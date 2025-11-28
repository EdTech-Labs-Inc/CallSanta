# Santa Call Video Generator - Remotion

This directory contains the Remotion video rendering system for generating shareable social media videos from Santa phone calls.

## Architecture

```
src/remotion/
├── Root.tsx                    # Remotion composition root
├── index.ts                    # Entry point & exports
├── compositions/
│   └── SantaCallVideo.tsx      # Main video composition
└── components/
    ├── Background.tsx          # Animated festive background
    ├── SantaAvatar.tsx         # Santa avatar with ring animation
    ├── CallingLabel.tsx        # Child name & calling text
    ├── Waveform.tsx            # Audio-synced waveform bars
    ├── Logo.tsx                # Watermark branding
    └── CallTimer.tsx           # Live call timer
```

## Video Specs

- **Resolution**: 1080×1920 (9:16 TikTok/Reels format)
- **Frame Rate**: 60 FPS
- **Codec**: H.264
- **Audio**: AAC 192kbps
- **Duration**: 2s intro + audio duration

## How It Works

1. **Call Completes** → Audio file stored in Supabase Storage
2. **Webhook Fires** → `handleAudioWebhook` triggers video render
3. **Audio Analysis** → Extract duration & waveform data
4. **Remotion Render** → Generate video programmatically
5. **Upload** → Store MP4 in Supabase Storage
6. **Notify** → Email user with download link

## Local Development

```bash
# Preview in browser
npm run remotion:preview

# Open Remotion Studio
npm run remotion:studio

# Render a test video
npm run remotion:render
```

## Video Composition Flow

1. **Intro (0-2s)**
   - Fade in background
   - Santa avatar appears with pulsing ring animation
   - "Santa is calling..." text with dots animation
   - Child's name displayed prominently

2. **Connected (2s+)**
   - Green "CONNECTED" indicator
   - Waveform bars animate to audio
   - Call timer starts
   - "LIVE" badge pulses
   - Audio plays synced with visuals

## Customization

### Adding Custom Santa Avatar

Replace the emoji in `SantaAvatar.tsx`:

```tsx
// Instead of emoji
<span style={{ fontSize: 180 }}>🎅</span>

// Use your own image
<img 
  src="/santa-avatar.png" 
  style={{ width: 280, height: 280, borderRadius: '50%' }} 
/>
```

### Custom Backgrounds

Modify `Background.tsx` to use your own background images or gradient styles.

### Waveform Styling

Adjust colors and bar count in `Waveform.tsx`:

```tsx
const barCount = 40;        // Number of bars
const barWidth = 12;        // Width of each bar
const maxHeight = 180;      // Maximum bar height
```

## Production Deployment

### Option 1: Serverless (Remotion Lambda)
- Pay per render
- Scales infinitely
- No infrastructure management

### Option 2: GPU Worker
- Best for high volume (1000+ videos/day)
- 3-5× faster rendering
- Requires CUDA-enabled instance

### Current MVP Approach
- Renders in webhook handler
- Suitable for moderate volume
- Can be upgraded to queue-based system

## Storage

Videos are stored in Supabase Storage bucket: `call-videos`

Files are named: `{callId}.mp4`

Signed URLs expire after 1 hour for downloads.

## Environment Variables

No additional env vars required. Uses existing:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Future Enhancements

- [ ] Job queue (BullMQ/SQS) for async rendering
- [ ] Custom Santa avatar images
- [ ] Multiple video themes (cinematic, minimal, festive)
- [ ] Subtitle overlay from transcript
- [ ] Premium upsell features (custom messages, name lettering)
- [ ] Remotion Lambda deployment for scale

