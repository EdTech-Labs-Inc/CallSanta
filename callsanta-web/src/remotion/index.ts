import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';

// Register the root component for Remotion CLI
registerRoot(RemotionRoot);

// Export for programmatic rendering
export { RemotionRoot } from './Root';
export { SantaCallVideo } from './compositions/SantaCallVideo';
export type { SantaCallVideoProps } from './compositions/SantaCallVideo';

