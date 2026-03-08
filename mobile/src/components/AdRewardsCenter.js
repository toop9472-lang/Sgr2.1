// مركز مكافآت الإعلانات - Ad Rewards Center
// نظام متكامل وممتع لمشاهدة الإعلانات والحصول على المكافآت
// 1 جوهرة لكل دقيقة مشاهدة - 500 جوهرة = 1 ريال سعودي

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const { width, height } = Dimensions.get('window');

// ==================== ثوابت النظام ====================
const GEMS_PER_RIYAL = 500; // 500 جوهرة = 1 ريال سعودي
const AD_DURATION_SECONDS = 30; // مدة الإعلان
const MAX_DAILY_ADS = 50; // الحد الأقصى للإعلانات اليومية

// مكافآت إضافية
const STREAK_BONUSES = {
  3: 5,   // 3 إعلانات متتالية = 5 جواهر إضافية
  5: 10,  // 5 إعلانات = 10 جواهر
  10: 25, // 10 إعلانات = 25 جوهرة
  20: 60, // 20 إعلان = 60 جوهرة
  30: 100, // 30 إعلان = 100 جوهرة
};

// جوائز عجلة الحظ
const WHEEL_PRIZES = [
  { id: 1, gems: 1, probability: 0.30, color: '#3b82f6', label: '1' },
  { id: 2, gems: 2, probability: 0.25, color: '#22c55e', label: '2' },
  { id: 3, gems: 3, probability: 0.20, color: '#f59e0b', label: '3' },
  { id: 4, gems: 5, probability: 0.12, color: '#ec4899', label: '5' },
  { id: 5, gems: 10, probability: 0.08, color: '#8b5cf6', label: '10' },
  { id: 6, gems: 25, probability: 0.04, color: '#ef4444', label: '25' },
  { id: 7, gems: 50, probability: 0.009, color: '#fbbf24', label: '50' },
  { id: 8, gems: 100, probability: 0.001, color: '#14b8a6', label: '100' },
];

