# Implementation Plan - Call Santa

## Overview

This document breaks down the build into **10 phases**, designed to be completed sequentially. Each phase builds on the previous and results in a testable milestone.

---

## Phase 1: Project Initialization

**Goal:** Set up Next.js project with Tailwind, project structure, and dev tooling.

### Tasks

1. **Create Next.js App**
```bash
npx create-next-app@latest callsanta-web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd callsanta-web
```

2. **Install Core Dependencies**
```bash
npm install @supabase/supabase-js @supabase/ssr stripe @stripe/stripe-js
npm install zod react-hook-form @hookform/resolvers
npm install lucide-react clsx tailwind-merge
npm install -D @types/node
```

3. **Project Structure**
```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── (marketing)/
│   │   └── page.tsx          # Landing page
│   ├── book/
│   │   └── page.tsx          # Booking wizard
│   ├── success/
│   │   └── page.tsx          # Payment success
│   ├── cancelled/
│   │   └── page.tsx          # Payment cancelled
│   ├── recording/
│   │   └── [callId]/
│   │       └── page.tsx      # Recording download
│   └── api/
│       ├── calls/
│       │   └── route.ts
│       ├── upload-voice/
│       │   └── route.ts
│       ├── webhooks/
│       │   ├── stripe/
│       │   │   └── route.ts
│       │   └── elevenlabs/
│       │       └── route.ts
│       └── cron/
│           └── schedule-calls/
│               └── route.ts
├── components/
│   ├── ui/                   # Reusable UI components
│   ├── forms/                # Form components
│   └── layout/               # Layout components
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Browser client
│   │   ├── server.ts         # Server client
│   │   └── admin.ts          # Service role client
│   ├── stripe.ts
│   ├── elevenlabs.ts          # Outbound calls + transcription
│   └── utils.ts
├── types/
│   └── index.ts              # TypeScript types
└── config/
    └── constants.ts          # App constants
```

4. **Environment Variables Setup**

Create `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_CALL_PRICE_ID=
STRIPE_RECORDING_PRICE_ID=

# ElevenLabs (Twilio is linked via ElevenLabs dashboard)
ELEVENLABS_API_KEY=
ELEVENLABS_AGENT_ID=
ELEVENLABS_AGENT_PHONE_NUMBER_ID=
ELEVENLABS_WEBHOOK_SECRET=

# Cron
CRON_SECRET=

# Email
RESEND_API_KEY=
EMAIL_FROM=santa@callsanta.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

5. **Configure Tailwind**

Update `tailwind.config.ts` with Christmas theme colors:
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        santa: {
          red: "#C41E3A",
          green: "#165B33",
          gold: "#FFD700",
          cream: "#FFFDD0",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
    },
  },
  plugins: [],
};
export default config;
```

6. **Utility Functions**

Create `src/lib/utils.ts`:
```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Acceptance Criteria
- [✅] Next.js app runs with `npm run dev`
- [✅] Tailwind styling works
- [✅] Project structure created
- [✅] Environment variables template exists

---

## Phase 2: Supabase Database Setup

**Goal:** Create Supabase project and set up all database tables.

### Tasks

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project (both dev and prod)
   - Copy connection details to `.env.local`

2. **Run Database Migrations**

Create `supabase/migrations/001_initial_schema.sql`:
```sql
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
```

3. **Set up Supabase Storage**
   - Create bucket: `voice-recordings` (private)
   - Create bucket: `call-recordings` (private)

4. **Supabase Client Setup**

Create `src/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

Create `src/lib/supabase/server.ts`:
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

Create `src/lib/supabase/admin.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

5. **TypeScript Types**

Create `src/types/database.ts`:
```typescript
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

export type GiftBudget = 'low' | 'medium' | 'high' | 'unlimited';

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
  gift_budget: GiftBudget;
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
  created_at: string;
  updated_at: string;
}
```

### Acceptance Criteria
- [✅] Supabase project created
- [✅] All tables exist with correct schema
- [✅] Storage buckets created
- [✅] Supabase clients work (test with simple query)
- [✅] TypeScript types match database schema

---

## Phase 3: Landing Page & UI Components

**Goal:** Build the landing page with festive design and core UI components.

### Tasks

1. **Install Fonts**

Update `src/app/layout.tsx`:
```typescript
import { Playfair_Display, Source_Sans_3 } from 'next/font/google'

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-display',
})

