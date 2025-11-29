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

// Logging helper
function log(step: string, message: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const dataStr = data ? ` ${JSON.stringify(data)}` : '';
  console.log(`[${timestamp}] [${step}] ${message}${dataStr}`);
}

async function sendPostCallEmail(call: Call, videoUrl: string): Promise<void> {
  if (!call.parent_email) {
    log('EMAIL', 'No parent email found, skipping email');
    return;
  }

  log('EMAIL', `Preparing email for ${call.parent_email}`);

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
    log('EMAIL', 'Sending via Resend...');
    await resend.emails.send({
      from: 'Santa <santa@santasnumber.com>',
      to: call.parent_email,
      subject: `🎅 Santa's Call with ${call.child_name} - Recording & Video Ready!`,
      html,
    });
    log('EMAIL', `✅ Email sent successfully to ${call.parent_email}`);
  } catch (err) {
    log('EMAIL', `❌ Failed to send email: ${err}`);
  }
}

/**
 * Concatenate main video with outro using FFmpeg
 * Re-encodes to ensure compatibility between MP4 and MOV formats
 */
function concatenateWithOutro(mainVideoPath: string, outputPath: string): void {
  log('OUTRO', `Checking for outro at: ${OUTRO_PATH}`);
  
  if (!fs.existsSync(OUTRO_PATH)) {
    log('OUTRO', 'No outro.mov found, skipping concatenation');
    fs.copyFileSync(mainVideoPath, outputPath);
    return;
  }

  const outroStats = fs.statSync(OUTRO_PATH);
  log('OUTRO', `Found outro.mov (${(outroStats.size / 1024 / 1024).toFixed(2)} MB)`);
  log('OUTRO', 'Starting FFmpeg concatenation...');
  
  const startTime = Date.now();
  
  try {
    // Re-encode and concatenate using FFmpeg filter_complex
    // This handles different codecs between MP4 and MOV
    execSync(
      `ffmpeg -y -i "${mainVideoPath}" -i "${OUTRO_PATH}" -filter_complex "[0:v:0][0:a:0][1:v:0][1:a:0]concat=n=2:v=1:a=1[outv][outa]" -map "[outv]" -map "[outa]" -c:v libx264 -c:a aac -preset fast -crf 23 "${outputPath}"`,
      { stdio: 'pipe' }
    );
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    log('OUTRO', `✅ Outro added successfully (took ${elapsed}s)`);
  } catch (err) {
    log('OUTRO', `❌ FFmpeg concat failed: ${err}`);
    log('OUTRO', 'Using main video only (no outro)');
    fs.copyFileSync(mainVideoPath, outputPath);
  }
}

