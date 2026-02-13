// Challenges & Rewards Screen
// Daily Challenges (69 points max) + 14-day Login Rewards (150 points/month)
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import storage from '../services/storage';

const { width } = Dimensions.get('window');

const ChallengesScreen = ({ user, onPointsEarned }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [challenges, setChallenges] = useState([]);
  const [loginRewards, setLoginRewards] = useState([]);
  const [stats, setStats] = useState({});
  const [claimingId, setClaimingId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const token = await storage.getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch all data in parallel
      const [challengesRes, rewardsRes, statsRes] = await Promise.all([
        api.fetch('/api/challenges/daily', { headers }),
        api.fetch('/api/challenges/login-rewards', { headers }),
        api.fetch('/api/challenges/stats', { headers }),
      ]);

      if (challengesRes.ok) {
        const data = await challengesRes.json();
        setChallenges(data.challenges || []);
      }

      if (rewardsRes.ok) {
        const data = await rewardsRes.json();
        setLoginRewards(data.rewards || []);
        setStats(prev => ({ ...prev, loginDays: data.login_days, claimedRewardPoints: data.claimed_points }));
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const claimChallenge = async (challengeId) => {
    setClaimingId(challengeId);
    try {
      const token = await storage.getToken();
      const response = await api.fetch('/api/challenges/daily/claim', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ challenge_id: challengeId }),
      });

      if (response.ok) {
        const data = await response.json();
        Alert.alert('مبروك!', data.message);
        if (onPointsEarned) onPointsEarned(data.points_earned);
        fetchData();
      } else {
        const error = await response.json();
        Alert.alert('خطأ', error.detail || 'فشل في استلام المكافأة');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    } finally {
      setClaimingId(null);
    }
  };

  const claimLoginReward = async (day) => {
    setClaimingId(`day-${day}`);
    try {
      const token = await storage.getToken();
      const response = await api.fetch('/api/challenges/login-rewards/claim', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ day }),
      });

      if (response.ok) {
        const data = await response.json();
        Alert.alert('مبروك!', data.message);
        if (onPointsEarned) onPointsEarned(data.points_earned);
        fetchData();
      } else {
        const error = await response.json();
        Alert.alert('خطأ', error.detail || 'فشل في استلام المكافأة');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    } finally {
      setClaimingId(null);
    }
  };

  const getIconName = (iconName) => {
    const iconMap = {
      'play-circle': 'play-circle-outline',
      'film': 'film-outline',
      'log-in': 'log-in-outline',
      'rocket': 'rocket-outline',
      'flame': 'flame-outline',
    };
    return iconMap[iconName] || 'star-outline';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  const todayPoints = stats?.today?.challenge_points || 0;
  const monthRewardPoints = stats?.this_month?.login_reward_points || 0;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#3b82f6"
          colors={['#3b82f6']}
        />
      }
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="trophy" size={28} color="#fbbf24" />
          </View>
          <View>
            <Text style={styles.headerTitle}>التحديات والمكافآت</Text>
            <Text style={styles.headerSubtitle}>اكسب نقاط إضافية يومياً</Text>
          </View>
        </View>

        {/* Stats Summary */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Ionicons name="today-outline" size={20} color="#22c55e" />
            <Text style={styles.statValue}>{todayPoints}/69</Text>
            <Text style={styles.statLabel}>نقاط اليوم</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="calendar-outline" size={20} color="#60a5fa" />
            <Text style={styles.statValue}>{monthRewardPoints}/150</Text>
            <Text style={styles.statLabel}>مكافآت الشهر</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="flame-outline" size={20} color="#f97316" />
            <Text style={styles.statValue}>{stats?.streak_days || 0}</Text>
            <Text style={styles.statLabel}>أيام متتالية</Text>
          </View>
        </View>

        {/* Daily Challenges Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="flash" size={20} color="#fbbf24" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>التحديات اليومية</Text>
              <Text style={styles.sectionSubtitle}>الحد الأقصى: 69 نقطة يومياً</Text>
            </View>
          </View>

          {challenges.map((challenge) => {
            const progress = (challenge.current / challenge.target) * 100;
            const isClaiming = claimingId === challenge.id;

            return (
              <View key={challenge.id} style={styles.challengeCard}>
                <View style={styles.challengeTop}>
                  <View style={[styles.challengeIcon, challenge.completed && styles.challengeIconCompleted]}>
                    <Ionicons
                      name={getIconName(challenge.icon)}
                      size={22}
                      color={challenge.completed ? '#22c55e' : '#94a3b8'}
                    />
                  </View>
                  <View style={styles.challengeInfo}>
                    <Text style={styles.challengeTitle}>{challenge.title}</Text>
                    <Text style={styles.challengeDesc}>{challenge.description}</Text>
                  </View>
                  <View style={styles.challengePoints}>
                    <Ionicons name="star" size={14} color="#fbbf24" />
                    <Text style={styles.challengePointsText}>{challenge.points}</Text>
                  </View>
                </View>

                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
                  </View>
                  <Text style={styles.progressText}>
                    {challenge.current}/{challenge.target}
                  </Text>
                </View>

                {challenge.claimed ? (
                  <View style={styles.claimedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                    <Text style={styles.claimedText}>تم الاستلام</Text>
                  </View>
                ) : challenge.can_claim ? (
                  <TouchableOpacity
                    style={styles.claimButton}
                    onPress={() => claimChallenge(challenge.id)}
                    disabled={isClaiming}
                    activeOpacity={0.8}
                  >
                    {isClaiming ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Ionicons name="gift" size={16} color="#FFF" />
                        <Text style={styles.claimButtonText}>استلم المكافأة</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })}
        </View>

        {/* 14-Day Login Rewards Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
              <Ionicons name="gift" size={20} color="#ec4899" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>مكافآت تسجيل الدخول</Text>
              <Text style={styles.sectionSubtitle}>14 يوم = 150 نقطة شهرياً</Text>
            </View>
          </View>

          <View style={styles.loginDaysInfo}>
            <Ionicons name="calendar" size={16} color="#60a5fa" />
            <Text style={styles.loginDaysText}>
              أيام التسجيل هذا الشهر: {stats?.loginDays || 0} يوم
            </Text>
          </View>

          <View style={styles.rewardsGrid}>
            {loginRewards.map((reward) => {
              const isClaiming = claimingId === `day-${reward.day}`;
              const isSpecialDay = reward.day === 7 || reward.day === 14;

              return (
                <TouchableOpacity
                  key={reward.day}
                  style={[
                    styles.rewardBox,
                    reward.claimed && styles.rewardBoxClaimed,
                    reward.can_claim && styles.rewardBoxReady,
                    !reward.unlocked && styles.rewardBoxLocked,
                    isSpecialDay && styles.rewardBoxSpecial,
                  ]}
                  onPress={() => reward.can_claim && claimLoginReward(reward.day)}
                  disabled={!reward.can_claim || isClaiming}
                  activeOpacity={reward.can_claim ? 0.7 : 1}
                >
                  {isClaiming ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Text style={[
                        styles.rewardDay,
                        reward.claimed && styles.rewardDayClaimed,
                        isSpecialDay && styles.rewardDaySpecial,
                      ]}>
                        {reward.day}
                      </Text>
                      <View style={styles.rewardPointsContainer}>
                        <Ionicons
                          name={reward.claimed ? 'checkmark-circle' : reward.unlocked ? 'star' : 'lock-closed'}
                          size={12}
                          color={reward.claimed ? '#22c55e' : reward.unlocked ? '#fbbf24' : '#475569'}
                        />
                        <Text style={[
                          styles.rewardPoints,
                          reward.claimed && styles.rewardPointsClaimed,
                          !reward.unlocked && styles.rewardPointsLocked,
                        ]}>
                          {reward.points}
                        </Text>
                      </View>
                      {reward.can_claim && (
                        <View style={styles.claimIndicator}>
                          <Ionicons name="arrow-down" size={10} color="#22c55e" />
                        </View>
                      )}
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.rewardLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
              <Text style={styles.legendText}>تم الاستلام</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
              <Text style={styles.legendText}>جاهز للاستلام</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#475569' }]} />
              <Text style={styles.legendText}>مقفل</Text>
            </View>
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Ionicons name="bulb-outline" size={18} color="#fbbf24" />
          <Text style={styles.tipsText}>
            سجل دخولك يومياً واحصل على مكافآت متزايدة!
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { padding: 20, paddingTop: 50, paddingBottom: 100 },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0f',
  },
  loadingText: { color: 'rgba(255,255,255,0.6)', marginTop: 12 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  headerSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 2 },

  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statValue: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginTop: 6 },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 4 },

  section: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  sectionSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 },

  challengeCard: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  challengeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  challengeIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeIconCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  challengeInfo: { flex: 1 },
  challengeTitle: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  challengeDesc: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 },
  challengePoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  challengePointsText: { color: '#fbbf24', fontSize: 13, fontWeight: 'bold' },

  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 3,
  },
  progressText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, minWidth: 30 },

  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 10,
  },
  claimedText: { color: '#22c55e', fontSize: 13, fontWeight: '600' },

  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 10,
    backgroundColor: '#3b82f6',
    borderRadius: 10,
  },
  claimButtonText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },

  loginDaysInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingVertical: 10,
    borderRadius: 10,
  },
  loginDaysText: { color: '#60a5fa', fontSize: 13 },

  rewardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  rewardBox: {
    width: (width - 80) / 7,
    aspectRatio: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rewardBoxClaimed: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  rewardBoxReady: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: '#3b82f6',
    borderWidth: 2,
  },
  rewardBoxLocked: {
    opacity: 0.5,
  },
  rewardBoxSpecial: {
    borderColor: '#ec4899',
    borderWidth: 2,
  },
  rewardDay: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  rewardDayClaimed: { color: '#22c55e' },
  rewardDaySpecial: { color: '#ec4899' },
  rewardPointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  rewardPoints: { color: '#fbbf24', fontSize: 10, fontWeight: '600' },
  rewardPointsClaimed: { color: '#22c55e' },
  rewardPointsLocked: { color: '#475569' },
  claimIndicator: {
    position: 'absolute',
    bottom: 2,
  },

  rewardLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },

  tipsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  tipsText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
});

export default ChallengesScreen;
