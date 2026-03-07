// شاشة ثروات صقر - Saqr Fortunes Screen
// تجربة مشاهدة إعلانات ممتعة وتفاعلية
// جواهر صقر = للاستبدال بالمال (500 جوهرة = 1 ريال سعودي)
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
  ImageBackground,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import AdRewardsCenter from '../components/AdRewardsCenter';
import TreasureChestsSection from '../components/TreasureChests';

const { width, height } = Dimensions.get('window');

// ==================== ثوابت النظام ====================
// جواهر صقر = للاستبدال بالمال (ريال سعودي)
const GEMS_PER_RIYAL = 500;
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
            <Ionicons name="sparkles" size={12} color="#f472b6" />
            <Text style={styles.rewardText}>{challenge.reward}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// مكون زر المشاهدة الرئيسي - يعرض جواهر صقر
const MainWatchButton = ({ onPress, saqrGems, loading }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.mainButtonContainer}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity onPress={onPress} activeOpacity={0.9} disabled={loading}>
          <View style={styles.mainButtonNew}>
            <Image
              source={{ uri: 'https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/79ce2574f803a5fb1d0492bf79d3cf2590abf32894de2625e27f9694b16e0cd7.png' }}
              style={styles.mainButtonImage}
            />
            {loading && (
              <View style={styles.mainButtonLoading}>
                <ActivityIndicator color="#FFF" size="large" />
              </View>
            )}
          </View>
          <Text style={styles.mainButtonTitleNew}>شاهد واربح!</Text>
          <Text style={styles.mainButtonSubNew}>من 1 الى 100 جوهرة</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Current Saqr Gems Balance */}
      <View style={styles.balanceDisplay}>
        <LinearGradient
          colors={['#f472b6', '#c084fc']}
          style={styles.gemIconBg}
        >
          <Ionicons name="sparkles" size={18} color="#FFF" />
        </LinearGradient>
        <Text style={styles.balanceText}>{saqrGems.toLocaleString()}</Text>
        <Text style={styles.balanceLabel}>جوهرة صقر</Text>
      </View>
    </View>
  );
};

const AD_RACE_MILESTONES = [
  { id: 'race_5', ads: 5, reward: 8 },
  { id: 'race_10', ads: 10, reward: 18 },
  { id: 'race_20', ads: 20, reward: 40 },
  { id: 'race_35', ads: 35, reward: 90 },
];

const AdRaceModal = ({ visible, onClose, todayAds, claimedIds = [], onClaim }) => {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.raceOverlay}>
        <View style={styles.raceCard}>
          <LinearGradient colors={['#111827', '#0b1020']} style={styles.raceGradient}>
            <View style={styles.raceHeader}>
              <Text style={styles.raceTitle}>سباق الإعلانات</Text>
              <TouchableOpacity onPress={onClose} style={styles.raceCloseBtn}>
                <Ionicons name="close" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.raceSubtitle}>أكمل مشاهدات أكثر اليوم لتحصل على جوائز إضافية.</Text>
            <View style={styles.raceCounter}>
              <Ionicons name="speedometer" size={16} color="#60a5fa" />
              <Text style={styles.raceCounterText}>مشاهدات اليوم: {todayAds}</Text>
            </View>

            {AD_RACE_MILESTONES.map((milestone) => {
              const completed = todayAds >= milestone.ads;
              const claimed = claimedIds.includes(milestone.id);
              return (
                <View key={milestone.id} style={[styles.raceItem, completed && styles.raceItemDone]}>
                  <View style={styles.raceItemLeft}>
                    <Text style={styles.raceItemAds}>{milestone.ads} إعلان</Text>
                    <Text style={styles.raceItemReward}>+{milestone.reward} جوهرة</Text>
                  </View>
                  {claimed ? (
                    <View style={styles.raceClaimedBadge}>
                      <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                    </View>
                  ) : completed ? (
                    <TouchableOpacity style={styles.raceClaimBtn} onPress={() => onClaim(milestone)}>
                      <Text style={styles.raceClaimText}>استلام</Text>
                    </TouchableOpacity>
                  ) : (
                    <Ionicons name="lock-closed" size={16} color="#64748b" />
                  )}
                </View>
              );
            })}
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

