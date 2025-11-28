import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

interface CallingLabelProps {
  childName: string;
  isRinging: boolean;
  connectionProgress: number;
}

export const CallingLabel: React.FC<CallingLabelProps> = ({
  childName,
  isRinging,
  connectionProgress,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Text entry animation
  const textEntry = spring({
    frame: frame - 15,
    fps,
    config: {
      damping: 15,
      stiffness: 100,
    },
  });

  // Subtle float animation
  const floatY = Math.sin(frame * 0.02) * 5;

  // Dot animation for "calling..."
  const dotCount = Math.floor((frame / 20) % 4);
  const dots = '.'.repeat(dotCount);

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 130,
      }}
    >
      {/* Main title container */}
      <div
        style={{
          transform: `translateY(${floatY}px) scale(${textEntry})`,
          textAlign: 'center',
        }}
      >
        {/* "Santa is calling" text */}
        <div
          style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: 32,
            fontWeight: 500,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: 2,
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          {isRinging ? `Santa is calling${dots}` : 'Santa is talking to'}
        </div>

        {/* Child's name */}
        <div
          style={{
            color: '#fff',
            fontSize: 72,
            fontWeight: 800,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textShadow: '0 4px 20px rgba(0,0,0,0.3), 0 0 60px rgba(255,200,50,0.3)',
            lineHeight: 1.1,
          }}
        >
          {childName}
        </div>

        {/* Christmas decorations */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 20,
            marginTop: 20,
            fontSize: 36,
            opacity: interpolate(frame, [30, 50], [0, 1], { extrapolateRight: 'clamp' }),
          }}
        >
          <span>🎄</span>
          <span>⭐</span>
          <span>🎄</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

