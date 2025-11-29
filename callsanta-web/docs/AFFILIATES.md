# Affiliate Program Management

This document describes how to manage the affiliate/creator program for Santa's Number.

## Overview

The affiliate program allows creators to earn commission on bookings they refer. Each affiliate gets:
- A **friendly URL**: `santasnumber.com/{slug}` (e.g., `santasnumber.com/santa-mike`)
- A **tracking code**: Used in `?aff={code}` parameter
- **20% default commission** on paid bookings

## Configuration

| Setting | Value | Location |
|---------|-------|----------|
| Attribution window | 30 days | Cookie-based tracking |
| Default payout | 20% | Configurable per affiliate |
| Cookie name | `cs_aff` | Client-side storage |

## Environment Setup

Add to your `.env.local`:

```bash
ADMIN_API_KEY=your-secure-admin-key-here
```

## Creating an Affiliate

Use the admin API to create affiliates:

```bash
curl -X POST https://santasnumber.com/api/affiliates \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_ADMIN_API_KEY" \
  -d '{
    "name": "Creator Name",
    "email": "creator@example.com",
    "slug": "creator-name",
    "payout_percent": 20
  }'
```

### Slug Requirements

- 3-50 characters
- Lowercase alphanumeric and hyphens only
- Must start and end with alphanumeric character
- Cannot use reserved slugs (see below)

### Response

```json
{
  "affiliate": {
    "id": "uuid-here",
    "slug": "creator-name",
    "public_code": "CREATNAME1234",
    "name": "Creator Name",
    "email": "creator@example.com",
    "payout_percent": 20,
    "is_active": true,
    "created_at": "2024-12-01T00:00:00Z",
    "updated_at": "2024-12-01T00:00:00Z"
  },
  "links": {
    "direct": "https://santasnumber.com/creator-name",
    "withCode": "https://santasnumber.com/book?aff=CREATNAME1234"
  }
}
```

## Affiliate Links

Each affiliate gets two link formats:

| Type | URL | Use Case |
|------|-----|----------|
| Friendly URL | `santasnumber.com/{slug}` | Social media bios, verbal sharing |
| Direct URL | `santasnumber.com/book?aff={code}` | Ads, email campaigns with UTM tracking |

Both links work the same way - they set an attribution cookie that lasts 30 days.

## Listing Affiliates

```bash
# List all active affiliates
curl https://santasnumber.com/api/affiliates \
  -H "x-api-key: YOUR_ADMIN_API_KEY"

# Include inactive affiliates
curl "https://santasnumber.com/api/affiliates?active=false" \
  -H "x-api-key: YOUR_ADMIN_API_KEY"
```

## Revenue Report

Get affiliate performance metrics:

```bash
# All-time report
curl https://santasnumber.com/api/affiliates/report \
  -H "x-api-key: YOUR_ADMIN_API_KEY"

# Date-filtered report
curl "https://santasnumber.com/api/affiliates/report?start=2024-12-01&end=2024-12-31" \
  -H "x-api-key: YOUR_ADMIN_API_KEY"
```

### Report Response

```json
{
  "report": [
    {
      "affiliate_id": "uuid",
      "affiliate_name": "Creator Name",
      "affiliate_email": "creator@example.com",
      "affiliate_slug": "creator-name",
      "payout_percent": 20,
      "total_bookings": 50,
      "paid_bookings": 45,
      "total_revenue_cents": 4455,
      "payout_due_cents": 891
    }
  ],
  "totals": {
    "total_affiliates": 1,
    "total_bookings": 50,
    "total_paid_bookings": 45,
    "total_revenue_cents": 4455,
    "total_payout_due_cents": 891
  },
  "filters": {
    "start_date": "2024-12-01",
    "end_date": "2024-12-31"
  }
}
```

### Calculating Payouts

Payout amounts are in cents. To get dollars:

```
payout_due_dollars = payout_due_cents / 100
```

Example: `891 cents = $8.91`

## Reserved Slugs

The following slugs cannot be used for affiliates:

**Existing Routes:**
- `book`, `api`, `demo`, `legal`, `success`, `cancelled`, `recording`

**Future Routes:**
- `admin`, `affiliate`, `affiliates`, `dashboard`, `login`, `signup`

**Brand Protection:**
- `santasnumber`, `santas-number`, `santas_number`
- `santacalls`, `santa-calls`, `santa_calls`

**Technical:**
- `lib`, `components`, `hooks`, `utils`, `types`, `constants`

## How Attribution Works

1. User clicks affiliate link (e.g., `santasnumber.com/creator-name`)
2. System redirects to `/book?aff=CREATORCODE`
3. Attribution cookie is set with code + timestamp
4. Cookie persists for 30 days
5. When user completes booking, `affiliate_id` is attached to the call record
6. Revenue is tracked and can be queried via the report API

### Last-Click Attribution

If a user clicks multiple affiliate links, the **last click wins**. The cookie is overwritten with the most recent affiliate code.

## Database Schema

### affiliates table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| slug | VARCHAR(50) | URL-friendly identifier |
| public_code | VARCHAR(20) | Tracking code |
| name | VARCHAR(100) | Display name |
| email | VARCHAR(255) | Contact email |
| payout_percent | DECIMAL(5,2) | Commission percentage |
| is_active | BOOLEAN | Whether affiliate can receive new attributions |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### calls table (additions)

| Column | Type | Description |
|--------|------|-------------|
| affiliate_id | UUID | Foreign key to affiliates.id (nullable) |

## Troubleshooting

### Affiliate not getting credit

1. Check if the affiliate's `is_active` is `true`
2. Verify the attribution cookie is set (check browser dev tools)
3. Ensure booking was completed within 30-day attribution window

### Slug already taken error

Slugs must be unique. Use a different slug or check if an inactive affiliate already has it.

### Report shows zero revenue

- Verify bookings have `payment_status = 'paid'`
- Check the date range filters
- Confirm `affiliate_id` is set on call records
