import { Composition } from 'remotion';
import { SantaCallVideo } from './compositions/SantaCallVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SantaCallVideo"
        component={SantaCallVideo}
        durationInFrames={60 * 60} // Default 60 seconds at 60fps, will be overridden
        fps={60}
        width={1080}
        height={1920}
        defaultProps={{
          audioUrl: '',
          childName: 'Little One',
          audioDurationInFrames: 60 * 60,
          waveformData: [] as number[],
        }}
      />
    </>
  );
};

