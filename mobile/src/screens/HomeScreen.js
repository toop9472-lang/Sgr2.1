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
  RefreshControl,
  Image,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import colors from '../styles/colors';

const { width } = Dimensions.get('window');

// Featured Game Card - New Design with Image Support
const FeaturedGameCard = memo(({ icon, name, description, colors: gradColors, onPress, image }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.featuredCard}>
    {image ? (
      <ImageBackground source={{ uri: image }} style={styles.featuredImageBg} imageStyle={styles.featuredImageStyle}>
        <LinearGradient colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']} style={styles.featuredOverlay}>
          <View style={styles.featuredContent}>
            <View style={styles.featuredInfo}>
              <Text style={styles.featuredNameNew}>{name}</Text>
              <Text style={styles.featuredDescNew}>{description}</Text>
            </View>
            <View style={styles.playIconBtn}>
              <Ionicons name="play" size={20} color="#FFF" />
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    ) : (
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
    )}
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

const HomeScreen = ({ user, onNavigateToAds, onNavigateToGames, onNavigateToChat, onNavigateToFortunes, onNavigateToFriends, settings, onRefresh }) => {
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

          {/* AI Quest - Featured New Game */}
          <FeaturedGameCard
            icon="sparkles"
            name="AI Quest - جديد!"
            description="تحدى الذكاء الاصطناعي في 5 أنواع من التحديات الذهنية!"
            colors={['#ec4899', '#9333ea']}
            onPress={handleNavigateToGames}
            image="https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/0f533451dc398a22ab06768592a035284d7e83dddc8372ecd8529a3560098cbc.png"
          />
          
          {/* Secondary Featured */}
          <View style={{ height: 12 }} />
          <FeaturedGameCard
            icon="game-controller"
            name="ألعاب متنوعة"
            description="شطرنج، تركيب الصور، ألغاز، أسئلة ثقافية والمزيد!"
            colors={['#3b82f6', '#8b5cf6']}
            onPress={handleNavigateToGames}
            image="https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/e02071f57750c77c0db321a70a51ed7bceb6eeb4df5f78e29d834466fcf3f354.png"
          />

          {/* Watch & Earn */}
          <View style={{ height: 12 }} />
          <FeaturedGameCard
            icon="play-circle"
            name="شاهد واربح!"
            description="شاهد إعلانات قصيرة واحصل على جواهر صقر للاستبدال بالمال"
            colors={['#f59e0b', '#d97706']}
            onPress={onNavigateToAds}
            image="https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/e14c91a9e40e8d29b6f8d3bf567a4fcb7020c985b1a9d3e96e2035b06f9921e6.png"
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

        {/* Balance Card - New Design with Image */}
        <TouchableOpacity style={styles.balanceCard} activeOpacity={0.9}>
          <ImageBackground 
            source={{ uri: 'https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/80a9b958945b14e3f85f8b8e2b49544963122866ce9cdc8af6f2ab70c5c8bb31.png' }}
            style={styles.balanceBanner}
            imageStyle={styles.balanceBannerImage}
          >
            <LinearGradient 
              colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)']} 
              style={styles.balanceOverlay}
            >
              <Text style={styles.balanceTitle}>رصيدك الحالي</Text>
              <View style={styles.balanceRow}>
                <View style={styles.balanceItem}>
                  <Ionicons name="star" size={24} color="#fbbf24" />
                  <Text style={styles.balanceValue}>{userPoints}</Text>
                  <Text style={styles.balanceLabel}>نقاط صقر</Text>
                </View>
                <View style={styles.balanceDivider} />
                <View style={styles.balanceItem}>
                  <Ionicons name="diamond" size={24} color="#60a5fa" />
                  <Text style={styles.balanceValue}>{userDiamonds}</Text>
                  <Text style={styles.balanceLabel}>ألماسة</Text>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>

        {/* Player Stats - New Professional Design */}
        <View style={styles.statsSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="stats-chart" size={18} color="#60a5fa" />
            <Text style={styles.sectionTitle}>إحصائياتك</Text>
          </View>
          
          <View style={styles.statsCardNew}>
            <LinearGradient 
              colors={['#1a1a2e', '#16213e']} 
              style={styles.statsGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Stats Row */}
              <View style={styles.statsRowNew}>
                {/* Games Played */}
                <View style={styles.statItemNew}>
                  <View style={[styles.statIconBg, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                    <Ionicons name="game-controller" size={20} color="#3b82f6" />
                  </View>
                  <Text style={styles.statValueNew}>{gamesPlayed}</Text>
                  <Text style={styles.statLabelNew}>مباراة لُعبت</Text>
                </View>
                
                {/* Divider */}
                <View style={styles.statDivider} />
                
                {/* Wins */}
                <View style={styles.statItemNew}>
                  <View style={[styles.statIconBg, { backgroundColor: 'rgba(251, 191, 36, 0.2)' }]}>
                    <Ionicons name="trophy" size={20} color="#fbbf24" />
                  </View>
                  <Text style={styles.statValueNew}>{gamesWon}</Text>
                  <Text style={styles.statLabelNew}>انتصار</Text>
                </View>
                
                {/* Divider */}
                <View style={styles.statDivider} />
                
                {/* Win Rate */}
                <View style={styles.statItemNew}>
                  <View style={[styles.statIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                    <Ionicons name="trending-up" size={20} color="#10b981" />
                  </View>
                  <Text style={styles.statValueNew}>
                    {gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0}%
                  </Text>
                  <Text style={styles.statLabelNew}>نسبة الفوز</Text>
                </View>
              </View>
              
              {/* Progress Bar */}
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>تقدمك نحو المستوى التالي</Text>
                  <Text style={styles.progressValue}>{Math.min(userPoints % 100, 100)}/100</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${Math.min(userPoints % 100, 100)}%` }]} />
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Daily Challenge Banner - New Image Design */}
        <TouchableOpacity activeOpacity={0.9} style={styles.challengeBannerNew}>
          <ImageBackground 
            source={{ uri: 'https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/9571396ba276f9f9cf70ce0622c4303850d05054256c99581ef235eec62d9760.png' }}
            style={styles.challengeImageBg}
            imageStyle={styles.challengeImageStyle}
          >
            <LinearGradient 
              colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.7)']} 
              style={styles.challengeOverlayNew}
            >
              <View style={styles.challengeContentNew}>
                <View>
                  <Text style={styles.challengeTitleNew}>التحدي اليومي</Text>
                  <Text style={styles.challengeDescNew}>اربح نقاط إضافية كل يوم!</Text>
                </View>
                <View style={styles.challengeBtn}>
                  <Ionicons name="flame" size={18} color="#FFF" />
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>

        {/* Multiplayer Section - New Image Design */}
        <TouchableOpacity 
          style={styles.multiplayerCardNew}
          onPress={handleNavigateToGames}
          activeOpacity={0.9}
        >
          <ImageBackground 
            source={{ uri: 'https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/45a8a3fbd10c46b785a5178ca02ae00c0c4aa43973b95689ebf41e18eb5cbada.png' }}
            style={styles.multiplayerImageBg}
            imageStyle={styles.multiplayerImageStyle}
          >
            <LinearGradient 
              colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.7)']} 
              style={styles.multiplayerOverlayNew}
            >
              <View style={styles.multiplayerContentNew}>
                <View>
                  <Text style={styles.multiplayerTitleNew}>اللعب الجماعي</Text>
                  <Text style={styles.multiplayerDescNew}>تحدى لاعبين من حول العالم!</Text>
                </View>
                <View style={styles.startMatchBtn}>
                  <Text style={styles.startMatchText}>ابدأ</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" />
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>

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

        {/* Saqr Fortunes Section - New Design with Image */}
        <TouchableOpacity 
          style={styles.fortunesCard}
          onPress={onNavigateToFortunes}
          activeOpacity={0.9}
        >
          <ImageBackground 
            source={{ uri: 'https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/8cdadba2892459ff5914f65842239cb7d223d973dca3d9c0e02dc176bdacf78d.png' }}
            style={styles.fortunesBanner}
            imageStyle={styles.fortunesBannerImage}
          >
            <LinearGradient 
              colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']} 
              style={styles.fortunesOverlay}
            >
              <View style={styles.fortunesContent}>
                <View style={styles.fortunesTextArea}>
                  <View style={styles.fortunesHeader}>
                    <Text style={styles.fortunesTitle}>ثروات صقر</Text>
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>جديد</Text>
                    </View>
                  </View>
                  <Text style={styles.fortunesDesc}>جواهر صقر للاستبدال بالمال!</Text>
                  <Text style={styles.fortunesSubDesc}>عجلة حظ وصناديق كنز يومية</Text>
                </View>
                <View style={styles.playNowBtn}>
                  <Text style={styles.playNowText}>ابدأ</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" />
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>

        {/* Global Chat Section - New Design with Image */}
        <TouchableOpacity 
          style={styles.chatCard}
          onPress={onNavigateToChat}
          activeOpacity={0.9}
        >
          <ImageBackground 
            source={{ uri: 'https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/bcdacd75d090c4626f5432d13b9b6c4c4560cc34282e9424de1cbc6732f06abf.png' }}
            style={styles.chatBanner}
            imageStyle={styles.chatBannerImage}
          >
            <LinearGradient 
              colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.7)']} 
              style={styles.chatOverlay}
            >
              <View style={styles.chatContent}>
                <View style={styles.chatTextArea}>
                  <View style={styles.chatHeader}>
                    <Text style={styles.chatTitle}>الدردشة العامة</Text>
                    <View style={styles.costBadge}>
                      <Ionicons name="diamond" size={10} color="#60a5fa" />
                      <Text style={styles.costBadgeText}>5</Text>
                    </View>
                  </View>
                  <Text style={styles.chatDesc}>تواصل مع لاعبين من حول العالم!</Text>
                </View>
                <View style={styles.joinBtn}>
                  <Text style={styles.joinBtnText}>انضم</Text>
                  <Ionicons name="chatbubbles" size={14} color="#FFF" />
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>

        {/* Friends Section - New Design with Image */}
        <TouchableOpacity 
          style={styles.friendsCard}
          onPress={onNavigateToFriends}
          activeOpacity={0.9}
        >
          <ImageBackground 
            source={{ uri: 'https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/7f2948052c933ae7604200fd2c98d91f4504fce293deb36ce108cba1d36f062a.png' }}
            style={styles.friendsBanner}
            imageStyle={styles.friendsBannerImage}
          >
            <LinearGradient 
              colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.7)']} 
              style={styles.friendsOverlay}
            >
              <View style={styles.friendsContent}>
                <View style={styles.friendsTextArea}>
                  <Text style={styles.friendsTitle}>الأصدقاء والبريد</Text>
                  <Text style={styles.friendsDesc}>أضف أصدقاء وادعهم للألعاب!</Text>
                </View>
                <View style={styles.inviteBtn}>
                  <Ionicons name="person-add" size={16} color="#FFF" />
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>

        {/* Tips Card */}
        <View style={styles.tipsCard}>
          <Ionicons name="bulb-outline" size={20} color="#fbbf24" />
          <Text style={styles.tipsText}>ادعُ أصدقاءك للألعاب مجاناً واربح جوائز مضاعفة!</Text>
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
    paddingBottom: 120 // مساحة للـ BottomNav
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
  welcomeContainer: {
    flexDirection: 'column',
  },
  welcomeText: { 
    fontSize: 20, 
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
    borderRadius: 20, 
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  featuredGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  featuredImageBg: {
    height: 120,
  },
  featuredImageStyle: {
    borderRadius: 20,
  },
  featuredOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  featuredContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
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
  featuredNameNew: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 4,
  },
  featuredDesc: { 
    fontSize: 13, 
    color: 'rgba(255,255,255,0.8)', 
    marginTop: 4 
  },
  featuredDescNew: { 
    fontSize: 12, 
    color: 'rgba(255,255,255,0.9)',
  },
  playIconBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    padding: 12,
    borderRadius: 14,
  },

  // Balance Card - New
  balanceCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  balanceBanner: {
    height: 130,
  },
  balanceBannerImage: {
    borderRadius: 20,
  },
  balanceOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  balanceTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
    fontWeight: '600',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 6,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  balanceLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  balanceDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.3)',
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

  // Saqr Fortunes Card - New Image Design
  fortunesCard: {
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fortunesBanner: {
    height: 140,
  },
  fortunesBannerImage: {
    borderRadius: 20,
  },
  fortunesOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  fortunesContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  fortunesTextArea: {
    flex: 1,
  },
  fortunesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  fortunesTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  newBadge: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  fortunesDesc: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  fortunesSubDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginTop: 2,
  },
  playNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ec4899',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
  },
  playNowText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Global Chat Card - New Image Design
  chatCard: {
    marginTop: 12,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  chatBanner: {
    height: 120,
  },
  chatBannerImage: {
    borderRadius: 20,
  },
  chatOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  chatContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  chatTextArea: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  costBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(96, 165, 250, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  costBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  chatDesc: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
  },
  joinBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Friends Card - New Image Design
  friendsCard: {
    marginTop: 12,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  friendsBanner: {
    height: 110,
  },
  friendsBannerImage: {
    borderRadius: 20,
  },
  friendsOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  friendsContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  friendsTextArea: {
    flex: 1,
  },
  friendsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  friendsDesc: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
  },
  inviteBtn: {
    backgroundColor: '#22c55e',
    padding: 12,
    borderRadius: 14,
  },
});

export default HomeScreen;
