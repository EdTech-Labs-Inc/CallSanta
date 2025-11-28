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
import { Resend } from 'resend';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { config } from 'dotenv';

// Load environment
config({ path: path.join(process.cwd(), '.env.local') });

// Outro video path - save your outro.mov here
const OUTRO_PATH = path.join(process.cwd(), 'public', 'outro.mov');

// Initialize Resend for email
const resend = new Resend(process.env.RESEND_API_KEY);

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
  parent_email: string;
  transcript: string | null;
  call_duration_seconds: number | null;
  transcript_sent_at: string | null;
  recording_purchased: boolean;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.santasnumber.com';

async function sendPostCallEmail(call: Call, videoUrl: string): Promise<void> {
  if (!call.parent_email) {
    console.log('   No parent email, skipping email');
    return;
  }

  const downloadUrl = `${APP_URL}/recording/${call.id}`;
  const videoPageUrl = `${APP_URL}/recording/${call.id}?tab=video`;
  
  const durationText = call.call_duration_seconds 
    ? `${Math.floor(call.call_duration_seconds / 60)} minutes ${call.call_duration_seconds % 60} seconds`
    : '';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
    <div style="background: linear-gradient(135deg, #C41E3A 0%, #8B0000 100%); padding: 40px 20px; text-align: center;">
      <span style="font-size: 24px;">🎅</span>
      <h1 style="color: #ffffff; font-size: 28px; margin: 10px 0; font-weight: bold;">Santa Called ${call.child_name}!</h1>
      <p style="color: #FFD700; font-size: 16px; margin: 0;">Your recording & video are ready!</p>
    </div>

    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; color: #333; line-height: 1.6;">
        Ho ho ho! Santa just finished a wonderful conversation with ${call.child_name}!
      </p>

      ${durationText ? `<p style="color: #666; font-size: 14px;">Call duration: ${durationText}</p>` : ''}

      <div style="background: #165B33; color: #ffffff; padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center;">
        <p style="margin: 0 0 16px; font-size: 14px; opacity: 0.9;">🎙️ Audio Recording</p>
        <a href="${downloadUrl}" style="display: inline-block; background: #FFD700; color: #333; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Download Recording
        </a>
      </div>

      <div style="background: linear-gradient(135deg, #C41E3A 0%, #8B0000 100%); color: #ffffff; padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center;">
        <p style="margin: 0 0 8px; font-size: 20px;">🎬 Shareable Video Ready!</p>
        <p style="margin: 0 0 16px; font-size: 14px; opacity: 0.9;">
          Share ${call.child_name}'s magical moment on TikTok, Instagram Reels, or with family!
        </p>
        <a href="${videoPageUrl}" style="display: inline-block; background: #ffffff; color: #C41E3A; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Download Video
        </a>
      </div>

      ${call.transcript ? `
      <div style="background: #f8f9fa; border-left: 4px solid #C41E3A; padding: 24px; margin: 24px 0; border-radius: 0 8px 8px 0;">
        <h3 style="margin: 0 0 16px; color: #C41E3A; font-size: 16px;">📝 Call Transcript</h3>
        <div style="color: #444; line-height: 1.8; white-space: pre-wrap; font-size: 14px;">${call.transcript}</div>
      </div>
      ` : ''}

      <p style="text-align: center; color: #888; font-size: 14px;">
        Thank you for choosing Call Santa! We hope this brought joy to your holiday. ❄️
      </p>
    </div>

    <div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #eee;">
      <p style="color: #888; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Call Santa. Spreading Christmas magic!</p>
      <p style="color: #888; font-size: 12px; margin-top: 10px;">
        Questions? Contact us at <a href="mailto:questions@santasnumber.com" style="color: #C41E3A;">questions@santasnumber.com</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    await resend.emails.send({
      from: 'Santa <santa@santasnumber.com>',
      to: call.parent_email,
      subject: `🎅 Santa's Call with ${call.child_name} - Recording & Video Ready!`,
      html,
    });
    console.log('📧 Email sent to:', call.parent_email);
  } catch (err) {
    console.error('❌ Failed to send email:', err);
  }
}

/**
 * Concatenate main video with outro using FFmpeg
 * Re-encodes to ensure compatibility between MP4 and MOV formats
 */
function concatenateWithOutro(mainVideoPath: string, outputPath: string): void {
  if (!fs.existsSync(OUTRO_PATH)) {
    console.log('   No outro.mov found, skipping concatenation');
    fs.copyFileSync(mainVideoPath, outputPath);
    return;
  }

  console.log('🎬 Adding outro...');
  
  try {
    // Re-encode and concatenate using FFmpeg filter_complex
    // This handles different codecs between MP4 and MOV
    execSync(
      `ffmpeg -y -i "${mainVideoPath}" -i "${OUTRO_PATH}" -filter_complex "[0:v:0][0:a:0][1:v:0][1:a:0]concat=n=2:v=1:a=1[outv][outa]" -map "[outv]" -map "[outa]" -c:v libx264 -c:a aac -preset fast -crf 23 "${outputPath}"`,
      { stdio: 'pipe' }
    );
    console.log('   Outro added successfully');
  } catch (err) {
    console.error('   FFmpeg concat failed, using main video only');
    fs.copyFileSync(mainVideoPath, outputPath);
  }
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

  // Render main video
  console.log('🎥 Rendering...');
  const mainVideoPath = path.join(os.tmpdir(), `santa-main-${callId}.mp4`);
  const finalVideoPath = path.join(os.tmpdir(), `santa-video-${callId}.mp4`);

  await renderMedia({
    composition: { ...composition, durationInFrames: totalDurationFrames },
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: mainVideoPath,
    inputProps,
    crf: 28, // Faster encoding
    pixelFormat: 'yuv420p',
    concurrency: 2, // Reduce memory pressure
    timeoutInMilliseconds: 120000, // 2 minute timeout per frame
    onProgress: ({ progress }) => {
      process.stdout.write(`\r   Progress: ${Math.round(progress * 100)}%`);
    },
  });

  // Add outro if exists
  console.log('');
  concatenateWithOutro(mainVideoPath, finalVideoPath);

  console.log('📤 Uploading...');
  
  // Upload to Supabase
  const videoBuffer = fs.readFileSync(finalVideoPath);
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

  // Send email now that video is ready
  console.log('📧 Sending email...');
  
  // Re-fetch call with all fields for email
  const { data: fullCall } = await supabase
    .from('calls')
    .select('*')
    .eq('id', callId)
    .single();

  if (fullCall && !fullCall.transcript_sent_at) {
    await sendPostCallEmail(fullCall as Call, publicUrl);
    
    // Mark email as sent
    await supabase
      .from('calls')
      .update({ transcript_sent_at: new Date().toISOString() })
      .eq('id', callId);

    await supabase.from('call_events').insert({
      call_id: callId,
      event_type: 'post_call_email_sent',
      event_data: { with_video: true },
    });
  }

  // Cleanup temp files
  try {
    fs.unlinkSync(tempAudioPath);
    fs.unlinkSync(mainVideoPath);
    fs.unlinkSync(finalVideoPath);
  } catch {}

  console.log(`✅ Done: ${publicUrl}`);
  return publicUrl;
}

async function processCall(callId: string): Promise<void> {
  const { data: call, error } = await supabase
    .from('calls')
    .select('id, child_name, recording_url, parent_email, transcript, call_duration_seconds, transcript_sent_at, recording_purchased')
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
    .select('id, child_name, recording_url, parent_email, transcript, call_duration_seconds, transcript_sent_at, recording_purchased')
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