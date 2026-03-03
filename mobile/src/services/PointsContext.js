/**
 * Points Context - نظام النقاط والماس
 * 500 نقطة صقر = 1 ريال سعودي
 * الماس: عملة داخلية للألعاب
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const PointsContext = createContext();

// Constants
export const POINTS_PER_SAR = 500; // 500 نقطة = 1 ريال
export const DIAMONDS_PER_AD = 5;  // مشاهدة إعلان = 5 ماس
export const POINTS_PER_AD = 1;    // مشاهدة إعلان = 1 نقطة

export const PointsProvider = ({ children, userId }) => {
  const [points, setPoints] = useState(0);
  const [diamonds, setDiamonds] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [dailyPoints, setDailyPoints] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(100);
  const [loading, setLoading] = useState(true);

  // Load balance from server/storage
  const loadBalance = useCallback(async () => {
    try {
      if (userId) {
        // Load from server
        const response = await api.get(`/economy/balance?user_id=${userId}`);
        if (response.data) {
          setPoints(response.data.saqr_points || 0);
          setDiamonds(response.data.diamonds || 0);
          setTotalEarned(response.data.total_earned || 0);
          setDailyPoints(response.data.daily_points_remaining || 0);
          setDailyLimit(response.data.daily_limit || 100);
        }
      } else {
        // Load from local storage for guests
        const storedPoints = await AsyncStorage.getItem('guest_points');
        const storedDiamonds = await AsyncStorage.getItem('guest_diamonds');
        if (storedPoints) setPoints(parseInt(storedPoints, 10));
        if (storedDiamonds) setDiamonds(parseInt(storedDiamonds, 10));
      }
    } catch (error) {
      console.error('Error loading balance:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  /**
   * Add points (from ad watching)
   * @param {number} amount - Amount of points to add
   * @param {boolean} isAd - If from ad, also add diamonds
   */
  const addPoints = useCallback(async (amount, isAd = false) => {
    try {
      const newPoints = points + amount;
      setPoints(newPoints);
      setTotalEarned(prev => prev + amount);

      // If from ad, also add diamonds
      if (isAd) {
        const newDiamonds = diamonds + DIAMONDS_PER_AD;
        setDiamonds(newDiamonds);
        
        if (!userId) {
          await AsyncStorage.setItem('guest_diamonds', newDiamonds.toString());
        }
      }

      // Save to storage/server
      if (userId) {
        await api.post('/economy/add-points', {
          user_id: userId,
          amount: amount,
          source: isAd ? 'rewarded_ad' : 'other'
        });
      } else {
        await AsyncStorage.setItem('guest_points', newPoints.toString());
      }

      return true;
    } catch (error) {
      console.error('Error adding points:', error);
      return false;
    }
  }, [points, diamonds, userId]);

  /**
   * Add diamonds
   * @param {number} amount - Amount of diamonds to add
   */
  const addDiamonds = useCallback(async (amount) => {
    try {
      const newDiamonds = diamonds + amount;
      setDiamonds(newDiamonds);

      if (userId) {
        await api.post('/economy/add-diamonds', {
          user_id: userId,
          amount: amount
        });
      } else {
        await AsyncStorage.setItem('guest_diamonds', newDiamonds.toString());
      }

      return true;
    } catch (error) {
      console.error('Error adding diamonds:', error);
      return false;
    }
  }, [diamonds, userId]);

  /**
   * Use diamonds (for lifelines, games, etc.)
   * @param {number} amount - Amount of diamonds to use
   */
  const useDiamonds = useCallback(async (amount) => {
    if (diamonds < amount) {
      return { success: false, error: 'لا يوجد ماس كافي' };
    }

    try {
      const newDiamonds = diamonds - amount;
      setDiamonds(newDiamonds);

      if (userId) {
        await api.post('/economy/use-diamonds', {
          user_id: userId,
          amount: amount
        });
      } else {
        await AsyncStorage.setItem('guest_diamonds', newDiamonds.toString());
      }

      return { success: true };
    } catch (error) {
      console.error('Error using diamonds:', error);
      return { success: false, error: error.message };
    }
  }, [diamonds, userId]);

  /**
   * Calculate SAR value of points
   */
  const getPointsValueInSAR = useCallback(() => {
    return (points / POINTS_PER_SAR).toFixed(2);
  }, [points]);

  /**
   * Check if user can withdraw
   */
  const canWithdraw = useCallback(() => {
    return points >= POINTS_PER_SAR;
  }, [points]);

  /**
   * Get remaining points for next withdraw
   */
  const pointsToNextWithdraw = useCallback(() => {
    return Math.max(POINTS_PER_SAR - points, 0);
  }, [points]);

  const value = {
    // State
    points,
    diamonds,
    totalEarned,
    dailyPoints,
    dailyLimit,
    loading,
    
    // Actions
    addPoints,
    addDiamonds,
    useDiamonds,
    loadBalance,
    
    // Helpers
    getPointsValueInSAR,
    canWithdraw,
    pointsToNextWithdraw,
    
    // Constants
    POINTS_PER_SAR,
    DIAMONDS_PER_AD,
    POINTS_PER_AD,
  };

  return (
    <PointsContext.Provider value={value}>
      {children}
    </PointsContext.Provider>
  );
};

export const usePoints = () => {
  const context = useContext(PointsContext);
  if (!context) {
    throw new Error('usePoints must be used within a PointsProvider');
  }
  return context;
};

export default PointsContext;
