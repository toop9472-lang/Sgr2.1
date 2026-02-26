// صندوق الكنز - Treasure Chest Component
// مكافآت خاصة من مشاهدة الإعلانات

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const { width } = Dimensions.get('window');

// أنواع صناديق الكنز
const CHEST_TYPES = {
  bronze: {
    id: 'bronze',
    name: 'صندوق برونزي',
    adsRequired: 5,
    minReward: 5,
    maxReward: 15,
    color: '#cd7f32',
    gradient: ['#cd7f32', '#8b4513'],
    icon: 'cube',
  },
  silver: {
    id: 'silver',
    name: 'صندوق فضي',
    adsRequired: 15,
    minReward: 20,
    maxReward: 50,
    color: '#c0c0c0',
    gradient: ['#c0c0c0', '#808080'],
    icon: 'diamond-outline',
  },
  gold: {
    id: 'gold',
    name: 'صندوق ذهبي',
    adsRequired: 30,
    minReward: 60,
    maxReward: 150,
    color: '#ffd700',
    gradient: ['#ffd700', '#daa520'],
    icon: 'diamond',
  },
  platinum: {
    id: 'platinum',
    name: 'صندوق بلاتيني',
    adsRequired: 50,
    minReward: 150,
    maxReward: 300,
    color: '#e5e4e2',
    gradient: ['#e5e4e2', '#b8b8b8'],
    icon: 'trophy',
  },
  legendary: {
    id: 'legendary',
    name: 'صندوق أسطوري',
    adsRequired: 100,
    minReward: 350,
    maxReward: 750,
    color: '#9933ff',
    gradient: ['#9933ff', '#6600cc'],
    icon: 'flame',
  },
};

