import { Composition } from 'remotion';
import { SantaCallVideo } from './compositions/SantaCallVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SantaCallVideo"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={SantaCallVideo as any}
        durationInFrames={60 * 60}
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
