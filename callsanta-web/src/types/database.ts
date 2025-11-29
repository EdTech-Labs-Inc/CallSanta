export type CallStatus = 
  | 'pending' 
  | 'scheduled' 
  | 'queued' 
  | 'in_progress' 
  | 'completed' 
  | 'failed' 
  | 'cancelled' 
  | 'no_answer';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Call {
  id: string;
  child_name: string;
  child_age: number;
  child_gender: string;
  child_nationality: string;
  child_info_text: string | null;
  child_info_voice_url: string | null;
  child_info_voice_transcript: string | null;
  phone_number: string;
  phone_country_code: string;
  scheduled_at: string;
  timezone: string;
  call_now: boolean;
  gift_budget: number; // Budget in dollars, 0-1000
  parent_email: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  payment_status: PaymentStatus;
  base_amount_cents: number;
  recording_purchased: boolean;
  recording_amount_cents: number | null;
  total_amount_cents: number;
  currency: string;
  call_status: CallStatus;
  twilio_call_sid: string | null;
  elevenlabs_conversation_id: string | null;
  call_started_at: string | null;
  call_ended_at: string | null;
  call_duration_seconds: number | null;
  recording_url: string | null;
  recording_twilio_url: string | null;
  transcript: string | null;
  transcript_sent_at: string | null;
  recording_purchase_link: string | null;
  recording_purchased_at: string | null;
  video_url: string | null;
  video_generated_at: string | null;
  video_status: 'pending' | 'processing' | 'completed' | 'failed' | null;
  retry_count: number;
  utm_source: string | null;
  created_at: string;
  updated_at: string;
}
