// Home Screen - Professional Gaming Hub Dashboard
// Focus on Games, Entertainment & Challenges - NOT Ads
import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import colors from '../styles/colors';

const { width } = Dimensions.get('window');

// Featured Game Card
const FeaturedGameCard = memo(({ icon, name, description, colors: gradColors, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.featuredCard}>
    <LinearGradient colors={gradColors} style={styles.featuredGradient}>
      <View style={styles.featuredIcon}>
        <Ionicons name={icon} size={32} color="#FFF" />
      </View>
      <View style={styles.featuredInfo}>
        <Text style={styles.featuredName}>{name}</Text>
        <Text style={styles.featuredDesc}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.7)" />
    </LinearGradient>
  </TouchableOpacity>
));

// Quick Game Button
const QuickGameBtn = memo(({ icon, name, color, onPress }) => (
  <TouchableOpacity style={styles.quickGameBtn} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.quickGameIcon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.quickGameName}>{name}</Text>
  </TouchableOpacity>
));

// Stats Card
const StatsCard = memo(({ icon, value, label, color }) => (
  <View style={styles.statCard}>
    <Ionicons name={icon} size={20} color={color} />
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
));

const HomeScreen = ({ user, onNavigateToAds, onNavigateToGames, settings, onRefresh }) => {
  const [refreshing, setRefreshing] = useState(false);

  // User data
  const userName = useMemo(() => user?.name || 'لاعب', [user?.name]);
  const userPoints = useMemo(() => user?.saqr_points || user?.points || 0, [user?.saqr_points, user?.points]);
  const userDiamonds = useMemo(() => user?.diamonds || 0, [user?.diamonds]);
  const gamesPlayed = useMemo(() => user?.games_played || 0, [user?.games_played]);
  const gamesWon = useMemo(() => user?.games_won || 0, [user?.games_won]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (onRefresh) await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);

  // Navigation handlers
  const handleNavigateToGames = useCallback(() => {
    if (onNavigateToGames) onNavigateToGames();
  }, [onNavigateToGames]);

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#3b82f6"
          colors={['#3b82f6']}
        />
      }
    >
      <View style={styles.content}>
        {/* Header - بدون شعار */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>أهلاً {userName}</Text>
              <Text style={styles.subText}>جاهز للتحدي؟</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.currencyBadge}>
              <Ionicons name="star" size={14} color="#fbbf24" />
              <Text style={styles.currencyText}>{userPoints}</Text>
            </View>
            <View style={[styles.currencyBadge, styles.diamondBadge]}>
              <Ionicons name="diamond" size={14} color="#60a5fa" />
              <Text style={styles.currencyText}>{userDiamonds}</Text>
            </View>
          </View>
        </View>

        {/* Featured Section - Play Now */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>العب الآن</Text>
            <TouchableOpacity onPress={handleNavigateToGames}>
              <Text style={styles.seeAllText}>عرض الكل</Text>
            </TouchableOpacity>
          </View>

          {/* Main Featured Game */}
          <FeaturedGameCard
            icon="game-controller"
            name="ألعاب متعددة"
            description="شطرنج، X-O، ألغاز، أسئلة ثقافية والمزيد!"
            colors={['#3b82f6', '#8b5cf6']}
            onPress={handleNavigateToGames}
          />
        </View>

        {/* Quick Games Grid */}
        <View style={styles.quickGamesGrid}>
          <QuickGameBtn 
            icon="grid-outline" 
            name="شطرنج" 
            color="#10b981"
            onPress={handleNavigateToGames}
          />
          <QuickGameBtn 
            icon="close-outline" 
            name="X-O" 
            color="#f59e0b"
            onPress={handleNavigateToGames}
          />
          <QuickGameBtn 
            icon="help-circle-outline" 
            name="أسئلة" 
            color="#ec4899"
            onPress={handleNavigateToGames}
          />
          <QuickGameBtn 
            icon="extension-puzzle-outline" 
            name="ألغاز" 
            color="#8b5cf6"
            onPress={handleNavigateToGames}
          />
        </View>

        {/* Player Stats */}
        <View style={styles.statsSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="stats-chart" size={18} color="#60a5fa" />
            <Text style={styles.sectionTitle}>إحصائياتك</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="game-controller-outline" size={22} color="#3b82f6" />
              <Text style={styles.statValue}>{gamesPlayed}</Text>
              <Text style={styles.statLabel}>مباراة</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trophy-outline" size={22} color="#fbbf24" />
              <Text style={styles.statValue}>{gamesWon}</Text>
              <Text style={styles.statLabel}>انتصار</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="star-outline" size={22} color="#10b981" />
              <Text style={styles.statValue}>{userPoints}</Text>
              <Text style={styles.statLabel}>نقاط صقر</Text>
            </View>
          </View>
        </View>

        {/* Daily Challenge Banner */}
        <TouchableOpacity activeOpacity={0.9} style={styles.challengeBanner}>
          <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.challengeGradient}>
            <View style={styles.challengeLeft}>
              <View style={styles.challengeIconBg}>
                <Ionicons name="trophy" size={24} color="#FFF" />
              </View>
              <View>
                <Text style={styles.challengeTitle}>التحدي اليومي</Text>
                <Text style={styles.challengeDesc}>اربح نقاط إضافية كل يوم!</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Multiplayer Section */}
        <View style={styles.multiplayerSection}>
          <LinearGradient colors={['#1e1e28', '#252532']} style={styles.multiplayerCard}>
            <View style={styles.multiplayerHeader}>
              <Ionicons name="people" size={24} color="#60a5fa" />
              <Text style={styles.multiplayerTitle}>اللعب الجماعي</Text>
            </View>
            <Text style={styles.multiplayerDesc}>
              تحدى أصدقائك أو لاعبين من حول العالم في مباريات مباشرة!
            </Text>
            <TouchableOpacity 
              style={styles.multiplayerBtn}
              onPress={handleNavigateToGames}
              activeOpacity={0.8}
            >
              <Text style={styles.multiplayerBtnText}>ابدأ مباراة</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Earn More Section - Subtle, not main focus */}
        <View style={styles.earnSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="gift-outline" size={18} color="#22c55e" />
            <Text style={styles.sectionTitle}>اكسب المزيد</Text>
          </View>
          <View style={styles.earnOptions}>
            <TouchableOpacity style={styles.earnOption} onPress={handleNavigateToGames}>
              <Ionicons name="game-controller" size={20} color="#3b82f6" />
              <Text style={styles.earnOptionText}>العب واربح</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.earnOption} onPress={onNavigateToAds}>
              <Ionicons name="play-circle" size={20} color="#10b981" />
              <Text style={styles.earnOptionText}>مكافآت إضافية</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tips Card */}
        <View style={styles.tipsCard}>
          <Ionicons name="bulb-outline" size={20} color="#fbbf24" />
          <Text style={styles.tipsText}>العب يومياً للحصول على مكافآت حصرية!</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0a0a0f' 
  },
  content: { 
    padding: 20, 
    paddingTop: 50, 
    paddingBottom: 100 
  },

  // Header
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 24 
  },
  headerLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12 
  },
  logoImage: { 
    width: 48, 
    height: 48, 
    borderRadius: 24 
  },
  welcomeText: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#FFF' 
  },
  subText: { 
    fontSize: 13, 
    color: 'rgba(255,255,255,0.5)', 
    marginTop: 2 
  },
  headerRight: { 
    flexDirection: 'row', 
    gap: 8 
  },
  currencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  diamondBadge: {
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
  },
  currencyText: { 
    color: '#FFF', 
    fontSize: 13, 
    fontWeight: '600' 
  },

  // Sections
  section: { 
    marginBottom: 20 
  },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#FFF',
    flex: 1,
  },
  seeAllText: { 
    fontSize: 13, 
    color: '#60a5fa' 
  },

  // Featured Card
  featuredCard: { 
    borderRadius: 16, 
    overflow: 'hidden' 
  },
  featuredGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  featuredIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredInfo: { 
    flex: 1 
  },
  featuredName: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#FFF' 
  },
  featuredDesc: { 
    fontSize: 13, 
    color: 'rgba(255,255,255,0.8)', 
    marginTop: 4 
  },

  // Quick Games Grid
  quickGamesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickGameBtn: { 
    alignItems: 'center', 
    width: (width - 60) / 4 
  },
  quickGameIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickGameName: { 
    fontSize: 12, 
    color: 'rgba(255,255,255,0.7)', 
    textAlign: 'center' 
  },

  // Stats Section
  statsSection: { 
    marginBottom: 24 
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1e1e28',
    borderRadius: 16,
    padding: 16,
  },
  statCard: { 
    alignItems: 'center', 
    flex: 1 
  },
  statValue: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#FFF', 
    marginTop: 8 
  },
  statLabel: { 
    fontSize: 12, 
    color: 'rgba(255,255,255,0.5)', 
    marginTop: 4 
  },

  // Challenge Banner
  challengeBanner: { 
    marginBottom: 24, 
    borderRadius: 16, 
    overflow: 'hidden' 
  },
  challengeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  challengeLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12 
  },
  challengeIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#FFF' 
  },
  challengeDesc: { 
    fontSize: 12, 
    color: 'rgba(255,255,255,0.8)', 
    marginTop: 2 
  },

  // Multiplayer Section
  multiplayerSection: { 
    marginBottom: 24 
  },
  multiplayerCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
  },
  multiplayerHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    marginBottom: 12 
  },
  multiplayerTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#FFF' 
  },
  multiplayerDesc: { 
    fontSize: 13, 
    color: 'rgba(255,255,255,0.6)', 
    lineHeight: 20, 
    marginBottom: 16 
  },
  multiplayerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  multiplayerBtnText: { 
    color: '#FFF', 
    fontSize: 14, 
    fontWeight: '600' 
  },

  // Earn Section
  earnSection: { 
    marginBottom: 24 
  },
  earnOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  earnOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e1e28',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  earnOptionText: { 
    color: '#FFF', 
    fontSize: 13, 
    fontWeight: '500' 
  },

  // Tips
  tipsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  tipsText: { 
    color: 'rgba(255,255,255,0.8)', 
    fontSize: 13, 
    flex: 1 
  },
});

export default HomeScreen;