const sourceSans = Source_Sans_3({ 
  subsets: ['latin'],
  variable: '--font-body',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${sourceSans.variable}`}>
      <body className="font-body">{children}</body>
    </html>
  )
}
```

2. **Core UI Components**

Create these in `src/components/ui/`:
- `button.tsx` - Button with variants
- `input.tsx` - Form input
- `select.tsx` - Dropdown select
- `textarea.tsx` - Text area
- `card.tsx` - Card container
- `badge.tsx` - Status badges

3. **Landing Page Layout**

Create `src/app/page.tsx` with sections:
- Hero with headline + CTA button
- How it works (3 steps)
- Features/benefits
- Pricing preview
- FAQ accordion
- Footer

4. **Design Elements**
- Snowfall animation (CSS or lightweight library)
- Christmas color scheme (reds, greens, golds)
- Festive illustrations/icons
- Responsive design (mobile-first)

### Acceptance Criteria
- [✅] Landing page renders with festive design
- [✅] All UI components created and styled
- [✅] Responsive on mobile/tablet/desktop
- [✅] CTA button links to `/book`
- [✅] Page loads quickly (no heavy assets)

---

## Phase 4: Booking Form Wizard

**Goal:** Build multi-step form for collecting call details.

### Tasks

1. **Form Schema (Zod)**

Create `src/lib/schemas/booking.ts`:
```typescript
import { z } from 'zod';

export const childInfoSchema = z.object({
  childName: z.string().min(1, 'Name is required').max(100),
  childAge: z.number().min(1).max(18),
  childGender: z.enum(['boy', 'girl', 'other']),
  childNationality: z.string().min(1, 'Nationality is required'),
  childInfoText: z.string().max(2000).optional(),
});

export const callConfigSchema = z.object({
  phoneNumber: z.string().min(10, 'Valid phone number required'),
  phoneCountryCode: z.string().min(2).max(5),
  scheduledAt: z.string(), // ISO date string
  timezone: z.string(),
  giftBudget: z.enum(['low', 'medium', 'high', 'unlimited']),
});

export const contactSchema = z.object({
  parentEmail: z.string().email('Valid email required'),
  purchaseRecording: z.boolean().default(false),
});

export const bookingSchema = childInfoSchema
  .merge(callConfigSchema)
  .merge(contactSchema);

export type BookingFormData = z.infer<typeof bookingSchema>;
```

2. **Form Steps Component**

Create `src/components/forms/BookingWizard.tsx`:
- Step 1: Child Information
- Step 2: Call Configuration (phone, time, budget)
- Step 3: Contact & Add-ons (email, recording option)
- Step 4: Review & Pay

3. **Form State Management**

Use React Hook Form with step-based validation:
```typescript
const form = useForm<BookingFormData>({
  resolver: zodResolver(bookingSchema),
  mode: 'onChange',
});
```

4. **Voice Recording Component**

Create `src/components/forms/VoiceRecorder.tsx`:
- Record audio via MediaRecorder API
- Upload to Supabase Storage
- Show playback controls

5. **Phone Input**

Use `react-phone-number-input` or similar:
```bash
npm install react-phone-number-input
```

6. **Date/Time Picker**

Create time slot picker:
- Show available times (every 15 min)
- Timezone auto-detect + selector
- "Call Now" option
- Block times in the past

### Acceptance Criteria
- [✅] Multi-step form works end-to-end
- [✅] Validation shows errors appropriately
- [✅] Voice recording uploads successfully
- [✅] Phone number validates correctly
- [✅] Time picker handles timezones
- [✅] Form state persists between steps
- [✅] Final step shows order summary

---

## Phase 5: Backend API Routes

**Goal:** Build API routes for form submission and data handling.

### Tasks

1. **Create Call API**

Create `src/app/api/calls/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { bookingSchema } from '@/lib/schemas/booking';
import { createCheckoutSession } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = bookingSchema.parse(body);
    
    // Get pricing
    const { data: pricing } = await supabaseAdmin
      .from('pricing_config')
      .select('*')
      .eq('is_active', true)
      .single();
    
    const baseAmount = pricing.base_price_cents;
    const recordingAmount = validated.purchaseRecording 
      ? pricing.recording_addon_cents 
      : 0;
    const totalAmount = baseAmount + recordingAmount;
    
    // Create call record
    const { data: call, error } = await supabaseAdmin
      .from('calls')
      .insert({
        child_name: validated.childName,
        child_age: validated.childAge,
        child_gender: validated.childGender,
        child_nationality: validated.childNationality,
        child_info_text: validated.childInfoText,
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
    
    if (error) throw error;
    
    // Create Stripe checkout session
    const checkoutUrl = await createCheckoutSession(call, validated.purchaseRecording);
    
    // Update call with session ID
    await supabaseAdmin
      .from('calls')
      .update({ stripe_checkout_session_id: checkoutUrl.sessionId })
      .eq('id', call.id);
    
    return NextResponse.json({ 
      callId: call.id, 
      checkoutUrl: checkoutUrl.url 
    });
    
  } catch (error) {
    console.error('Error creating call:', error);
    return NextResponse.json(
      { error: 'Failed to create call' },
      { status: 500 }
    );
  }
}
```

2. **Voice Upload API**

Create `src/app/api/upload-voice/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { v4 as uuid } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('audio') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    const fileName = `${uuid()}.webm`;
    const buffer = Buffer.from(await file.arrayBuffer());
    
    const { data, error } = await supabaseAdmin.storage
      .from('voice-recordings')
      .upload(fileName, buffer, {
        contentType: file.type,
      });
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('voice-recordings')
      .getPublicUrl(fileName);
    
    // TODO: Transcribe with Whisper/ElevenLabs
    
    return NextResponse.json({ 
      voiceUrl: publicUrl,
      transcript: null // Will be added after transcription
    });
    
  } catch (error) {
    console.error('Error uploading voice:', error);
    return NextResponse.json(
      { error: 'Failed to upload' },
      { status: 500 }
    );
  }
}
```

3. **Get Call Status API**

Create `src/app/api/calls/[callId]/route.ts`:
- GET: Return call status (for success page polling)

### Acceptance Criteria
- [✅] POST /api/calls creates database record
- [✅] POST /api/calls returns Stripe checkout URL
- [✅] POST /api/upload-voice uploads to storage
- [✅] Error handling returns appropriate status codes
- [✅] Request validation works correctly

---

## Phase 6: Stripe Integration

**Goal:** Set up Stripe checkout, webhooks, and payment handling.

### Tasks

1. **Stripe Setup**

Create products in Stripe Dashboard:
- "Santa Call" - $9.99
- "Call Recording" - $4.99

2. **Stripe Client**

Create `src/lib/stripe.ts`:
```typescript
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function createCheckoutSession(
  call: any,
  includeRecording: boolean
) {
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price: process.env.STRIPE_CALL_PRICE_ID!,
      quantity: 1,
    },
  ];
  
  if (includeRecording) {
    lineItems.push({
      price: process.env.STRIPE_RECORDING_PRICE_ID!,
      quantity: 1,
    });
  }
  
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancelled`,
    customer_email: call.parent_email,
    metadata: {
      call_id: call.id,
      include_recording: includeRecording.toString(),
    },
  });
  
  return { sessionId: session.id, url: session.url };
}

