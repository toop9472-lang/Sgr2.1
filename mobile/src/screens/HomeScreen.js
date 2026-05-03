// Home Screen - الصفحة الرئيسية
// بدون ألعاب - فقط ثروات صقر والميزات الأساسية
import React, { useState, useMemo, useCallback, memo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
  ImageBackground,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useLanguage } from "../i18n/LanguageContext";
import {
  APP_BACKGROUND_IMAGE,
  ICON_ASSETS,
  getHomeCardBackgrounds,
} from "../constants/uiAssets";

const { width } = Dimensions.get("window");

const AppIcon = ({ uri, size = 18, tintColor = "#fff", style }) => (
  <Image
    source={{ uri }}
    style={[{ width: size, height: size, tintColor, resizeMode: "contain" }, style]}
  />
);

const QuickStatSticker = memo(({ iconSource, value, label, tintColor, backgroundImage }) => (
  <ImageBackground
    source={{ uri: backgroundImage }}
    style={styles.quickStatCard}
    imageStyle={styles.quickStatImage}
  >
    <LinearGradient
      colors={["rgba(15,23,42,0.24)", "rgba(15,23,42,0.76)"]}
      style={styles.quickStatOverlay}
    >
      <AppIcon uri={iconSource} size={16} tintColor={tintColor} />
      <Text style={styles.quickStatValue}>{value}</Text>
      <Text style={styles.quickStatLabel}>{label}</Text>
    </LinearGradient>
  </ImageBackground>
));

const QuickActionPill = memo(({ iconSource, title, subtitle, colors, onPress, backgroundImage }) => (
  <TouchableOpacity style={styles.quickActionPill} onPress={onPress} activeOpacity={0.85}>
    <ImageBackground
      source={{ uri: backgroundImage }}
      style={styles.quickActionPillBg}
      imageStyle={styles.quickActionPillImage}
    >
      <LinearGradient colors={colors} style={styles.quickActionPillGradient}>
        <View style={styles.quickActionPillIcon}>
          <AppIcon uri={iconSource} size={17} />
        </View>
        <View style={styles.quickActionPillTextWrap}>
          <Text style={styles.quickActionPillTitle}>{title}</Text>
          <Text style={styles.quickActionPillSub}>{subtitle}</Text>
        </View>
      </LinearGradient>
    </ImageBackground>
  </TouchableOpacity>
));

const PrimaryActionCard = memo(
  ({ iconSource, title, subtitle, colors, onPress, backgroundImage }) => (
    <TouchableOpacity style={styles.primaryAction} onPress={onPress} activeOpacity={0.9}>
      <ImageBackground
        source={{ uri: backgroundImage }}
        style={styles.primaryActionBg}
        imageStyle={styles.primaryActionImage}
      >
        <LinearGradient colors={colors} style={styles.primaryActionGradient}>
          <View style={styles.primaryActionIcon}>
            <AppIcon uri={iconSource} size={18} />
          </View>
          <View style={styles.primaryActionTextWrap}>
            <Text style={styles.primaryActionTitle}>{title}</Text>
            <Text style={styles.primaryActionSub}>{subtitle}</Text>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  ),
);

// بطاقة مميزة كبيرة
const FeaturedCard = memo(
  ({ title, subtitle, image, colors, iconSource, onPress, badge }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={styles.featuredCard}
    >
      <ImageBackground
        source={{ uri: image }}
        style={styles.featuredBg}
        imageStyle={styles.featuredImage}
      >
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          style={styles.featuredOverlay}
        >
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
              <AppIcon uri={iconSource || ICON_ASSETS.watch} size={16} />
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  ),
);

