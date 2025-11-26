import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { bookingSchema } from '@/lib/schemas/booking';
import { createCheckoutSession } from '@/lib/stripe';
import { transcribeAudio } from '@/lib/transcription';
import { v4 as uuid } from 'uuid';
import { Call } from '@/types/database';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_AUDIO_TYPES = [
  'audio/webm',
  'audio/mp3',
  'audio/wav',
  'audio/m4a',
  'audio/mpeg',
  'audio/ogg',
];

export async function POST(request: NextRequest) {
  try {
    // 1. Parse FormData
    const formData = await request.formData();
    const dataString = formData.get('data');
    const voiceFile = formData.get('voiceRecording') as File | null;

    if (!dataString || typeof dataString !== 'string') {
      return NextResponse.json(
        { error: 'Missing form data' },
        { status: 400 }
      );
    }

    // 2. Parse and validate JSON data
    let parsedData;
    try {
      parsedData = JSON.parse(dataString);
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON data' },
        { status: 400 }
      );
    }

    const validationResult = bookingSchema.safeParse(parsedData);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const validated = validationResult.data;

    // 3. Process voice file (if present)
    let voiceUrl: string | null = null;
    let voiceTranscript: string | null = null;

    if (voiceFile && voiceFile.size > 0) {
      // Validate file size
      if (voiceFile.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'Voice file too large (max 10MB)' },
          { status: 400 }
        );
      }

      // Validate file type
      if (!ALLOWED_AUDIO_TYPES.includes(voiceFile.type)) {
        return NextResponse.json(
          { error: `Invalid audio file type: ${voiceFile.type}` },
          { status: 400 }
        );
      }

      // Upload voice to Supabase Storage
      try {
        const fileExtension = voiceFile.name.split('.').pop() || 'webm';
        const fileName = `${uuid()}.${fileExtension}`;
        const buffer = Buffer.from(await voiceFile.arrayBuffer());

        const { error: uploadError } = await supabaseAdmin.storage
          .from('voice-recordings')
          .upload(fileName, buffer, {
            contentType: voiceFile.type,
          });

        if (uploadError) {
          console.error('Voice upload error:', uploadError);
          // Continue without voice file - graceful degradation
        } else {
          // Get public URL for the uploaded file
          const { data: urlData } = supabaseAdmin.storage
            .from('voice-recordings')
            .getPublicUrl(fileName);

          voiceUrl = urlData.publicUrl;

          // Transcribe voice with ElevenLabs
          voiceTranscript = await transcribeAudio(buffer, fileName);
        }
      } catch (uploadError) {
        console.error('Voice processing error:', uploadError);
        // Continue without voice file - graceful degradation
      }
    }

    // 4. Fetch active pricing from database
    const { data: pricing, error: pricingError } = await supabaseAdmin
      .from('pricing_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (pricingError || !pricing) {
      console.error('Pricing fetch error:', pricingError);
      return NextResponse.json(
        { error: 'Unable to fetch pricing configuration' },
        { status: 500 }
      );
    }

    // 5. Calculate amounts
    const baseAmount = pricing.base_price_cents;
    const recordingAmount = validated.purchaseRecording
      ? pricing.recording_addon_cents
      : 0;
    const totalAmount = baseAmount + recordingAmount;

    // 6. Insert call record into database
    const { data: call, error: insertError } = await supabaseAdmin
      .from('calls')
      .insert({
        child_name: validated.childName,
        child_age: validated.childAge,
        child_gender: validated.childGender,
        child_nationality: validated.childNationality,
        child_info_text: validated.childInfoText || null,
        child_info_voice_url: voiceUrl,
        child_info_voice_transcript: voiceTranscript,
        phone_number: validated.phoneNumber,
        phone_country_code: validated.phoneCountryCode,
        scheduled_at: validated.scheduledAt,
        timezone: validated.timezone,
        gift_budget: validated.giftBudget,
        parent_email: validated.parentEmail,
        base_amount_cents: baseAmount,
        recording_purchased: validated.purchaseRecording,
        recording_amount_cents: recordingAmount || null,
        total_amount_cents: totalAmount,
        payment_status: 'pending',
        call_status: 'pending',
      })
      .select()
      .single();

    if (insertError || !call) {
      console.error('Call insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      );
    }

    // 7. Create Stripe checkout session (placeholder for now)
    const checkoutResult = await createCheckoutSession(
      call as Call,
      validated.purchaseRecording
    );

    // 8. Update call with Stripe session ID
    await supabaseAdmin
      .from('calls')
      .update({ stripe_checkout_session_id: checkoutResult.sessionId })
      .eq('id', call.id);

    // 9. Return success response
    return NextResponse.json({
      callId: call.id,
      checkoutUrl: checkoutResult.url,
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/calls:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
