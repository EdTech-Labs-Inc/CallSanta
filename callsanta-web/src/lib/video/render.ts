import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { analyzeAudio, AudioAnalysis } from './audio-analysis';

const COMPOSITION_ID = 'SantaCallVideo';
const FPS = 60;
const INTRO_DURATION_SECONDS = 2;

interface RenderVideoOptions {
  callId: string;
  audioUrl?: string; // Optional - will fetch from Supabase if not provided
  childName: string;
}

/**
 * Get a signed URL for the audio file from Supabase Storage
 */
async function getSignedAudioUrl(callId: string): Promise<string | null> {
  const fileName = `${callId}.mp3`;
  
  const { data, error } = await supabaseAdmin.storage
    .from('call-recordings')
    .createSignedUrl(fileName, 3600); // 1 hour expiry

  if (error) {
    console.error(`[Video] Failed to create signed URL for ${fileName}:`, error);
    return null;
  }

  return data?.signedUrl || null;
}

/**
 * Download audio file to a temporary location
 * Remotion works better with local files for long audio
 */
async function downloadAudioToTemp(signedUrl: string, callId: string): Promise<string> {
  console.log('[Video] Downloading audio file...');
  
  const response = await fetch(signedUrl);
  if (!response.ok) {
    throw new Error(`Failed to download audio: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  const tempPath = path.join(os.tmpdir(), `santa-audio-${callId}.mp3`);
  fs.writeFileSync(tempPath, buffer);
  
  console.log(`[Video] Audio downloaded to: ${tempPath} (${buffer.length} bytes)`);
  return tempPath;
}

interface RenderResult {
  success: boolean;
  videoUrl?: string;
  error?: string;
}

/**
 * Render a Santa call video using Remotion
 */
export async function renderSantaVideo(options: RenderVideoOptions): Promise<RenderResult> {
  const { callId, childName } = options;
  let { audioUrl } = options;
  
  console.log(`[Video] Starting render for call ${callId}`);
  console.log(`[Video] Child name: ${childName}`);

  // Update status to processing
  await supabaseAdmin
    .from('calls')
    .update({ video_status: 'processing' })
    .eq('id', callId);

  let tempAudioPath: string | null = null;

  try {
    // Step 0: Get signed URL from Supabase Storage if not provided
    if (!audioUrl) {
      console.log('[Video] Fetching signed URL from Supabase Storage...');
      const signedUrl = await getSignedAudioUrl(callId);
      if (!signedUrl) {
        throw new Error('Could not get signed URL for audio file');
      }
      audioUrl = signedUrl;
    }
    
    console.log(`[Video] Audio URL: ${audioUrl.substring(0, 100)}...`);

    // Step 0.5: Download audio to temp file for reliable access
    tempAudioPath = await downloadAudioToTemp(audioUrl, callId);
    const localAudioUrl = `file://${tempAudioPath}`;

    // Step 1: Analyze audio to get duration and waveform data
    console.log('[Video] Analyzing audio...');
    let audioAnalysis: AudioAnalysis;
    
    try {
      audioAnalysis = await analyzeAudio(localAudioUrl);
    } catch (audioError) {
      console.error('[Video] Audio analysis failed:', audioError);
      // Use fallback values if audio analysis fails
      audioAnalysis = {
        durationSeconds: 30, // Default 30 seconds
        waveformData: [], // Empty waveform will trigger fallback animation
        sampleRate: 44100,
      };
    }

    console.log(`[Video] Audio duration: ${audioAnalysis.durationSeconds}s`);
    console.log(`[Video] Waveform data points: ${audioAnalysis.waveformData.length}`);

    // Step 2: Calculate video duration
    const audioDurationFrames = Math.ceil(audioAnalysis.durationSeconds * FPS);
    const introDurationFrames = INTRO_DURATION_SECONDS * FPS;
    const totalDurationFrames = introDurationFrames + audioDurationFrames;

    console.log(`[Video] Total duration: ${totalDurationFrames} frames (${totalDurationFrames / FPS}s)`);

    // Step 3: Bundle the Remotion project
    console.log('[Video] Bundling Remotion project...');
    
    const remotionEntryPath = path.join(process.cwd(), 'src', 'remotion', 'index.ts');
    
    // Check if entry file exists
    if (!fs.existsSync(remotionEntryPath)) {
      throw new Error(`Remotion entry file not found at ${remotionEntryPath}`);
    }

    const bundleLocation = await bundle({
      entryPoint: remotionEntryPath,
      // Enable React compiler optimization
      // publicPath: './',
    });

    console.log(`[Video] Bundle created at: ${bundleLocation}`);

    // Step 4: Select the composition
    console.log('[Video] Selecting composition...');
    
    const inputProps = {
      audioUrl: localAudioUrl, // Use local file path for Remotion
      childName,
      audioDurationInFrames: totalDurationFrames,
      waveformData: audioAnalysis.waveformData,
    };

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: COMPOSITION_ID,
      inputProps,
    });

    // Override duration based on audio
    const compositionWithDuration = {
      ...composition,
      durationInFrames: totalDurationFrames,
    };

    // Step 5: Render the video
    console.log('[Video] Rendering video...');
    
    const outputDir = os.tmpdir();
    const outputPath = path.join(outputDir, `santa-video-${callId}.mp4`);

    await renderMedia({
      composition: compositionWithDuration,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps,
      // Video quality settings for social media
      crf: 18, // High quality
      pixelFormat: 'yuv420p', // Compatibility
      // Audio settings
      audioBitrate: '192k',
    });

    console.log(`[Video] Video rendered to: ${outputPath}`);

    // Step 6: Upload to Supabase Storage
    console.log('[Video] Uploading video to storage...');
    
    const videoBuffer = fs.readFileSync(outputPath);
    const videoFileName = `${callId}.mp4`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('call-videos')
      .upload(videoFileName, videoBuffer, {
        contentType: 'video/mp4',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload video: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('call-videos')
      .getPublicUrl(videoFileName);

    console.log(`[Video] Video uploaded: ${publicUrl}`);

    // Step 7: Update database with video URL
    await supabaseAdmin
      .from('calls')
      .update({
        video_url: publicUrl,
        video_status: 'completed',
        video_generated_at: new Date().toISOString(),
      })
      .eq('id', callId);

    // Step 8: Cleanup temp files
    try {
      fs.unlinkSync(outputPath);
      if (tempAudioPath) fs.unlinkSync(tempAudioPath);
      console.log('[Video] Temp files cleaned up');
    } catch (cleanupError) {
      console.warn('[Video] Failed to cleanup temp files:', cleanupError);
    }

    console.log(`[Video] Render complete for call ${callId}`);

    return {
      success: true,
      videoUrl: publicUrl,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Video] Render failed for call ${callId}:`, errorMessage);

    // Cleanup temp audio file on error
    if (tempAudioPath) {
      try {
        fs.unlinkSync(tempAudioPath);
      } catch {
        // Ignore cleanup errors
      }
    }

    // Update status to failed
    await supabaseAdmin
      .from('calls')
      .update({ video_status: 'failed' })
      .eq('id', callId);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Queue a video render job
 * In production, this should use a job queue (BullMQ, SQS, etc.)
 * For MVP, we'll render synchronously in the webhook
 */
export async function queueVideoRender(options: RenderVideoOptions): Promise<void> {
  console.log(`[Video] Queueing video render for call ${options.callId}`);
  
  // Mark as pending
  await supabaseAdmin
    .from('calls')
    .update({ video_status: 'pending' })
    .eq('id', options.callId);

  // For MVP: render directly (in production, use a queue)
  // This is non-blocking - we don't await the result
  renderSantaVideo(options).catch((error) => {
    console.error(`[Video] Background render failed for call ${options.callId}:`, error);
  });
}

