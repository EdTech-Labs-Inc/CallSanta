/**
 * Video Render Worker
 * 
 * Processes pending video renders from the queue.
 * Run this as a cron job or background process.
 * 
 * Usage:
 *   npm run video:process                    # Process all pending videos
 *   npm run video:process -- --callId xxx    # Process specific call
 */

import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { config } from 'dotenv';

// Load environment
config({ path: path.join(process.cwd(), '.env.local') });

const COMPOSITION_ID = 'SantaCallVideo';
const FPS = 60;
const INTRO_DURATION_SECONDS = 2;

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Parse arguments
const args = process.argv.slice(2);
let specificCallId: string | null = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--callId' && args[i + 1]) {
    specificCallId = args[i + 1];
    i++;
  }
}

interface Call {
  id: string;
  child_name: string;
  recording_url: string;
}

async function getSignedAudioUrl(callId: string): Promise<string> {
  const fileName = `${callId}.mp3`;
  const { data, error } = await supabase.storage
    .from('call-recordings')
    .createSignedUrl(fileName, 3600);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to get signed URL: ${error?.message}`);
  }
  return data.signedUrl;
}

function generateWaveform(length: number): number[] {
  const waveform: number[] = [];
  for (let i = 0; i < length; i++) {
    const base = 0.3 + Math.random() * 0.4;
    const speech = Math.sin(i * 0.1) * 0.2;
    waveform.push(Math.max(0.1, Math.min(1, base + speech)));
  }
  return waveform;
}

async function renderVideo(call: Call): Promise<string> {
  const { id: callId, child_name: childName } = call;
  
  console.log(`\n🎬 Rendering video for: ${childName} (${callId})`);

  // Update status
  await supabase
    .from('calls')
    .update({ video_status: 'processing' })
    .eq('id', callId);

  // Get audio
  console.log('📥 Fetching audio...');
  const signedUrl = await getSignedAudioUrl(callId);
  
  // Download to temp
  const response = await fetch(signedUrl);
  const buffer = Buffer.from(await response.arrayBuffer());
  const tempAudioPath = path.join(os.tmpdir(), `worker-audio-${callId}.mp3`);
  fs.writeFileSync(tempAudioPath, buffer);
  
  // Estimate duration
  const durationSeconds = Math.max(5, Math.round(buffer.length / 20000));
  console.log(`⏱️  Duration: ~${durationSeconds}s`);

  const audioDurationFrames = durationSeconds * FPS;
  const totalDurationFrames = (INTRO_DURATION_SECONDS * FPS) + audioDurationFrames;
  const waveformData = generateWaveform(durationSeconds * 100);

  // Bundle
  console.log('📦 Bundling...');
  const remotionEntryPath = path.join(process.cwd(), 'src', 'remotion', 'index.ts');
  const bundleLocation = await bundle({ entryPoint: remotionEntryPath });

  // Configure
  const inputProps = {
    audioUrl: signedUrl,
    childName,
    audioDurationInFrames: totalDurationFrames,
    waveformData,
  };

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: COMPOSITION_ID,
    inputProps,
  });

  // Render
  console.log('🎥 Rendering...');
  const outputPath = path.join(os.tmpdir(), `santa-video-${callId}.mp4`);

  await renderMedia({
    composition: { ...composition, durationInFrames: totalDurationFrames },
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps,
    crf: 23,
    pixelFormat: 'yuv420p',
    onProgress: ({ progress }) => {
      process.stdout.write(`\r   Progress: ${Math.round(progress * 100)}%`);
    },
  });

  console.log('\n📤 Uploading...');
  
  // Upload to Supabase
  const videoBuffer = fs.readFileSync(outputPath);
  const videoFileName = `${callId}.mp4`;

  const { error: uploadError } = await supabase.storage
    .from('call-videos')
    .upload(videoFileName, videoBuffer, {
      contentType: 'video/mp4',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('call-videos')
    .getPublicUrl(videoFileName);

  // Update database
  await supabase
    .from('calls')
    .update({
      video_url: publicUrl,
      video_status: 'completed',
      video_generated_at: new Date().toISOString(),
    })
    .eq('id', callId);

  await supabase.from('call_events').insert({
    call_id: callId,
    event_type: 'video_render_completed',
    event_data: { video_url: publicUrl },
  });

  // Cleanup
  try {
    fs.unlinkSync(tempAudioPath);
    fs.unlinkSync(outputPath);
  } catch {}

  console.log(`✅ Done: ${publicUrl}`);
  return publicUrl;
}

async function processCall(callId: string): Promise<void> {
  const { data: call, error } = await supabase
    .from('calls')
    .select('id, child_name, recording_url')
    .eq('id', callId)
    .single();

  if (error || !call) {
    throw new Error(`Call not found: ${callId}`);
  }

  if (!call.recording_url) {
    throw new Error(`Call ${callId} has no recording`);
  }

  await renderVideo(call as Call);
}

async function processPending(): Promise<void> {
  console.log('🔍 Looking for pending video renders...');

  const { data: calls, error } = await supabase
    .from('calls')
    .select('id, child_name, recording_url')
    .eq('video_status', 'pending')
    .not('recording_url', 'is', null)
    .limit(10);

  if (error) {
    console.error('Failed to fetch pending calls:', error);
    return;
  }

  if (!calls || calls.length === 0) {
    console.log('No pending video renders found.');
    return;
  }

  console.log(`Found ${calls.length} pending video(s)`);

  for (const call of calls) {
    try {
      await renderVideo(call as Call);
    } catch (err) {
      console.error(`\n❌ Failed to render ${call.id}:`, err);
      
      await supabase
        .from('calls')
        .update({ video_status: 'failed' })
        .eq('id', call.id);
    }
  }
}

async function main() {
  console.log('\n🎅 Santa Video Worker\n');

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
  }

  try {
    if (specificCallId) {
      await processCall(specificCallId);
    } else {
      await processPending();
    }
    
    console.log('\n✨ Worker finished\n');
  } catch (err) {
    console.error('\n❌ Worker error:', err);
    process.exit(1);
  }
}

main();

