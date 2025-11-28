/**
 * Test Video Render Script
 * 
 * Run this to test video generation locally WITHOUT touching the database writes.
 * 
 * Usage:
 *   npm run remotion:test                           # Silent test video
 *   npm run remotion:test -- --callId <call-id>     # Fetch audio from Supabase
 *   npm run remotion:test -- --local <file-path>    # Local audio file
 */

import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { config } from 'dotenv';

// Load .env.local
config({ path: path.join(process.cwd(), '.env.local') });

const COMPOSITION_ID = 'SantaCallVideo';
const FPS = 60;
const INTRO_DURATION_SECONDS = 2;

// Parse arguments
const args = process.argv.slice(2);
let callId: string | null = null;
let localFile: string | null = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--callId' && args[i + 1]) {
    callId = args[i + 1];
    i++;
  } else if (args[i] === '--local' && args[i + 1]) {
    localFile = args[i + 1];
    i++;
  }
}

// Test configuration
const TEST_CONFIG = {
  childName: 'Emily',
  outputPath: path.join(process.cwd(), 'out', 'test-santa-video.mp4'),
  durationSeconds: 15,
};

function generateFakeWaveform(length: number): number[] {
  const waveform: number[] = [];
  for (let i = 0; i < length; i++) {
    const base = 0.3 + Math.random() * 0.4;
    const speech = Math.sin(i * 0.1) * 0.2;
    const variation = Math.sin(i * 0.3) * 0.1;
    waveform.push(Math.max(0.1, Math.min(1, base + speech + variation)));
  }
  return waveform;
}

async function getAudioFromSupabase(id: string): Promise<{ signedUrl: string; childName: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }

  console.log('🔌 Connecting to Supabase...');
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get call details (READ only - no writes)
  const { data: call, error: callError } = await supabase
    .from('calls')
    .select('child_name, recording_url')
    .eq('id', id)
    .single();

  if (callError || !call) {
    throw new Error(`Call not found: ${id}. Error: ${callError?.message}`);
  }

  console.log(`   Found call for: ${call.child_name}`);

  if (!call.recording_url) {
    throw new Error(`Call ${id} has no recording yet`);
  }

  // Get signed URL from storage
  const fileName = `${id}.mp3`;
  console.log(`📂 Getting signed URL for: ${fileName}`);
  
  const { data, error } = await supabase.storage
    .from('call-recordings')
    .createSignedUrl(fileName, 3600);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to get signed URL: ${error?.message || 'Unknown error'}`);
  }

  console.log('✅ Got signed URL');
  return { signedUrl: data.signedUrl, childName: call.child_name };
}

async function downloadAudio(url: string, id: string): Promise<string> {
  console.log('📥 Downloading audio file...');
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }
  
  const buffer = Buffer.from(await response.arrayBuffer());
  const tempPath = path.join(os.tmpdir(), `test-audio-${id}.mp3`);
  fs.writeFileSync(tempPath, buffer);
  
  console.log(`   Downloaded ${(buffer.length / 1024).toFixed(1)} KB`);
  return tempPath;
}

async function main() {
  console.log('\n🎬 Santa Video Test Renderer');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let finalAudioUrl = '';
  let childName = TEST_CONFIG.childName;
  let tempAudioPath: string | null = null;
  let durationSeconds = TEST_CONFIG.durationSeconds;

  // Determine audio source
  if (callId) {
    console.log(`📞 Mode: Fetch from Supabase (callId: ${callId})\n`);
    
    const result = await getAudioFromSupabase(callId);
    childName = result.childName;
    
    // Use signed URL directly - Remotion supports https URLs
    finalAudioUrl = result.signedUrl;
    
    // Download to get file size for duration estimate
    tempAudioPath = await downloadAudio(result.signedUrl, callId);
    const stats = fs.statSync(tempAudioPath);
    durationSeconds = Math.max(5, Math.round(stats.size / 20000)); // ~160kbps
    
  } else if (localFile) {
    console.log(`📂 Mode: Local file (${localFile})\n`);
    
    if (!fs.existsSync(localFile)) {
      throw new Error(`File not found: ${localFile}`);
    }
    
    // For local files, we need to copy to public folder
    const publicPath = path.join(process.cwd(), 'public', 'temp-audio.mp3');
    fs.copyFileSync(localFile, publicPath);
    finalAudioUrl = '/temp-audio.mp3';  // Relative path for staticFile
    
    const stats = fs.statSync(localFile);
    durationSeconds = Math.max(5, Math.round(stats.size / 20000));
    
  } else {
    console.log('🔇 Mode: Silent test (no audio)\n');
    console.log('   Tip: Use --callId <id> to test with real audio from Supabase\n');
  }

  console.log(`👶 Child name: ${childName}`);
  console.log(`⏱️  Duration: ~${durationSeconds}s`);
  console.log(`📁 Output: ${TEST_CONFIG.outputPath}\n`);

  // Ensure output directory exists
  const outputDir = path.dirname(TEST_CONFIG.outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const audioDurationFrames = durationSeconds * FPS;
  const introDurationFrames = INTRO_DURATION_SECONDS * FPS;
  const totalDurationFrames = introDurationFrames + audioDurationFrames;

  // Generate waveform
  const waveformData = generateFakeWaveform(durationSeconds * 100);

  // Bundle Remotion
  console.log('📦 Bundling Remotion project...');
  const remotionEntryPath = path.join(process.cwd(), 'src', 'remotion', 'index.ts');
  const bundleLocation = await bundle({ entryPoint: remotionEntryPath });
  console.log('✅ Bundle ready\n');

  const inputProps = {
    audioUrl: finalAudioUrl,
    childName,
    audioDurationInFrames: totalDurationFrames,
    waveformData,
  };

  console.log('🎯 Configuring composition...');
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: COMPOSITION_ID,
    inputProps,
  });

  console.log('🎥 Rendering video...\n');
  const startTime = Date.now();

  await renderMedia({
    composition: { ...composition, durationInFrames: totalDurationFrames },
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: TEST_CONFIG.outputPath,
    inputProps,
    crf: 23,
    pixelFormat: 'yuv420p',
    onProgress: ({ progress }) => {
      const percent = Math.round(progress * 100);
      process.stdout.write(`\r   Progress: ${percent}%`);
    },
  });

  // Cleanup temp file
  if (tempAudioPath) {
    try { fs.unlinkSync(tempAudioPath); } catch {}
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Video rendered successfully!');
  console.log(`⏱️  Render time: ${elapsed}s`);
  console.log(`📁 Output: ${TEST_CONFIG.outputPath}`);
  console.log('\n🎄 Open the file to preview your Santa call video!\n');
}

main().catch((error) => {
  console.error('\n❌ Render failed:', error.message || error);
  process.exit(1);
});
