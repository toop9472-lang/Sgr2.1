// Daily Streak Component - نظام التسجيل اليومي
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STREAK_REWARDS = [
  { day: 1, reward: 5, type: 'points', icon: '⭐' },
  { day: 2, reward: 10, type: 'points', icon: '⭐' },
  { day: 3, reward: 5, type: 'diamonds', icon: '💎' },
  { day: 4, reward: 15, type: 'points', icon: '⭐' },
  { day: 5, reward: 10, type: 'diamonds', icon: '💎' },
  { day: 6, reward: 25, type: 'points', icon: '⭐' },
  { day: 7, reward: 20, type: 'diamonds', icon: '🎁' },
];

const DailyStreakModal = ({ visible, onClose, onClaim, streak = 0, todayClaimed = false }) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(bounceAnim, { toValue: -10, duration: 500, useNativeDriver: true }),
            Animated.timing(bounceAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
          ])
        ),
      ]).start();
    }
  }, [visible]);

  const currentDay = (streak % 7) + 1;
  const currentReward = STREAK_REWARDS[currentDay - 1];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View style={[styles.modal, { transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>

          <Animated.Text style={[styles.eagleEmoji, { transform: [{ translateY: bounceAnim }] }]}>
            🦅
          </Animated.Text>
          
          <Text style={styles.title}>التسجيل اليومي</Text>
          <Text style={styles.streakText}>
            سلسلة التسجيل: <Text style={styles.streakNumber}>{streak}</Text> يوم
          </Text>

          {/* Days Row */}
          <View style={styles.daysRow}>
            {STREAK_REWARDS.map((day, index) => {
              const isCompleted = index < currentDay - 1;
              const isCurrent = index === currentDay - 1;
              const isLocked = index > currentDay - 1;

              return (
                <View
                  key={day.day}
                  style={[
                    styles.dayBox,
                    isCompleted && styles.dayCompleted,
                    isCurrent && styles.dayCurrent,
                    isLocked && styles.dayLocked,
                  ]}
                >
                  <Text style={styles.dayNumber}>يوم {day.day}</Text>
                  <Text style={styles.dayIcon}>{day.icon}</Text>
                  <Text style={styles.dayReward}>
                    {day.reward} {day.type === 'diamonds' ? 'ماسة' : 'نقطة'}
                  </Text>
                  {isCompleted && (
                    <View style={styles.checkmark}>
                      <Ionicons name="checkmark" size={12} color="#FFF" />
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Claim Button */}
          {!todayClaimed ? (
            <TouchableOpacity style={styles.claimBtn} onPress={() => onClaim(currentReward)}>
              <LinearGradient colors={['#fbbf24', '#f59e0b']} style={styles.claimGradient}>
                <Text style={styles.claimText}>
                  استلم {currentReward.reward} {currentReward.type === 'diamonds' ? 'ماسة' : 'نقطة'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={styles.claimedBox}>
              <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
              <Text style={styles.claimedText}>تم استلام مكافأة اليوم!</Text>
              <Text style={styles.nextRewardText}>عد غداً للمكافأة التالية</Text>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

// Hook لإدارة السلسلة اليومية
export const useDailyStreak = (userId) => {
  const [streak, setStreak] = useState(0);
  const [todayClaimed, setTodayClaimed] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadStreak();
  }, [userId]);

  const loadStreak = async () => {
    try {
      const streakData = await AsyncStorage.getItem(`streak_${userId || 'guest'}`);
      const lastClaim = await AsyncStorage.getItem(`last_claim_${userId || 'guest'}`);
      
      if (streakData) {
        const data = JSON.parse(streakData);
        setStreak(data.count || 0);
      }

      if (lastClaim) {
        const today = new Date().toDateString();
        const lastClaimDate = new Date(lastClaim).toDateString();
        setTodayClaimed(today === lastClaimDate);
        
        // Reset streak if missed a day
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (lastClaimDate !== today && lastClaimDate !== yesterday.toDateString()) {
          setStreak(0);
          await AsyncStorage.setItem(`streak_${userId || 'guest'}`, JSON.stringify({ count: 0 }));
        }
      }
    } catch (error) {
      console.error('Error loading streak:', error);
    }
  };

  const claimReward = async (reward) => {
    try {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setTodayClaimed(true);
      
      await AsyncStorage.setItem(`streak_${userId || 'guest'}`, JSON.stringify({ count: newStreak }));
      await AsyncStorage.setItem(`last_claim_${userId || 'guest'}`, new Date().toISOString());
      
      return { success: true, reward };
    } catch (error) {
      console.error('Error claiming reward:', error);
      return { success: false, error };
    }
  };

  return {
    streak,
    todayClaimed,
    showModal,
    setShowModal,
    claimReward,
    DailyStreakModal: (props) => (
      <DailyStreakModal
        {...props}
        visible={showModal}
        onClose={() => setShowModal(false)}
        streak={streak}
        todayClaimed={todayClaimed}
        onClaim={async (reward) => {
          const result = await claimReward(reward);
          if (result.success && props.onRewardClaimed) {
            props.onRewardClaimed(result.reward);
          }
        }}
      />
    ),
  };
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#1e1e2e',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  eagleEmoji: {
    fontSize: 60,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  streakText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 20,
  },
  streakNumber: {
    color: '#fbbf24',
    fontWeight: 'bold',
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dayBox: {
    width: 70,
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayCompleted: {
    backgroundColor: 'rgba(34,197,94,0.2)',
    borderColor: '#22c55e',
  },
  dayCurrent: {
    backgroundColor: 'rgba(251,191,36,0.2)',
    borderColor: '#fbbf24',
  },
  dayLocked: {
    opacity: 0.5,
  },
  dayNumber: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  dayIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  dayReward: {
    fontSize: 10,
    color: '#FFF',
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimBtn: {
    width: '100%',
  },
  claimGradient: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  claimText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  claimedBox: {
    alignItems: 'center',
    padding: 16,
  },
  claimedText: {
    fontSize: 16,
    color: '#22c55e',
    marginTop: 8,
  },
  nextRewardText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
});

export default DailyStreakModal;
