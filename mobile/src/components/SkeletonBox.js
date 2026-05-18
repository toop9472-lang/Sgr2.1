// Reusable skeleton placeholder with shimmer animation.
// Use anywhere we previously showed an ActivityIndicator while loading lists.
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';

const SkeletonBox = ({ width = '100%', height = 16, radius = 8, style }) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1100,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.35, 0.85, 0.35],
  });

  return (
    <Animated.View
      style={[
        styles.box,
        { width, height, borderRadius: radius, opacity },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  box: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});

export default SkeletonBox;
export { SkeletonBox };