// ==================== مكون عجلة الحظ ====================
const LuckyWheel = ({ onSpin, spinning, prize }) => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (spinning) {
      // حساب زاوية الدوران بناءً على الجائزة
      const prizeIndex = WHEEL_PRIZES.findIndex(p => p.id === prize?.id) || 0;
      const segmentAngle = 360 / WHEEL_PRIZES.length;
      const targetAngle = 360 * 5 + (360 - prizeIndex * segmentAngle - segmentAngle / 2);
      
      Animated.timing(spinAnim, {
        toValue: targetAngle,
        duration: 4000,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }).start();
    }
  }, [spinning, prize]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <View style={wheelStyles.container}>
      {/* Glow Effect */}
      <Animated.View style={[wheelStyles.glow, { opacity: glowOpacity }]} />
      
      {/* Wheel */}
      <Animated.View style={[wheelStyles.wheel, { transform: [{ rotate: spin }] }]}>
        {WHEEL_PRIZES.map((prize, index) => {
          const rotation = (360 / WHEEL_PRIZES.length) * index;
          return (
            <View
              key={prize.id}
              style={[
                wheelStyles.segment,
                {
                  backgroundColor: prize.color,
                  transform: [
                    { rotate: `${rotation}deg` },
                    { translateY: -75 },
                  ],
                },
              ]}
            >
              <View style={wheelStyles.prizeLabel}>
                <Ionicons name="diamond" size={12} color="#FFF" />
                <Text style={wheelStyles.prizeText}>{prize.label}</Text>
              </View>
            </View>
          );
        })}
      </Animated.View>
      
      {/* Pointer */}
      <View style={wheelStyles.pointer}>
        <Ionicons name="caret-down" size={32} color="#fbbf24" />
      </View>
      
      {/* Center Button */}
      <TouchableOpacity
        style={wheelStyles.centerButton}
        onPress={onSpin}
        disabled={spinning}
      >
        <LinearGradient
          colors={spinning ? ['#666', '#444'] : ['#fbbf24', '#f59e0b']}
          style={wheelStyles.centerGradient}
        >
          {spinning ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={wheelStyles.spinText}>دوّر</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const wheelStyles = StyleSheet.create({
  container: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
  },
  wheel: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#1a1a2e',
    borderWidth: 4,
    borderColor: '#fbbf24',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  segment: {
    position: 'absolute',
    width: 60,
    height: 100,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 30,
  },
  prizeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  prizeText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  pointer: {
    position: 'absolute',
    top: -5,
    zIndex: 10,
  },
  centerButton: {
    position: 'absolute',
    zIndex: 5,
  },
  centerGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  spinText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

// ==================== مكون مشاهدة الإعلان ====================
const AdWatchingModal = ({ visible, onComplete, onClose }) => {
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(AD_DURATION_SECONDS);
  const [isWatching, setIsWatching] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible && isWatching) {
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            onComplete();
            return 0;
          }
          return prev - 1;
        });
        setProgress(prev => Math.min(100, prev + (100 / AD_DURATION_SECONDS)));
      }, 1000);

      // Progress bar animation
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: AD_DURATION_SECONDS * 1000,
        useNativeDriver: false,
      }).start();

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();

      return () => clearInterval(interval);
    }
  }, [visible, isWatching]);

  const startWatching = () => {
    setIsWatching(true);
    setProgress(0);
    setTimeLeft(AD_DURATION_SECONDS);
    progressAnim.setValue(0);
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={adStyles.overlay}>
        <View style={adStyles.container}>
          {!isWatching ? (
            // شاشة البدء
            <View style={adStyles.startScreen}>
              <LinearGradient
                colors={['#1a1a2e', '#16213e']}
                style={adStyles.startGradient}
              >
                <Ionicons name="play-circle" size={80} color="#60a5fa" />
                <Text style={adStyles.startTitle}>شاهد إعلان واربح!</Text>
                <Text style={adStyles.startDesc}>
                  شاهد الإعلان لمدة {AD_DURATION_SECONDS} ثانية واحصل على فرصة لدوران عجلة الحظ
                </Text>
                
                <View style={adStyles.rewardInfo}>
                  <Ionicons name="sparkles" size={20} color="#f472b6" />
                  <Text style={adStyles.rewardText}>من 1 إلى 100 جوهرة صقر!</Text>
                </View>

                <TouchableOpacity style={adStyles.startButton} onPress={startWatching}>
                  <LinearGradient
                    colors={['#22c55e', '#16a34a']}
                    style={adStyles.startButtonGradient}
                  >
                    <Ionicons name="play" size={24} color="#FFF" />
                    <Text style={adStyles.startButtonText}>ابدأ المشاهدة</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={adStyles.closeButton} onPress={onClose}>
                  <Text style={adStyles.closeText}>إلغاء</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          ) : (
            // شاشة المشاهدة
            <View style={adStyles.watchingScreen}>
              <LinearGradient
                colors={['#0a0a0f', '#1a1a2e']}
                style={adStyles.watchingGradient}
              >
                {/* Ad Content Placeholder */}
                <View style={adStyles.adContent}>
                  <Animated.View style={[adStyles.adIcon, { transform: [{ scale: pulseAnim }] }]}>
                    <Ionicons name="tv" size={60} color="#60a5fa" />
                  </Animated.View>
                  <Text style={adStyles.adText}>إعلان قيد العرض</Text>
                </View>

                {/* Progress */}
                <View style={adStyles.progressContainer}>
                  <View style={adStyles.progressBar}>
                    <Animated.View style={[adStyles.progressFill, { width: progressWidth }]} />
                  </View>
                  <Text style={adStyles.timeText}>{timeLeft} ثانية</Text>
                </View>

                {/* Don't close warning */}
                <View style={adStyles.warningBox}>
                  <Ionicons name="warning" size={16} color="#fbbf24" />
                  <Text style={adStyles.warningText}>لا تغلق النافذة للحصول على المكافأة</Text>
                </View>
              </LinearGradient>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const adStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
  },
  startScreen: {
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
  },
  startGradient: {
    padding: 30,
    alignItems: 'center',
  },
  startTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 16,
    marginBottom: 8,
  },
  startDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  rewardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(96,165,250,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 24,
  },
  rewardText: {
    color: '#60a5fa',
    fontSize: 16,
    fontWeight: '600',
  },
  startButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 12,
  },
  closeText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  watchingScreen: {
    backgroundColor: '#0a0a0f',
    borderRadius: 24,
  },
  watchingGradient: {
    padding: 30,
    alignItems: 'center',
    minHeight: 350,
  },
  adContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  adIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(96,165,250,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  adText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 4,
  },
  timeText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(251,191,36,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  warningText: {
    color: '#fbbf24',
    fontSize: 12,
  },
});

