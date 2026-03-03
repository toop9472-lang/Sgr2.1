// Achievements Screen - شاشة الإنجازات
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAchievements, ACHIEVEMENTS } from '../services/AchievementsContext';

const { width } = Dimensions.get('window');

// Achievement Card Component
const AchievementCard = ({ achievement, isUnlocked, progress, language = 'ar', onPress }) => {
  const name = achievement.name[language] || achievement.name.ar;
  const description = achievement.description[language] || achievement.description.ar;
  
  return (
    <TouchableOpacity 
      style={[styles.achievementCard, isUnlocked && styles.achievementCardUnlocked]}
      onPress={() => onPress(achievement)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={isUnlocked ? [achievement.color, achievement.color + '99'] : ['#1e293b', '#334155']}
        style={styles.achievementIcon}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons 
          name={achievement.icon} 
          size={28} 
          color={isUnlocked ? '#FFF' : '#666'} 
        />
        {isUnlocked && (
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark" size={12} color="#FFF" />
          </View>
        )}
      </LinearGradient>
      
      <View style={styles.achievementInfo}>
        <Text style={[styles.achievementName, !isUnlocked && styles.lockedText]}>
          {name}
        </Text>
        <Text style={styles.achievementDesc}>{description}</Text>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${progress.percentage}%`,
                  backgroundColor: isUnlocked ? '#10b981' : achievement.color,
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {progress.current}/{progress.required}
          </Text>
        </View>
      </View>
      
      {/* Reward Badge */}
      <View style={styles.rewardBadge}>
        <View style={styles.rewardItem}>
          <Ionicons name="star" size={14} color="#fbbf24" />
          <Text style={styles.rewardText}>+{achievement.reward.points}</Text>
        </View>
        <View style={styles.rewardItem}>
          <Ionicons name="diamond" size={14} color="#60a5fa" />
          <Text style={styles.rewardText}>+{achievement.reward.diamonds}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Achievement Detail Modal
const AchievementDetailModal = ({ achievement, isUnlocked, progress, language, onClose }) => {
  if (!achievement) return null;
  
  const name = achievement.name[language] || achievement.name.ar;
  const description = achievement.description[language] || achievement.description.ar;
  
  return (
    <Modal transparent visible={!!achievement} animationType="fade">
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.modalContent}>
          <LinearGradient
            colors={isUnlocked ? [achievement.color, achievement.color + '77'] : ['#1e293b', '#0f172a']}
            style={styles.modalHeader}
          >
            <View style={styles.modalIcon}>
              <Ionicons name={achievement.icon} size={50} color="#FFF" />
            </View>
            {isUnlocked && (
              <View style={styles.unlockedBanner}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.unlockedText}>
                  {language === 'ar' ? 'تم فتحه!' : 'Unlocked!'}
                </Text>
              </View>
            )}
          </LinearGradient>
          
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>{name}</Text>
            <Text style={styles.modalDesc}>{description}</Text>
            
            {/* Progress */}
            <View style={styles.modalProgress}>
              <Text style={styles.modalProgressLabel}>
                {language === 'ar' ? 'التقدم' : 'Progress'}
              </Text>
              <View style={styles.modalProgressBar}>
                <View 
                  style={[
                    styles.modalProgressFill,
                    { 
                      width: `${progress.percentage}%`,
                      backgroundColor: achievement.color,
                    }
                  ]} 
                />
              </View>
              <Text style={styles.modalProgressText}>
                {progress.current} / {progress.required} ({Math.round(progress.percentage)}%)
              </Text>
            </View>
            
            {/* Reward */}
            <View style={styles.modalReward}>
              <Text style={styles.modalRewardLabel}>
                {language === 'ar' ? 'المكافأة' : 'Reward'}
              </Text>
              <View style={styles.modalRewardItems}>
                <View style={styles.modalRewardItem}>
                  <Ionicons name="star" size={24} color="#fbbf24" />
                  <Text style={styles.modalRewardValue}>+{achievement.reward.points}</Text>
                  <Text style={styles.modalRewardType}>
                    {language === 'ar' ? 'نقطة' : 'Points'}
                  </Text>
                </View>
                <View style={styles.modalRewardItem}>
                  <Ionicons name="diamond" size={24} color="#60a5fa" />
                  <Text style={styles.modalRewardValue}>+{achievement.reward.diamonds}</Text>
                  <Text style={styles.modalRewardType}>
                    {language === 'ar' ? 'ماسة' : 'Diamonds'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>
              {language === 'ar' ? 'إغلاق' : 'Close'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// New Achievement Notification
export const AchievementNotification = ({ achievement, language = 'ar', onClose }) => {
  if (!achievement) return null;
  
  const name = achievement.name[language] || achievement.name.ar;
  
  return (
    <Modal transparent visible={!!achievement} animationType="slide">
      <View style={styles.notificationContainer}>
        <LinearGradient
          colors={[achievement.color, achievement.color + '99']}
          style={styles.notificationCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.notificationIcon}>
            <Ionicons name={achievement.icon} size={40} color="#FFF" />
          </View>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>
              {language === 'ar' ? 'إنجاز جديد!' : 'Achievement Unlocked!'}
            </Text>
            <Text style={styles.notificationName}>{name}</Text>
            <View style={styles.notificationReward}>
              <Ionicons name="star" size={16} color="#fbbf24" />
              <Text style={styles.notificationRewardText}>+{achievement.reward.points}</Text>
              <Ionicons name="diamond" size={16} color="#60a5fa" style={{ marginLeft: 10 }} />
              <Text style={styles.notificationRewardText}>+{achievement.reward.diamonds}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationClose} onPress={onClose}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
};

// Main Achievements Screen
const AchievementsScreen = ({ onClose, language = 'ar' }) => {
  const { 
    achievements, 
    unlockedAchievements, 
    stats, 
    getAchievementProgress 
  } = useAchievements();
  
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unlocked, locked
  
  const filteredAchievements = achievements.filter(a => {
    const isUnlocked = unlockedAchievements.includes(a.id);
    if (filter === 'unlocked') return isUnlocked;
    if (filter === 'locked') return !isUnlocked;
    return true;
  });
  
  const unlockedCount = unlockedAchievements.length;
  const totalCount = achievements.length;
  const completionPercentage = Math.round((unlockedCount / totalCount) * 100);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a0a0f', '#111118', '#0a0a0f']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {language === 'ar' ? 'الإنجازات' : 'Achievements'}
          </Text>
          <View style={{ width: 44 }} />
        </View>
        
        {/* Stats Summary */}
        <View style={styles.statsSummary}>
          <View style={styles.summaryCircle}>
            <Text style={styles.summaryPercentage}>{completionPercentage}%</Text>
            <Text style={styles.summaryLabel}>
              {unlockedCount}/{totalCount}
            </Text>
          </View>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <Ionicons name="play-circle" size={20} color="#10b981" />
              <Text style={styles.summaryStatValue}>{stats.ads_watched || 0}</Text>
              <Text style={styles.summaryStatLabel}>
                {language === 'ar' ? 'إعلان' : 'Ads'}
              </Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Ionicons name="share-social" size={20} color="#3b82f6" />
              <Text style={styles.summaryStatValue}>{stats.app_shares || 0}</Text>
              <Text style={styles.summaryStatLabel}>
                {language === 'ar' ? 'مشاركة' : 'Shares'}
              </Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Ionicons name="person-add" size={20} color="#8b5cf6" />
              <Text style={styles.summaryStatValue}>{stats.successful_referrals || 0}</Text>
              <Text style={styles.summaryStatLabel}>
                {language === 'ar' ? 'إحالة' : 'Referrals'}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {['all', 'unlocked', 'locked'].map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
                {f === 'all' ? (language === 'ar' ? 'الكل' : 'All') :
                 f === 'unlocked' ? (language === 'ar' ? 'مفتوح' : 'Unlocked') :
                 (language === 'ar' ? 'مغلق' : 'Locked')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Achievements List */}
        <ScrollView 
          style={styles.achievementsList}
          showsVerticalScrollIndicator={false}
        >
          {filteredAchievements.map(achievement => {
            const isUnlocked = unlockedAchievements.includes(achievement.id);
            const progress = getAchievementProgress(achievement.id);
            
            return (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                isUnlocked={isUnlocked}
                progress={progress}
                language={language}
                onPress={setSelectedAchievement}
              />
            );
          })}
          <View style={{ height: 20 }} />
        </ScrollView>
        
        {/* Detail Modal */}
        <AchievementDetailModal
          achievement={selectedAchievement}
          isUnlocked={selectedAchievement ? unlockedAchievements.includes(selectedAchievement.id) : false}
          progress={selectedAchievement ? getAchievementProgress(selectedAchievement.id) : { current: 0, required: 0, percentage: 0 }}
          language={language}
          onClose={() => setSelectedAchievement(null)}
        />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  
  // Stats Summary
  statsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  summaryCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59,130,246,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#3b82f6',
  },
  summaryPercentage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#888',
  },
  summaryStats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 16,
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 4,
  },
  summaryStatLabel: {
    fontSize: 11,
    color: '#888',
  },
  
  // Filter Tabs
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#3b82f6',
  },
  filterTabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#FFF',
  },
  
  // Achievement Card
  achievementsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  achievementCardUnlocked: {
    borderColor: 'rgba(16,185,129,0.3)',
    backgroundColor: 'rgba(16,185,129,0.05)',
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementInfo: {
    flex: 1,
    marginLeft: 12,
  },
  achievementName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  lockedText: {
    color: '#888',
  },
  achievementDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
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
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: '#888',
    marginLeft: 8,
  },
  rewardBadge: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardText: {
    fontSize: 12,
    color: '#888',
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1a1a24',
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: 'rgba(16,185,129,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  unlockedText: {
    color: '#10b981',
    fontWeight: '600',
  },
  modalBody: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  modalProgress: {
    marginTop: 20,
  },
  modalProgressLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  modalProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  modalProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  modalProgressText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  modalReward: {
    marginTop: 20,
  },
  modalRewardLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  modalRewardItems: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
  },
  modalRewardItem: {
    alignItems: 'center',
  },
  modalRewardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 4,
  },
  modalRewardType: {
    fontSize: 12,
    color: '#888',
  },
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Notification
  notificationContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  notificationIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
  },
  notificationTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  notificationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  notificationReward: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  notificationRewardText: {
    fontSize: 14,
    color: '#FFF',
    marginLeft: 4,
  },
  notificationClose: {
    padding: 8,
  },
});

export default AchievementsScreen;
