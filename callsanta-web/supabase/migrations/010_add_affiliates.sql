-- Migration: Add affiliates table and affiliate_id to calls
-- Purpose: Enable affiliate/creator program for tracking referrals and payouts

-- Create affiliates table
CREATE TABLE affiliates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- URL identifiers
    slug VARCHAR(50) NOT NULL UNIQUE,           -- URL path: /creator-name
    public_code VARCHAR(20) NOT NULL UNIQUE,    -- Tracking code: ?aff=CODE

    -- Affiliate details
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,

    -- Payout configuration
    payout_percent DECIMAL(5,2) NOT NULL DEFAULT 20.00,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX idx_affiliates_slug ON affiliates(slug) WHERE is_active = TRUE;
CREATE INDEX idx_affiliates_public_code ON affiliates(public_code) WHERE is_active = TRUE;
CREATE INDEX idx_affiliates_email ON affiliates(email);

-- Add affiliate_id to calls table
ALTER TABLE calls ADD COLUMN affiliate_id UUID REFERENCES affiliates(id) ON DELETE SET NULL;
CREATE INDEX idx_calls_affiliate_id ON calls(affiliate_id);

-- Trigger for updated_at (reuse existing function if available, create if not)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at') THEN
        CREATE FUNCTION update_updated_at()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
    END IF;
END
$$;

CREATE TRIGGER affiliates_updated_at
    BEFORE UPDATE ON affiliates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Reporting function for affiliate revenue
CREATE OR REPLACE FUNCTION get_affiliate_report(
    start_date TIMESTAMPTZ DEFAULT NULL,
    end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    affiliate_id UUID,
    affiliate_name VARCHAR,
    affiliate_email VARCHAR,
    affiliate_slug VARCHAR,
    payout_percent DECIMAL,
    total_bookings BIGINT,
    paid_bookings BIGINT,
    total_revenue_cents BIGINT,
    payout_due_cents BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.name,
        a.email,
        a.slug,
        a.payout_percent,
        COUNT(c.id)::BIGINT,
        COUNT(c.id) FILTER (WHERE c.payment_status = 'paid')::BIGINT,
        COALESCE(SUM(c.total_amount_cents) FILTER (WHERE c.payment_status = 'paid'), 0)::BIGINT,
        COALESCE(ROUND(SUM(c.total_amount_cents) FILTER (WHERE c.payment_status = 'paid') * a.payout_percent / 100), 0)::BIGINT
    FROM affiliates a
    LEFT JOIN calls c ON c.affiliate_id = a.id
        AND (start_date IS NULL OR c.created_at >= start_date)
        AND (end_date IS NULL OR c.created_at <= end_date)
    WHERE a.is_active = TRUE
    GROUP BY a.id, a.name, a.email, a.slug, a.payout_percent
    ORDER BY COALESCE(SUM(c.total_amount_cents) FILTER (WHERE c.payment_status = 'paid'), 0) DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;
