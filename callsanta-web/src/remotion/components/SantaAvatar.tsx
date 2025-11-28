import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

interface SantaAvatarProps {
  isRinging: boolean;
  ringPulse: number;
  connectionProgress: number;
}

export const SantaAvatar: React.FC<SantaAvatarProps> = ({
  isRinging,
  ringPulse,
  connectionProgress,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entry animation
  const entryScale = spring({
    frame,
    fps,
    config: {
      damping: 12,
      stiffness: 80,
    },
  });

  // Breathing animation when connected
  const breathe = isRinging 
    ? 0 
    : Math.sin(frame * 0.03) * 0.02;

  // Ring scale for incoming call effect
  const ringScale = isRinging ? 1 + ringPulse * 0.08 : 1;

  // Glow intensity
  const glowIntensity = isRinging 
    ? 0.4 + ringPulse * 0.3 
    : interpolate(connectionProgress, [0, 1], [0.4, 0.6]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 280,
      }}
    >
      {/* Pulsing ring effect for incoming call */}
      {isRinging && (
        <>
          {[0, 1, 2].map((i) => {
            const delay = i * 10;
            const opacity = interpolate(
              (frame + delay) % 60,
              [0, 30, 60],
              [0.6, 0.2, 0],
              { extrapolateRight: 'clamp' }
            );
            const scale = interpolate(
              (frame + delay) % 60,
              [0, 60],
              [1, 1.8]
            );
            
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: 280 + 180,
                  width: 360,
                  height: 360,
                  borderRadius: '50%',
                  border: '4px solid rgba(50, 205, 50, 0.8)',
                  opacity,
                  transform: `scale(${scale})`,
                }}
              />
            );
          })}
        </>
      )}

      {/* Green connected indicator */}
      {!isRinging && connectionProgress > 0.5 && (
        <div
          style={{
            position: 'absolute',
            top: 270,
            width: 380,
            height: 380,
            borderRadius: '50%',
            border: '4px solid rgba(50, 205, 50, 0.6)',
            boxShadow: '0 0 30px rgba(50, 205, 50, 0.4)',
          }}
        />
      )}

      {/* Avatar glow */}
      <div
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(255,255,255,${glowIntensity}) 0%, transparent 70%)`,
          filter: 'blur(30px)',
        }}
      />

      {/* Santa avatar container */}
      <div
        style={{
          width: 360,
          height: 360,
          borderRadius: '50%',
          background: 'linear-gradient(180deg, #c41e3a 0%, #8b0000 100%)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transform: `scale(${entryScale * ringScale * (1 + breathe)})`,
          boxShadow: `
            0 0 0 8px rgba(255,255,255,0.1),
            0 20px 60px rgba(0,0,0,0.4),
            inset 0 -10px 30px rgba(0,0,0,0.2)
          `,
          overflow: 'hidden',
        }}
      >
        {/* Santa emoji/icon - using emoji for now, can replace with actual image */}
        <span style={{ fontSize: 180, marginTop: -10 }}>🎅</span>
      </div>

      {/* Connection status badge */}
      <div
        style={{
          position: 'absolute',
          top: 580,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: isRinging 
            ? 'rgba(255,255,255,0.15)' 
            : 'rgba(50,205,50,0.2)',
          padding: '12px 24px',
          borderRadius: 30,
          opacity: interpolate(frame, [20, 40], [0, 1], { extrapolateRight: 'clamp' }),
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: isRinging ? '#fff' : '#32cd32',
            boxShadow: isRinging 
              ? `0 0 ${8 + ringPulse * 8}px #fff` 
              : '0 0 10px #32cd32',
          }}
        />
        <span
          style={{
            color: '#fff',
            fontSize: 24,
            fontWeight: 600,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: 1,
          }}
        >
          {isRinging ? 'INCOMING CALL' : 'CONNECTED'}
        </span>
      </div>
    </AbsoluteFill>
  );
};

