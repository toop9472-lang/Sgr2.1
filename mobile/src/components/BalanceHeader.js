// Balance Header - شريط عرض الرصيد المحسن (جواهر صقر + الماس)
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

const BalanceHeader = ({ userId, onDiamondPress, onGemsPress, refreshTrigger }) => {
  const [balance, setBalance] = useState({
    saqr_points: 0,
    diamonds: 0,
    saqr_gems: 0,
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
        
        // تاثير النبض عند التحديث
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 150, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
      }
    } catch (error) {
      console.log('Balance fetch error:', error);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <View style={styles.container}>
      {/* جواهر صقر - للاستبدال بالمال */}
      <TouchableOpacity 
        onPress={onGemsPress}
        activeOpacity={0.8}
        style={styles.balanceItem}
      >
        <Animated.View style={[styles.balanceCard, { transform: [{ scale: pulseAnim }] }]}>
          <LinearGradient
            colors={['rgba(244,114,182,0.2)', 'rgba(192,132,252,0.1)']}
            style={styles.balanceGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <LinearGradient
              colors={['#f472b6', '#c084fc']}
              style={styles.iconCircle}
            >
              <Ionicons name="sparkles" size={16} color="#FFF" />
            </LinearGradient>
            <View style={styles.balanceInfo}>
              <Text style={styles.gemsLabel}>جواهر صقر</Text>
              <Text style={styles.gemsValue}>{formatNumber(balance.saqr_gems)}</Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      {/* الماسات - للاستهلاك داخل التطبيق */}
      <TouchableOpacity 
        onPress={onDiamondPress}
        activeOpacity={0.8}
        style={styles.balanceItem}
      >
        <Animated.View style={[styles.balanceCard, { transform: [{ scale: pulseAnim }] }]}>
          <LinearGradient
            colors={['rgba(96,165,250,0.2)', 'rgba(59,130,246,0.1)']}
            style={styles.balanceGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <LinearGradient
              colors={['#60a5fa', '#3b82f6']}
              style={styles.iconCircle}
            >
              <Ionicons name="diamond" size={16} color="#FFF" />
            </LinearGradient>
            <View style={styles.balanceInfo}>
              <Text style={styles.diamondLabel}>الماس</Text>
              <Text style={styles.diamondValue}>{formatNumber(balance.diamonds)}</Text>
            </View>
            {/* زر الاضافة */}
            <View style={styles.addButton}>
              <Ionicons name="add" size={12} color="#FFF" />
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      {/* نقاط صقر - مختصرة */}
      <Animated.View style={[styles.pointsCard, { transform: [{ scale: pulseAnim }] }]}>
        <LinearGradient
          colors={['rgba(251,191,36,0.2)', 'rgba(245,158,11,0.1)']}
          style={styles.pointsGradient}
        >
          <Ionicons name="star" size={14} color="#fbbf24" />
          <Text style={styles.pointsValue}>{formatNumber(balance.saqr_points)}</Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  balanceItem: {
    flex: 1,
  },
  balanceCard: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  balanceGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceInfo: {
    flex: 1,
    marginLeft: 8,
  },
  gemsLabel: {
    fontSize: 9,
    color: 'rgba(244,114,182,0.9)',
    fontWeight: '500',
  },
  gemsValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#f472b6',
  },
  diamondLabel: {
    fontSize: 9,
    color: 'rgba(96,165,250,0.9)',
    fontWeight: '500',
  },
  diamondValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#60a5fa',
  },
  addButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointsCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  pointsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.15)',
  },
  pointsValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fbbf24',
  },
});

export default BalanceHeader;