export async function createRecordingPaymentLink(callId: string) {
  const paymentLink = await stripe.paymentLinks.create({
    line_items: [
      {
        price: process.env.STRIPE_RECORDING_PRICE_ID!,
        quantity: 1,
      },
    ],
    metadata: {
      call_id: callId,
      type: 'recording_purchase',
    },
    after_completion: {
      type: 'redirect',
      redirect: {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/recording/${callId}`,
      },
    },
  });
  
  return paymentLink.url;
}
```

3. **Stripe Webhook**

Create `src/app/api/webhooks/stripe/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
  
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const callId = session.metadata?.call_id;
      
      if (callId) {
        await supabaseAdmin
          .from('calls')
          .update({
            payment_status: 'paid',
            call_status: 'scheduled',
            stripe_payment_intent_id: session.payment_intent as string,
          })
          .eq('id', callId);
        
        await supabaseAdmin.from('call_events').insert({
          call_id: callId,
          event_type: 'payment_received',
          event_data: { session_id: session.id },
        });
      }
      break;
    }
    
    case 'payment_intent.payment_failed': {
      // Handle failed payment
      break;
    }
  }
  
  return NextResponse.json({ received: true });
}
```

4. **Success Page**

Create `src/app/success/page.tsx`:
- Show confirmation message
- Display call details
- Show countdown if scheduled for future
- "What happens next" explanation

5. **Cancelled Page**

Create `src/app/cancelled/page.tsx`:
- Encourage to complete purchase
- Link back to booking form

### Acceptance Criteria
- [✅] Stripe checkout redirects correctly
- [✅] Webhook updates database on payment
- [✅] Success page shows correct information
- [✅] Cancelled page provides retry option
- [✅] Test with Stripe test cards

---

## Phase 7: ElevenLabs Conversational AI Integration

**Goal:** Set up phone call functionality using ElevenLabs Conversational AI with native Twilio integration.

> **Architecture:** ElevenLabs handles the entire call flow (connects to Twilio internally). We just trigger calls via their API and receive webhooks when calls complete.

### Prerequisites (One-time Dashboard Setup)

1. **Create ElevenLabs Conversational AI Agent**
   - Go to ElevenLabs dashboard → Agents
   - Create new agent with Santa voice
   - Configure system prompt with dynamic variables (see below)
   - Note the `agent_id`

2. **Link Twilio in ElevenLabs Dashboard**
   - Go to Agent settings → Phone Numbers
   - Add Twilio Account SID + Auth Token
   - Import or purchase a phone number
   - Note the `agent_phone_number_id`

3. **Configure Agent System Prompt**
```
You are Santa Claus making a phone call to a child named {{child_name}}.
You are warm, jolly, and magical. Use "Ho ho ho!" naturally in conversation.
{{child_name}} is {{child_age}} years old.

Gift budget guidance: {{gift_budget}}

The parent has told you about {{child_name}}: {{child_info}}
Additional voice note info: {{voice_info}}

Keep the call under 3 minutes. End warmly by reminding them to be good and go to bed early on Christmas Eve.
Start by asking "Ho ho ho! Is this {{child_name}}?"
```

### Tasks

1. **Environment Variables**

Add to `.env.local`:
```env
# ElevenLabs (existing key, new agent IDs)
ELEVENLABS_API_KEY=xxx
ELEVENLABS_AGENT_ID=xxx
ELEVENLABS_AGENT_PHONE_NUMBER_ID=xxx

# Cron security
CRON_SECRET=xxx
```

2. **ElevenLabs Client**

Update `src/lib/elevenlabs.ts`:
```typescript
// Keep existing transcription code, add:

export async function initiateCall(
  toNumber: string,
  callData: {
    childName: string;
    childAge: number;
    giftBudget: string;
    childInfoText?: string;
    childInfoVoiceTranscript?: string;
  }
) {
  const response = await fetch('https://api.elevenlabs.io/v1/convai/twilio/outbound-call', {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      agent_id: process.env.ELEVENLABS_AGENT_ID!,
      agent_phone_number_id: process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID!,
      to_number: toNumber,
      conversation_initiation_client_data: {
        dynamic_variables: {
          child_name: callData.childName,
          child_age: callData.childAge.toString(),
          gift_budget: callData.giftBudget,
          child_info: callData.childInfoText || '',
          voice_info: callData.childInfoVoiceTranscript || '',
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs call failed: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    conversationId: data.conversation_id,
    callSid: data.callSid,
    success: data.success,
  };
}

export async function getConversation(conversationId: string) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
    {
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY! },
    }
  );
  return response.json();
}

export async function getConversationAudio(conversationId: string) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`,
    {
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY! },
    }
  );
  return response.arrayBuffer();
}
```

3. **Call Scheduler (Cron Job)**

Create `src/app/api/cron/schedule-calls/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { initiateCall } from '@/lib/elevenlabs';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Find calls ready to be made (within next minute)
  const { data: calls } = await supabaseAdmin
    .from('calls')
    .select('*')
    .eq('call_status', 'scheduled')
    .eq('payment_status', 'paid')
    .lte('scheduled_at', new Date(Date.now() + 60000).toISOString());

  const results = [];
  for (const call of calls || []) {
    try {
      const result = await initiateCall(call.phone_number, {
        childName: call.child_name,
        childAge: call.child_age,
        giftBudget: call.gift_budget,
        childInfoText: call.child_info_text,
        childInfoVoiceTranscript: call.child_info_voice_transcript,
      });

      await supabaseAdmin
        .from('calls')
        .update({
          call_status: 'queued',
          twilio_call_sid: result.callSid,
          elevenlabs_conversation_id: result.conversationId,
        })
        .eq('id', call.id);

      await supabaseAdmin.from('call_events').insert({
        call_id: call.id,
        event_type: 'call_initiated',
        event_data: result,
      });

      results.push({ callId: call.id, success: true });
    } catch (error) {
      console.error(`Failed to initiate call ${call.id}:`, error);
      results.push({ callId: call.id, success: false, error: String(error) });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
```

4. **ElevenLabs Webhook**

Create `src/app/api/webhooks/elevenlabs/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getConversation, getConversationAudio } from '@/lib/elevenlabs';

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const { conversation_id, status } = payload;

  // Find call by conversation ID
  const { data: call } = await supabaseAdmin
    .from('calls')
    .select('*')
    .eq('elevenlabs_conversation_id', conversation_id)
    .single();

  if (!call) {
    return NextResponse.json({ error: 'Call not found' }, { status: 404 });
  }

  // Map ElevenLabs status to our status
  const statusMap: Record<string, string> = {
    'in_progress': 'in_progress',
    'completed': 'completed',
    'failed': 'failed',
  };

  const updates: Record<string, any> = {
    call_status: statusMap[status] || call.call_status,
  };

  // If completed, fetch transcript and recording
  if (status === 'completed') {
    const conversation = await getConversation(conversation_id);

    updates.call_ended_at = new Date().toISOString();
    updates.transcript = conversation.transcript;
    updates.call_duration_seconds = conversation.duration_seconds;

    // Download and store recording in Supabase
    const audioBuffer = await getConversationAudio(conversation_id);
    const fileName = `${call.id}.mp3`;

    await supabaseAdmin.storage
      .from('call-recordings')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('call-recordings')
      .getPublicUrl(fileName);

    updates.recording_url = publicUrl;
  }

  await supabaseAdmin
    .from('calls')
    .update(updates)
    .eq('id', call.id);

  await supabaseAdmin.from('call_events').insert({
    call_id: call.id,
    event_type: `elevenlabs_${status}`,
    event_data: payload,
  });

  return NextResponse.json({ received: true });
}
```

5. **Vercel Cron Config**

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/schedule-calls",
      "schedule": "* * * * *"
    }
  ]
}
```

### Acceptance Criteria
- [✅] ElevenLabs agent configured in dashboard
- [✅] Twilio linked in ElevenLabs dashboard
- [✅] Cron job triggers scheduled calls
- [✅] Calls initiate successfully via ElevenLabs API
- [✅] Webhook receives call status updates
- [✅] Recordings saved to Supabase Storage
- [✅] Transcripts stored in database
- [✅] End-to-end test call works

---

## Phase 8: Email System

**Goal:** Set up transactional email for transcripts and notifications.

### Tasks

1. **Install Resend**
```bash
npm install resend
```

2. **Email Client**

Create `src/lib/email.ts`:
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendTranscriptEmail(call: any) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: call.parent_email,
    subject: `🎅 Here's what Santa said to ${call.child_name}!`,
    html: generateTranscriptEmailHtml(call),
  });
}

