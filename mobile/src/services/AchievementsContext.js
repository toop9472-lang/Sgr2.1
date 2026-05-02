// Achievements System - نظام الإنجازات
import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const ACHIEVEMENTS = [
  {
    id: "first_ad",
    name: { ar: "المشاهدة الأولى", en: "First View" },
    description: { ar: "شاهد أول إعلان", en: "Watch your first ad" },
    icon: "play-circle",
    color: "#10b981",
    requirement: { type: "ads_watched", count: 1 },
    reward: { points: 5 },
  },
  {
    id: "ad_watcher_10",
    name: { ar: "مشاهد نشط", en: "Active Viewer" },
    description: { ar: "شاهد 10 إعلانات", en: "Watch 10 ads" },
    icon: "videocam",
    color: "#3b82f6",
    requirement: { type: "ads_watched", count: 10 },
    reward: { points: 5 },
  },
  {
    id: "ad_watcher_50",
    name: { ar: "مشاهد محترف", en: "Pro Viewer" },
    description: { ar: "شاهد 50 إعلان", en: "Watch 50 ads" },
    icon: "tv",
    color: "#8b5cf6",
    requirement: { type: "ads_watched", count: 50 },
    reward: { points: 5 },
  },
  {
    id: "ad_watcher_100",
    name: { ar: "خبير المشاهدة", en: "Viewing Expert" },
    description: { ar: "شاهد 100 إعلان", en: "Watch 100 ads" },
    icon: "ribbon",
    color: "#ec4899",
    requirement: { type: "ads_watched", count: 100 },
    reward: { points: 5 },
  },
  {
    id: "first_share",
    name: { ar: "المشاركة الأولى", en: "First Share" },
    description: { ar: "شارك التطبيق مع صديق", en: "Share the app with a friend" },
    icon: "share-social",
    color: "#22c55e",
    requirement: { type: "app_shares", count: 1 },
    reward: { points: 5 },
  },
];

const AchievementsContext = createContext();

export const AchievementsProvider = ({ children }) => {
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [stats, setStats] = useState({
    ads_watched: 0,
    app_shares: 0,
    successful_referrals: 0,
    total_points: 0,
    login_streak: 0,
  });
  const [newAchievement, setNewAchievement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedAchievements = await AsyncStorage.getItem("achievements");
      const savedStats = await AsyncStorage.getItem("achievement_stats");
      if (savedAchievements) setUnlockedAchievements(JSON.parse(savedAchievements));
      if (savedStats) setStats(JSON.parse(savedStats));
    } catch (error) {
      console.log("Error loading achievements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = async (nextAchievements, nextStats) => {
    try {
      await AsyncStorage.setItem("achievements", JSON.stringify(nextAchievements));
      await AsyncStorage.setItem("achievement_stats", JSON.stringify(nextStats));
    } catch (error) {
      console.error("Error saving achievements:", error);
    }
  };

  const checkAchievements = (nextStats) => {
    const unlockedNow = [];
    ACHIEVEMENTS.forEach((achievement) => {
      if (unlockedAchievements.includes(achievement.id)) return;
      const { type, count } = achievement.requirement;
      const currentValue = Number(nextStats[type] || 0);
      if (currentValue >= count) unlockedNow.push(achievement.id);
    });
    return unlockedNow;
  };

  const updateStats = async (statUpdate) => {
    const nextStats = { ...stats };
    Object.keys(statUpdate).forEach((key) => {
      if (typeof statUpdate[key] === "number") {
        nextStats[key] = Number(nextStats[key] || 0) + statUpdate[key];
      } else {
        nextStats[key] = statUpdate[key];
      }
    });

    setStats(nextStats);
    const unlockedNow = checkAchievements(nextStats);
    if (unlockedNow.length > 0) {
      const nextUnlocked = [...unlockedAchievements, ...unlockedNow];
      setUnlockedAchievements(nextUnlocked);
      const first = ACHIEVEMENTS.find((a) => a.id === unlockedNow[0]);
      if (first) setNewAchievement(first);
      await saveData(nextUnlocked, nextStats);
    } else {
      await saveData(unlockedAchievements, nextStats);
    }
    return unlockedNow;
  };

  const recordAdWatched = async () => updateStats({ ads_watched: 1 });
  const recordAppShared = async () => updateStats({ app_shares: 1 });
  const recordReferral = async () => updateStats({ successful_referrals: 1 });
  const updateCurrency = async (points = 0) => updateStats({ total_points: points });
  const updateLoginStreak = async (streak) => updateStats({ login_streak: streak });
  const clearNewAchievement = () => setNewAchievement(null);

  const getAchievementProgress = (achievementId) => {
    const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
    if (!achievement) return { current: 0, required: 0, percentage: 0 };
    const { type, count } = achievement.requirement;
    const current = Number(stats[type] || 0);
    return {
      current: Math.min(current, count),
      required: count,
      percentage: Math.min((current / count) * 100, 100),
    };
  };

  return (
    <AchievementsContext.Provider
      value={{
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
      }}
    >
      {children}
    </AchievementsContext.Provider>
  );
};

export const useAchievements = () => {
  const context = useContext(AchievementsContext);
  if (!context) throw new Error("useAchievements must be used within an AchievementsProvider");
  return context;
};

export default AchievementsContext;
