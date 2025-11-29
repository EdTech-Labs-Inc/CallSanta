import { AbsoluteFill, Audio, Sequence, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { Background } from '../components/Background';
import { SantaAvatar } from '../components/SantaAvatar';
import { CallingLabel } from '../components/CallingLabel';
import { Waveform } from '../components/Waveform';
import { Logo } from '../components/Logo';
import { CallTimer } from '../components/CallTimer';

export interface SantaCallVideoProps {
  audioUrl: string;
  childName: string;
  audioDurationInFrames: number;
  waveformData: number[];
}

export const SantaCallVideo: React.FC<SantaCallVideoProps> = ({
  audioUrl,
  childName,
  audioDurationInFrames,
  waveformData,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Intro animation duration (2 seconds)
  const introDuration = fps * 2;
  
  // Call connection animation
  const connectionProgress = spring({
    frame: frame - introDuration * 0.5,
    fps,
    config: {
      damping: 12,
      stiffness: 100,
    },
  });

  // Ringing animation for first 2 seconds
  const isRinging = frame < introDuration;
  const ringPulse = Math.sin(frame * 0.4) * 0.5 + 0.5;
  
  // Fade in the whole composition
  const fadeIn = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      {/* Festive Background */}
      <Background />
      
      {/* Santa Avatar with pulsing ring effect */}
      <Sequence from={0}>
        <SantaAvatar 
          isRinging={isRinging} 
          ringPulse={ringPulse}
          connectionProgress={connectionProgress}
        />
      </Sequence>

      {/* Calling Label */}
      <Sequence from={0}>
        <CallingLabel 
          childName={childName} 
          isRinging={isRinging}
          connectionProgress={connectionProgress}
        />
      </Sequence>

      {/* Waveform - appears after connection */}
      <Sequence from={introDuration}>
        <Waveform 
          waveformData={waveformData} 
          startFrame={introDuration}
        />
      </Sequence>

      {/* Call Timer */}
      <Sequence from={introDuration}>
        <CallTimer startFrame={introDuration} />
      </Sequence>

      {/* Logo Watermark */}
      <Logo />

      {/* Audio Track - starts after intro */}
      {audioUrl && (
        <Sequence from={introDuration}>
          <Audio src={audioUrl} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};


