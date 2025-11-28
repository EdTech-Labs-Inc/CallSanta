import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { queueVideoRender } from '@/lib/video';

/**
 * POST /api/video/render
 * Queue video rendering for a completed call
 * 
 * NOTE: Actual rendering is done by a separate worker process
 * This endpoint just queues the job
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

    // Queue the video render
    await queueVideoRender({
      callId,
      audioUrl: call.recording_url,
      childName: call.child_name,
    });

    return NextResponse.json({
      success: true,
      message: 'Video queued for rendering',
      note: 'Run the worker to process: npm run video:process',
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API] Video queue error:', errorMessage);
    
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

  try {
    const { data: call, error } = await supabaseAdmin
      .from('calls')
      .select('id, child_name, recording_url')
      .eq('id', callId)
      .single();

    if (error || !call) {
      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404 }
      );
    }

    // Try to get video fields (may not exist if migration not run)
    const fullCall = call as Record<string, unknown>;

    return NextResponse.json({
      callId,
      childName: call.child_name,
      hasRecording: !!call.recording_url,
      videoStatus: fullCall.video_status || null,
      videoUrl: fullCall.video_url || null,
      generatedAt: fullCall.video_generated_at || null,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch call' },
      { status: 500 }
    );
  }
}
