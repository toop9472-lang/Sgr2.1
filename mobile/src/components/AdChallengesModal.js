// Ad Challenges Modal - تحديات الإعلانات للحصول على مكافآت
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// تعريف التحديات
const CHALLENGES = [
  {
    id: 'watch_1',
    title: 'المشاهد المبتدئ',
    description: 'شاهد إعلان واحد',
    target: 1,
    reward: 5,
    rewardType: 'diamonds',
    icon: 'play-circle',
    color: '#3b82f6',
  },
  {
    id: 'watch_3',
    title: 'المشاهد النشط',
    description: 'شاهد 3 إعلانات',
    target: 3,
    reward: 20,
    rewardType: 'diamonds',
    icon: 'videocam',
    color: '#22c55e',
  },
  {
    id: 'watch_5',
    title: 'المشاهد المتحمس',
    description: 'شاهد 5 إعلانات',
    target: 5,
    reward: 50,
    rewardType: 'diamonds',
    icon: 'star',
    color: '#fbbf24',
  },
  {
    id: 'watch_10',
    title: 'المشاهد المحترف',
    description: 'شاهد 10 إعلانات',
    target: 10,
    reward: 150,
    rewardType: 'diamonds',
    icon: 'trophy',
    color: '#a855f7',
  },
  {
    id: 'daily_streak_3',
    title: 'المثابر',
    description: 'شاهد إعلانات 3 أيام متتالية',
    target: 3,
    reward: 100,
    rewardType: 'diamonds',
    icon: 'flame',
    color: '#ef4444',
  },
  {
    id: 'game_try',
    title: 'المستكشف',
    description: 'جرب لعبة جديدة بعد مشاهدة إعلان',
    target: 1,
    reward: 1,
    rewardType: 'free_play',
    icon: 'game-controller',
    color: '#06b6d4',
  },
];

// مكافآت خاصة
const SPECIAL_REWARDS = [
  {
    id: 'free_chess',
    title: 'محاولة شطرنج مجانية',
    cost: 0,
    description: 'شاهد إعلان واحصل على محاولة مجانية',
    icon: 'chess-pawn',
    requiresAd: true,
  },
  {
    id: 'free_puzzle',
    title: 'محاولة أحجية مجانية',
    cost: 0,
    description: 'شاهد إعلان واحصل على محاولة مجانية',
    icon: 'grid',
    requiresAd: true,
  },
  {
    id: 'double_diamonds',
    title: 'مضاعفة الماس',
    cost: 0,
    description: 'شاهد إعلان لمضاعفة مكافأتك التالية',
    icon: 'diamond',
    requiresAd: true,
  },
];

