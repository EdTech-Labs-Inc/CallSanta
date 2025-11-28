import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  
  // Subtle gradient animation
  const gradientShift = interpolate(
    frame % 600,
    [0, 300, 600],
    [0, 5, 0]
  );

  // Minimal floating particles (subtle)
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: (i * 43) % 100,
    size: 3 + (i % 2) * 2,
    speed: 0.15 + (i % 3) * 0.1,
    opacity: 0.08 + (i % 3) * 0.04,
  }));

  return (
    <AbsoluteFill>
      {/* Clean white/cream gradient background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(${175 + gradientShift}deg, 
            #ffffff 0%, 
            #fafafa 30%,
            #f5f5f5 60%,
            #f0f0f0 100%
          )`,
        }}
      />
      
      {/* Subtle warm glow at top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 1200,
          height: 600,
          background: 'radial-gradient(ellipse, rgba(196,30,58,0.06) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Very subtle floating particles */}
      {particles.map((particle) => {
        const y = ((frame * particle.speed) + (particle.id * 80)) % 2200 - 100;
        const wobble = Math.sin(frame * 0.015 + particle.id) * 15;
        
        return (
          <div
            key={particle.id}
            style={{
              position: 'absolute',
              left: `${particle.x}%`,
              top: y,
              width: particle.size,
              height: particle.size,
              borderRadius: '50%',
              backgroundColor: '#c41e3a',
              opacity: particle.opacity,
              transform: `translateX(${wobble}px)`,
              filter: 'blur(1px)',
            }}
          />
        );
      })}

      {/* Subtle grid pattern overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.015) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </AbsoluteFill>
  );
};
