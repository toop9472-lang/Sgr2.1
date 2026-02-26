// Achievements System - نظام الإنجازات
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// قائمة الإنجازات
export const ACHIEVEMENTS = [
  {
    id: 'first_win',
    name: { ar: 'الفوز الأول', en: 'First Victory' },
    description: { ar: 'فز بأول لعبة', en: 'Win your first game' },
    icon: 'trophy',
    color: '#fbbf24',
    requirement: { type: 'wins', count: 1 },
    reward: { points: 50, diamonds: 5 },
  },
  {
    id: 'ai_master',
    name: { ar: 'سيد الذكاء الاصطناعي', en: 'AI Master' },
    description: { ar: 'اهزم AI Quest 10 مرات', en: 'Beat AI Quest 10 times' },
    icon: 'sparkles',
    color: '#ec4899',
    requirement: { type: 'ai_quest_wins', count: 10 },
    reward: { points: 200, diamonds: 25 },
  },
  {
    id: 'trivia_expert',
    name: { ar: 'خبير الأسئلة', en: 'Trivia Expert' },
    description: { ar: 'أجب على 100 سؤال صحيح', en: 'Answer 100 questions correctly' },
    icon: 'school',
    color: '#10b981',
    requirement: { type: 'trivia_correct', count: 100 },
    reward: { points: 150, diamonds: 15 },
  },
  {
    id: 'puzzle_solver',
    name: { ar: 'حلّال الألغاز', en: 'Puzzle Solver' },
    description: { ar: 'أكمل 50 لغز', en: 'Complete 50 puzzles' },
    icon: 'extension-puzzle',
    color: '#3b82f6',
    requirement: { type: 'puzzles_completed', count: 50 },
    reward: { points: 100, diamonds: 10 },
  },
  {
    id: 'streak_master',
    name: { ar: 'سيد السلسلة', en: 'Streak Master' },
    description: { ar: 'حقق سلسلة 10 فوز متتالي', en: 'Achieve 10 wins in a row' },
    icon: 'flame',
    color: '#f97316',
    requirement: { type: 'win_streak', count: 10 },
    reward: { points: 300, diamonds: 30 },
  },
  {
    id: 'diamond_collector',
    name: { ar: 'جامع الماس', en: 'Diamond Collector' },
    description: { ar: 'اجمع 1000 ماسة', en: 'Collect 1000 diamonds' },
    icon: 'diamond',
    color: '#60a5fa',
    requirement: { type: 'total_diamonds', count: 1000 },
    reward: { points: 500, diamonds: 100 },
  },
  {
    id: 'point_millionaire',
    name: { ar: 'مليونير النقاط', en: 'Point Millionaire' },
    description: { ar: 'اجمع 10000 نقطة', en: 'Collect 10000 points' },
    icon: 'star',
    color: '#fbbf24',
    requirement: { type: 'total_points', count: 10000 },
    reward: { points: 1000, diamonds: 50 },
  },
  {
    id: 'daily_player',
    name: { ar: 'لاعب يومي', en: 'Daily Player' },
    description: { ar: 'سجل دخول 30 يوم متتالي', en: 'Login 30 days in a row' },
    icon: 'calendar',
    color: '#8b5cf6',
    requirement: { type: 'login_streak', count: 30 },
    reward: { points: 500, diamonds: 50 },
  },
  {
    id: 'game_variety',
    name: { ar: 'منوع الألعاب', en: 'Game Variety' },
    description: { ar: 'العب 10 ألعاب مختلفة', en: 'Play 10 different games' },
    icon: 'apps',
    color: '#14b8a6',
    requirement: { type: 'unique_games', count: 10 },
    reward: { points: 200, diamonds: 20 },
  },
  {
    id: 'speed_demon',
    name: { ar: 'شيطان السرعة', en: 'Speed Demon' },
    description: { ar: 'أكمل لعبة في أقل من دقيقة', en: 'Complete a game in under 1 minute' },
    icon: 'flash',
    color: '#ef4444',
    requirement: { type: 'fast_completion', count: 1 },
    reward: { points: 100, diamonds: 10 },
  },
  {
    id: 'chess_grandmaster',
    name: { ar: 'غراند ماستر', en: 'Grandmaster' },
    description: { ar: 'فز في 20 لعبة شطرنج', en: 'Win 20 chess games' },
    icon: 'game-controller',
    color: '#7c3aed',
    requirement: { type: 'chess_wins', count: 20 },
    reward: { points: 250, diamonds: 25 },
  },
  {
    id: 'memory_master',
    name: { ar: 'سيد الذاكرة', en: 'Memory Master' },
    description: { ar: 'أكمل لعبة الذاكرة بدون أخطاء', en: 'Complete memory game without mistakes' },
    icon: 'brain',
    color: '#06b6d4',
    requirement: { type: 'perfect_memory', count: 1 },
    reward: { points: 150, diamonds: 15 },
  },
];

