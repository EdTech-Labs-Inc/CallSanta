import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

export const Logo: React.FC = () => {
  const frame = useCurrentFrame();

  // Fade in after a short delay
  const opacity = interpolate(frame, [30, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
      }}
    >
      {/* Big red banner at bottom */}
      <div
        style={{
          width: '100%',
          height: 180,
          background: 'linear-gradient(180deg, #c41e3a 0%, #a01830 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          opacity,
          boxShadow: '0 -4px 30px rgba(0,0,0,0.15)',
        }}
      >
        {/* Main URL */}
        <div
          style={{
            color: 'white',
            fontSize: 56,
            fontWeight: 800,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: -1,
            textShadow: '0 2px 10px rgba(0,0,0,0.2)',
          }}
        >
          santasnumber.com
        </div>
        
        {/* Tagline */}
        <div
          style={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: 20,
            fontWeight: 500,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: 2,
            textTransform: 'uppercase',
            marginTop: 8,
          }}
        >
          Book a call from Santa
        </div>
      </div>
    </AbsoluteFill>
  );
};
