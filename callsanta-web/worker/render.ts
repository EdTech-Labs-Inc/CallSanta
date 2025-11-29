/**
 * Video rendering logic for worker
 * Extracted from scripts/video-worker.ts
 */

import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import type { VideoJob, RenderResult } from './types';
import { WORKER_CONFIG } from './types';
import { log } from './logger';
import { sendPostCallEmail } from './email';

// Paths - configurable for different environments
const OUTRO_PATH = process.env.OUTRO_PATH || path.join(process.cwd(), 'public', 'outro.mov');
const REMOTION_ENTRY = process.env.REMOTION_ENTRY || path.join(process.cwd(), 'src', 'remotion', 'index.ts');

// Initialize Supabase
let supabase: SupabaseClient;

function getSupabase(): SupabaseClient {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

/**
 * Get signed URL for audio file from Supabase Storage
 */
async function getSignedAudioUrl(callId: string): Promise<string> {
  log('AUDIO', `Getting signed URL for ${callId}.mp3`);

  const fileName = `${callId}.mp3`;
  const { data, error } = await getSupabase().storage
    .from('call-recordings')
    .createSignedUrl(fileName, 3600);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to get signed URL: ${error?.message}`);
  }

  log('AUDIO', 'Got signed URL');
  return data.signedUrl;
}

/**
 * Generate synthetic waveform data
 */
function generateWaveform(length: number): number[] {
  const waveform: number[] = [];
  for (let i = 0; i < length; i++) {
    const base = 0.3 + Math.random() * 0.4;
    const speech = Math.sin(i * 0.1) * 0.2;
    waveform.push(Math.max(0.1, Math.min(1, base + speech)));
  }
  return waveform;
}

/**
 * Concatenate main video with outro using FFmpeg
 * Scales outro to match main video resolution (1080x1920) and normalizes fps/audio
 */
function concatenateWithOutro(mainVideoPath: string, outputPath: string): void {
  log('OUTRO', `Checking for outro at: ${OUTRO_PATH}`);

  if (!fs.existsSync(OUTRO_PATH)) {
    log('OUTRO', 'WARNING: No outro.mov found, skipping concatenation');
    fs.copyFileSync(mainVideoPath, outputPath);
    return;
  }

  const outroStats = fs.statSync(OUTRO_PATH);
  log('OUTRO', `Found outro.mov (${(outroStats.size / 1024 / 1024).toFixed(2)} MB)`);
  log('OUTRO', 'Starting FFmpeg concatenation (scaling outro to 1080x1920)...');

  const startTime = Date.now();

  // Scale outro from 2160x3840 to 1080x1920, normalize fps to 60, and resample audio to 48000Hz
  const ffmpegCommand = `ffmpeg -y -i "${mainVideoPath}" -i "${OUTRO_PATH}" -filter_complex "[1:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,fps=60,format=yuv420p[outro_v];[1:a]aresample=48000[outro_a];[0:v][0:a][outro_v][outro_a]concat=n=2:v=1:a=1[outv][outa]" -map "[outv]" -map "[outa]" -c:v libx264 -c:a aac -preset fast -crf 23 "${outputPath}"`;

  try {
    execSync(ffmpegCommand, { stdio: 'pipe' });
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    log('OUTRO', `Outro added successfully (took ${elapsed}s)`);
  } catch (err) {
    log('OUTRO', `WARNING: FFmpeg concat failed: ${err}`);
    log('OUTRO', 'WARNING: Using main video only (no outro) - video will be missing outro!');
    fs.copyFileSync(mainVideoPath, outputPath);
  }
}

/**
 * Main render function
 */
export async function renderVideo(job: VideoJob): Promise<RenderResult> {
  const { id: callId, child_name: childName } = job;
  const startTime = Date.now();

  console.log('\n' + '='.repeat(60));
  log('START', `Starting video render for: ${childName}`, { callId });
  console.log('='.repeat(60));

  const db = getSupabase();

  try {
    // Step 1: Update status to processing
    log('DB', 'Updating call status to "processing"');
    await db
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
    log('AUDIO', `Downloaded ${(buffer.length / 1024).toFixed(0)} KB in ${downloadTime}s`);

    // Step 4: Calculate duration
    const durationSeconds = Math.max(5, Math.round(buffer.length / 20000));
    const audioDurationFrames = durationSeconds * WORKER_CONFIG.fps;
    const totalDurationFrames = (WORKER_CONFIG.introDurationSeconds * WORKER_CONFIG.fps) + audioDurationFrames;
    log('CALC', `Video duration calculated`, {
      audioDuration: `${durationSeconds}s`,
      totalFrames: totalDurationFrames,
    });

    // Step 5: Generate waveform
    log('WAVEFORM', 'Generating waveform data...');
    const waveformData = generateWaveform(durationSeconds * 100);
    log('WAVEFORM', `Generated ${waveformData.length} waveform points`);

    // Step 6: Bundle Remotion
    log('BUNDLE', 'Bundling Remotion project...');
    const bundleStart = Date.now();
    log('BUNDLE', `Entry point: ${REMOTION_ENTRY}`);
    const bundleLocation = await bundle({ entryPoint: REMOTION_ENTRY });
    const bundleTime = ((Date.now() - bundleStart) / 1000).toFixed(1);
    log('BUNDLE', `Bundle created in ${bundleTime}s`);

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
      id: WORKER_CONFIG.compositionId,
      inputProps,
    });
    log('COMPOSE', `Composition selected: ${WORKER_CONFIG.compositionId}`);

    // Step 8: Render main video
    log('RENDER', 'Starting Remotion render...');
    const renderStart = Date.now();
    const mainVideoPath = path.join(os.tmpdir(), `santa-main-${callId}.mp4`);
    const finalVideoPath = path.join(os.tmpdir(), `santa-video-${callId}.mp4`);

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
        if (percent >= lastLoggedProgress + 10) {
          lastLoggedProgress = Math.floor(percent / 10) * 10;
          log('RENDER', `Progress: ${percent}%`);
        }
      },
    });

    const renderTime = ((Date.now() - renderStart) / 1000).toFixed(1);
    const mainVideoStats = fs.statSync(mainVideoPath);
    log('RENDER', `Main video rendered in ${renderTime}s`, {
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

    log('UPLOAD', `Uploading ${videoFileName} to Supabase Storage...`);

    const uploadStart = Date.now();
    const { error: uploadError } = await db.storage
      .from('call-videos')
      .upload(videoFileName, videoBuffer, {
        contentType: 'video/mp4',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const uploadTime = ((Date.now() - uploadStart) / 1000).toFixed(1);
    log('UPLOAD', `Upload completed in ${uploadTime}s`);

    // Step 11: Get public URL
    const { data: { publicUrl } } = db.storage
      .from('call-videos')
      .getPublicUrl(videoFileName);
    log('UPLOAD', `Public URL: ${publicUrl}`);

    // Step 12: Update database
    log('DB', 'Updating call record with video URL...');
    await db
      .from('calls')
      .update({
        video_url: publicUrl,
        video_status: 'completed',
        video_generated_at: new Date().toISOString(),
      })
      .eq('id', callId);
    log('DB', 'Call record updated');

    // Step 13: Log event
    await db.from('call_events').insert({
      call_id: callId,
      event_type: 'video_render_completed',
      event_data: { video_url: publicUrl },
    });
    log('DB', 'Event logged');

    // Step 14: Send email
    log('EMAIL', 'Preparing to send post-call email...');

    const { data: fullCall } = await db
      .from('calls')
      .select('*')
      .eq('id', callId)
      .single();

    if (fullCall && !fullCall.transcript_sent_at) {
      await sendPostCallEmail(fullCall, publicUrl);

      await db
        .from('calls')
        .update({ transcript_sent_at: new Date().toISOString() })
        .eq('id', callId);

      await db.from('call_events').insert({
        call_id: callId,
        event_type: 'post_call_email_sent',
        event_data: { with_video: true },
      });
      log('DB', 'Email sent flag updated');
    } else {
      log('EMAIL', 'Email already sent or call not found, skipping');
    }

    // Step 15: Cleanup
    log('CLEANUP', 'Removing temporary files...');
    try {
      fs.unlinkSync(tempAudioPath);
      fs.unlinkSync(mainVideoPath);
      fs.unlinkSync(finalVideoPath);
      log('CLEANUP', 'Temp files removed');
    } catch (err) {
      log('CLEANUP', `Warning: Could not remove some temp files: ${err}`);
    }

    // Final summary
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('='.repeat(60));
    log('DONE', `Video render complete!`, {
      callId,
      childName,
      totalTime: `${totalTime}s`,
      videoUrl: publicUrl,
    });
    console.log('='.repeat(60) + '\n');

    return { success: true, videoUrl: publicUrl };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log('ERROR', `Render failed: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}