// Context
const AchievementsContext = createContext();

export const AchievementsProvider = ({ children }) => {
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [stats, setStats] = useState({
    wins: 0,
    ai_quest_wins: 0,
    trivia_correct: 0,
    puzzles_completed: 0,
    win_streak: 0,
    best_win_streak: 0,
    total_diamonds: 0,
    total_points: 0,
    login_streak: 0,
    unique_games: [],
    fast_completion: 0,
    chess_wins: 0,
    perfect_memory: 0,
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
        case 'wins':
          currentValue = newStats.wins;
          break;
        case 'ai_quest_wins':
          currentValue = newStats.ai_quest_wins;
          break;
        case 'trivia_correct':
          currentValue = newStats.trivia_correct;
          break;
        case 'puzzles_completed':
          currentValue = newStats.puzzles_completed;
          break;
        case 'win_streak':
          currentValue = newStats.best_win_streak;
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
        case 'unique_games':
          currentValue = newStats.unique_games?.length || 0;
          break;
        case 'fast_completion':
          currentValue = newStats.fast_completion;
          break;
        case 'chess_wins':
          currentValue = newStats.chess_wins;
          break;
        case 'perfect_memory':
          currentValue = newStats.perfect_memory;
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
      if (key === 'unique_games' && statUpdate[key]) {
        // Add to unique games if not already there
        if (!newStats.unique_games.includes(statUpdate[key])) {
          newStats.unique_games = [...newStats.unique_games, statUpdate[key]];
        }
      } else if (typeof statUpdate[key] === 'number') {
        newStats[key] = (newStats[key] || 0) + statUpdate[key];
      } else {
        newStats[key] = statUpdate[key];
      }
    });
    
    // Update best win streak
    if (newStats.win_streak > newStats.best_win_streak) {
      newStats.best_win_streak = newStats.win_streak;
    }
    
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

  // Record game win
  const recordGameWin = async (gameId, timeInSeconds = null) => {
    const update = {
      wins: 1,
      win_streak: stats.win_streak + 1,
      unique_games: gameId,
    };
    
    // Check for specific game achievements
    if (gameId === 'aiquest') {
      update.ai_quest_wins = 1;
    } else if (gameId === 'chess') {
      update.chess_wins = 1;
    } else if (gameId === 'puzzle') {
      update.puzzles_completed = 1;
    }
    
    // Check for speed achievement
    if (timeInSeconds && timeInSeconds < 60) {
      update.fast_completion = 1;
    }
    
    return updateStats(update);
  };

  // Record game loss (reset streak)
  const recordGameLoss = async (gameId) => {
    return updateStats({
      win_streak: -stats.win_streak, // Reset to 0
      unique_games: gameId,
    });
  };

  // Record trivia correct answer
  const recordTriviaCorrect = async (count = 1) => {
    return updateStats({ trivia_correct: count });
  };

  // Record perfect memory game
  const recordPerfectMemory = async () => {
    return updateStats({ perfect_memory: 1 });
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
      case 'wins': current = stats.wins; break;
      case 'ai_quest_wins': current = stats.ai_quest_wins; break;
      case 'trivia_correct': current = stats.trivia_correct; break;
      case 'puzzles_completed': current = stats.puzzles_completed; break;
      case 'win_streak': current = stats.best_win_streak; break;
      case 'total_diamonds': current = stats.total_diamonds; break;
      case 'total_points': current = stats.total_points; break;
      case 'login_streak': current = stats.login_streak; break;
      case 'unique_games': current = stats.unique_games?.length || 0; break;
      case 'fast_completion': current = stats.fast_completion; break;
      case 'chess_wins': current = stats.chess_wins; break;
      case 'perfect_memory': current = stats.perfect_memory; break;
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
    recordGameWin,
    recordGameLoss,
    recordTriviaCorrect,
    recordPerfectMemory,
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
