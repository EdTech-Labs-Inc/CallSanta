import { NextRequest, NextResponse } from 'next/server';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import os from 'os';

/**
 * GET /api/video/test
 * 
 * Test video rendering WITHOUT touching the database.
 * Generates a test video and returns a download link.
 * 
 * Query params:
 *   - name: Child's name (default: "Emily")
 *   - duration: Video duration in seconds (default: 10)
 */
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test endpoint disabled in production' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const childName = searchParams.get('name') || 'Emily';
  const durationSeconds = parseInt(searchParams.get('duration') || '10', 10);

  console.log(`[Test] Rendering test video for "${childName}", ${durationSeconds}s`);

  try {
    const FPS = 60;
    const INTRO_DURATION = 2 * FPS;
    const audioDurationFrames = durationSeconds * FPS;
    const totalDurationFrames = INTRO_DURATION + audioDurationFrames;

    // Generate fake waveform
    const waveformData: number[] = [];
    for (let i = 0; i < durationSeconds * 100; i++) {
      const base = 0.3 + Math.random() * 0.4;
      const speech = Math.sin(i * 0.1) * 0.2;
      waveformData.push(Math.max(0.1, Math.min(1, base + speech)));
    }

    // Bundle Remotion
    const remotionEntryPath = path.join(process.cwd(), 'src', 'remotion', 'index.ts');
    const bundleLocation = await bundle({ entryPoint: remotionEntryPath });

    const inputProps = {
      audioUrl: '',
      childName,
      audioDurationInFrames: totalDurationFrames,
      waveformData,
    };

    // Select composition
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'SantaCallVideo',
      inputProps,
    });

    // Render
    const outputPath = path.join(os.tmpdir(), `test-santa-${Date.now()}.mp4`);
    
    await renderMedia({
      composition: { ...composition, durationInFrames: totalDurationFrames },
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps,
      crf: 23, // Faster encoding for test
    });

    // Read the file and return it
    const videoBuffer = fs.readFileSync(outputPath);
    
    // Clean up
    fs.unlinkSync(outputPath);

    return new NextResponse(videoBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="test-santa-${childName}.mp4"`,
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Test] Render failed:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

