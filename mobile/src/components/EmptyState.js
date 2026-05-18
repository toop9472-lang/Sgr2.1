// Reusable polished empty-state with floating illustration.
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Props:
 *  icon: Ionicons name (default: "sparkles-outline")
 *  iconColor: color string
 *  title: bold headline
 *  subtitle: smaller description
 *  cta: { label, onPress }
 */
const EmptyState = ({
  icon = 'sparkles-outline',
  iconColor = '#60a5fa',
  title = 'لا يوجد محتوى بعد',
  subtitle = 'ابدأ بالاستكشاف من الأعلى!',
  cta,
}) => {
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [float]);

  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.iconWrap,
          {
            transform: [{ translateY }],
            borderColor: iconColor + '55',
            backgroundColor: iconColor + '14',
          },
        ]}
      >
        <Ionicons name={icon} size={42} color={iconColor} />
      </Animated.View>
      <Text style={styles.title}>{title}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {cta && cta.label && (
        <TouchableOpacity style={styles.cta} onPress={cta.onPress} activeOpacity={0.85}>
          <Ionicons name={cta.icon || 'add-circle'} size={16} color="#0a0a0f" />
          <Text style={styles.ctaText}>{cta.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 18,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 19,
  },
  cta: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#fbbf24',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 22,
  },
  ctaText: {
    color: '#0a0a0f',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default EmptyState;
