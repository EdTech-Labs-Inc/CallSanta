# Affiliate Program

This document describes the affiliate/creator program for Santa's Number.

## Overview

The affiliate program allows anyone to earn commission on bookings they refer. Each affiliate gets:
- A **friendly URL**: `santasnumber.com/{slug}` (e.g., `santasnumber.com/santa-mike`)
- A **tracking code**: Used in `?aff={code}` parameter
- **20% commission** on paid bookings

## For Creators: How to Join

### Self-Serve Signup

1. Visit **santasnumber.com/affiliate/join**
2. Enter your name, email, and desired custom slug
3. Click "Create My Affiliate Link"
4. Copy and save your links!

Your links are saved in your browser, so you can view them anytime by clicking the "Your Links" button on the booking page.

### Your Two Links

| Type | Example | Best For |
|------|---------|----------|
| Friendly URL | `santasnumber.com/santa-mike` | Social media bios, verbal sharing |
| Tracking URL | `santasnumber.com/book?aff=SANTAMIKE` | Ads, email campaigns |

Both links work the same way - when someone clicks and books within 30 days, you earn 20%.

### Slug Requirements

- 3-50 characters
- Lowercase letters, numbers, and hyphens only
- Must start and end with a letter or number
- Cannot use reserved words (brand names, route names)

---

## For Admins: Management

### Configuration

| Setting | Value | Location |
|---------|-------|----------|
| Attribution window | 30 days | Cookie-based tracking |
| Default payout | 20% | All affiliates |
| Cookie name | `cs_aff` | Client-side storage |

### Environment Setup

Add to your `.env.local` for admin features:

```bash
ADMIN_API_KEY=your-secure-admin-key-here
```

### Listing Affiliates (Admin Only)

```bash
curl https://santasnumber.com/api/affiliates \
  -H "x-api-key: YOUR_ADMIN_API_KEY"
```

### Revenue Report (Admin Only)

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
  }
}
```

### Calculating Payouts

Payout amounts are in cents: `891 cents = $8.91`

---

## How Attribution Works

1. User clicks affiliate link (e.g., `santasnumber.com/creator-name`)
2. System redirects to `/book?aff=CREATORCODE`
3. Attribution cookie is set with code + timestamp
4. Cookie persists for 30 days
5. When user completes booking, `affiliate_id` is attached to the call record
6. Revenue is tracked and can be queried via the report API

### Last-Click Attribution

If a user clicks multiple affiliate links, the **last click wins**. The cookie is overwritten with the most recent affiliate code.

---

## Reserved Slugs

The following slugs cannot be used:

- **Routes:** `book`, `api`, `demo`, `legal`, `success`, `cancelled`, `recording`, `admin`, `affiliate`
- **Brand:** `santasnumber`, `santas-number`, `santacalls`, `santa-calls`
- **Technical:** `lib`, `components`, `hooks`, `utils`, `types`, `constants`

---

## API Reference

### Check Slug Availability

```
GET /api/affiliates/check-slug?slug=my-slug
```

Response:
```json
{ "available": true }
// or
{ "available": false, "reason": "This slug is already taken" }
```

### Create Affiliate (Public)

```
POST /api/affiliates
Content-Type: application/json

{
  "name": "Creator Name",
  "email": "creator@example.com",
  "slug": "creator-name"
}
```

### List Affiliates (Admin)

```
GET /api/affiliates
x-api-key: YOUR_ADMIN_API_KEY
```

### Get Report (Admin)

```
GET /api/affiliates/report?start=2024-12-01&end=2024-12-31
x-api-key: YOUR_ADMIN_API_KEY
```

---

## Database Schema

### affiliates table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| slug | VARCHAR(50) | URL-friendly identifier |
| public_code | VARCHAR(20) | Tracking code |
| name | VARCHAR(100) | Display name |
| email | VARCHAR(255) | Contact email |
| payout_percent | DECIMAL(5,2) | Commission percentage (default 20) |
| is_active | BOOLEAN | Whether affiliate can receive attributions |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### calls table (affiliate tracking)

| Column | Type | Description |
|--------|------|-------------|
| affiliate_id | UUID | Foreign key to affiliates.id (nullable) |

---

## Troubleshooting

### Affiliate not getting credit

1. Check if the affiliate's `is_active` is `true`
2. Verify the attribution cookie is set (check browser dev tools for `cs_aff`)
3. Ensure booking was completed within 30-day attribution window

### Slug already taken

Slugs must be unique. Try a different slug variation.

### Report shows zero revenue

- Verify bookings have `payment_status = 'paid'`
- Check the date range filters
- Confirm `affiliate_id` is set on call records