const AdChallengesModal = ({ 
  visible, 
  onClose, 
  onWatchAd, 
  onClaimReward,
  userDiamonds = 0,
}) => {
  const [progress, setProgress] = useState({});
  const [claimedChallenges, setClaimedChallenges] = useState([]);
  const [dailyAdsWatched, setDailyAdsWatched] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('challenges');
  const [watchStreak, setWatchStreak] = useState(0);

  // تحميل البيانات المحفوظة
  useEffect(() => {
    loadProgress();
  }, [visible]);

  const loadProgress = async () => {
    try {
      const savedProgress = await AsyncStorage.getItem('ad_challenges_progress');
      const savedClaimed = await AsyncStorage.getItem('ad_challenges_claimed');
      const savedDaily = await AsyncStorage.getItem('daily_ads_watched');
      const savedStreak = await AsyncStorage.getItem('ad_watch_streak');
      const lastWatchDate = await AsyncStorage.getItem('last_ad_watch_date');
      
      if (savedProgress) setProgress(JSON.parse(savedProgress));
      if (savedClaimed) setClaimedChallenges(JSON.parse(savedClaimed));
      if (savedStreak) setWatchStreak(parseInt(savedStreak) || 0);
      
      // التحقق من اليوم الجديد
      const today = new Date().toDateString();
      if (lastWatchDate !== today) {
        setDailyAdsWatched(0);
        await AsyncStorage.setItem('daily_ads_watched', '0');
      } else if (savedDaily) {
        setDailyAdsWatched(parseInt(savedDaily) || 0);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const saveProgress = async (newProgress, newClaimed) => {
    try {
      await AsyncStorage.setItem('ad_challenges_progress', JSON.stringify(newProgress));
      await AsyncStorage.setItem('ad_challenges_claimed', JSON.stringify(newClaimed));
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  // مشاهدة إعلان
  const handleWatchAd = async (challengeId = null, specialRewardId = null) => {
    setIsLoading(true);
    
    try {
      // محاكاة مشاهدة الإعلان (في الإنتاج يتم استدعاء AdMob)
      if (onWatchAd) {
        const success = await onWatchAd();
        if (!success) {
          Alert.alert('خطأ', 'لم نتمكن من تحميل الإعلان، حاول مرة أخرى');
          setIsLoading(false);
          return;
        }
      }
      
      // تحديث العداد اليومي
      const newDailyCount = dailyAdsWatched + 1;
      setDailyAdsWatched(newDailyCount);
      await AsyncStorage.setItem('daily_ads_watched', String(newDailyCount));
      await AsyncStorage.setItem('last_ad_watch_date', new Date().toDateString());
      
      // تحديث التقدم لجميع التحديات
      const newProgress = { ...progress };
      
      // تحديث تحديات المشاهدة
      ['watch_1', 'watch_3', 'watch_5', 'watch_10'].forEach(id => {
        newProgress[id] = (newProgress[id] || 0) + 1;
      });
      
      // تحديث streak
      const newStreak = watchStreak + 1;
      setWatchStreak(newStreak);
      await AsyncStorage.setItem('ad_watch_streak', String(newStreak));
      newProgress['daily_streak_3'] = newStreak;
      
      setProgress(newProgress);
      await saveProgress(newProgress, claimedChallenges);
      
      // إذا كان هناك مكافأة خاصة
      if (specialRewardId) {
        handleSpecialReward(specialRewardId);
      }
      
      Alert.alert('تم!', 'شكراً لمشاهدتك الإعلان! تم تحديث تقدمك.');
      
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ، حاول مرة أخرى');
    } finally {
      setIsLoading(false);
    }
  };

  // استلام المكافأة
  const handleClaimReward = async (challenge) => {
    if (claimedChallenges.includes(challenge.id)) {
      Alert.alert('تنبيه', 'لقد استلمت هذه المكافأة مسبقاً');
      return;
    }
    
    const currentProgress = progress[challenge.id] || 0;
    if (currentProgress < challenge.target) {
      Alert.alert('تنبيه', 'لم تكمل التحدي بعد');
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (onClaimReward) {
        await onClaimReward(challenge.reward, challenge.rewardType);
      }
      
      const newClaimed = [...claimedChallenges, challenge.id];
      setClaimedChallenges(newClaimed);
      await saveProgress(progress, newClaimed);
      
      Alert.alert(
        'مبروك!',
        challenge.rewardType === 'diamonds' 
          ? `حصلت على ${challenge.reward} ماسة!`
          : `حصلت على ${challenge.reward} محاولة مجانية!`
      );
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في استلام المكافأة');
    } finally {
      setIsLoading(false);
    }
  };

  // مكافأة خاصة
  const handleSpecialReward = (rewardId) => {
    const reward = SPECIAL_REWARDS.find(r => r.id === rewardId);
    if (reward) {
      Alert.alert('مبروك!', `حصلت على: ${reward.title}`);
    }
  };

  // حساب نسبة التقدم
  const getProgressPercent = (challenge) => {
    const current = progress[challenge.id] || 0;
    return Math.min((current / challenge.target) * 100, 100);
  };

  // التحقق من اكتمال التحدي
  const isChallengeComplete = (challenge) => {
    const current = progress[challenge.id] || 0;
    return current >= challenge.target;
  };

  // التحقق من استلام المكافأة
  const isRewardClaimed = (challengeId) => {
    return claimedChallenges.includes(challengeId);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>تحديات الإعلانات</Text>
            <View style={styles.diamondBadge}>
              <Ionicons name="diamond" size={16} color="#60a5fa" />
              <Text style={styles.diamondText}>{userDiamonds}</Text>
            </View>
          </LinearGradient>

          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{dailyAdsWatched}</Text>
              <Text style={styles.statLabel}>إعلانات اليوم</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{watchStreak}</Text>
              <Text style={styles.statLabel}>أيام متتالية</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{claimedChallenges.length}</Text>
              <Text style={styles.statLabel}>مكافآت مستلمة</Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'challenges' && styles.tabActive]}
              onPress={() => setActiveTab('challenges')}
            >
              <Text style={[styles.tabText, activeTab === 'challenges' && styles.tabTextActive]}>
                التحديات
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'special' && styles.tabActive]}
              onPress={() => setActiveTab('special')}
            >
              <Text style={[styles.tabText, activeTab === 'special' && styles.tabTextActive]}>
                مكافآت فورية
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {activeTab === 'challenges' ? (
              <>
                {/* Watch Ad Button */}
                <TouchableOpacity 
                  style={styles.watchAdMainBtn}
                  onPress={() => handleWatchAd()}
                  disabled={isLoading}
                >
                  <LinearGradient 
                    colors={['#3b82f6', '#2563eb']} 
                    style={styles.watchAdGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <>
                        <Ionicons name="play-circle" size={28} color="#FFF" />
                        <View style={styles.watchAdTextContainer}>
                          <Text style={styles.watchAdMainText}>شاهد إعلان الآن</Text>
                          <Text style={styles.watchAdSubText}>لزيادة تقدمك في التحديات</Text>
                        </View>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Challenges List */}
                {CHALLENGES.map((challenge) => {
                  const percent = getProgressPercent(challenge);
                  const isComplete = isChallengeComplete(challenge);
                  const isClaimed = isRewardClaimed(challenge.id);
                  
                  return (
                    <View key={challenge.id} style={styles.challengeCard}>
                      <View style={[styles.challengeIcon, { backgroundColor: challenge.color + '20' }]}>
                        <Ionicons name={challenge.icon} size={24} color={challenge.color} />
                      </View>
                      
                      <View style={styles.challengeInfo}>
                        <Text style={styles.challengeTitle}>{challenge.title}</Text>
                        <Text style={styles.challengeDesc}>{challenge.description}</Text>
                        
                        {/* Progress Bar */}
                        <View style={styles.progressContainer}>
                          <View style={styles.progressBar}>
                            <View 
                              style={[
                                styles.progressFill, 
                                { width: `${percent}%`, backgroundColor: challenge.color }
                              ]} 
                            />
                          </View>
                          <Text style={styles.progressText}>
                            {progress[challenge.id] || 0}/{challenge.target}
                          </Text>
                        </View>
                      </View>
                      
                      {/* Reward / Claim Button */}
                      <View style={styles.rewardContainer}>
                        {isClaimed ? (
                          <View style={styles.claimedBadge}>
                            <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                          </View>
                        ) : isComplete ? (
                          <TouchableOpacity 
                            style={styles.claimBtn}
                            onPress={() => handleClaimReward(challenge)}
                          >
                            <Text style={styles.claimBtnText}>استلم</Text>
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
                })}
              </>
            ) : (
              <>
                {/* Special Rewards */}
                <Text style={styles.sectionTitle}>شاهد إعلان واحصل على مكافأة فورية</Text>
                
                {SPECIAL_REWARDS.map((reward) => (
                  <TouchableOpacity 
                    key={reward.id}
                    style={styles.specialRewardCard}
                    onPress={() => handleWatchAd(null, reward.id)}
                    disabled={isLoading}
                  >
                    <View style={[styles.specialIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                      <Ionicons name="gift" size={24} color="#3b82f6" />
                    </View>
                    <View style={styles.specialInfo}>
                      <Text style={styles.specialTitle}>{reward.title}</Text>
                      <Text style={styles.specialDesc}>{reward.description}</Text>
                    </View>
                    <View style={styles.watchAdSmallBtn}>
                      <Ionicons name="play" size={18} color="#FFF" />
                    </View>
                  </TouchableOpacity>
                ))}

                {/* Tips */}
                <View style={styles.tipsCard}>
                  <Ionicons name="bulb" size={20} color="#fbbf24" />
                  <Text style={styles.tipsText}>
                    نصيحة: شاهد إعلانات يومياً لزيادة streak والحصول على مكافآت أكبر!
                  </Text>
                </View>
              </>
            )}
            
            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0a0a0f',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
    gap: 4,
  },
  diamondText: {
    color: '#60a5fa',
    fontWeight: '600',
    fontSize: 14,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFF',
  },
  content: {
    padding: 16,
  },
  watchAdMainBtn: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  watchAdGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  watchAdTextContainer: {
    flex: 1,
  },
  watchAdMainText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFF',
  },
  watchAdSubText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  challengeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  challengeIcon: {
    width: 48,
    height: 48,
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
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
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
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  rewardContainer: {
    alignItems: 'center',
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
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
  claimBtn: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  claimBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  claimedBadge: {
    padding: 6,
  },
  sectionTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 14,
    textAlign: 'center',
  },
  specialRewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  specialIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  specialInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  specialTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  specialDesc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  watchAdSmallBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  tipsText: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
  },
});

export default AdChallengesModal;
