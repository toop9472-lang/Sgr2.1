// Home Screen - الصفحة الرئيسية
// بدون ألعاب - فقط ثروات صقر والميزات الأساسية
import React, { useState, useMemo, useCallback, memo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ImageBackground,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useLanguage } from "../i18n/LanguageContext";
import {
  APP_BACKGROUND_IMAGE,
  ICON_ASSETS,
  LOCAL_ICON_FALLBACKS,
} from "../constants/uiAssets";

const AppIcon = ({ uri, assetKey = null, size = 18, tintColor = "#fff", style }) => {
  const fallback = assetKey ? LOCAL_ICON_FALLBACKS?.[assetKey] : null;
  const source = fallback || { uri };
  const effectiveTintColor = assetKey === "clips" ? undefined : tintColor;
  return (
    <Image
      source={source}
      style={[
        { width: size, height: size, tintColor: effectiveTintColor, resizeMode: "contain" },
        style,
      ]}
    />
  );
};

const HeroCard = memo(
  ({ title, subtitle, image, iconSource, iconAssetKey, badge, onPress }) => (
    <TouchableOpacity style={styles.heroCard} onPress={onPress} activeOpacity={0.9}>
      <ImageBackground source={{ uri: image }} style={styles.heroBg} imageStyle={styles.heroImage}>
        <LinearGradient
          colors={["rgba(2,6,23,0.18)", "rgba(2,6,23,0.82)"]}
          style={styles.heroOverlay}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.heroIconWrap}>
              <AppIcon uri={iconSource} assetKey={iconAssetKey} size={20} />
            </View>
            {!!badge && (
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>{badge}</Text>
              </View>
            )}
          </View>
          <View>
            <Text style={styles.heroTitle}>{title}</Text>
            <Text style={styles.heroSubtitle}>{subtitle}</Text>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  ),
);

