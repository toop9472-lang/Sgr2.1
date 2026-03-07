// AI Floating Button - زر المساعد الذكي المحسن
import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated, View, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const AIFloatingButton = ({ onPress }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // تاثير نبض مستمر
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: -1,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.delay(1200),
      ])
    ).start();
  }, []);

  const waveRotation = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-12deg', '0deg', '12deg'],
  });

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress} 
      activeOpacity={0.85}
    >
      {/* حلقة الوهج الخارجية */}
      <Animated.View 
        style={[
          styles.glowRing,
          { transform: [{ scale: pulseAnim }] }
        ]} 
      />
      
      {/* الزر الرئيسي */}
      <LinearGradient
        colors={['#38bdf8', '#6366f1', '#8b5cf6']}
        style={styles.button}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* صقر مبهج */}
        <View style={styles.iconContainer}>
          <Image source={require('../../assets/logo_saqr.png')} style={styles.falconLogo} resizeMode="cover" />
          <Animated.View style={[styles.waveBadge, { transform: [{ rotate: waveRotation }] }]}>
            <Ionicons name="hand-right" size={9} color="#0f172a" />
          </Animated.View>
        </View>
        
        {/* نقاط الذكاء الاصطناعي */}
        <View style={styles.aiDots}>
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    zIndex: 100,
  },
  glowRing: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(99, 102, 241, 0.24)',
    top: -7,
    left: -7,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  falconLogo: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  waveBadge: {
    position: 'absolute',
    right: -2,
    top: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fde68a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  aiDots: {
    position: 'absolute',
    bottom: 6,
    flexDirection: 'row',
    gap: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  dot1: {
    opacity: 0.5,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
});

export default AIFloatingButton;
