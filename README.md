# SantasNumber Documentation

Welcome to the SantasNumber documentation. This guide covers everything you need to know to understand, run, and develop the SantasNumber application.

## What is SantasNumber?

SantasNumber is a web application that enables parents to book personalized phone calls from Santa Claus to their children. The system combines AI conversational capabilities, automated call scheduling, video generation, and payment processing into a complete e-commerce experience.

### Key Features

- **Book Personalized Santa Calls** - Parents provide child details, schedule a time, and Santa calls
- **AI Voice Conversations** - Powered by ElevenLabs for natural, context-aware conversations
- **Automatic Scheduling** - Calls are initiated at the scheduled time via cron jobs
- **Call Recording & Video Generation** - Optional recording purchase generates shareable video clips
- **Affiliate Program** - Promotional program with tracking and commissions
- **Email Notifications** - Booking confirmations, reminders, and post-call summaries

## Documentation Index

| Document | Description |
|----------|-------------|
| [Getting Started](./GETTING_STARTED.md) | Local development setup and running the project |
| [Architecture](./ARCHITECTURE.md) | System architecture, data flow, and service interactions |
| [API Reference](./API_REFERENCE.md) | Complete API endpoints documentation |
| [Environment Variables](./ENVIRONMENT_VARIABLES.md) | All required environment variables |
| [Database Schema](./DATABASE_SCHEMA.md) | Database tables and relationships |
| [Affiliates](./AFFILIATES.md) | Affiliate program documentation |

## Tech Stack Overview

### Frontend
- **Next.js 16** with App Router
- **React 19** with React Compiler
- **Tailwind CSS 4** for styling
- **React Hook Form + Zod** for form validation

### Backend
- **Next.js API Routes** for serverless functions
- **Supabase** for PostgreSQL database and file storage
- **Stripe** for payment processing
- **ElevenLabs** for AI voice conversations (via Twilio)
- **Remotion + AWS Lambda** for video generation
- **Resend** for transactional emails

### Infrastructure
- **Vercel** for hosting and cron jobs
- **AWS Lambda** for video rendering
- **Supabase Storage** for file storage

## Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd SantasNumber-web

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your API keys

# Run the development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
SantasNumber-web/
├── src/
│   ├── app/                    # Next.js App Router pages & API routes
│   │   ├── api/               # Backend API endpoints
│   │   │   ├── calls/         # Call CRUD operations
│   │   │   ├── affiliates/    # Affiliate management
│   │   │   ├── cron/          # Scheduled jobs
│   │   │   ├── video/         # Video rendering
│   │   │   └── webhooks/      # Third-party webhooks
│   │   ├── book/              # Booking page
│   │   ├── success/           # Post-payment success
│   │   ├── recording/         # Recording playback
│   │   └── affiliate/         # Affiliate pages
│   ├── components/            # React components
│   │   ├── forms/             # Form components
│   │   ├── layout/            # Layout components
│   │   └── ui/                # Reusable UI primitives
│   ├── lib/                   # Utility functions & services
│   │   ├── email/             # Email service (Resend)
│   │   ├── video/             # Video rendering (Remotion)
│   │   ├── affiliate/         # Affiliate tracking
│   │   ├── supabase/          # Database clients
│   │   └── *.ts               # Individual service integrations
│   ├── remotion/              # Video composition components
│   └── types/                 # TypeScript type definitions
├── public/                    # Static assets
├── supabase/                  # Database migrations
├── worker/                    # Background worker process
├── scripts/                   # Utility scripts
└── docs/                      # Documentation (you are here)
```

## Core User Flow

1. **Booking** - Parent visits `/book` and fills out the booking wizard
2. **Payment** - Stripe processes the payment
3. **Scheduling** - Call is scheduled or initiated immediately
4. **Call Execution** - Cron job triggers ElevenLabs to make the call
5. **Recording** - If purchased, audio is processed into a shareable video
6. **Delivery** - Email sent with transcript and/or video link

## Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Remotion (Video)
npm run remotion:preview # Preview video composition
npm run remotion:studio  # Interactive video studio
npm run remotion:render  # Render test video locally

# Worker
npm run worker:dev       # Run background worker in dev mode
npm run worker:start     # Run background worker
```

## Support

For questions or issues, please refer to the relevant documentation sections or open an issue in the repository.
