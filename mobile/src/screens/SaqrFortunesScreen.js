// شاشة ثروات صقر - Saqr Fortunes Screen
// تجربة مشاهدة إعلانات ممتعة وتفاعلية
// جواهر صقر = للاستبدال بالمال (500 جوهرة = 1 دولار)
// الالماس = للاستهلاك داخل التطبيق (دردشة، العاب)

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import AdRewardsCenter from '../components/AdRewardsCenter';
import TreasureChestsSection from '../components/TreasureChests';

const { width, height } = Dimensions.get('window');

// ==================== ثوابت النظام ====================
// جواهر صقر = للاستبدال بالمال
const GEMS_PER_DOLLAR = 500;
const GEM_PER_MINUTE = 1;

// التحديات اليومية (تعطي جواهر صقر)
const DAILY_CHALLENGES = [
  { id: 'first_ad', title: 'اول اعلان', desc: 'شاهد اعلانك الاول اليوم', target: 1, reward: 3, icon: 'play' },
  { id: 'watch_5', title: 'مشاهد نشط', desc: 'شاهد 5 اعلانات', target: 5, reward: 10, icon: 'eye' },
  { id: 'watch_10', title: 'مشاهد محترف', desc: 'شاهد 10 اعلانات', target: 10, reward: 25, icon: 'star' },
  { id: 'streak_3', title: 'المثابر', desc: 'شاهد 3 اعلانات متتالية', target: 3, reward: 15, icon: 'flame' },
  { id: 'morning', title: 'الباكر', desc: 'شاهد اعلان قبل الظهر', target: 1, reward: 5, icon: 'sunny' },
  { id: 'night', title: 'السهران', desc: 'شاهد اعلان بعد منتصف الليل', target: 1, reward: 8, icon: 'moon' },
];

// الانجازات الخاصة بالاعلانات (تعطي جواهر صقر)
const AD_ACHIEVEMENTS = [
  { id: 'total_50', title: 'مشاهد مبتدئ', desc: '50 اعلان اجمالي', target: 50, reward: 50, icon: 'medal-outline' },
  { id: 'total_100', title: 'مشاهد متوسط', desc: '100 اعلان اجمالي', target: 100, reward: 100, icon: 'medal' },
  { id: 'total_500', title: 'مشاهد خبير', desc: '500 اعلان اجمالي', target: 500, reward: 300, icon: 'trophy-outline' },
  { id: 'total_1000', title: 'مشاهد اسطوري', desc: '1000 اعلان اجمالي', target: 1000, reward: 750, icon: 'trophy' },
  { id: 'gems_1000', title: 'جامع الجواهر', desc: '1000 جوهرة من الاعلانات', target: 1000, reward: 200, icon: 'diamond' },
];

