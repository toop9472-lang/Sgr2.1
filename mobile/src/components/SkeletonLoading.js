// Skeleton Loading Component - تحميل متحرك احترافي
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

// Shimmer Effect Component
const Shimmer = ({ width, height, borderRadius = 8, style }) => {
  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={[styles.shimmerContainer, { width, height, borderRadius }, style]}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.1)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shimmerGradient}
        />
      </Animated.View>
    </View>
  );
};

// Home Screen Skeleton
export const HomeScreenSkeleton = () => (
  <View style={styles.container}>
    {/* Header */}
    <View style={styles.headerRow}>
      <Shimmer width={120} height={40} borderRadius={20} />
      <View style={styles.headerRight}>
        <Shimmer width={60} height={30} borderRadius={15} />
        <Shimmer width={60} height={30} borderRadius={15} />
      </View>
    </View>

    {/* Featured Card */}
    <Shimmer width={screenWidth - 32} height={160} borderRadius={16} style={styles.featuredCard} />

    {/* Balance Card */}
    <Shimmer width={screenWidth - 32} height={100} borderRadius={16} style={styles.card} />

    {/* Dual Cards */}
    <View style={styles.dualRow}>
      <Shimmer width={(screenWidth - 44) / 2} height={110} borderRadius={14} />
      <Shimmer width={(screenWidth - 44) / 2} height={110} borderRadius={14} />
    </View>

    {/* Another Dual Row */}
    <View style={styles.dualRow}>
      <Shimmer width={(screenWidth - 44) / 2} height={110} borderRadius={14} />
      <Shimmer width={(screenWidth - 44) / 2} height={110} borderRadius={14} />
    </View>
  </View>
);

// Profile Screen Skeleton
export const ProfileScreenSkeleton = () => (
  <View style={styles.container}>
    {/* Avatar */}
    <View style={styles.profileHeader}>
      <Shimmer width={100} height={100} borderRadius={50} />
      <Shimmer width={150} height={24} borderRadius={8} style={{ marginTop: 12 }} />
      <Shimmer width={100} height={16} borderRadius={8} style={{ marginTop: 8 }} />
    </View>

    {/* Stats Row */}
    <View style={styles.statsRow}>
      <Shimmer width={80} height={60} borderRadius={12} />
      <Shimmer width={80} height={60} borderRadius={12} />
      <Shimmer width={80} height={60} borderRadius={12} />
    </View>

    {/* Menu Items */}
    {[1, 2, 3, 4, 5].map(i => (
      <Shimmer key={i} width={screenWidth - 32} height={56} borderRadius={12} style={styles.menuItem} />
    ))}
  </View>
);

// Games Screen Skeleton
export const GamesScreenSkeleton = () => (
  <View style={styles.container}>
    {/* Categories */}
    <View style={styles.categoriesRow}>
      <Shimmer width={80} height={36} borderRadius={18} />
      <Shimmer width={80} height={36} borderRadius={18} />
      <Shimmer width={80} height={36} borderRadius={18} />
    </View>

    {/* Games Grid */}
    <View style={styles.gamesGrid}>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <Shimmer key={i} width={(screenWidth - 44) / 2} height={140} borderRadius={16} style={styles.gameCard} />
      ))}
    </View>
  </View>
);

// Shop Screen Skeleton
export const ShopScreenSkeleton = () => (
  <View style={styles.container}>
    {/* Balance */}
    <Shimmer width={screenWidth - 32} height={80} borderRadius={16} style={styles.card} />

    {/* Categories */}
    <View style={styles.categoriesRow}>
      <Shimmer width={100} height={40} borderRadius={20} />
      <Shimmer width={100} height={40} borderRadius={20} />
      <Shimmer width={100} height={40} borderRadius={20} />
    </View>

    {/* Items */}
    <View style={styles.shopGrid}>
      {[1, 2, 3, 4].map(i => (
        <Shimmer key={i} width={(screenWidth - 44) / 2} height={180} borderRadius={16} style={styles.shopItem} />
      ))}
    </View>
  </View>
);

// Chat Screen Skeleton
export const ChatScreenSkeleton = () => (
  <View style={styles.container}>
    {/* Messages */}
    {[1, 2, 3, 4, 5, 6].map(i => (
      <View key={i} style={[styles.messageRow, i % 2 === 0 && styles.messageRowRight]}>
        {i % 2 !== 0 && <Shimmer width={36} height={36} borderRadius={18} />}
        <Shimmer 
          width={Math.random() * 100 + 120} 
          height={50} 
          borderRadius={16} 
          style={{ marginHorizontal: 8 }}
        />
        {i % 2 === 0 && <Shimmer width={36} height={36} borderRadius={18} />}
      </View>
    ))}

    {/* Input */}
    <View style={styles.chatInput}>
      <Shimmer width={screenWidth - 80} height={44} borderRadius={22} />
      <Shimmer width={44} height={44} borderRadius={22} />
    </View>
  </View>
);

// List Item Skeleton (for FlatList/FlashList)
export const ListItemSkeleton = ({ height = 80 }) => (
  <View style={styles.listItem}>
    <Shimmer width={50} height={50} borderRadius={25} />
    <View style={styles.listItemContent}>
      <Shimmer width={150} height={16} borderRadius={4} />
      <Shimmer width={100} height={12} borderRadius={4} style={{ marginTop: 8 }} />
    </View>
    <Shimmer width={60} height={30} borderRadius={8} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    padding: 16,
    paddingTop: 50,
  },
  shimmerContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
  },
  shimmerGradient: {
    flex: 1,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },

  // Cards
  featuredCard: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },

  // Dual Row
  dualRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  // Profile
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  menuItem: {
    marginBottom: 12,
  },

  // Categories
  categoriesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },

  // Games Grid
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gameCard: {
    marginBottom: 12,
  },

  // Shop
  shopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  shopItem: {
    marginBottom: 12,
  },

  // Messages
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  chatInput: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // List Item
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
});

export default {
  HomeScreenSkeleton,
  ProfileScreenSkeleton,
  GamesScreenSkeleton,
  ShopScreenSkeleton,
  ChatScreenSkeleton,
  ListItemSkeleton,
};
