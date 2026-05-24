import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, Easing } from "react-native";

/**
 * Skeleton — animated shimmer placeholder.
 * Use instead of ActivityIndicator for a premium loading feel.
 */
const Skeleton = ({ width = "100%", height = 14, radius = 8, style }) => {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.75,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height, borderRadius: radius, opacity },
        style,
      ]}
    />
  );
};

/** Reels list skeleton — full-screen placeholder while reels load */
export const ReelsListSkeleton = () => (
  <View style={styles.reelsWrap}>
    {[1, 2].map((i) => (
      <View key={i} style={styles.reelCard}>
        <Skeleton width="100%" height="100%" radius={0} />
      </View>
    ))}
  </View>
);

/** Chat list skeleton */
export const ChatListSkeleton = () => (
  <View style={{ paddingHorizontal: 14, paddingTop: 8 }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <View key={i} style={styles.chatRow}>
        <Skeleton width={36} height={36} radius={18} />
        <View style={{ flex: 1 }}>
          <Skeleton width="55%" height={11} />
          <Skeleton
            width="80%"
            height={9}
            style={{ marginTop: 6 }}
          />
        </View>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  base: {
    backgroundColor: "rgba(148,163,184,0.18)",
  },
  reelsWrap: { flex: 1, gap: 8, paddingHorizontal: 0 },
  reelCard: {
    flex: 1,
    backgroundColor: "#0f172a",
    overflow: "hidden",
  },
  chatRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    paddingVertical: 10,
  },
});

export default Skeleton;