// بطاقة ميزة
const FeatureCard = memo(
  ({ title, subtitle, image, color, iconSource, onPress, badge }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={styles.featureCard}
    >
      <ImageBackground
        source={{ uri: image }}
        style={styles.featureBg}
        imageStyle={styles.featureImage}
      >
        <LinearGradient
          colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.75)"]}
          style={styles.featureOverlay}
        >
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
              <AppIcon uri={iconSource || ICON_ASSETS.watch} size={14} />
            </View>
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
  homePreset,
  onHomePresetChange,
  onRefresh,
}) => {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [refreshing, setRefreshing] = useState(false);
  const homeCardBackgrounds = useMemo(
    () => getHomeCardBackgrounds(homePreset),
    [homePreset],
  );
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
      styleLuxury: isArabic ? "فاخر داكن" : "Luxury Dark",
      styleBright: isArabic ? "مشرق عصري" : "Bright Modern",
    }),
    [isArabic],
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

  const handleQuickPresetToggle = useCallback(() => {
    if (!onHomePresetChange) return;
    const nextPreset = homePreset === "brightModern" ? "luxuryDark" : "brightModern";
    onHomePresetChange(nextPreset);
  }, [homePreset, onHomePresetChange]);

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
          <TouchableOpacity
            style={styles.presetSwitchBtn}
            onPress={handleQuickPresetToggle}
            activeOpacity={0.85}
          >
            <Ionicons name="swap-horizontal" size={14} color="#fff" />
            <Text style={styles.presetSwitchText}>
              {homePreset === "brightModern" ? copy.styleBright : copy.styleLuxury}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickStatsRow}>
          <QuickStatSticker
            iconSource={ICON_ASSETS.gems}
            value={user?.saqr_gems || 0}
            label="جواهر"
            tintColor="#fbbf24"
            backgroundImage={homeCardBackgrounds.statGems}
          />
          <QuickStatSticker
            iconSource={ICON_ASSETS.clips}
            value={user?.clips_count || 0}
            label="ريلز"
            tintColor="#a5f3fc"
            backgroundImage={homeCardBackgrounds.statReels}
          />
          <QuickStatSticker
            iconSource={ICON_ASSETS.chat}
            value="24/7"
            label="دردشة"
            tintColor="#93c5fd"
            backgroundImage={homeCardBackgrounds.statChat}
          />
        </View>

        <View style={styles.quickActionsWrap}>
          <QuickActionPill
            iconSource={ICON_ASSETS.watch}
            title={copy.adsPill}
            subtitle={copy.adsPillSub}
            colors={["rgba(245,158,11,0.30)", "rgba(120,53,15,0.60)"]}
            onPress={onNavigateToAds}
            backgroundImage={homeCardBackgrounds.quickAds}
          />
          <QuickActionPill
            iconSource={ICON_ASSETS.clips}
            title={copy.reelsPill}
            subtitle={copy.reelsPillSub}
            colors={["rgba(99,102,241,0.30)", "rgba(49,46,129,0.62)"]}
            onPress={onNavigateToClips}
            backgroundImage={homeCardBackgrounds.quickReels}
          />
          <QuickActionPill
            iconSource={ICON_ASSETS.chat}
            title={copy.chatPill}
            subtitle={copy.chatPillSub}
            colors={["rgba(14,165,233,0.30)", "rgba(8,47,73,0.62)"]}
            onPress={onNavigateToChat}
            backgroundImage={homeCardBackgrounds.quickChat}
          />
          <QuickActionPill
            iconSource={ICON_ASSETS.fortunes}
            title={copy.fortunesPill}
            subtitle={copy.fortunesPillSub}
            colors={["rgba(236,72,153,0.32)", "rgba(88,28,135,0.62)"]}
            onPress={onNavigateToFortunes}
            backgroundImage={homeCardBackgrounds.quickFortunes}
          />
        </View>

        {/* ثروات صقر - القسم الرئيسي */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppIcon uri={ICON_ASSETS.fortunes} size={18} tintColor="#ec4899" />
            <Text style={styles.sectionTitle}>{copy.fortunes}</Text>
            <View style={styles.newTag}>
              <Text style={styles.newTagText}>{copy.newLabel}</Text>
            </View>
          </View>

          <FeaturedCard
            title={copy.fortunes}
            subtitle={copy.fortunesSubtitle}
            image={homeCardBackgrounds.featuredFortunes}
            colors={["#ec4899", "#be185d"]}
            iconSource={ICON_ASSETS.fortunes}
            onPress={onNavigateToFortunes}
            badge={copy.exchangeBadge}
          />

          <Text style={styles.fortunesDesc}>{copy.fortunesDesc}</Text>
        </View>

        <View style={styles.primaryActionsRow}>
          <PrimaryActionCard
            iconSource={ICON_ASSETS.watch}
            title={copy.watchAndEarn}
            subtitle={copy.watchAndEarnSubtitle}
            colors={["rgba(245,158,11,0.25)", "rgba(120,53,15,0.66)"]}
            onPress={onNavigateToAds}
            backgroundImage={homeCardBackgrounds.primaryWatch}
          />
          <PrimaryActionCard
            iconSource={ICON_ASSETS.fortunes}
            title={copy.fortunes}
            subtitle={copy.exchangeBadge}
            colors={["rgba(236,72,153,0.25)", "rgba(67,56,202,0.66)"]}
            onPress={onNavigateToFortunes}
            backgroundImage={homeCardBackgrounds.primaryFortunes}
          />
        </View>

        {/* البطاقات الثنائية */}
        <View style={styles.dualCards}>
          <FeatureCard
            title={copy.clips}
            subtitle={copy.clipsSub}
            image={homeCardBackgrounds.reels}
            color="#8b5cf6"
            iconSource={ICON_ASSETS.clips}
            onPress={onNavigateToClips}
          />
          <FeatureCard
            title={copy.friends}
            subtitle={copy.friendsSub}
            image={homeCardBackgrounds.friends}
            color="#22c55e"
            iconSource={ICON_ASSETS.friends}
            onPress={onNavigateToFriends}
          />
        </View>

        {/* بطاقات إضافية */}
        <View style={styles.dualCards}>
          <FeatureCard
            title={copy.chat}
            subtitle={copy.chatSub}
            image={homeCardBackgrounds.chat}
            color="#3b82f6"
            iconSource={ICON_ASSETS.chat}
            onPress={onNavigateToChat}
            badge={copy.chatCostBadge}
          />
          <View style={{ flex: 1 }} />
        </View>

        {/* نصيحة */}
        <ImageBackground
          source={{ uri: homeCardBackgrounds.tip }}
          style={styles.tipCard}
          imageStyle={styles.tipImage}
        >
          <LinearGradient
            colors={["rgba(251,191,36,0.14)", "rgba(15,23,42,0.74)"]}
            style={styles.tipOverlay}
          >
            <AppIcon uri={ICON_ASSETS.home} size={18} tintColor="#fbbf24" />
            <Text style={styles.tipText}>{copy.tip}</Text>
          </LinearGradient>
        </ImageBackground>
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
    overflow: "hidden",
    minHeight: 82,
  },
  quickStatImage: {
    borderRadius: 14,
  },
  quickStatOverlay: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
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
  quickActionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  quickActionPill: {
    width: (width - 48) / 2,
    borderRadius: 14,
    overflow: "hidden",
  },
  quickActionPillBg: {
    minHeight: 64,
  },
  quickActionPillImage: {
    borderRadius: 14,
  },
  quickActionPillGradient: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 64,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  quickActionPillIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  quickActionPillTextWrap: {
    flex: 1,
  },
  quickActionPillTitle: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  quickActionPillSub: {
    marginTop: 2,
    color: "rgba(255,255,255,0.74)",
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
  presetSwitchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(59,130,246,0.24)",
    borderWidth: 1,
    borderColor: "rgba(147,197,253,0.45)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  presetSwitchText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
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
  newTag: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  newTagText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  fortunesDesc: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
  primaryActionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  primaryAction: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  primaryActionBg: {
    minHeight: 86,
  },
  primaryActionImage: {
    borderRadius: 14,
  },
  primaryActionGradient: {
    minHeight: 86,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
  },
  primaryActionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  primaryActionTextWrap: {
    gap: 3,
  },
  primaryActionTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  primaryActionSub: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 10,
    lineHeight: 14,
  },

  // البطاقة المميزة
  featuredCard: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#ec4899",
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
    justifyContent: "space-between",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#22c55e",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  featuredContent: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  featuredInfo: {},
  featuredTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFF",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  featuredSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },
  playBtn: {
    padding: 12,
    borderRadius: 14,
  },

  // البطاقات الثنائية
  dualCards: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  featureCard: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
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
    justifyContent: "space-between",
  },
  featureBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(96,165,250,0.8)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  featureBadgeText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "bold",
  },
  featureBottom: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  featureContent: {},
  featureTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  featureSubtitle: {
    fontSize: 10,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  featureBtn: {
    padding: 8,
    borderRadius: 10,
  },

  // نصيحة
  tipCard: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 4,
  },
  tipImage: {
    borderRadius: 12,
  },
  tipOverlay: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.26)",
    backgroundColor: "rgba(15,23,42,0.34)",
  },
  tipText: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 12,
    flex: 1,
  },
});

export default HomeScreen;
