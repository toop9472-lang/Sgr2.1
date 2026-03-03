// Achievements System - نظام الإنجازات
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// قائمة الإنجازات - مبنية على مشاهدة الإعلانات ومشاركة التطبيق
export const ACHIEVEMENTS = [
  // إنجازات مشاهدة الإعلانات
  {
    id: 'first_ad',
    name: { ar: 'المشاهدة الأولى', en: 'First View' },
    description: { ar: 'شاهد أول إعلان', en: 'Watch your first ad' },
    icon: 'play-circle',
    color: '#10b981',
    requirement: { type: 'ads_watched', count: 1 },
    reward: { points: 10, diamonds: 2 },
  },
  {
    id: 'ad_watcher_10',
    name: { ar: 'مشاهد نشط', en: 'Active Viewer' },
    description: { ar: 'شاهد 10 إعلانات', en: 'Watch 10 ads' },
    icon: 'videocam',
    color: '#3b82f6',
    requirement: { type: 'ads_watched', count: 10 },
    reward: { points: 50, diamonds: 10 },
  },
  {
    id: 'ad_watcher_50',
    name: { ar: 'مشاهد محترف', en: 'Pro Viewer' },
    description: { ar: 'شاهد 50 إعلان', en: 'Watch 50 ads' },
    icon: 'tv',
    color: '#8b5cf6',
    requirement: { type: 'ads_watched', count: 50 },
    reward: { points: 100, diamonds: 25 },
  },
  {
    id: 'ad_watcher_100',
    name: { ar: 'خبير المشاهدة', en: 'Viewing Expert' },
    description: { ar: 'شاهد 100 إعلان', en: 'Watch 100 ads' },
    icon: 'ribbon',
    color: '#ec4899',
    requirement: { type: 'ads_watched', count: 100 },
    reward: { points: 200, diamonds: 50 },
  },
  {
    id: 'ad_watcher_500',
    name: { ar: 'أسطورة المشاهدة', en: 'Viewing Legend' },
    description: { ar: 'شاهد 500 إعلان', en: 'Watch 500 ads' },
    icon: 'trophy',
    color: '#fbbf24',
    requirement: { type: 'ads_watched', count: 500 },
    reward: { points: 500, diamonds: 100 },
  },
  // إنجازات مشاركة التطبيق
  {
    id: 'first_share',
    name: { ar: 'المشاركة الأولى', en: 'First Share' },
    description: { ar: 'شارك التطبيق مع صديق', en: 'Share the app with a friend' },
    icon: 'share-social',
    color: '#22c55e',
    requirement: { type: 'app_shares', count: 1 },
    reward: { points: 20, diamonds: 5 },
  },
  {
    id: 'social_butterfly_5',
    name: { ar: 'صديق اجتماعي', en: 'Social Butterfly' },
    description: { ar: 'شارك التطبيق 5 مرات', en: 'Share the app 5 times' },
    icon: 'people',
    color: '#06b6d4',
    requirement: { type: 'app_shares', count: 5 },
    reward: { points: 75, diamonds: 15 },
  },
  {
    id: 'influencer',
    name: { ar: 'مؤثر', en: 'Influencer' },
    description: { ar: 'شارك التطبيق 20 مرة', en: 'Share the app 20 times' },
    icon: 'megaphone',
    color: '#f97316',
    requirement: { type: 'app_shares', count: 20 },
    reward: { points: 150, diamonds: 40 },
  },
  {
    id: 'ambassador',
    name: { ar: 'سفير صقر', en: 'Saqr Ambassador' },
    description: { ar: 'شارك التطبيق 50 مرة', en: 'Share the app 50 times' },
    icon: 'star',
    color: '#eab308',
    requirement: { type: 'app_shares', count: 50 },
    reward: { points: 300, diamonds: 75 },
  },
  // إنجازات الإحالات الناجحة
  {
    id: 'first_referral',
    name: { ar: 'الإحالة الأولى', en: 'First Referral' },
    description: { ar: 'صديق سجل بكودك', en: 'A friend registered with your code' },
    icon: 'person-add',
    color: '#14b8a6',
    requirement: { type: 'successful_referrals', count: 1 },
    reward: { points: 50, diamonds: 20 },
  },
  {
    id: 'referrer_5',
    name: { ar: 'موجه ناجح', en: 'Successful Referrer' },
    description: { ar: '5 أصدقاء سجلوا بكودك', en: '5 friends registered with your code' },
    icon: 'people-circle',
    color: '#a855f7',
    requirement: { type: 'successful_referrals', count: 5 },
    reward: { points: 150, diamonds: 50 },
  },
  {
    id: 'referrer_master',
    name: { ar: 'خبير الإحالات', en: 'Referral Master' },
    description: { ar: '20 صديق سجلوا بكودك', en: '20 friends registered with your code' },
    icon: 'medal',
    color: '#ef4444',
    requirement: { type: 'successful_referrals', count: 20 },
    reward: { points: 500, diamonds: 150 },
  },
];

// Context
const AchievementsContext = createContext();

