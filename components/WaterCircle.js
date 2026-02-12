import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming
} from 'react-native-reanimated';

export default function WaterCircle({ consumed, goal }) {

  const fillHeight = useSharedValue(0);

  useEffect(() => {
    if (goal) {
      const percentage = Math.min(consumed / goal, 1);
      fillHeight.value = withTiming(percentage * 220, { duration: 800 });
    }
  }, [consumed]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: fillHeight.value
  }));

  return (
    <Animated.View style={[styles.circle]}>
      <Animated.View style={[styles.fill, animatedStyle]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#1E293B',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    borderWidth: 4,
    borderColor: '#38BDF8'
  },
  fill: {
    width: '100%',
    backgroundColor: '#38BDF8'
  }
});
