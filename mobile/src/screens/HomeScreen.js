// Home Screen - الصفحة الرئيسية المحسنة
// تصميم احترافي ومنظم
import React, { useState, useMemo, useCallback, memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import LanguageSwitcher from '../components/LanguageSwitcher';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 52) / 2;

// بطاقة لعبة مميزة
const FeaturedCard = memo(({ title, subtitle, image, colors, icon, onPress, badge }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.featuredCard}>
    <ImageBackground source={{ uri: image }} style={styles.featuredBg} imageStyle={styles.featuredImage}>
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.featuredOverlay}>
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        <View style={styles.featuredContent}>
          <View style={styles.featuredInfo}>
            <Text style={styles.featuredTitle}>{title}</Text>
            <Text style={styles.featuredSubtitle}>{subtitle}</Text>
          </View>
          <View style={[styles.playBtn, { backgroundColor: colors[0] }]}>
            <Ionicons name={icon || "play"} size={16} color="#FFF" />
          </View>
        </View>
      </LinearGradient>
    </ImageBackground>
  </TouchableOpacity>
));

// بطاقة صغيرة
const SmallCard = memo(({ title, icon, color, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.smallCard}>
    <View style={[styles.smallCardIcon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <Text style={styles.smallCardText}>{title}</Text>
  </TouchableOpacity>
));

// بطاقة ميزة
const FeatureCard = memo(({ title, subtitle, image, color, icon, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.featureCard}>
    <ImageBackground source={{ uri: image }} style={styles.featureBg} imageStyle={styles.featureImage}>
      <LinearGradient colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.75)']} style={styles.featureOverlay}>
        <View style={styles.featureContent}>
          <Text style={styles.featureTitle}>{title}</Text>
          <Text style={styles.featureSubtitle}>{subtitle}</Text>
        </View>
        <View style={[styles.featureBtn, { backgroundColor: color }]}>
          <Ionicons name={icon} size={14} color="#FFF" />
        </View>
      </LinearGradient>
    </ImageBackground>
  </TouchableOpacity>
));

const HomeScreen = ({ 
  user, 
  onNavigateToAds, 
  onNavigateToGames, 
  onNavigateToChat, 
  onNavigateToFortunes, 
  onNavigateToFriends, 
  onOpenDailyChallenge, 
  settings, 
  onRefresh 
}) => {
  const [refreshing, setRefreshing] = useState(false);

  // بيانات المستخدم
  const userName = useMemo(() => user?.name || 'لاعب', [user?.name]);
  const userPoints = useMemo(() => user?.saqr_points || user?.points || 0, [user?.saqr_points, user?.points]);
  const userDiamonds = useMemo(() => user?.diamonds || 0, [user?.diamonds]);
  const gamesPlayed = useMemo(() => user?.games_played || 0, [user?.games_played]);
  const gamesWon = useMemo(() => user?.games_won || 0, [user?.games_won]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (onRefresh) await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);

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
        {/* الترويسة */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <LanguageSwitcher />
            <View>
              <Text style={styles.greeting}>أهلاً {userName}</Text>
              <Text style={styles.subGreeting}>جاهز للتحدي؟</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.statBadge}>
              <Ionicons name="star" size={12} color="#fbbf24" />
              <Text style={styles.statText}>{userPoints}</Text>
            </View>
            <View style={[styles.statBadge, styles.diamondBadge]}>
              <Ionicons name="diamond" size={12} color="#60a5fa" />
              <Text style={styles.statText}>{userDiamonds}</Text>
            </View>
          </View>
        </View>

        {/* القسم الرئيسي - الألعاب */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>العب الآن</Text>
            <TouchableOpacity onPress={onNavigateToGames}>
              <Text style={styles.seeAll}>عرض الكل</Text>
            </TouchableOpacity>
          </View>

          {/* البطاقة المميزة الكبيرة */}
          <FeaturedCard
            title="AI Quest"
            subtitle="تحدى الذكاء الاصطناعي!"
            image="https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/0f533451dc398a22ab06768592a035284d7e83dddc8372ecd8529a3560098cbc.png"
            colors={['#ec4899', '#9333ea']}
            onPress={onNavigateToGames}
            badge="جديد"
          />
        </View>

        {/* الألعاب السريعة */}
        <View style={styles.quickGames}>
          <SmallCard title="شطرنج" icon="grid-outline" color="#10b981" onPress={onNavigateToGames} />
          <SmallCard title="X-O" icon="close-outline" color="#f59e0b" onPress={onNavigateToGames} />
          <SmallCard title="أسئلة" icon="help-circle-outline" color="#ec4899" onPress={onNavigateToGames} />
          <SmallCard title="ألغاز" icon="extension-puzzle-outline" color="#8b5cf6" onPress={onNavigateToGames} />
        </View>

        {/* الإحصائيات */}
        <View style={styles.statsCard}>
          <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.statsGradient}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(59,130,246,0.2)' }]}>
                  <Ionicons name="game-controller" size={18} color="#3b82f6" />
                </View>
                <Text style={styles.statValue}>{gamesPlayed}</Text>
                <Text style={styles.statLabel}>مباراة</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(251,191,36,0.2)' }]}>
                  <Ionicons name="trophy" size={18} color="#fbbf24" />
                </View>
                <Text style={styles.statValue}>{gamesWon}</Text>
                <Text style={styles.statLabel}>انتصار</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(16,185,129,0.2)' }]}>
                  <Ionicons name="trending-up" size={18} color="#10b981" />
                </View>
                <Text style={styles.statValue}>{gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0}%</Text>
                <Text style={styles.statLabel}>نسبة الفوز</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* البطاقات الثنائية */}
        <View style={styles.dualCards}>
          <FeatureCard
            title="ثروات صقر"
            subtitle="اربح جواهر!"
            image="https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/8cdadba2892459ff5914f65842239cb7d223d973dca3d9c0e02dc176bdacf78d.png"
            color="#ec4899"
            icon="sparkles"
            onPress={onNavigateToFortunes}
          />
          <FeatureCard
            title="التحدي اليومي"
            subtitle="نقاط إضافية!"
            image="https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/9571396ba276f9f9cf70ce0622c4303850d05054256c99581ef235eec62d9760.png"
            color="#f59e0b"
            icon="flame"
            onPress={onOpenDailyChallenge}
          />
        </View>

        {/* بطاقات إضافية */}
        <View style={styles.dualCards}>
          <FeatureCard
            title="الدردشة"
            subtitle="تواصل مع اللاعبين"
            image="https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/bcdacd75d090c4626f5432d13b9b6c4c4560cc34282e9424de1cbc6732f06abf.png"
            color="#3b82f6"
            icon="chatbubbles"
            onPress={onNavigateToChat}
          />
          <FeatureCard
            title="الأصدقاء"
            subtitle="أضف أصدقاء جدد"
            image="https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/7f2948052c933ae7604200fd2c98d91f4504fce293deb36ce108cba1d36f062a.png"
            color="#22c55e"
            icon="person-add"
            onPress={onNavigateToFriends}
          />
        </View>

        {/* شاهد واربح */}
        <FeaturedCard
          title="شاهد واربح"
          subtitle="شاهد إعلانات واحصل على جواهر صقر!"
          image="https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/e14c91a9e40e8d29b6f8d3bf567a4fcb7020c985b1a9d3e96e2035b06f9921e6.png"
          colors={['#f59e0b', '#d97706']}
          icon="play-circle"
          onPress={onNavigateToAds}
        />

        {/* نصيحة */}
        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={18} color="#fbbf24" />
          <Text style={styles.tipText}>ادعُ أصدقاءك واربح مكافآت مضاعفة!</Text>
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
    padding: 16, 
    paddingTop: 50, 
    paddingBottom: 120 
  },

  // الترويسة
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  headerLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10 
  },
  greeting: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#FFF' 
  },
  subGreeting: { 
    fontSize: 12, 
    color: 'rgba(255,255,255,0.5)' 
  },
  headerRight: { 
    flexDirection: 'row', 
    gap: 6 
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251,191,36,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
  },
  diamondBadge: {
    backgroundColor: 'rgba(96,165,250,0.15)',
  },
  statText: { 
    color: '#FFF', 
    fontSize: 12, 
    fontWeight: '600' 
  },

  // الأقسام
  section: { 
    marginBottom: 16 
  },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  sectionTitle: { 
    fontSize: 15, 
    fontWeight: 'bold', 
    color: '#FFF' 
  },
  seeAll: { 
    fontSize: 12, 
    color: '#60a5fa' 
  },

  // البطاقة المميزة
  featuredCard: { 
    borderRadius: 16, 
    overflow: 'hidden',
    marginBottom: 12,
  },
  featuredBg: {
    height: 140,
  },
  featuredImage: {
    borderRadius: 16,
  },
  featuredOverlay: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#22c55e',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  featuredContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  featuredInfo: {},
  featuredTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  featuredSubtitle: { 
    fontSize: 12, 
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  playBtn: {
    padding: 10,
    borderRadius: 12,
  },

  // الألعاب السريعة
  quickGames: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  smallCard: { 
    alignItems: 'center', 
    width: (width - 48) / 4 
  },
  smallCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  smallCardText: { 
    fontSize: 11, 
    color: 'rgba(255,255,255,0.7)', 
    textAlign: 'center' 
  },

  // الإحصائيات
  statsCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  statsGradient: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  // البطاقات الثنائية
  dualCards: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  featureCard: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  featureBg: {
    height: 100,
  },
  featureImage: {
    borderRadius: 14,
  },
  featureOverlay: {
    flex: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  featureContent: {},
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  featureSubtitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  featureBtn: {
    padding: 8,
    borderRadius: 10,
  },

  // نصيحة
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251,191,36,0.1)',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.2)',
  },
  tipText: { 
    color: 'rgba(255,255,255,0.8)', 
    fontSize: 12, 
    flex: 1 
  },
});

export default HomeScreen;
