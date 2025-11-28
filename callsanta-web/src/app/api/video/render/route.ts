import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { renderSantaVideo } from '@/lib/video';

/**
 * POST /api/video/render
 * Trigger video rendering for a completed call
 * 
 * Body: { callId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { callId } = body;

    if (!callId) {
      return NextResponse.json(
        { error: 'callId is required' },
        { status: 400 }
      );
    }

    // Fetch call from database
    const { data: call, error: fetchError } = await supabaseAdmin
      .from('calls')
      .select('*')
      .eq('id', callId)
      .single();

    if (fetchError || !call) {
      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404 }
      );
    }

    // Check if call has a recording
    if (!call.recording_url) {
      return NextResponse.json(
        { error: 'Call does not have a recording yet' },
        { status: 400 }
      );
    }

    // Check if video is already being processed or completed
    if (call.video_status === 'processing') {
      return NextResponse.json(
        { error: 'Video is already being processed' },
        { status: 409 }
      );
    }

    if (call.video_status === 'completed' && call.video_url) {
      return NextResponse.json({
        message: 'Video already exists',
        videoUrl: call.video_url,
      });
    }

    // Start video rendering
    console.log(`[API] Starting video render for call ${callId}`);

    const result = await renderSantaVideo({
      callId,
      audioUrl: call.recording_url,
      childName: call.child_name,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        videoUrl: result.videoUrl,
        message: 'Video rendered successfully',
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Video rendering failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API] Video render error:', errorMessage);
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET /api/video/render?callId=xxx
 * Check video render status for a call
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const callId = searchParams.get('callId');

  if (!callId) {
    return NextResponse.json(
      { error: 'callId is required' },
      { status: 400 }
    );
  }

  const { data: call, error } = await supabaseAdmin
    .from('calls')
    .select('video_url, video_status, video_generated_at')
    .eq('id', callId)
    .single();

  if (error || !call) {
    return NextResponse.json(
      { error: 'Call not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    callId,
    videoStatus: call.video_status,
    videoUrl: call.video_url,
    generatedAt: call.video_generated_at,
  });
}

