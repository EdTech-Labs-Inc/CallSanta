-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Calls table
CREATE TABLE calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Child Information
    child_name VARCHAR(100) NOT NULL,
    child_age INTEGER NOT NULL CHECK (child_age >= 1 AND child_age <= 18),
    child_gender VARCHAR(20) NOT NULL,
    child_nationality VARCHAR(100) NOT NULL,
    child_info_text TEXT,
    child_info_voice_url TEXT,
    child_info_voice_transcript TEXT,
    
    -- Call Configuration
    phone_number VARCHAR(20) NOT NULL,
    phone_country_code VARCHAR(5) NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    timezone VARCHAR(50) NOT NULL,
    gift_budget VARCHAR(20) NOT NULL,
    
    -- Parent Contact
    parent_email VARCHAR(255) NOT NULL,
    
    -- Payment
    stripe_checkout_session_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    payment_status VARCHAR(20) DEFAULT 'pending',
    base_amount_cents INTEGER NOT NULL,
    recording_purchased BOOLEAN DEFAULT FALSE,
    recording_amount_cents INTEGER,
    total_amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'usd',
    
    -- Call Execution
    call_status VARCHAR(20) DEFAULT 'pending',
    twilio_call_sid VARCHAR(50),
    elevenlabs_conversation_id VARCHAR(100),
    call_started_at TIMESTAMPTZ,
    call_ended_at TIMESTAMPTZ,
    call_duration_seconds INTEGER,
    
    -- Recordings & Transcripts
    recording_url TEXT,
    recording_twilio_url TEXT,
    transcript TEXT,
    transcript_sent_at TIMESTAMPTZ,
    recording_purchase_link TEXT,
    recording_purchased_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_calls_scheduled_at ON calls(scheduled_at) WHERE call_status = 'scheduled';
CREATE INDEX idx_calls_payment_status ON calls(payment_status);
CREATE INDEX idx_calls_call_status ON calls(call_status);
CREATE INDEX idx_calls_parent_email ON calls(parent_email);

-- Call Events table
CREATE TABLE call_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_call_events_call_id ON call_events(call_id);

-- Pricing Config table
CREATE TABLE pricing_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    base_price_cents INTEGER NOT NULL,
    recording_addon_cents INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'usd',
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default pricing
INSERT INTO pricing_config (name, base_price_cents, recording_addon_cents, is_active)
VALUES ('default', 999, 499, TRUE);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calls_updated_at
    BEFORE UPDATE ON calls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