// مكون تقدم الريال - يعرض جواهر صقر
const RiyalProgress = ({ saqrGems }) => {
  const progress = (saqrGems % GEMS_PER_RIYAL) / GEMS_PER_RIYAL * 100;
  const riyalsEarned = Math.floor(saqrGems / GEMS_PER_RIYAL);
  const gemsToNext = GEMS_PER_RIYAL - (saqrGems % GEMS_PER_RIYAL);

  return (
    <View style={styles.dollarProgressCard}>
      <View style={styles.dollarHeader}>
        <View style={styles.dollarIcon}>
          <Text style={styles.dollarSign}>ر.س</Text>
        </View>
        <View style={styles.dollarInfo}>
          <Text style={styles.dollarTitle}>تقدمك نحو الريال التالي</Text>
          <Text style={styles.dollarValue}>{riyalsEarned} ريال مكتسب</Text>
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
          {gemsToNext} جوهرة للريال التالي
        </Text>
      </View>

      <View style={styles.exchangeRate}>
        <Ionicons name="swap-horizontal" size={14} color="#10b981" />
        <Text style={styles.exchangeText}>500 جوهرة صقر = 1 ريال سعودي</Text>
      </View>
    </View>
  );
};

// ==================== الشاشة الرئيسية ====================
const SaqrFortunesScreen = ({ user, onClose, onBalanceUpdate }) => {
  const userId = user?.id || user?.user_id;
  const [loading, setLoading] = useState(true);
  const [saqrGems, setSaqrGems] = useState(0);
  const [totalAds, setTotalAds] = useState(0);
  const [todayAds, setTodayAds] = useState(0);
  const [showRewardsCenter, setShowRewardsCenter] = useState(false);
  const [showAdRace, setShowAdRace] = useState(false);
  const [dailyProgress, setDailyProgress] = useState({});
  const [claimedChallenges, setClaimedChallenges] = useState([]);
  const [claimedRaceMilestones, setClaimedRaceMilestones] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load balance - جلب جواهر صقر
      const balanceResponse = await api.getBalance(userId);
      if (balanceResponse.ok) {
        const data = await balanceResponse.json();
        setSaqrGems(data.saqr_gems || 0);
      }

      // Load stats from storage
      const statsKey = `saqr_fortunes_stats_${userId}`;
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
          setClaimedRaceMilestones([]);
        } else {
          setTodayAds(parsed.todayAds || 0);
          setDailyProgress(parsed.dailyProgress || {});
          setClaimedChallenges(parsed.claimedChallenges || []);
          setClaimedRaceMilestones(parsed.claimedRaceMilestones || []);
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
      const response = await api.getBalance(userId);
      if (response.ok) {
        const data = await response.json();
        setSaqrGems(data.saqr_gems || 0);
      }
    } catch (e) {
      console.log('Error refreshing balance:', e);
    }
  };

  const handleClaimChallenge = async (challenge) => {
    try {
      // اضافة جواهر صقر بدلا من الالماس
      const response = await api.addSaqrGems(userId, challenge.reward, `daily_challenge_${challenge.id}`);
      if (response.ok) {
        const data = await response.json();
        setSaqrGems(data.new_balance);
        setClaimedChallenges(prev => [...prev, challenge.id]);
        
        // Save to storage
        await saveStats({
          ...getStatsObj(),
          claimedChallenges: [...claimedChallenges, challenge.id],
        });

        Alert.alert('مبروك!', `حصلت على ${challenge.reward} جوهرة صقر!`);
      }
    } catch (e) {
      Alert.alert('خطا', 'حدث خطا، حاول مرة اخرى');
    }
  };

  const getStatsObj = () => ({
    totalAds,
    todayAds,
    dailyProgress,
    claimedChallenges,
    claimedRaceMilestones,
    lastDate: new Date().toDateString(),
  });

  const handleClaimRaceMilestone = async (milestone) => {
    if (claimedRaceMilestones.includes(milestone.id) || todayAds < milestone.ads) {
      return;
    }

    try {
      const response = await api.addSaqrGems(userId, milestone.reward, `ad_race_${milestone.id}`);
      if (!response.ok) {
        throw new Error('failed');
      }
      const data = await response.json();
      const updatedClaims = [...claimedRaceMilestones, milestone.id];
      setClaimedRaceMilestones(updatedClaims);
      setSaqrGems(data.new_balance || saqrGems);
      await saveStats({
        ...getStatsObj(),
        claimedRaceMilestones: updatedClaims,
      });
      Alert.alert('تم الاستلام', `أضيفت ${milestone.reward} جوهرة صقر إلى رصيدك.`);
    } catch (e) {
      Alert.alert('تعذر الاستلام', 'حدث خطأ أثناء إضافة المكافأة.');
    }
  };

  const saveStats = async (stats) => {
    try {
      await AsyncStorage.setItem(`saqr_fortunes_stats_${userId}`, JSON.stringify(stats));
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
          <View style={styles.gemsHeader}>
            <LinearGradient
              colors={['#f472b6', '#c084fc']}
              style={styles.gemIconSmall}
            >
              <Ionicons name="sparkles" size={14} color="#FFF" />
            </LinearGradient>
            <Text style={styles.gemsHeaderText}>{saqrGems}</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Main Stats */}
          <View style={styles.statsRow}>
            <StatsCard icon="tv" value={todayAds} label="اعلانات اليوم" color="#60a5fa" />
            <StatsCard icon="videocam" value={totalAds} label="اجمالي الاعلانات" color="#ec4899" />
            <StatsCard icon="cash" value={`${Math.floor(saqrGems / GEMS_PER_RIYAL)} ر.س`} label="القيمة" color="#22c55e" />
          </View>

          {/* Dollar Progress */}
          <RiyalProgress saqrGems={saqrGems} />

          {/* Main Watch Button */}
          <MainWatchButton
            onPress={() => setShowRewardsCenter(true)}
            saqrGems={saqrGems}
            loading={false}
          />

          {/* Quick Actions - New Image Design */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionNew}
              onPress={() => setShowRewardsCenter(true)}
            >
              <ImageBackground
                source={{ uri: 'https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/ef4c12b55d42df2a8a6af51757efa04a8471c202f4cf7500803dec45a3a0b3e7.png' }}
                style={styles.quickActionImageBg}
                imageStyle={styles.quickActionImageStyle}
              >
                <LinearGradient
                  colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
                  style={styles.quickActionOverlay}
                >
                  <Text style={styles.quickActionTextNew}>عجلة الحظ</Text>
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.quickActionNew}
              onPress={() => setShowAdRace(true)}
            >
              <ImageBackground
                source={{ uri: 'https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/e7465c5916e65832b7442a2d8e0a6e9704c872117300e46de5f12b06c5fde836.png' }}
                style={styles.quickActionImageBg}
                imageStyle={styles.quickActionImageStyle}
              >
                <LinearGradient
                  colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
                  style={styles.quickActionOverlay}
                >
                  <Text style={styles.quickActionTextNew}>سباق الاعلانات</Text>
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>
          </View>

          {/* Treasure Chests */}
          <TreasureChestsSection
            userId={userId}
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
                <Text style={styles.tipTitle}>نصيحة للربح الاقصى</Text>
                <Text style={styles.tipText}>
                  شاهد الاعلانات بشكل متتالي للحصول على مكافات اضافية. 
                  كل 5 اعلانات متتالية = مكافاة خاصة!
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
        userId={userId}
        onBalanceUpdate={() => {
          refreshBalance();
          setTodayAds((prevToday) => {
            const nextToday = prevToday + 1;
            setTotalAds((prevTotal) => {
              const nextTotal = prevTotal + 1;
              saveStats({
                ...getStatsObj(),
                todayAds: nextToday,
                totalAds: nextTotal,
              });
              return nextTotal;
            });
            return nextToday;
          });
          if (onBalanceUpdate) onBalanceUpdate();
        }}
      />

      <AdRaceModal
        visible={showAdRace}
        onClose={() => setShowAdRace(false)}
        todayAds={todayAds}
        claimedIds={claimedRaceMilestones}
        onClaim={handleClaimRaceMilestone}
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
  gemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244,114,182,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  gemIconSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gemsHeaderText: {
    color: '#f472b6',
    fontWeight: 'bold',
    fontSize: 14,
  },
  gemIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
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
  // New Main Button with Image
  mainButtonNew: {
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
    alignSelf: 'center',
    elevation: 10,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  mainButtonImage: {
    width: '100%',
    height: '100%',
    borderRadius: 80,
  },
  mainButtonLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 80,
  },
  mainButtonTitleNew: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    marginTop: 12,
  },
  mainButtonSubNew: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 4,
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
  quickActionNew: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#60a5fa',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  quickActionImageBg: {
    height: 120,
  },
  quickActionImageStyle: {
    borderRadius: 20,
  },
  quickActionOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 14,
    borderRadius: 20,
  },
  quickActionTextNew: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
    backgroundColor: 'rgba(244,114,182,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  rewardText: {
    color: '#f472b6',
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
  raceOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.86)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  raceCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    overflow: 'hidden',
  },
  raceGradient: {
    padding: 16,
  },
  raceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  raceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  raceCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  raceSubtitle: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 12,
    marginBottom: 12,
  },
  raceCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  raceCounterText: {
    color: '#93c5fd',
    fontWeight: '600',
    fontSize: 13,
  },
  raceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 8,
  },
  raceItemDone: {
    borderColor: 'rgba(34,197,94,0.35)',
    backgroundColor: 'rgba(34,197,94,0.08)',
  },
  raceItemLeft: {
    flex: 1,
  },
  raceItemAds: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  raceItemReward: {
    color: '#f472b6',
    fontSize: 12,
    marginTop: 2,
  },
  raceClaimBtn: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9,
  },
  raceClaimText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  raceClaimedBadge: {
    paddingHorizontal: 4,
  },
});

export default SaqrFortunesScreen;