function generateTranscriptEmailHtml(call: any) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #C41E3A;">🎅 Ho Ho Ho!</h1>
      <p>Santa just finished talking to ${call.child_name}!</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Call Transcript</h3>
        <p style="white-space: pre-wrap;">${call.transcript}</p>
      </div>
      
      ${!call.recording_purchased ? `
        <div style="background: #165B33; color: white; padding: 20px; border-radius: 8px; text-align: center;">
          <h2>Want to keep this memory forever?</h2>
          <p>Purchase the recording for just $4.99</p>
          <a href="${call.recording_purchase_link}" 
             style="display: inline-block; background: #C41E3A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
            Get the Recording
          </a>
        </div>
      ` : `
        <div style="text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/recording/${call.id}" 
             style="display: inline-block; background: #165B33; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Download Recording
          </a>
        </div>
      `}
    </div>
  `;
}
```

3. **Transcript Generation**

Add transcript generation after call:
- Use ElevenLabs transcript if available
- Or use Whisper API on recording
- Store in database

4. **Email Sender Cron**

Create `src/app/api/cron/send-emails/route.ts`:
- Find completed calls without transcript_sent_at
- Generate recording purchase link if needed
- Send email
- Update transcript_sent_at

### Acceptance Criteria
- [ ] Emails send successfully
- [ ] Transcript displays correctly
- [ ] Recording purchase link works
- [ ] Download link works for purchasers
- [ ] Emails look good on mobile