export const AchievementsProvider = ({ children }) => {
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [stats, setStats] = useState({
    ads_watched: 0,
    app_shares: 0,
    successful_referrals: 0,
    total_diamonds: 0,
    total_points: 0,
    login_streak: 0,
  });
  const [newAchievement, setNewAchievement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedAchievements = await AsyncStorage.getItem('achievements');
      const savedStats = await AsyncStorage.getItem('achievement_stats');
      
      if (savedAchievements) {
        setUnlockedAchievements(JSON.parse(savedAchievements));
      }
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      }
    } catch (error) {
      console.log('Error loading achievements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = async (newAchievements, newStats) => {
    try {
      await AsyncStorage.setItem('achievements', JSON.stringify(newAchievements));
      await AsyncStorage.setItem('achievement_stats', JSON.stringify(newStats));
    } catch (error) {
      console.error('Error saving achievements:', error);
    }
  };

  // Check and unlock achievements
  const checkAchievements = (newStats) => {
    const newlyUnlocked = [];
    
    ACHIEVEMENTS.forEach(achievement => {
      // Skip if already unlocked
      if (unlockedAchievements.includes(achievement.id)) return;
      
      const { type, count } = achievement.requirement;
      let currentValue = 0;
      
      switch (type) {
        case 'ads_watched':
          currentValue = newStats.ads_watched;
          break;
        case 'app_shares':
          currentValue = newStats.app_shares;
          break;
        case 'successful_referrals':
          currentValue = newStats.successful_referrals;
          break;
        case 'total_diamonds':
          currentValue = newStats.total_diamonds;
          break;
        case 'total_points':
          currentValue = newStats.total_points;
          break;
        case 'login_streak':
          currentValue = newStats.login_streak;
          break;
      }
      
      if (currentValue >= count) {
        newlyUnlocked.push(achievement.id);
      }
    });
    
    return newlyUnlocked;
  };

  // Update stats and check achievements
  const updateStats = async (statUpdate) => {
    const newStats = { ...stats };
    
    // Update specific stats
    Object.keys(statUpdate).forEach(key => {
      if (typeof statUpdate[key] === 'number') {
        newStats[key] = (newStats[key] || 0) + statUpdate[key];
      } else {
        newStats[key] = statUpdate[key];
      }
    });
    
    setStats(newStats);
    
    // Check for new achievements
    const newlyUnlocked = checkAchievements(newStats);
    
    if (newlyUnlocked.length > 0) {
      const updatedAchievements = [...unlockedAchievements, ...newlyUnlocked];
      setUnlockedAchievements(updatedAchievements);
      
      // Show notification for first new achievement
      const firstNew = ACHIEVEMENTS.find(a => a.id === newlyUnlocked[0]);
      if (firstNew) {
        setNewAchievement(firstNew);
      }
      
      // Save
      saveData(updatedAchievements, newStats);
    } else {
      saveData(unlockedAchievements, newStats);
    }
    
    return newlyUnlocked;
  };

  // Record ad watched
  const recordAdWatched = async () => {
    return updateStats({ ads_watched: 1 });
  };

  // Record app shared
  const recordAppShared = async () => {
    return updateStats({ app_shares: 1 });
  };

  // Record successful referral
  const recordReferral = async () => {
    return updateStats({ successful_referrals: 1 });
  };

  // Update currency
  const updateCurrency = async (points = 0, diamonds = 0) => {
    return updateStats({
      total_points: points,
      total_diamonds: diamonds,
    });
  };

  // Update login streak
  const updateLoginStreak = async (streak) => {
    return updateStats({ login_streak: streak });
  };

  // Clear new achievement notification
  const clearNewAchievement = () => {
    setNewAchievement(null);
  };

  // Get achievement progress
  const getAchievementProgress = (achievementId) => {
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return { current: 0, required: 0, percentage: 0 };
    
    const { type, count } = achievement.requirement;
    let current = 0;
    
    switch (type) {
      case 'ads_watched': current = stats.ads_watched; break;
      case 'app_shares': current = stats.app_shares; break;
      case 'successful_referrals': current = stats.successful_referrals; break;
      case 'total_diamonds': current = stats.total_diamonds; break;
      case 'total_points': current = stats.total_points; break;
      case 'login_streak': current = stats.login_streak; break;
    }
    
    return {
      current: Math.min(current, count),
      required: count,
      percentage: Math.min((current / count) * 100, 100),
    };
  };

  const value = {
    achievements: ACHIEVEMENTS,
    unlockedAchievements,
    stats,
    newAchievement,
    isLoading,
    updateStats,
    recordAdWatched,
    recordAppShared,
    recordReferral,
    updateCurrency,
    updateLoginStreak,
    clearNewAchievement,
    getAchievementProgress,
  };

  return (
    <AchievementsContext.Provider value={value}>
      {children}
    </AchievementsContext.Provider>
  );
};

// Hook
export const useAchievements = () => {
  const context = useContext(AchievementsContext);
  if (!context) {
    throw new Error('useAchievements must be used within an AchievementsProvider');
  }
  return context;
};

export default AchievementsContext;
