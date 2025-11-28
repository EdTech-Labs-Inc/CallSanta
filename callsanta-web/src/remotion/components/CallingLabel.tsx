import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig } from 'remotion';

interface CallingLabelProps {
  childName: string;
  isRinging: boolean;
  connectionProgress: number;
}

export const CallingLabel: React.FC<CallingLabelProps> = ({
  childName,
  isRinging,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Text entry animation
  const textEntry = spring({
    frame: frame - 10,
    fps,
    config: {
      damping: 15,
      stiffness: 100,
    },
  });

  // Dot animation for "calling..."
  const dotCount = Math.floor((frame / 25) % 4);
  const dots = '.'.repeat(dotCount);

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 140,
      }}
    >
      {/* Main title container */}
      <div
        style={{
          transform: `scale(${textEntry})`,
          textAlign: 'center',
        }}
      >
        {/* Status text */}
        <div
          style={{
            color: '#888',
            fontSize: 24,
            fontWeight: 500,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          {isRinging ? `Santa is calling${dots}` : 'Santa is talking to'}
        </div>

        {/* Child's name - bold and prominent */}
        <div
          style={{
            color: '#1a1a1a',
            fontSize: 64,
            fontWeight: 800,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: -1,
            lineHeight: 1.1,
          }}
        >
          {childName}
        </div>
      </div>
    </AbsoluteFill>
  );
};
