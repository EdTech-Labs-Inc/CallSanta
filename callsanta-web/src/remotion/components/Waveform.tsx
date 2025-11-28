import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

interface WaveformProps {
  waveformData: number[];
  startFrame: number;
}

export const Waveform: React.FC<WaveformProps> = ({
  waveformData,
  startFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Number of bars to display
  const barCount = 40;
  
  // Entry animation
  const entryProgress = spring({
    frame: frame - startFrame,
    fps,
    config: {
      damping: 12,
      stiffness: 80,
    },
  });

  // Calculate which part of the waveform data we're at
  const audioFrame = frame - startFrame;
  
  // Get amplitude values for current frame
  const getAmplitude = (barIndex: number): number => {
    if (!waveformData || waveformData.length === 0) {
      // Fallback: generate fake waveform based on frame
      const fakeAmplitude = 
        Math.sin(audioFrame * 0.1 + barIndex * 0.5) * 0.3 +
        Math.sin(audioFrame * 0.05 + barIndex * 0.3) * 0.2 +
        0.3 +
        Math.random() * 0.1;
      return Math.max(0.1, Math.min(1, fakeAmplitude));
    }

    // Map bar index to waveform data
    const dataIndex = Math.floor((audioFrame / 2) + barIndex) % waveformData.length;
    const amplitude = waveformData[dataIndex] || 0.3;
    
    // Add some variation based on neighboring values
    const prevIndex = Math.max(0, dataIndex - 1);
    const nextIndex = Math.min(waveformData.length - 1, dataIndex + 1);
    const smoothed = (waveformData[prevIndex] + amplitude + waveformData[nextIndex]) / 3;
    
    return Math.max(0.1, Math.min(1, smoothed));
  };

  // Bar colors - gradient from green to gold
  const getBarColor = (index: number, amplitude: number): string => {
    const normalizedIndex = index / barCount;
    const intensity = amplitude;
    
    // Create a gradient effect across bars
    if (normalizedIndex < 0.3 || normalizedIndex > 0.7) {
      return `rgba(50, 205, 50, ${0.6 + intensity * 0.4})`; // Green on edges
    }
    return `rgba(255, 215, 0, ${0.6 + intensity * 0.4})`; // Gold in center
  };

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 200,
      }}
    >
      {/* Waveform container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          height: 200,
          opacity: entryProgress,
          transform: `scale(${0.8 + entryProgress * 0.2})`,
        }}
      >
        {Array.from({ length: barCount }).map((_, index) => {
          const amplitude = getAmplitude(index);
          const barHeight = 20 + amplitude * 160;
          const color = getBarColor(index, amplitude);
          
          // Staggered entry animation
          const barEntry = spring({
            frame: frame - startFrame - index * 0.5,
            fps,
            config: {
              damping: 10,
              stiffness: 100,
            },
          });
          
          return (
            <div
              key={index}
              style={{
                width: 12,
                height: barHeight * barEntry,
                backgroundColor: color,
                borderRadius: 6,
                boxShadow: `0 0 ${10 + amplitude * 20}px ${color}`,
                transition: 'height 0.05s ease-out',
              }}
            />
          );
        })}
      </div>

      {/* Glow effect behind waveform */}
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 300,
          background: 'radial-gradient(ellipse, rgba(50,205,50,0.15) 0%, transparent 70%)',
          filter: 'blur(20px)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};