// ==================== مكون نتيجة المكافأة ====================
const RewardResultModal = ({ visible, gems, onClose, isBonus, bonusReason }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Vibration.vibrate([0, 50, 100, 50]);
      
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
    }
  }, [visible]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={resultStyles.overlay}>
        <Animated.View style={[resultStyles.container, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient
            colors={['#1a1a2e', '#16213e']}
            style={resultStyles.gradient}
          >
            {/* Confetti Effect */}
            <View style={resultStyles.confetti}>
              {[...Array(20)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    resultStyles.confettiPiece,
                    {
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 0.5}s`,
                      backgroundColor: ['#fbbf24', '#22c55e', '#ec4899', '#60a5fa'][Math.floor(Math.random() * 4)],
                    },
                  ]}
                />
              ))}
            </View>

            <Animated.View style={[resultStyles.iconContainer, { transform: [{ rotate }] }]}>
              <Ionicons name="diamond" size={60} color="#60a5fa" />
            </Animated.View>

            <Text style={resultStyles.title}>
              {isBonus ? 'مكافأة إضافية!' : 'مبروك!'}
            </Text>
            
            <Text style={resultStyles.diamondCount}>+{gems}</Text>
            <Text style={resultStyles.label}>جوهرة صقر</Text>

            {bonusReason && (
              <View style={resultStyles.bonusReason}>
                <Ionicons name="star" size={16} color="#fbbf24" />
                <Text style={resultStyles.bonusText}>{bonusReason}</Text>
              </View>
            )}

            <View style={resultStyles.valueInfo}>
              <Text style={resultStyles.valueText}>
                قيمتها: {(gems / GEMS_PER_RIYAL).toFixed(3)} ريال
              </Text>
            </View>

            <TouchableOpacity style={resultStyles.closeButton} onPress={onClose}>
              <LinearGradient
                colors={['#3b82f6', '#2563eb']}
                style={resultStyles.closeGradient}
              >
                <Text style={resultStyles.closeButtonText}>رائع!</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const resultStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.85,
    maxWidth: 350,
    borderRadius: 24,
    overflow: 'hidden',
  },
  gradient: {
    padding: 30,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  confetti: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    top: -10,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(96,165,250,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#60a5fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  diamondCount: {
    fontSize: 56,
    fontWeight: '800',
    color: '#60a5fa',
    textShadowColor: 'rgba(96,165,250,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  label: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 16,
  },
  bonusReason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251,191,36,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  bonusText: {
    color: '#fbbf24',
    fontSize: 13,
  },
  valueInfo: {
    marginBottom: 20,
  },
  valueText: {
    color: '#10b981',
    fontSize: 14,
  },
  closeButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  closeGradient: {
    padding: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

// ==================== المكون الرئيسي - مركز المكافآت ====================
const AdRewardsCenter = ({ visible, onClose, userId, onBalanceUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayAds: 0,
    totalGems: 0,
    streak: 0,
    lastWatchDate: null,
  });
  const [showAdWatching, setShowAdWatching] = useState(false);
  const [showWheel, setShowWheel] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [currentPrize, setCurrentPrize] = useState(null);
  const [bonusInfo, setBonusInfo] = useState(null);
  const [userGems, setUserGems] = useState(0);

  useEffect(() => {
    if (visible) {
      loadStats();
      loadBalance();
    }
  }, [visible]);

  const loadStats = async () => {
    try {
      const savedStats = await AsyncStorage.getItem(`ad_rewards_stats_${userId}`);
      const today = new Date().toDateString();
      
      if (savedStats) {
        const parsed = JSON.parse(savedStats);
        const normalized = {
          ...parsed,
          totalGems: parsed.totalGems ?? parsed.totalDiamonds ?? 0,
        };
        // Reset daily counter if new day
        if (normalized.lastWatchDate !== today) {
          setStats({
            todayAds: 0,
            totalGems: normalized.totalGems || 0,
            streak: 0,
            lastWatchDate: today,
          });
        } else {
          setStats(normalized);
        }
      }
    } catch (e) {
      console.log('Error loading stats:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadBalance = async () => {
    try {
      const response = await api.getBalance(userId);
      if (response.ok) {
        const data = await response.json();
        setUserGems(data.saqr_gems || 0);
      }
    } catch (e) {
      console.log('Error loading balance:', e);
    }
  };

  const saveStats = async (newStats) => {
    try {
      await AsyncStorage.setItem(`ad_rewards_stats_${userId}`, JSON.stringify(newStats));
    } catch (e) {
      console.log('Error saving stats:', e);
    }
  };

  const startWatchingAd = () => {
    if (stats.todayAds >= MAX_DAILY_ADS) {
      Alert.alert('الحد اليومي', `لقد شاهدت ${MAX_DAILY_ADS} إعلان اليوم. عد غداً للمزيد!`);
      return;
    }
    setShowAdWatching(true);
  };

  const handleAdComplete = async () => {
    setShowAdWatching(false);
    
    // Update stats
    const newStreak = stats.streak + 1;
    const today = new Date().toDateString();
    const newStats = {
      ...stats,
      todayAds: stats.todayAds + 1,
      streak: newStreak,
      lastWatchDate: today,
    };
    setStats(newStats);
    await saveStats(newStats);

    // Check for streak bonus
    let bonus = null;
    if (STREAK_BONUSES[newStreak]) {
      bonus = {
        gems: STREAK_BONUSES[newStreak],
        reason: `مكافأة ${newStreak} إعلان متتالي!`,
      };
      setBonusInfo(bonus);
    }

    // Show wheel
    setShowWheel(true);
  };

  const spinWheel = () => {
    setWheelSpinning(true);
    
    // Calculate prize based on probability
    const random = Math.random();
    let cumulativeProbability = 0;
    let selectedPrize = WHEEL_PRIZES[0];
    
    for (const prize of WHEEL_PRIZES) {
      cumulativeProbability += prize.probability;
      if (random <= cumulativeProbability) {
        selectedPrize = prize;
        break;
      }
    }
    
    setCurrentPrize(selectedPrize);

    // Wait for animation
    setTimeout(async () => {
      setWheelSpinning(false);
      setShowWheel(false);
      
      // Calculate total gems
      let totalGems = selectedPrize.gems;
      if (bonusInfo) {
        totalGems += bonusInfo.gems;
      }

      // Add gems to user account
      try {
        const response = await api.addSaqrGems(userId, totalGems, 'ad_wheel_reward');
        if (response.ok) {
          const data = await response.json();
          setUserGems(data.new_balance);
          
          // Keep ad count stable (already incremented in handleAdComplete)
          // and only append total gems.
          const updatedStats = {
            ...stats,
            totalGems: (stats.totalGems || 0) + totalGems,
          };
          setStats(updatedStats);
          await saveStats(updatedStats);
          
          if (onBalanceUpdate) onBalanceUpdate();
        }
      } catch (e) {
        console.log('Error adding gems:', e);
      }

      // Show result
      setShowResult(true);
    }, 4500);
  };

  const closeResult = () => {
    setShowResult(false);
    setCurrentPrize(null);
    setBonusInfo(null);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={['#0a0a0f', '#1a1a2e']}
            style={styles.gradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>مركز المكافآت</Text>
              <View style={styles.diamondBadge}>
                <Ionicons name="sparkles" size={16} color="#f472b6" />
                <Text style={styles.diamondCount}>{userGems}</Text>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Exchange Rate Banner */}
              <LinearGradient
                colors={['rgba(16,185,129,0.2)', 'rgba(16,185,129,0.05)']}
                style={styles.exchangeBanner}
              >
                <Ionicons name="swap-horizontal" size={20} color="#10b981" />
                <Text style={styles.exchangeText}>
                  500 جوهرة = 1 ريال سعودي
                </Text>
              </LinearGradient>

              {/* Stats Cards */}
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.todayAds}</Text>
                  <Text style={styles.statLabel}>إعلانات اليوم</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.streak}</Text>
                  <Text style={styles.statLabel}>متتالي</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.totalGems || 0}</Text>
                  <Text style={styles.statLabel}>مجموع الجواهر</Text>
                </View>
              </View>

              {/* Main Watch Ad Button */}
              <TouchableOpacity
                style={styles.watchAdBtn}
                onPress={startWatchingAd}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#ec4899', '#9333ea']}
                  style={styles.watchAdGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <View style={styles.watchAdIcon}>
                    <Ionicons name="play-circle" size={40} color="#FFF" />
                  </View>
                  <View style={styles.watchAdInfo}>
                    <Text style={styles.watchAdTitle}>شاهد إعلان وأدر العجلة!</Text>
                    <Text style={styles.watchAdDesc}>اربح من 1 إلى 100 جوهرة</Text>
                  </View>
                  <View style={styles.watchAdBadge}>
                    <Ionicons name="sparkles" size={14} color="#FFF" />
                    <Text style={styles.watchAdBadgeText}>حتى 100</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Streak Bonuses */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>مكافآت الإعلانات المتتالية</Text>
                <View style={styles.streakGrid}>
                  {Object.entries(STREAK_BONUSES).map(([count, bonus]) => {
                    const achieved = stats.streak >= parseInt(count);
                    return (
                      <View
                        key={count}
                        style={[styles.streakItem, achieved && styles.streakItemAchieved]}
                      >
                        <Text style={[styles.streakCount, achieved && styles.streakCountAchieved]}>
                          {count}
                        </Text>
                        <View style={styles.streakReward}>
                          <Ionicons name="sparkles" size={12} color={achieved ? '#fbbf24' : '#666'} />
                          <Text style={[styles.streakBonus, achieved && styles.streakBonusAchieved]}>
                            +{bonus}
                          </Text>
                        </View>
                        {achieved && (
                          <Ionicons name="checkmark-circle" size={14} color="#22c55e" style={styles.checkIcon} />
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Tips */}
              <View style={styles.tipsCard}>
                <Ionicons name="bulb" size={18} color="#fbbf24" />
                <Text style={styles.tipsText}>
                  شاهد إعلانات متتالية لتضاعف مكافآتك! كلما شاهدت أكثر، كلما ربحت أكثر.
                </Text>
              </View>

              {/* Daily Progress */}
              <View style={styles.dailyProgress}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressTitle}>تقدم اليوم</Text>
                  <Text style={styles.progressCount}>{stats.todayAds}/{MAX_DAILY_ADS}</Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${(stats.todayAds / MAX_DAILY_ADS) * 100}%` }
                    ]} 
                  />
                </View>
              </View>

              <View style={{ height: 30 }} />
            </ScrollView>
          </LinearGradient>
        </View>

        {/* Ad Watching Modal */}
        <AdWatchingModal
          visible={showAdWatching}
          onComplete={handleAdComplete}
          onClose={() => setShowAdWatching(false)}
        />

        {/* Lucky Wheel Modal */}
        {showWheel && (
          <Modal visible={showWheel} animationType="fade" transparent presentationStyle="overFullScreen" statusBarTranslucent>
            <View style={styles.wheelOverlay}>
              <View style={styles.wheelContainer}>
                <LinearGradient
                  colors={['#1a1a2e', '#0a0a0f']}
                  style={styles.wheelGradient}
                >
                  <TouchableOpacity style={styles.wheelCloseBtn} onPress={() => !wheelSpinning && setShowWheel(false)}>
                    <Ionicons name="close" size={20} color="#FFF" />
                  </TouchableOpacity>
                  <Text style={styles.wheelTitle}>أدر عجلة الحظ!</Text>
                  <LuckyWheel
                    onSpin={spinWheel}
                    spinning={wheelSpinning}
                    prize={currentPrize}
                  />
                  <Text style={styles.wheelHint}>اضغط على "دوّر" للفوز بجائزتك</Text>
                </LinearGradient>
              </View>
            </View>
          </Modal>
        )}

        {/* Result Modal */}
        <RewardResultModal
          visible={showResult}
          gems={(currentPrize?.gems || 0) + (bonusInfo?.gems || 0)}
          onClose={closeResult}
          isBonus={!!bonusInfo}
          bonusReason={bonusInfo?.reason}
        />
      </View>
    </Modal>
  );
};

