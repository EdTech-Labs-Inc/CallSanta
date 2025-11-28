import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig } from 'remotion';

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

  // Subtle breathing animation when connected
  const breathe = isRinging 
    ? 0 
    : Math.sin(frame * 0.025) * 0.015;

  // Ring scale for incoming call effect
  const ringScale = isRinging ? 1 + ringPulse * 0.05 : 1;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 320,
      }}
    >
      {/* Pulsing ring effect for incoming call */}
      {isRinging && (
        <>
          {[0, 1, 2].map((i) => {
            const delay = i * 12;
            const cycleFrame = (frame + delay) % 70;
            const opacity = cycleFrame < 50 
              ? 0.5 - (cycleFrame / 50) * 0.5
              : 0;
            const scale = 1 + (cycleFrame / 70) * 0.6;
            
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: 320 + 140,
                  width: 280,
                  height: 280,
                  borderRadius: '50%',
                  border: '3px solid #c41e3a',
                  opacity,
                  transform: `scale(${scale})`,
                }}
              />
            );
          })}
        </>
      )}

      {/* Connected green ring */}
      {!isRinging && connectionProgress > 0.5 && (
        <div
          style={{
            position: 'absolute',
            top: 310,
            width: 300,
            height: 300,
            borderRadius: '50%',
            border: '3px solid #22c55e',
            boxShadow: '0 0 20px rgba(34, 197, 94, 0.3)',
          }}
        />
      )}

      {/* Avatar shadow */}
      <div
        style={{
          position: 'absolute',
          top: 460,
          width: 200,
          height: 40,
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.12) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />

      {/* Santa avatar container - clean, modern */}
      <div
        style={{
          width: 280,
          height: 280,
          borderRadius: '50%',
          background: 'linear-gradient(180deg, #c41e3a 0%, #9a1830 100%)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transform: `scale(${entryScale * ringScale * (1 + breathe)})`,
          boxShadow: `
            0 4px 20px rgba(196, 30, 58, 0.25),
            0 8px 40px rgba(0,0,0,0.1),
            inset 0 -4px 20px rgba(0,0,0,0.15)
          `,
          border: '4px solid white',
        }}
      >
        {/* Santa emoji */}
        <span style={{ fontSize: 140, marginTop: -8 }}>🎅</span>
      </div>

      {/* Status badge - modern pill style */}
      <div
        style={{
          marginTop: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: isRinging ? 'white' : 'rgba(34, 197, 94, 0.1)',
          padding: '10px 20px',
          borderRadius: 50,
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          border: isRinging ? '1px solid #e5e5e5' : '1px solid rgba(34, 197, 94, 0.2)',
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: isRinging ? '#c41e3a' : '#22c55e',
            boxShadow: isRinging 
              ? `0 0 ${6 + ringPulse * 6}px #c41e3a` 
              : '0 0 8px #22c55e',
          }}
        />
        <span
          style={{
            color: isRinging ? '#333' : '#16a34a',
            fontSize: 18,
            fontWeight: 600,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: 0.5,
          }}
        >
          {isRinging ? 'Incoming Call' : 'Connected'}
        </span>
      </div>
    </AbsoluteFill>
  );
};
