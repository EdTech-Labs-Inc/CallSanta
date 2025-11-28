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
        paddingBottom: 240, // Above the banner
      }}
    >
      {/* Timer container - clean modern style */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          opacity,
          background: 'white',
          padding: '14px 24px',
          borderRadius: 50,
          boxShadow: '0 2px 15px rgba(0,0,0,0.08)',
          border: '1px solid #e5e5e5',
        }}
      >
        {/* Recording indicator */}
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: '#ef4444',
            boxShadow: `0 0 ${6 * pulse}px #ef4444`,
            opacity: 0.5 + pulse * 0.5,
          }}
        />
        
        {/* Timer text */}
        <span
          style={{
            color: '#333',
            fontSize: 24,
            fontWeight: 600,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: 1,
          }}
        >
          {timeString}
        </span>
      </div>
    </AbsoluteFill>
  );
};