// مكون صندوق الكنز
const TreasureChestCard = ({ chest, progress, onOpen, canOpen }) => {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (canOpen) {
      // Shake animation when ready
      Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 5, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -5, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 5, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
          Animated.delay(2000),
        ])
      ).start();

      // Glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [canOpen]);

  const progressPercent = (progress / chest.adsRequired) * 100;

  return (
    <Animated.View style={[
      styles.chestCard,
      canOpen && styles.chestCardReady,
      { transform: [{ translateX: shakeAnim }] }
    ]}>
      <TouchableOpacity
        style={styles.chestTouchable}
        onPress={canOpen ? onOpen : null}
        activeOpacity={canOpen ? 0.7 : 1}
      >
        <LinearGradient
          colors={canOpen ? chest.gradient : ['#2a2a3e', '#1a1a2e']}
          style={styles.chestGradient}
        >
          {/* Glow effect when ready */}
          {canOpen && (
            <Animated.View style={[styles.glowEffect, { 
              opacity: glowAnim,
              backgroundColor: chest.color + '30',
            }]} />
          )}

          {/* Chest Icon */}
          <View style={[styles.chestIconContainer, { backgroundColor: chest.color + '20' }]}>
            <Ionicons 
              name={canOpen ? 'gift' : chest.icon} 
              size={32} 
              color={canOpen ? chest.color : '#666'} 
            />
            {canOpen && (
              <View style={styles.readyBadge}>
                <Ionicons name="checkmark" size={10} color="#FFF" />
              </View>
            )}
          </View>

          {/* Chest Info */}
          <Text style={[styles.chestName, canOpen && { color: chest.color }]}>
            {chest.name}
          </Text>
          
          {/* Reward Range */}
          <View style={styles.rewardRange}>
            <Ionicons name="diamond" size={12} color={canOpen ? '#60a5fa' : '#666'} />
            <Text style={[styles.rewardText, canOpen && styles.rewardTextActive]}>
              {chest.minReward} - {chest.maxReward}
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min(100, progressPercent)}%`,
                    backgroundColor: canOpen ? '#22c55e' : chest.color,
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {progress}/{chest.adsRequired}
            </Text>
          </View>

          {/* Open Button */}
          {canOpen && (
            <View style={[styles.openBadge, { backgroundColor: chest.color }]}>
              <Text style={styles.openText}>افتح!</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// مكون فتح الصندوق
const ChestOpeningModal = ({ visible, chest, onClose, reward }) => {
  const chestAnim = useRef(new Animated.Value(1)).current;
  const rewardAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const [showReward, setShowReward] = useState(false);

  useEffect(() => {
    if (visible && chest && reward) {
      // Vibrate on open
      Vibration.vibrate([0, 100, 50, 100, 50, 100]);

      // Chest opening animation
      Animated.sequence([
        Animated.timing(chestAnim, { toValue: 1.2, duration: 300, useNativeDriver: true }),
        Animated.timing(chestAnim, { toValue: 0.8, duration: 200, useNativeDriver: true }),
        Animated.timing(chestAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        setShowReward(true);
        
        // Reward pop animation
        Animated.spring(rewardAnim, {
          toValue: 1,
          tension: 80,
          friction: 5,
          useNativeDriver: true,
        }).start();

        // Sparkle animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(sparkleAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(sparkleAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
          ])
        ).start();
      });
    } else {
      setShowReward(false);
      chestAnim.setValue(1);
      rewardAnim.setValue(0);
    }
  }, [visible, chest, reward]);

  if (!visible || !chest) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <LinearGradient
            colors={chest.gradient.map(c => c + '40')}
            style={modalStyles.gradient}
          >
            {/* Particles */}
            {showReward && (
              <View style={modalStyles.particles}>
                {[...Array(30)].map((_, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      modalStyles.particle,
                      {
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        backgroundColor: ['#fbbf24', '#60a5fa', '#ec4899'][i % 3],
                        opacity: sparkleAnim,
                        transform: [{ scale: sparkleAnim }],
                      },
                    ]}
                  />
                ))}
              </View>
            )}

            {/* Chest */}
            <Animated.View style={[modalStyles.chestContainer, { transform: [{ scale: chestAnim }] }]}>
              <View style={[modalStyles.chestIcon, { backgroundColor: chest.color + '30' }]}>
                <Ionicons name={showReward ? 'gift-outline' : 'gift'} size={80} color={chest.color} />
              </View>
            </Animated.View>

            {/* Reward */}
            {showReward && (
              <Animated.View style={[modalStyles.rewardContainer, { 
                transform: [{ scale: rewardAnim }],
                opacity: rewardAnim,
              }]}>
                <Text style={modalStyles.rewardTitle}>مبروك!</Text>
                <View style={modalStyles.diamondReward}>
                  <Ionicons name="diamond" size={36} color="#60a5fa" />
                  <Text style={modalStyles.rewardAmount}>+{reward}</Text>
                </View>
                <Text style={modalStyles.rewardLabel}>ألماسة من {chest.name}</Text>
              </Animated.View>
            )}

            {/* Close Button */}
            {showReward && (
              <TouchableOpacity style={modalStyles.closeButton} onPress={onClose}>
                <LinearGradient
                  colors={['#22c55e', '#16a34a']}
                  style={modalStyles.closeGradient}
                >
                  <Text style={modalStyles.closeText}>رائع!</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.85,
    maxWidth: 350,
    borderRadius: 24,
    overflow: 'hidden',
  },
  gradient: {
    padding: 40,
    alignItems: 'center',
    minHeight: 400,
    position: 'relative',
  },
  particles: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chestContainer: {
    marginBottom: 30,
  },
  chestIcon: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  rewardContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  rewardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  diamondReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rewardAmount: {
    fontSize: 48,
    fontWeight: '800',
    color: '#60a5fa',
  },
  rewardLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
  },
  closeButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  closeGradient: {
    padding: 16,
    alignItems: 'center',
  },
  closeText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

// المكون الرئيسي
const TreasureChestsSection = ({ userId, adsWatched, onBalanceUpdate }) => {
  const [progress, setProgress] = useState({});
  const [selectedChest, setSelectedChest] = useState(null);
  const [showOpening, setShowOpening] = useState(false);
  const [reward, setReward] = useState(null);

  useEffect(() => {
    loadProgress();
  }, []);

  useEffect(() => {
    if (adsWatched > 0) {
      updateProgress(adsWatched);
    }
  }, [adsWatched]);

  const loadProgress = async () => {
    try {
      const saved = await AsyncStorage.getItem(`chest_progress_${userId}`);
      if (saved) {
        setProgress(JSON.parse(saved));
      } else {
        // Initialize progress
        const initial = {};
        Object.keys(CHEST_TYPES).forEach(key => {
          initial[key] = 0;
        });
        setProgress(initial);
      }
    } catch (e) {
      console.log('Error loading chest progress:', e);
    }
  };

  const updateProgress = async (ads) => {
    const newProgress = { ...progress };
    Object.keys(CHEST_TYPES).forEach(key => {
      newProgress[key] = (newProgress[key] || 0) + 1;
    });
    setProgress(newProgress);
    await saveProgress(newProgress);
  };

  const saveProgress = async (prog) => {
    try {
      await AsyncStorage.setItem(`chest_progress_${userId}`, JSON.stringify(prog));
    } catch (e) {
      console.log('Error saving chest progress:', e);
    }
  };

  const openChest = async (chestType) => {
    const chest = CHEST_TYPES[chestType];
    if (!chest || (progress[chestType] || 0) < chest.adsRequired) return;

    setSelectedChest(chest);
    
    // Calculate reward
    const rewardAmount = Math.floor(
      Math.random() * (chest.maxReward - chest.minReward + 1)
    ) + chest.minReward;
    
    setReward(rewardAmount);
    setShowOpening(true);

    // Reset progress for this chest
    const newProgress = { ...progress, [chestType]: 0 };
    setProgress(newProgress);
    await saveProgress(newProgress);

    // Add diamonds to user
    try {
      const response = await api.addDiamonds(userId, rewardAmount, `treasure_chest_${chestType}`);
      if (response.ok && onBalanceUpdate) {
        onBalanceUpdate();
      }
    } catch (e) {
      console.log('Error adding chest reward:', e);
    }
  };

  const closeOpening = () => {
    setShowOpening(false);
    setSelectedChest(null);
    setReward(null);
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="gift" size={20} color="#fbbf24" />
        <Text style={styles.sectionTitle}>صناديق الكنز</Text>
      </View>
      <Text style={styles.sectionDesc}>
        شاهد الإعلانات واجمع صناديق الكنز لمكافآت كبيرة!
      </Text>

      <View style={styles.chestsGrid}>
        {Object.values(CHEST_TYPES).map(chest => (
          <TreasureChestCard
            key={chest.id}
            chest={chest}
            progress={progress[chest.id] || 0}
            canOpen={(progress[chest.id] || 0) >= chest.adsRequired}
            onOpen={() => openChest(chest.id)}
          />
        ))}
      </View>

      <ChestOpeningModal
        visible={showOpening}
        chest={selectedChest}
        reward={reward}
        onClose={closeOpening}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  sectionDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 14,
    paddingHorizontal: 16,
    textAlign: 'right',
  },
  chestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  chestCard: {
    width: (width - 48) / 3,
    borderRadius: 14,
    overflow: 'hidden',
  },
  chestCardReady: {
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  chestTouchable: {
    flex: 1,
  },
  chestGradient: {
    padding: 10,
    alignItems: 'center',
    minHeight: 130,
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  chestIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    position: 'relative',
  },
  readyBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chestName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#888',
    marginBottom: 4,
    textAlign: 'center',
  },
  rewardRange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 8,
  },
  rewardText: {
    fontSize: 9,
    color: '#666',
  },
  rewardTextActive: {
    color: '#60a5fa',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.4)',
  },
  openBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  openText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFF',
  },
});

export default TreasureChestsSection;