---

## Phase 9: Recording Download & Upsell

**Goal:** Build recording download page and handle post-call purchases.

### Tasks

1. **Recording Page**

Create `src/app/recording/[callId]/page.tsx`:
```typescript
// Verify recording is purchased
// Generate signed URL from Supabase Storage
// Show audio player
// Provide download button
```

2. **Handle Recording Purchase Webhook**

Update Stripe webhook to handle recording-only purchases:
- Check metadata for `type: 'recording_purchase'`
- Update `recording_purchased` and `recording_purchased_at`

3. **Signed URL Generation**

```typescript
export async function getRecordingUrl(callId: string) {
  const { data: call } = await supabaseAdmin
    .from('calls')
    .select('recording_url, recording_purchased')
    .eq('id', callId)
    .single();
  
  if (!call?.recording_purchased) {
    throw new Error('Recording not purchased');
  }
  
  // Generate signed URL valid for 1 hour
  const { data } = await supabaseAdmin.storage
    .from('call-recordings')
    .createSignedUrl(call.recording_url, 3600);
  
  return data.signedUrl;
}
```

### Acceptance Criteria
- [ ] Recording page validates purchase
- [ ] Audio player works
- [ ] Download works
- [ ] Post-call purchase flow works
- [ ] Unauthorized access is blocked

