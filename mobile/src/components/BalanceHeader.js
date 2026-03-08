// Balance Header - شريط الرصيد المحسن (أفقي ومتراص)
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

const CurrencyOrb = ({ colors, icon, iconColor }) => (
  <LinearGradient colors={colors} style={styles.currencyOrb}>
    <Ionicons name={icon} size={14} color={iconColor} />
  </LinearGradient>
);

const BalanceHeader = ({ userId, onDiamondPress, onGemsPress, refreshTrigger }) => {
  const [balance, setBalance] = useState({
    diamonds: 0,
    saqr_gems: 0,
    daily_points_earned: 0,
    daily_points_remaining: 70,
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
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 150, useNativeDriver: true }),
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
    <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
      {/* الرصيد في صف واحد */}
      <View style={styles.balanceRow}>
        {/* جواهر صقر */}
        <TouchableOpacity 
          onPress={onGemsPress}
          activeOpacity={0.8}
          style={styles.balanceItem}
        >
          <LinearGradient
            colors={['rgba(244,114,182,0.15)', 'rgba(192,132,252,0.1)']}
            style={styles.balanceGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.iconWrapper}>
              <CurrencyOrb colors={['rgba(244,114,182,0.45)', 'rgba(192,132,252,0.35)']} icon="sparkles" iconColor="#fce7f3" />
            </View>
            <Text style={styles.gemsValue}>{formatNumber(balance.saqr_gems)}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* الماسات */}
        <TouchableOpacity 
          onPress={onDiamondPress}
          activeOpacity={0.8}
          style={styles.balanceItem}
        >
          <LinearGradient
            colors={['rgba(96,165,250,0.15)', 'rgba(59,130,246,0.1)']}
            style={styles.balanceGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.iconWrapper}>
              <CurrencyOrb colors={['rgba(59,130,246,0.5)', 'rgba(6,182,212,0.38)']} icon="diamond" iconColor="#dbeafe" />
            </View>
            <Text style={styles.diamondValue}>{formatNumber(balance.diamonds)}</Text>
            <View style={styles.addIcon}>
              <Ionicons name="add" size={10} color="#FFF" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  balanceItem: {
    flex: 1,
    maxWidth: 120,
  },
  balanceGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 6,
  },
  iconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencyOrb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gemsValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f472b6',
  },
  diamondValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#60a5fa',
  },
  addIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BalanceHeader;
