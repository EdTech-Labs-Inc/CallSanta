import { AbsoluteFill, useCurrentFrame, interpolate, useVideoConfig } from 'remotion';

interface CallTimerProps {
  startFrame: number;
}

export const CallTimer: React.FC<CallTimerProps> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calculate elapsed time since call started
  const elapsedFrames = Math.max(0, frame - startFrame);
  const elapsedSeconds = Math.floor(elapsedFrames / fps);
  
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Entry animation
  const opacity = interpolate(frame - startFrame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Pulse animation for the recording indicator
  const pulse = Math.sin(frame * 0.1) * 0.3 + 0.7;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 200,
      }}
    >
      {/* Timer container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          opacity,
          background: 'rgba(0,0,0,0.4)',
          padding: '16px 28px',
          borderRadius: 40,
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Recording indicator */}
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            backgroundColor: '#ff4444',
            boxShadow: `0 0 ${8 * pulse}px #ff4444`,
            opacity: pulse,
          }}
        />
        
        {/* Timer text */}
        <span
          style={{
            color: '#fff',
            fontSize: 32,
            fontWeight: 600,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: 2,
          }}
        >
          {timeString}
        </span>
      </div>

      {/* "LIVE" badge */}
      <div
        style={{
          position: 'absolute',
          bottom: 280,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(255,68,68,0.9)',
          padding: '8px 16px',
          borderRadius: 6,
          opacity: pulse,
        }}
      >
        <span
          style={{
            color: '#fff',
            fontSize: 18,
            fontWeight: 700,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: 2,
          }}
        >
          LIVE
        </span>
      </div>
    </AbsoluteFill>
  );
};