// ==================== الأنماط ====================
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 16,
  },
  container: {
    backgroundColor: '#0a0a0f',
    borderRadius: 24,
    width: '96%',
    maxWidth: 460,
    height: '92%',
    maxHeight: '94%',
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  diamondBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  diamondCount: {
    color: '#60a5fa',
    fontWeight: 'bold',
    fontSize: 14,
  },
  exchangeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  exchangeText: {
    color: '#10b981',
    fontSize: 15,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  watchAdBtn: {
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 20,
  },
  watchAdGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  watchAdIcon: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  watchAdInfo: {
    flex: 1,
  },
  watchAdTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  watchAdDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  watchAdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  watchAdBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 12,
    textAlign: 'right',
  },
  streakGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  streakItem: {
    width: (width - 64) / 3,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    position: 'relative',
  },
  streakItemAchieved: {
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderColor: 'rgba(251,191,36,0.3)',
  },
  streakCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  streakCountAchieved: {
    color: '#fbbf24',
  },
  streakReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  streakBonus: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  streakBonusAchieved: {
    color: '#fbbf24',
  },
  checkIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  tipsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
    marginBottom: 16,
  },
  tipsText: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
  },
  dailyProgress: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
  },
  progressCount: {
    fontSize: 14,
    color: '#60a5fa',
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 3,
  },
  wheelOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  wheelContainer: {
    width: width * 0.9,
    maxWidth: 360,
    maxHeight: '90%',
    borderRadius: 24,
    overflow: 'hidden',
  },
  wheelGradient: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    position: 'relative',
  },
  wheelCloseBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  wheelTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
  },
  wheelHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 20,
  },
});

export default AdRewardsCenter;