---

## Phase 10: Testing, Polish & Deploy

**Goal:** Final testing, polish, and production deployment.

### Tasks

1. **End-to-End Testing**
- [ ] Full flow: Landing → Form → Payment → Call → Email → Recording
- [ ] Test with real phone number
- [ ] Test different timezones
- [ ] Test edge cases (form validation, failed payments)

2. **Error Handling**
- [ ] Add proper error boundaries
- [ ] Add toast notifications
- [ ] Handle network failures gracefully
- [ ] Add retry logic where appropriate

3. **Loading States**
- [ ] Form submission loading
- [ ] Payment redirect loading
- [ ] Recording download loading

4. **SEO & Meta**
- [ ] Page titles and descriptions
- [ ] Open Graph images
- [ ] Favicon (festive!)

5. **Analytics**
- [ ] Add Vercel Analytics or Plausible
- [ ] Track key conversion events

6. **Legal Pages**
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Refund Policy

7. **Production Deployment**
- [ ] Set up production Supabase
- [ ] Set up production Stripe (live keys)
- [ ] Configure Twilio for production
- [ ] Set up production domain
- [ ] Configure DNS
- [ ] Deploy to Vercel

8. **Monitoring**
- [ ] Set up Sentry for error tracking
- [ ] Set up uptime monitoring
- [ ] Configure alerting

### Acceptance Criteria
- [ ] All flows work in production
- [ ] Error tracking is active
- [ ] Analytics are recording
- [ ] Legal pages are accessible
- [ ] SSL is working
- [ ] Domain is configured

---

## Quick Reference

### Commands

```bash
# Development
npm run dev

# Build
npm run build

# Database migrations
supabase db push

# Stripe webhook testing (local)
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# ElevenLabs webhook testing (use ngrok for local dev)
ngrok http 3000
# Then set webhook URL in ElevenLabs dashboard: https://<ngrok-url>/api/webhooks/elevenlabs

# Manually trigger cron (local testing)
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/schedule-calls
```

### Key Files

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Landing page |
| `src/app/book/page.tsx` | Booking wizard |
| `src/app/api/calls/route.ts` | Create call API |
| `src/app/api/webhooks/stripe/route.ts` | Stripe webhook |
| `src/app/api/webhooks/elevenlabs/route.ts` | ElevenLabs call status webhook |
| `src/app/api/cron/schedule-calls/route.ts` | Cron job to trigger calls |
| `src/lib/stripe.ts` | Stripe utilities |
| `src/lib/elevenlabs.ts` | ElevenLabs calls + transcription |

### External Dashboards

- **Supabase:** https://supabase.com/dashboard
- **Stripe:** https://dashboard.stripe.com
- **Twilio:** https://console.twilio.com
- **ElevenLabs:** https://elevenlabs.io/app
- **Vercel:** https://vercel.com/dashboard

---

## Estimated Timeline

| Phase | Days | Cumulative |
|-------|------|------------|
| Phase 1: Project Init | 0.5 | 0.5 |
| Phase 2: Database | 0.5 | 1 |
| Phase 3: Landing Page | 1.5 | 2.5 |
| Phase 4: Booking Form | 2 | 4.5 |
| Phase 5: Backend APIs | 1 | 5.5 |
| Phase 6: Stripe | 1.5 | 7 |
| Phase 7: Twilio + ElevenLabs | 3 | 10 |
| Phase 8: Email | 1 | 11 |
| Phase 9: Recordings | 1 | 12 |
| Phase 10: Polish & Deploy | 2 | 14 |

**Total: ~14 days (2-3 weeks with buffer)**