const HomeScreen = ({
  user,
  onNavigateToAds,
  onNavigateToClips,
  onNavigateToChat,
  onNavigateToFortunes,
  onNavigateToFriends,
  settings,
  onRefresh,
}) => {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [refreshing, setRefreshing] = useState(false);
  const copy = useMemo(
    () => ({
      defaultPlayer: isArabic ? "لاعب" : "Player",
      welcomePrefix: isArabic ? "أهلاً" : "Welcome",
      welcomeSub: isArabic ? "مرحباً بك في صقر" : "Welcome to Saqr",
      fortunes: isArabic ? "ثروات صقر" : "Saqr Fortunes",
      newLabel: isArabic ? "جديد" : "NEW",
      fortunesSubtitle: isArabic
        ? "اربح جواهر صقر للاستبدال بالمال الحقيقي!"
        : "Earn Saqr gems and exchange them for real cash!",
      exchangeBadge: isArabic ? "500 جوهرة = 3 ريال" : "500 gems = 3 SAR",
      fortunesDesc: isArabic
        ? "إعلانات AdMob مكتملة • مكافأة ثابتة 5 جواهر • سحب مرن"
        : "Completed AdMob ads • Fixed 5 gems reward • Flexible cashout",
      watchAndEarn: isArabic ? "شاهد واربح" : "Watch & Earn",
      watchAndEarnSubtitle: isArabic
        ? "إعلانات AdMob كاملة الشاشة + إعلانات المعلنين"
        : "Full-screen AdMob + advertiser ads",
      clips: isArabic ? "ريلز المجتمع" : "Community Reels",
      clipsSub: isArabic
        ? "مقاطع 15 ثانية من المستخدمين"
        : "15-second clips by users",
      chat: isArabic ? "الدردشة" : "Chat",
      chatSub: isArabic ? "تواصل مع اللاعبين" : "Connect with players",
      friends: isArabic ? "الأصدقاء" : "Friends",
      friendsSub: isArabic ? "أضف أصدقاء جدد" : "Add new friends",
      chatCostBadge: isArabic ? "مجاني" : "Free",
      tip: isArabic
        ? "ادعُ أصدقاءك واربح جواهر صقر مضاعفة!"
        : "Invite friends and earn boosted Saqr gems!",
      adsPill: isArabic ? "صفحة الإعلانات" : "Ads Feed",
      adsPillSub: isArabic ? "AdMob + المعلنين" : "AdMob + advertisers",
      reelsPill: isArabic ? "صفحة الريلز" : "Reels Feed",
      reelsPillSub: isArabic ? "15 ثانية لكل فيديو" : "15s per reel",
      chatPill: isArabic ? "الدردشة العامة" : "Global Chat",
      chatPillSub: isArabic ? "مجانية بالكامل" : "Always free",
      fortunesPill: isArabic ? "ثروات صقر" : "Saqr Fortunes",
      fortunesPillSub: isArabic ? "500 = 3 ريال" : "500 = 3 SAR",
      sectionMain: isArabic ? "المزايا الرئيسية" : "Main Features",
      sectionMainSub: isArabic
        ? "واجهة منظمة بدون تكرار: كل ميزة مرة واحدة"
        : "Clean single-entry cards, no duplicates",
    }),
    [isArabic],
  );

  const primaryCards = useMemo(
    () => [
      {
        key: "fortunes",
        title: copy.fortunes,
        subtitle: copy.fortunesSubtitle,
        image:
          "https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/8cdadba2892459ff5914f65842239cb7d223d973dca3d9c0e02dc176bdacf78d.png",
        iconSource: ICON_ASSETS.fortunes,
        iconAssetKey: null,
        badge: copy.exchangeBadge,
        onPress: onNavigateToFortunes,
      },
      {
        key: "clips",
        title: copy.clips,
        subtitle: copy.clipsSub,
        image:
          "https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/e02071f57750c77c0db321a70a51ed7bceb6eeb4df5f78e29d834466fcf3f354.png",
        iconSource: ICON_ASSETS.clips,
        iconAssetKey: "clips",
        badge: null,
        onPress: onNavigateToClips,
      },
      {
        key: "watch",
        title: copy.watchAndEarn,
        subtitle: copy.watchAndEarnSubtitle,
        image:
          "https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/e14c91a9e40e8d29b6f8d3bf567a4fcb7020c985b1a9d3e96e2035b06f9921e6.png",
        iconSource: ICON_ASSETS.watch,
        iconAssetKey: null,
        badge: isArabic ? "AdMob" : "AdMob",
        onPress: onNavigateToAds,
      },
      {
        key: "friends",
        title: copy.friends,
        subtitle: copy.friendsSub,
        image:
          "https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/7f2948052c933ae7604200fd2c98d91f4504fce293deb36ce108cba1d36f062a.png",
        iconSource: ICON_ASSETS.friends,
        iconAssetKey: null,
        badge: null,
        onPress: onNavigateToFriends,
      },
      {
        key: "chat",
        title: copy.chat,
        subtitle: copy.chatSub,
        image:
          "https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/bcdacd75d090c4626f5432d13b9b6c4c4560cc34282e9424de1cbc6732f06abf.png",
        iconSource: ICON_ASSETS.chat,
        iconAssetKey: null,
        badge: copy.chatCostBadge,
        onPress: onNavigateToChat,
      },
    ],
    [
      copy.chat,
      copy.chatCostBadge,
      copy.chatSub,
      copy.clips,
      copy.clipsSub,
      copy.exchangeBadge,
      copy.fortunes,
      copy.fortunesSubtitle,
      copy.friends,
      copy.friendsSub,
      copy.watchAndEarn,
      copy.watchAndEarnSubtitle,
      isArabic,
      onNavigateToAds,
      onNavigateToChat,
      onNavigateToClips,
      onNavigateToFortunes,
      onNavigateToFriends,
    ],
  );

  // بيانات المستخدم
  const userName = useMemo(
    () => user?.name || copy.defaultPlayer,
    [copy.defaultPlayer, user?.name],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (onRefresh) await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);

  return (
    <ImageBackground
      source={{ uri: APP_BACKGROUND_IMAGE }}
      style={styles.bg}
      resizeMode="cover"
    >
      <LinearGradient
        colors={["rgba(15,23,42,0.26)", "rgba(30,41,59,0.68)", "rgba(30,27,75,0.88)"]}
        style={styles.bgOverlay}
      >
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#3b82f6"
              colors={["#3b82f6"]}
            />
          }
        >
          <View style={styles.content}>
        {/* الترويسة */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <LanguageSwitcher />
            <View>
              <Text style={styles.greeting}>
                {copy.welcomePrefix} {userName}
              </Text>
              <Text style={styles.subGreeting}>{copy.welcomeSub}</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickStatsRow}>
          <View style={styles.quickStatCard}>
            <AppIcon uri={ICON_ASSETS.gems} size={16} tintColor="#fbbf24" />
            <Text style={styles.quickStatValue}>{user?.saqr_gems || 0}</Text>
            <Text style={styles.quickStatLabel}>جواهر</Text>
          </View>
          <View style={styles.quickStatCard}>
            <AppIcon
              uri={ICON_ASSETS.clips}
              assetKey="clips"
              size={16}
              tintColor="#a5f3fc"
            />
            <Text style={styles.quickStatValue}>{user?.clips_count || 0}</Text>
            <Text style={styles.quickStatLabel}>ريلز</Text>
          </View>
          <View style={styles.quickStatCard}>
            <AppIcon uri={ICON_ASSETS.chat} size={16} tintColor="#93c5fd" />
            <Text style={styles.quickStatValue}>24/7</Text>
            <Text style={styles.quickStatLabel}>دردشة</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppIcon uri={ICON_ASSETS.home} size={18} tintColor="#60a5fa" />
            <Text style={styles.sectionTitle}>{copy.sectionMain}</Text>
          </View>
          <Text style={styles.sectionSub}>{copy.sectionMainSub}</Text>
        </View>

        <View style={styles.heroGrid}>
          {primaryCards.map((card) => (
            <HeroCard
              key={card.key}
              title={card.title}
              subtitle={card.subtitle}
              image={card.image}
              iconSource={card.iconSource}
              iconAssetKey={card.iconAssetKey}
              badge={card.badge}
              onPress={card.onPress}
            />
          ))}
        </View>

        {/* نصيحة */}
        <View style={styles.tipCard}>
          <AppIcon uri={ICON_ASSETS.home} size={18} tintColor="#fbbf24" />
          <Text style={styles.tipText}>{copy.tip}</Text>
        </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  bg: {
    flex: 1,
  },
  bgOverlay: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 28,
    paddingBottom: 120,
  },
  quickStatsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  quickStatCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(10,14,30,0.38)",
    paddingVertical: 10,
    alignItems: "center",
    gap: 3,
  },
  quickStatValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  quickStatLabel: {
    color: "rgba(255,255,255,0.66)",
    fontSize: 10,
  },
  // الترويسة
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  greeting: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
  subGreeting: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
  },

  // الأقسام
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
    flex: 1,
  },
  sectionSub: {
    marginTop: 4,
    marginBottom: 2,
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
  },

  heroGrid: {
    gap: 10,
    marginBottom: 12,
  },
  heroCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  heroBg: {
    height: 112,
  },
  heroImage: {
    borderRadius: 16,
  },
  heroOverlay: {
    flex: 1,
    justifyContent: "space-between",
    padding: 12,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroBadge: {
    backgroundColor: "rgba(34,197,94,0.92)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  heroBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  heroTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  heroSubtitle: {
    marginTop: 2,
    color: "rgba(255,255,255,0.86)",
    fontSize: 12,
    lineHeight: 16,
  },

  // نصيحة
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(251,191,36,0.1)",
    padding: 14,
    borderRadius: 12,
    gap: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.2)",
  },
  tipText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    flex: 1,
  },
});

export default HomeScreen;