async function getSignedAudioUrl(callId: string): Promise<string> {
  log('AUDIO', `Getting signed URL for ${callId}.mp3`);
  
  const fileName = `${callId}.mp3`;
  const { data, error } = await supabase.storage
    .from('call-recordings')
    .createSignedUrl(fileName, 3600);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to get signed URL: ${error?.message}`);
  }
  
  log('AUDIO', '✅ Got signed URL');
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
  const startTime = Date.now();
  
  console.log('\n' + '═'.repeat(60));
  log('START', `🎬 Starting video render for: ${childName}`, { callId });
  console.log('═'.repeat(60));

  // Step 1: Update status to processing
  log('DB', 'Updating call status to "processing"');
  await supabase
    .from('calls')
    .update({ video_status: 'processing' })
    .eq('id', callId);

  // Step 2: Get audio URL
  log('AUDIO', 'Fetching audio from Supabase Storage...');
  const signedUrl = await getSignedAudioUrl(callId);
  
  // Step 3: Download audio
  log('AUDIO', 'Downloading audio file...');
  const downloadStart = Date.now();
  const response = await fetch(signedUrl);
  const buffer = Buffer.from(await response.arrayBuffer());
  const tempAudioPath = path.join(os.tmpdir(), `worker-audio-${callId}.mp3`);
  fs.writeFileSync(tempAudioPath, buffer);
  const downloadTime = ((Date.now() - downloadStart) / 1000).toFixed(1);
  log('AUDIO', `✅ Downloaded ${(buffer.length / 1024).toFixed(0)} KB in ${downloadTime}s`, { path: tempAudioPath });
  
  // Step 4: Calculate duration
  const durationSeconds = Math.max(5, Math.round(buffer.length / 20000));
  const audioDurationFrames = durationSeconds * FPS;
  const totalDurationFrames = (INTRO_DURATION_SECONDS * FPS) + audioDurationFrames;
  log('CALC', `Video duration calculated`, {
    audioDuration: `${durationSeconds}s`,
    introFrames: INTRO_DURATION_SECONDS * FPS,
    totalFrames: totalDurationFrames,
    totalSeconds: totalDurationFrames / FPS,
  });

  // Step 5: Generate waveform
  log('WAVEFORM', 'Generating waveform data...');
  const waveformData = generateWaveform(durationSeconds * 100);
  log('WAVEFORM', `✅ Generated ${waveformData.length} waveform points`);

  // Step 6: Bundle Remotion
  log('BUNDLE', 'Bundling Remotion project...');
  const bundleStart = Date.now();
  const remotionEntryPath = path.join(process.cwd(), 'src', 'remotion', 'index.ts');
  log('BUNDLE', `Entry point: ${remotionEntryPath}`);
  const bundleLocation = await bundle({ entryPoint: remotionEntryPath });
  const bundleTime = ((Date.now() - bundleStart) / 1000).toFixed(1);
  log('BUNDLE', `✅ Bundle created in ${bundleTime}s`);

  // Step 7: Configure composition
  log('COMPOSE', 'Selecting composition...');
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
  log('COMPOSE', `✅ Composition selected: ${COMPOSITION_ID}`, {
    width: composition.width,
    height: composition.height,
    fps: composition.fps,
  });

  // Step 8: Render main video
  log('RENDER', '🎥 Starting Remotion render...');
  const renderStart = Date.now();
  const mainVideoPath = path.join(os.tmpdir(), `santa-main-${callId}.mp4`);
  const finalVideoPath = path.join(os.tmpdir(), `santa-video-${callId}.mp4`);
  
  log('RENDER', `Output path: ${mainVideoPath}`);
  log('RENDER', `Total frames to render: ${totalDurationFrames}`);

  let lastLoggedProgress = 0;
  await renderMedia({
    composition: { ...composition, durationInFrames: totalDurationFrames },
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: mainVideoPath,
    inputProps,
    crf: 28,
    pixelFormat: 'yuv420p',
    concurrency: 2,
    timeoutInMilliseconds: 120000,
    onProgress: ({ progress }) => {
      const percent = Math.round(progress * 100);
      // Log every 10%
      if (percent >= lastLoggedProgress + 10) {
        lastLoggedProgress = Math.floor(percent / 10) * 10;
        log('RENDER', `Progress: ${percent}%`);
      }
      process.stdout.write(`\r   Rendering: ${percent}%`);
    },
  });

  const renderTime = ((Date.now() - renderStart) / 1000).toFixed(1);
  const mainVideoStats = fs.statSync(mainVideoPath);
  console.log(''); // New line after progress
  log('RENDER', `✅ Main video rendered in ${renderTime}s`, {
    size: `${(mainVideoStats.size / 1024 / 1024).toFixed(2)} MB`,
  });

  // Step 9: Add outro
  log('OUTRO', 'Processing outro concatenation...');
  concatenateWithOutro(mainVideoPath, finalVideoPath);
  
  const finalVideoStats = fs.statSync(finalVideoPath);
  log('OUTRO', `Final video size: ${(finalVideoStats.size / 1024 / 1024).toFixed(2)} MB`);

  // Step 10: Upload to Supabase
  log('UPLOAD', 'Reading final video file...');
  const videoBuffer = fs.readFileSync(finalVideoPath);
  const videoFileName = `${callId}.mp4`;
  
  log('UPLOAD', `Uploading ${videoFileName} to Supabase Storage...`, {
    size: `${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`,
    bucket: 'call-videos',
  });
  
  const uploadStart = Date.now();
  const { error: uploadError } = await supabase.storage
    .from('call-videos')
    .upload(videoFileName, videoBuffer, {
      contentType: 'video/mp4',
      upsert: true,
    });

  if (uploadError) {
    log('UPLOAD', `❌ Upload failed: ${uploadError.message}`);
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const uploadTime = ((Date.now() - uploadStart) / 1000).toFixed(1);
  log('UPLOAD', `✅ Upload completed in ${uploadTime}s`);

  // Step 11: Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('call-videos')
    .getPublicUrl(videoFileName);
  log('UPLOAD', `Public URL: ${publicUrl}`);

  // Step 12: Update database
  log('DB', 'Updating call record with video URL...');
  await supabase
    .from('calls')
    .update({
      video_url: publicUrl,
      video_status: 'completed',
      video_generated_at: new Date().toISOString(),
    })
    .eq('id', callId);
  log('DB', '✅ Call record updated');

  // Step 13: Log event
  await supabase.from('call_events').insert({
    call_id: callId,
    event_type: 'video_render_completed',
    event_data: { video_url: publicUrl },
  });
  log('DB', '✅ Event logged');

  // Step 14: Send email
  log('EMAIL', 'Preparing to send post-call email...');
  
  const { data: fullCall } = await supabase
    .from('calls')
    .select('*')
    .eq('id', callId)
    .single();

  if (fullCall && !fullCall.transcript_sent_at) {
    await sendPostCallEmail(fullCall as Call, publicUrl);
    
    await supabase
      .from('calls')
      .update({ transcript_sent_at: new Date().toISOString() })
      .eq('id', callId);

    await supabase.from('call_events').insert({
      call_id: callId,
      event_type: 'post_call_email_sent',
      event_data: { with_video: true },
    });
    log('DB', '✅ Email sent flag updated');
  } else {
    log('EMAIL', 'Email already sent or call not found, skipping');
  }

  // Step 15: Cleanup
  log('CLEANUP', 'Removing temporary files...');
  try {
    fs.unlinkSync(tempAudioPath);
    fs.unlinkSync(mainVideoPath);
    fs.unlinkSync(finalVideoPath);
    log('CLEANUP', '✅ Temp files removed');
  } catch (err) {
    log('CLEANUP', `Warning: Could not remove some temp files: ${err}`);
  }

  // Final summary
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('═'.repeat(60));
  log('DONE', `✅ Video render complete!`, {
    callId,
    childName,
    totalTime: `${totalTime}s`,
    videoUrl: publicUrl,
  });
  console.log('═'.repeat(60) + '\n');

  return publicUrl;
}

async function processCall(callId: string): Promise<void> {
  log('FETCH', `Looking up call: ${callId}`);
  
  const { data: call, error } = await supabase
    .from('calls')
    .select('id, child_name, recording_url, parent_email, transcript, call_duration_seconds, transcript_sent_at, recording_purchased')
    .eq('id', callId)
    .single();

  if (error || !call) {
    throw new Error(`Call not found: ${callId}`);
  }

  log('FETCH', `✅ Found call for: ${call.child_name}`, { 
    hasRecording: !!call.recording_url,
    hasEmail: !!call.parent_email,
  });

  if (!call.recording_url) {
    throw new Error(`Call ${callId} has no recording`);
  }

  await renderVideo(call as Call);
}

async function processPending(): Promise<void> {
  log('QUEUE', 'Looking for pending video renders...');

  const { data: calls, error } = await supabase
    .from('calls')
    .select('id, child_name, recording_url, parent_email, transcript, call_duration_seconds, transcript_sent_at, recording_purchased')
    .eq('video_status', 'pending')
    .not('recording_url', 'is', null)
    .limit(10);

  if (error) {
    log('QUEUE', `❌ Failed to fetch pending calls: ${error.message}`);
    return;
  }

  if (!calls || calls.length === 0) {
    log('QUEUE', 'No pending video renders found');
    return;
  }

  log('QUEUE', `Found ${calls.length} pending video(s)`);

  for (let i = 0; i < calls.length; i++) {
    const call = calls[i];
    log('QUEUE', `Processing ${i + 1}/${calls.length}: ${call.child_name}`);
    
    try {
      await renderVideo(call as Call);
    } catch (err) {
      log('QUEUE', `❌ Failed to render ${call.id}: ${err}`);
      
      await supabase
        .from('calls')
        .update({ video_status: 'failed' })
        .eq('id', call.id);
    }
  }
}

async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                  🎅 SANTA VIDEO WORKER 🎅                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  log('INIT', 'Starting worker...');
  log('INIT', `Supabase URL: ${supabaseUrl?.substring(0, 40)}...`);
  log('INIT', `Outro path: ${OUTRO_PATH}`);
  log('INIT', `Outro exists: ${fs.existsSync(OUTRO_PATH)}`);
  
  if (!supabaseUrl || !supabaseKey) {
    log('INIT', '❌ Missing Supabase credentials in .env.local');
    process.exit(1);
  }

  try {
    if (specificCallId) {
      log('INIT', `Mode: Single call (${specificCallId})`);
      await processCall(specificCallId);
    } else {
      log('INIT', 'Mode: Process pending queue');
      await processPending();
    }
    
    console.log('');
    log('EXIT', '✨ Worker finished successfully');
    console.log('');
  } catch (err) {
    console.log('');
    log('EXIT', `❌ Worker error: ${err}`);
    process.exit(1);
  }
}

main();
