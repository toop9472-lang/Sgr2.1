// Home Screen - الصفحة الرئيسية
// بدون ألعاب - فقط ثروات صقر والميزات الأساسية
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

// بطاقة مميزة كبيرة
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

// بطاقة ميزة
const FeatureCard = memo(({ title, subtitle, image, color, icon, onPress, badge }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.featureCard}>
    <ImageBackground source={{ uri: image }} style={styles.featureBg} imageStyle={styles.featureImage}>
      <LinearGradient colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.75)']} style={styles.featureOverlay}>
        {badge && (
          <View style={styles.featureBadge}>
            <Text style={styles.featureBadgeText}>{badge}</Text>
          </View>
        )}
        <View style={styles.featureBottom}>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>{title}</Text>
            <Text style={styles.featureSubtitle}>{subtitle}</Text>
          </View>
          <View style={[styles.featureBtn, { backgroundColor: color }]}>
            <Ionicons name={icon} size={14} color="#FFF" />
          </View>
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
  const userGems = useMemo(() => user?.saqr_gems || 0, [user?.saqr_gems]);

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
              <Text style={styles.subGreeting}>مرحباً بك في صقر</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.statBadge}>
              <Ionicons name="sparkles" size={12} color="#f472b6" />
              <Text style={styles.statText}>{userGems}</Text>
            </View>
            <View style={[styles.statBadge, styles.diamondBadge]}>
              <Ionicons name="diamond" size={12} color="#60a5fa" />
              <Text style={styles.statText}>{userDiamonds}</Text>
            </View>
          </View>
        </View>

        {/* ثروات صقر - القسم الرئيسي */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles" size={18} color="#ec4899" />
            <Text style={styles.sectionTitle}>ثروات صقر</Text>
            <View style={styles.newTag}>
              <Text style={styles.newTagText}>جديد</Text>
            </View>
          </View>

          <FeaturedCard
            title="ثروات صقر"
            subtitle="اربح جواهر صقر للاستبدال بالمال الحقيقي!"
            image="https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/8cdadba2892459ff5914f65842239cb7d223d973dca3d9c0e02dc176bdacf78d.png"
            colors={['#ec4899', '#be185d']}
            icon="sparkles"
            onPress={onNavigateToFortunes}
            badge="500 جوهرة = 1 ريال"
          />

          <Text style={styles.fortunesDesc}>
            عجلة الحظ اليومية • صناديق الكنز • مكافآت مضاعفة
          </Text>
        </View>

        {/* شاهد واربح */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="play-circle" size={18} color="#f59e0b" />
            <Text style={styles.sectionTitle}>شاهد واربح</Text>
          </View>

          <FeaturedCard
            title="شاهد واربح"
            subtitle="شاهد إعلانات قصيرة واحصل على جواهر صقر!"
            image="https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/e14c91a9e40e8d29b6f8d3bf567a4fcb7020c985b1a9d3e96e2035b06f9921e6.png"
            colors={['#f59e0b', '#d97706']}
            icon="play"
            onPress={onNavigateToAds}
          />
        </View>

        {/* رصيدك */}
        <View style={styles.balanceCard}>
          <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.balanceGradient}>
            <Text style={styles.balanceTitle}>رصيدك الحالي</Text>
            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <View style={[styles.balanceIcon, { backgroundColor: 'rgba(244,114,182,0.2)' }]}>
                  <Ionicons name="sparkles" size={20} color="#f472b6" />
                </View>
                <Text style={styles.balanceValue}>{userGems}</Text>
                <Text style={styles.balanceLabel}>جواهر صقر</Text>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceItem}>
                <View style={[styles.balanceIcon, { backgroundColor: 'rgba(96,165,250,0.2)' }]}>
                  <Ionicons name="diamond" size={20} color="#60a5fa" />
                </View>
                <Text style={styles.balanceValue}>{userDiamonds}</Text>
                <Text style={styles.balanceLabel}>ماسة</Text>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceItem}>
                <View style={[styles.balanceIcon, { backgroundColor: 'rgba(251,191,36,0.2)' }]}>
                  <Ionicons name="star" size={20} color="#fbbf24" />
                </View>
                <Text style={styles.balanceValue}>{userPoints}</Text>
                <Text style={styles.balanceLabel}>نقطة</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* البطاقات الثنائية */}
        <View style={styles.dualCards}>
          <FeatureCard
            title="التحدي اليومي"
            subtitle="نقاط إضافية!"
            image="https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/9571396ba276f9f9cf70ce0622c4303850d05054256c99581ef235eec62d9760.png"
            color="#f59e0b"
            icon="flame"
            onPress={onOpenDailyChallenge}
          />
          <FeatureCard
            title="الألعاب"
            subtitle="العب واربح!"
            image="https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/e02071f57750c77c0db321a70a51ed7bceb6eeb4df5f78e29d834466fcf3f354.png"
            color="#8b5cf6"
            icon="game-controller"
            onPress={onNavigateToGames}
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
            badge="5 ماسات"
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

        {/* نصيحة */}
        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={18} color="#fbbf24" />
          <Text style={styles.tipText}>ادعُ أصدقاءك واربح جواهر صقر مضاعفة!</Text>
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
    marginBottom: 24 
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
    backgroundColor: 'rgba(244,114,182,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  diamondBadge: {
    backgroundColor: 'rgba(96,165,250,0.15)',
  },
  statText: { 
    color: '#FFF', 
    fontSize: 13, 
    fontWeight: '600' 
  },

  // الأقسام
  section: { 
    marginBottom: 20 
  },
  sectionHeader: { 
    flexDirection: 'row', 
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
  newTag: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  newTagText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  fortunesDesc: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },

  // البطاقة المميزة
  featuredCard: { 
    borderRadius: 16, 
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  featuredBg: {
    height: 160,
  },
  featuredImage: {
    borderRadius: 16,
  },
  featuredOverlay: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  featuredContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  featuredInfo: {},
  featuredTitle: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  featuredSubtitle: { 
    fontSize: 12, 
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  playBtn: {
    padding: 12,
    borderRadius: 14,
  },

  // الرصيد
  balanceCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  balanceGradient: {
    padding: 20,
  },
  balanceTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  balanceItem: {
    alignItems: 'center',
    flex: 1,
  },
  balanceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
  },
  balanceLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  balanceDivider: {
    width: 1,
    height: 50,
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
    height: 110,
  },
  featureImage: {
    borderRadius: 14,
  },
  featureOverlay: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  featureBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(96,165,250,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  featureBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  featureBottom: {
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
    padding: 14,
    borderRadius: 12,
    gap: 10,
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
