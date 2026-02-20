// Balance Header - شريط عرض الرصيد (النقاط والألماسات)
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const BalanceHeader = ({ userId, onDiamondPress, refreshTrigger }) => {
  const [balance, setBalance] = useState({
    saqr_points: 0,
    diamonds: 0,
    daily_points_earned: 0,
    daily_points_remaining: 150,
  });
  
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (userId) {
      fetchBalance();
    }
  }, [userId, refreshTrigger]);

  const fetchBalance = async () => {
    try {
      const response = await api.getBalance(userId);
      if (response.ok) {
        const data = await response.json();
        setBalance(data);
        
        // تأثير النبض عند التحديث
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 150, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
      }
    } catch (error) {
      console.log('Balance fetch error:', error);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <View style={styles.container}>
      {/* نقاط صقر */}
      <Animated.View style={[styles.balanceItem, { transform: [{ scale: pulseAnim }] }]}>
        <LinearGradient
          colors={['rgba(251,191,36,0.15)', 'rgba(251,191,36,0.05)']}
          style={styles.balanceGradient}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="star" size={18} color="#fbbf24" />
          </View>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>نقاط صقر</Text>
            <Text style={styles.balanceValue}>{formatNumber(balance.saqr_points)}</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* الألماسات مع زر الإضافة */}
      <TouchableOpacity 
        onPress={onDiamondPress}
        activeOpacity={0.8}
        style={styles.diamondTouch}
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <LinearGradient
            colors={['rgba(96,165,250,0.15)', 'rgba(96,165,250,0.05)']}
            style={styles.balanceGradient}
          >
            <View style={[styles.iconContainer, styles.diamondIcon]}>
              <Ionicons name="diamond" size={18} color="#60a5fa" />
            </View>
            <View style={styles.balanceInfo}>
              <Text style={[styles.balanceLabel, styles.diamondLabel]}>ألماسات</Text>
              <Text style={[styles.balanceValue, styles.diamondValue]}>
                {formatNumber(balance.diamonds)}
              </Text>
            </View>
            {/* زر الإضافة */}
            <View style={styles.addButton}>
              <Ionicons name="add" size={14} color="#FFF" />
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      {/* مؤشر النقاط اليومية */}
      <View style={styles.dailyIndicator}>
        <View style={styles.dailyProgress}>
          <View 
            style={[
              styles.dailyProgressFill, 
              { width: `${(balance.daily_points_earned / 150) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.dailyText}>
          {balance.daily_points_remaining} متبقي
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  balanceItem: {
    flex: 1,
  },
  diamondTouch: {
    flex: 1,
  },
  balanceGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(251,191,36,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  diamondIcon: {
    backgroundColor: 'rgba(96,165,250,0.2)',
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 10,
    color: 'rgba(251,191,36,0.8)',
    marginBottom: 2,
  },
  diamondLabel: {
    color: 'rgba(96,165,250,0.8)',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fbbf24',
  },
  diamondValue: {
    color: '#60a5fa',
  },
  addButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  dailyIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dailyProgress: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  dailyProgressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 2,
  },
  dailyText: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.4)',
  },
});

export default BalanceHeader;
