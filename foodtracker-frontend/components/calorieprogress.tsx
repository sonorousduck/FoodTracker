import { View } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';

type CalorieProgressProps = {
  size: number;
  strokeWidth: number;
  progress: number;
  trackColor: string;
  progressColor: string;
  testID?: string;
};

export default function CalorieProgress({
  size,
  strokeWidth,
  progress,
  trackColor,
  progressColor,
  testID,
}: CalorieProgressProps) {
  const clampedProgress = Math.max(0, Math.min(progress, 1));

  return (
    <View
      testID={testID}
      style={{
        width: size,
        height: size / 2 + strokeWidth,
        overflow: 'hidden',
        alignItems: 'center',
      }}
    >
      <AnimatedCircularProgress
        size={size}
        width={strokeWidth}
        fill={clampedProgress * 100}
        tintColor={progressColor}
        backgroundColor={trackColor}
        arcSweepAngle={180}
        rotation={-90}
        lineCap="round"
      />
    </View>
  );
}
