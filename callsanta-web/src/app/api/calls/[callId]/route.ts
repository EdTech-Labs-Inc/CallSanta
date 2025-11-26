import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

interface RouteParams {
  params: Promise<{ callId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { callId } = await params;

  if (!callId) {
    return NextResponse.json(
      { error: 'Call ID is required' },
      { status: 400 }
    );
  }

  const { data: call, error } = await supabaseAdmin
    .from('calls')
    .select('id, child_name, scheduled_at, payment_status, call_status, recording_purchased')
    .eq('id', callId)
    .single();

  if (error || !call) {
    return NextResponse.json(
      { error: 'Call not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(call);
}
