import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

export const Logo: React.FC = () => {
  const frame = useCurrentFrame();

  // Fade in after a short delay
  const opacity = interpolate(frame, [60, 90], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'flex-start',
        padding: 60,
        paddingBottom: 100,
      }}
    >
      {/* Logo container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          opacity,
          background: 'rgba(0,0,0,0.3)',
          padding: '12px 20px',
          borderRadius: 12,
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Logo icon */}
        <span style={{ fontSize: 28 }}>🎅</span>
        
        {/* Logo text */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span
            style={{
              color: '#fff',
              fontSize: 20,
              fontWeight: 700,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: 0.5,
            }}
          >
            santasnumber.com
          </span>
          <span
            style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: 12,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            Book your call today
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

