// Daily Rewards Modal - مكافآت الدخول اليومي
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const { width, height } = Dimensions.get('window');

const DailyRewardsModal = ({ visible, onClose, userId, onRewardClaimed }) => {
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [rewardStatus, setRewardStatus] = useState(null);
  const [claimed, setClaimed] = useState(false);
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible && userId) {
      fetchDailyStatus();
      startAnimations();
    }
  }, [visible, userId]);

  const startAnimations = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(rotateAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  };

  const fetchDailyStatus = async () => {
    setLoading(true);
    try {
      const response = await api.getDailyLoginStatus(userId);
      if (response.ok) {
        const data = await response.json();
        setRewardStatus(data);
        if (data.today_claimed) {
          setClaimed(true);
        }
      }
    } catch (error) {
      console.log('Daily status error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async () => {
    setClaiming(true);
    try {
      const response = await api.claimDailyReward(userId);
      if (response.ok) {
        const data = await response.json();
        setClaimed(true);
        if (onRewardClaimed) {
          onRewardClaimed(data);
        }
        // انتظر قليلاً ثم أغلق
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.log('Claim error:', error);
    } finally {
      setClaiming(false);
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderRewardCard = (reward, index, isNext) => {
    const isToday = rewardStatus?.current_streak === index;
    const isPast = rewardStatus?.current_streak > index;
    
    return (
      <View
        key={index}
        style={[
          styles.rewardCard,
          isNext && styles.rewardCardActive,
          isPast && styles.rewardCardPast,
        ]}
      >
        <Text style={styles.rewardDay}>{reward.label}</Text>
        <View style={[styles.rewardIconContainer, isNext && styles.rewardIconActive]}>
          <Ionicons
            name={reward.type === 'diamonds' ? 'diamond' : 'sparkles'}
            size={20}
            color={reward.type === 'diamonds' ? '#60a5fa' : '#f472b6'}
          />
        </View>
        <Text style={[styles.rewardAmount, isNext && styles.rewardAmountActive]}>
          +{reward.amount}
        </Text>
        {isPast && (
          <Ionicons name="checkmark-circle" size={16} color="#10b981" style={styles.checkIcon} />
        )}
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient
            colors={['#1a1a2e', '#16213e', '#0f0f23']}
            style={styles.gradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <LinearGradient
                  colors={['#fbbf24', '#f59e0b']}
                  style={styles.headerIcon}
                >
                  <Ionicons name="gift" size={32} color="#FFF" />
                </LinearGradient>
              </Animated.View>
              <Text style={styles.title}>مكافآت الدخول اليومي</Text>
              <Text style={styles.subtitle}>ادخل كل يوم واحصل على مكافآت!</Text>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#60a5fa" style={{ marginVertical: 40 }} />
            ) : (
              <>
                {/* Streak Counter */}
                <View style={styles.streakContainer}>
                  <Text style={styles.streakLabel}>أيام متتالية</Text>
                  <View style={styles.streakBadge}>
                    <Ionicons name="flame" size={20} color="#f97316" />
                    <Text style={styles.streakNumber}>{rewardStatus?.current_streak || 0}</Text>
                  </View>
                </View>

                {/* Rewards Grid */}
                <View style={styles.rewardsGrid}>
                  {(rewardStatus?.rewards || []).map((reward, index) =>
                    renderRewardCard(
                      reward,
                      index,
                      index === (rewardStatus?.current_streak || 0) % 7
                    )
                  )}
                </View>

                {/* Current Reward */}
                {!claimed && rewardStatus?.next_reward && (
                  <View style={styles.currentReward}>
                    <Text style={styles.currentRewardLabel}>مكافأة اليوم</Text>
                    <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
                      <LinearGradient
                        colors={
                          rewardStatus.next_reward.type === 'diamonds'
                            ? ['#3b82f6', '#1d4ed8']
                            : ['#ec4899', '#be185d']
                        }
                        style={styles.currentRewardBadge}
                      >
                        <Ionicons
                          name={rewardStatus.next_reward.type === 'diamonds' ? 'diamond' : 'sparkles'}
                          size={24}
                          color="#FFF"
                        />
                        <Text style={styles.currentRewardAmount}>
                          +{rewardStatus.next_reward.amount}
                        </Text>
                        <Text style={styles.currentRewardType}>
                          {rewardStatus.next_reward.type === 'diamonds' ? 'ألماسة' : 'جوهرة صقر'}
                        </Text>
                      </LinearGradient>
                    </Animated.View>
                  </View>
                )}

                {/* Claimed Message */}
                {claimed && (
                  <View style={styles.claimedContainer}>
                    <Ionicons name="checkmark-circle" size={60} color="#10b981" />
                    <Text style={styles.claimedText}>تم استلام المكافأة!</Text>
                    <Text style={styles.claimedSubtext}>عد غداً للمزيد</Text>
                  </View>
                )}

                {/* Claim Button */}
                {!claimed && !rewardStatus?.today_claimed && (
                  <TouchableOpacity
                    style={styles.claimButton}
                    onPress={handleClaimReward}
                    disabled={claiming}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#10b981', '#059669']}
                      style={styles.claimButtonGradient}
                    >
                      {claiming ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <>
                          <Ionicons name="gift-outline" size={22} color="#FFF" />
                          <Text style={styles.claimButtonText}>استلم المكافأة</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                {/* Close Button */}
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Text style={styles.closeButtonText}>
                    {claimed ? 'إغلاق' : 'تخطي'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width - 40,
    maxHeight: height * 0.85,
    borderRadius: 24,
    overflow: 'hidden',
  },
  gradient: {
    padding: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    backgroundColor: 'rgba(249,115,22,0.15)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  streakLabel: {
    fontSize: 14,
    color: '#f97316',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f97316',
  },
  rewardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  rewardCard: {
    width: (width - 80) / 4 - 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rewardCardActive: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderColor: '#10b981',
    transform: [{ scale: 1.05 }],
  },
  rewardCardPast: {
    opacity: 0.5,
  },
  rewardDay: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 6,
  },
  rewardIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  rewardIconActive: {
    backgroundColor: 'rgba(16,185,129,0.3)',
  },
  rewardAmount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  rewardAmountActive: {
    color: '#10b981',
  },
  checkIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  currentReward: {
    alignItems: 'center',
    marginBottom: 24,
  },
  currentRewardLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 12,
  },
  currentRewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
  },
  currentRewardAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  currentRewardType: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  claimedContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  claimedText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
    marginTop: 12,
  },
  claimedSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  claimButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  claimButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  claimButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  closeButton: {
    padding: 12,
  },
  closeButtonText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
});

export default DailyRewardsModal;
