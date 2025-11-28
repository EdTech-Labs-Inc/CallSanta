import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  
  // Subtle gradient animation
  const gradientShift = interpolate(
    frame % 300,
    [0, 150, 300],
    [0, 10, 0]
  );

  // Snowflake positions (deterministic based on index)
  const snowflakes = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: (i * 37) % 100,
    size: 4 + (i % 3) * 2,
    speed: 0.3 + (i % 4) * 0.15,
    opacity: 0.3 + (i % 3) * 0.2,
  }));

  return (
    <AbsoluteFill>
      {/* Base gradient - Christmas red to deep burgundy */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(${170 + gradientShift}deg, 
            #1a0a0a 0%, 
            #2d0a0a 20%,
            #4a1515 40%,
            #6b1a1a 60%,
            #8b2020 80%,
            #5a1010 100%
          )`,
        }}
      />
      
      {/* Radial glow behind Santa */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 800,
          height: 800,
          background: 'radial-gradient(circle, rgba(200,50,50,0.3) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Golden accent glow at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 400,
          background: 'linear-gradient(to top, rgba(255,200,50,0.08) 0%, transparent 100%)',
        }}
      />

      {/* Animated snowflakes */}
      {snowflakes.map((flake) => {
        const y = ((frame * flake.speed) + (flake.id * 100)) % 2200 - 200;
        const wobble = Math.sin(frame * 0.02 + flake.id) * 20;
        
        return (
          <div
            key={flake.id}
            style={{
              position: 'absolute',
              left: `${flake.x}%`,
              top: y,
              width: flake.size,
              height: flake.size,
              borderRadius: '50%',
              backgroundColor: 'white',
              opacity: flake.opacity,
              transform: `translateX(${wobble}px)`,
              filter: 'blur(1px)',
            }}
          />
        );
      })}

      {/* Vignette overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