// مكون بطاقة الإحصائيات
const StatsCard = ({ icon, value, label, color }) => (
  <View style={styles.statsCard}>
    <View style={[styles.statsIconBg, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.statsValue}>{value}</Text>
    <Text style={styles.statsLabel}>{label}</Text>
  </View>
);

// مكون التحدي اليومي
const DailyChallenge = ({ challenge, progress, claimed, onClaim }) => {
  const isComplete = progress >= challenge.target;
  const canClaim = isComplete && !claimed;

  return (
    <View style={[styles.challengeCard, canClaim && styles.challengeCardReady]}>
      <View style={[styles.challengeIcon, { backgroundColor: canClaim ? '#22c55e20' : '#ffffff10' }]}>
        <Ionicons name={challenge.icon} size={20} color={canClaim ? '#22c55e' : '#888'} />
      </View>
      
      <View style={styles.challengeInfo}>
        <Text style={styles.challengeTitle}>{challenge.title}</Text>
        <Text style={styles.challengeDesc}>{challenge.desc}</Text>
        <View style={styles.challengeProgress}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${Math.min(100, (progress / challenge.target) * 100)}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{progress}/{challenge.target}</Text>
        </View>
      </View>

      <View style={styles.challengeReward}>
        {claimed ? (
          <View style={styles.claimedBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
          </View>
        ) : canClaim ? (
          <TouchableOpacity style={styles.claimBtn} onPress={onClaim}>
            <Text style={styles.claimText}>استلم</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.rewardBadge}>
            <Ionicons name="diamond" size={12} color="#60a5fa" />
            <Text style={styles.rewardText}>{challenge.reward}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// مكون زر المشاهدة الرئيسي
const MainWatchButton = ({ onPress, diamonds, loading }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.mainButtonContainer}>
      {/* Glow Effect */}
      <Animated.View style={[styles.glowRing, { opacity: glowOpacity }]} />
      
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity onPress={onPress} activeOpacity={0.9} disabled={loading}>
          <LinearGradient
            colors={['#ec4899', '#9333ea', '#6366f1']}
            style={styles.mainButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="large" />
            ) : (
              <>
                <Ionicons name="play-circle" size={50} color="#FFF" />
                <Text style={styles.mainButtonTitle}>شاهد واربح!</Text>
                <View style={styles.rewardPreview}>
                  <Ionicons name="diamond" size={16} color="#FFF" />
                  <Text style={styles.rewardPreviewText}>من 1 إلى 100</Text>
                </View>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Current Balance */}
      <View style={styles.balanceDisplay}>
        <Ionicons name="diamond" size={24} color="#60a5fa" />
        <Text style={styles.balanceText}>{diamonds.toLocaleString()}</Text>
        <Text style={styles.balanceLabel}>ألماسة</Text>
      </View>
    </View>
  );
};

// مكون تقدم الدولار
const DollarProgress = ({ diamonds }) => {
  const progress = (diamonds % DIAMONDS_PER_DOLLAR) / DIAMONDS_PER_DOLLAR * 100;
  const dollarsEarned = Math.floor(diamonds / DIAMONDS_PER_DOLLAR);
  const diamondsToNext = DIAMONDS_PER_DOLLAR - (diamonds % DIAMONDS_PER_DOLLAR);

  return (
    <View style={styles.dollarProgressCard}>
      <View style={styles.dollarHeader}>
        <View style={styles.dollarIcon}>
          <Text style={styles.dollarSign}>$</Text>
        </View>
        <View style={styles.dollarInfo}>
          <Text style={styles.dollarTitle}>تقدمك نحو الدولار التالي</Text>
          <Text style={styles.dollarValue}>${dollarsEarned.toFixed(2)} مكتسب</Text>
        </View>
      </View>

      <View style={styles.dollarProgress}>
        <View style={styles.progressBar}>
          <LinearGradient
            colors={['#22c55e', '#10b981']}
            style={[styles.progressFillGradient, { width: `${progress}%` }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
        <Text style={styles.diamondsToNext}>
          {diamondsToNext} ألماسة للدولار التالي
        </Text>
      </View>

      <View style={styles.exchangeRate}>
        <Ionicons name="swap-horizontal" size={14} color="#10b981" />
        <Text style={styles.exchangeText}>500 ألماسة = 1 دولار</Text>
      </View>
    </View>
  );
};

// ==================== الشاشة الرئيسية ====================
const SaqrFortunesScreen = ({ user, onClose, onBalanceUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [diamonds, setDiamonds] = useState(0);
  const [totalAds, setTotalAds] = useState(0);
  const [todayAds, setTodayAds] = useState(0);
  const [showRewardsCenter, setShowRewardsCenter] = useState(false);
  const [dailyProgress, setDailyProgress] = useState({});
  const [claimedChallenges, setClaimedChallenges] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load balance
      const balanceResponse = await api.getBalance(user.id);
      if (balanceResponse.ok) {
        const data = await balanceResponse.json();
        setDiamonds(data.diamonds || 0);
      }

      // Load stats from storage
      const statsKey = `saqr_fortunes_stats_${user.id}`;
      const savedStats = await AsyncStorage.getItem(statsKey);
      const today = new Date().toDateString();

      if (savedStats) {
        const parsed = JSON.parse(savedStats);
        setTotalAds(parsed.totalAds || 0);
        
        // Reset daily if new day
        if (parsed.lastDate !== today) {
          setTodayAds(0);
          setDailyProgress({});
          setClaimedChallenges([]);
        } else {
          setTodayAds(parsed.todayAds || 0);
          setDailyProgress(parsed.dailyProgress || {});
          setClaimedChallenges(parsed.claimedChallenges || []);
        }
      }
    } catch (e) {
      console.log('Error loading data:', e);
    } finally {
      setLoading(false);
    }
  };

  const refreshBalance = async () => {
    try {
      const response = await api.getBalance(user.id);
      if (response.ok) {
        const data = await response.json();
        setDiamonds(data.diamonds || 0);
      }
    } catch (e) {
      console.log('Error refreshing balance:', e);
    }
  };

  const handleClaimChallenge = async (challenge) => {
    try {
      const response = await api.addDiamonds(user.id, challenge.reward, `daily_challenge_${challenge.id}`);
      if (response.ok) {
        const data = await response.json();
        setDiamonds(data.new_balance);
        setClaimedChallenges(prev => [...prev, challenge.id]);
        
        // Save to storage
        await saveStats({
          ...getStatsObj(),
          claimedChallenges: [...claimedChallenges, challenge.id],
        });

        Alert.alert('مبروك!', `حصلت على ${challenge.reward} ألماسة!`);
      }
    } catch (e) {
      Alert.alert('خطأ', 'حدث خطأ، حاول مرة أخرى');
    }
  };

  const getStatsObj = () => ({
    totalAds,
    todayAds,
    dailyProgress,
    claimedChallenges,
    lastDate: new Date().toDateString(),
  });

  const saveStats = async (stats) => {
    try {
      await AsyncStorage.setItem(`saqr_fortunes_stats_${user.id}`, JSON.stringify(stats));
    } catch (e) {
      console.log('Error saving stats:', e);
    }
  };

  const getChallengeProgress = (challengeId) => {
    switch (challengeId) {
      case 'first_ad':
      case 'watch_5':
      case 'watch_10':
      case 'streak_3':
        return todayAds;
      case 'morning':
        return new Date().getHours() < 12 && todayAds > 0 ? 1 : 0;
      case 'night':
        const hour = new Date().getHours();
        return (hour >= 0 && hour < 5) && todayAds > 0 ? 1 : 0;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#60a5fa" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a0f', '#1a1a2e', '#0a0a0f']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>ثروات صقر</Text>
            <Text style={styles.headerSub}>شاهد واربح الجواهر</Text>
          </View>
          <View style={styles.diamondHeader}>
            <Ionicons name="diamond" size={18} color="#60a5fa" />
            <Text style={styles.diamondHeaderText}>{diamonds}</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Main Stats */}
          <View style={styles.statsRow}>
            <StatsCard icon="tv" value={todayAds} label="إعلانات اليوم" color="#60a5fa" />
            <StatsCard icon="videocam" value={totalAds} label="إجمالي الإعلانات" color="#ec4899" />
            <StatsCard icon="cash" value={`$${(diamonds / DIAMONDS_PER_DOLLAR).toFixed(2)}`} label="القيمة" color="#22c55e" />
          </View>

          {/* Dollar Progress */}
          <DollarProgress diamonds={diamonds} />

          {/* Main Watch Button */}
          <MainWatchButton
            onPress={() => setShowRewardsCenter(true)}
            diamonds={diamonds}
            loading={false}
          />

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => setShowRewardsCenter(true)}
            >
              <LinearGradient
                colors={['rgba(96,165,250,0.2)', 'rgba(96,165,250,0.05)']}
                style={styles.quickActionGradient}
              >
                <Ionicons name="gift" size={24} color="#60a5fa" />
                <Text style={styles.quickActionText}>عجلة الحظ</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => Alert.alert('قريباً', 'هذه الميزة قيد التطوير!')}
            >
              <LinearGradient
                colors={['rgba(236,72,153,0.2)', 'rgba(236,72,153,0.05)']}
                style={styles.quickActionGradient}
              >
                <Ionicons name="trophy" size={24} color="#ec4899" />
                <Text style={styles.quickActionText}>سباق الإعلانات</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Treasure Chests */}
          <TreasureChestsSection
            userId={user.id}
            adsWatched={todayAds}
            onBalanceUpdate={refreshBalance}
          />

          {/* Daily Challenges */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flame" size={20} color="#f59e0b" />
              <Text style={styles.sectionTitle}>التحديات اليومية</Text>
            </View>

            {DAILY_CHALLENGES.map(challenge => (
              <DailyChallenge
                key={challenge.id}
                challenge={challenge}
                progress={getChallengeProgress(challenge.id)}
                claimed={claimedChallenges.includes(challenge.id)}
                onClaim={() => handleClaimChallenge(challenge)}
              />
            ))}
          </View>

          {/* Tips */}
          <View style={styles.tipsSection}>
            <View style={styles.tipCard}>
              <Ionicons name="bulb" size={20} color="#fbbf24" />
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>نصيحة للربح الأقصى</Text>
                <Text style={styles.tipText}>
                  شاهد الإعلانات بشكل متتالي للحصول على مكافآت إضافية. 
                  كل 5 إعلانات متتالية = مكافأة خاصة!
                </Text>
              </View>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </LinearGradient>

      {/* Rewards Center Modal */}
      <AdRewardsCenter
        visible={showRewardsCenter}
        onClose={() => {
          setShowRewardsCenter(false);
          refreshBalance();
        }}
        userId={user.id}
        onBalanceUpdate={() => {
          refreshBalance();
          setTodayAds(prev => prev + 1);
          setTotalAds(prev => prev + 1);
          saveStats({
            ...getStatsObj(),
            todayAds: todayAds + 1,
            totalAds: totalAds + 1,
          });
          if (onBalanceUpdate) onBalanceUpdate();
        }}
      />
    </View>
  );
};

// ==================== الأنماط ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0f',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  diamondHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(96,165,250,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  diamondHeaderText: {
    color: '#60a5fa',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 10,
  },
  statsCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statsIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 2,
  },
  statsLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  dollarProgressCard: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
  },
  dollarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  dollarIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(34,197,94,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dollarSign: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  dollarInfo: {
    flex: 1,
  },
  dollarTitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  dollarValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  dollarProgress: {
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFillGradient: {
    height: '100%',
    borderRadius: 4,
  },
  diamondsToNext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  exchangeRate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(34,197,94,0.2)',
  },
  exchangeText: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '500',
  },
  mainButtonContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  glowRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(236,72,153,0.3)',
  },
  mainButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  mainButtonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 8,
  },
  rewardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    gap: 4,
  },
  rewardPreviewText: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '500',
  },
  balanceDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: 'rgba(96,165,250,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  balanceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#60a5fa',
  },
  balanceLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  quickAction: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  quickActionGradient: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  quickActionText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '500',
    marginTop: 8,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  challengeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  challengeCardReady: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderColor: 'rgba(34,197,94,0.3)',
  },
  challengeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  challengeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  challengeDesc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
    marginBottom: 6,
  },
  challengeProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#60a5fa',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
  },
  challengeReward: {
    alignItems: 'center',
  },
  claimedBadge: {
    padding: 4,
  },
  claimBtn: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  claimText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(96,165,250,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  rewardText: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '600',
  },
  tipsSection: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.2)',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fbbf24',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 16,
  },
});

export default SaqrFortunesScreen;
