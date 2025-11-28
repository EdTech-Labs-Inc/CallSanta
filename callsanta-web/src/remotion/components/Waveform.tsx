import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig } from 'remotion';

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
  const barCount = 32;
  
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
        Math.sin(audioFrame * 0.08 + barIndex * 0.4) * 0.3 +
        Math.sin(audioFrame * 0.04 + barIndex * 0.25) * 0.2 +
        0.35 +
        Math.random() * 0.08;
      return Math.max(0.15, Math.min(1, fakeAmplitude));
    }

    // Map bar index to waveform data
    const dataIndex = Math.floor((audioFrame / 2) + barIndex) % waveformData.length;
    const amplitude = waveformData[dataIndex] || 0.3;
    
    // Smooth with neighbors
    const prevIndex = Math.max(0, dataIndex - 1);
    const nextIndex = Math.min(waveformData.length - 1, dataIndex + 1);
    const smoothed = (waveformData[prevIndex] + amplitude + waveformData[nextIndex]) / 3;
    
    return Math.max(0.15, Math.min(1, smoothed));
  };

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 180,
      }}
    >
      {/* Waveform container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          height: 160,
          opacity: entryProgress,
          transform: `scale(${0.9 + entryProgress * 0.1})`,
        }}
      >
        {Array.from({ length: barCount }).map((_, index) => {
          const amplitude = getAmplitude(index);
          const barHeight = 20 + amplitude * 120;
          
          // Staggered entry animation
          const barEntry = spring({
            frame: frame - startFrame - index * 0.3,
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
                width: 8,
                height: barHeight * barEntry,
                backgroundColor: '#c41e3a',
                borderRadius: 4,
                opacity: 0.7 + amplitude * 0.3,
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
