// Home Screen - الصفحة الرئيسية
// بدون ألعاب - فقط ثروات صقر والميزات الأساسية
import React, { useState, useMemo, useCallback, useEffect, useRef, memo } from "react";
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
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useLanguage } from "../i18n/LanguageContext";
import { APP_BACKGROUND_IMAGE, ICON_ASSETS, getHomeCardBackgrounds } from "../constants/uiAssets";

const { width } = Dimensions.get("window");

const ICON_NAME_BY_ASSET = {
  [ICON_ASSETS.home]: "home-outline",
  [ICON_ASSETS.clips]: "play-circle-outline",
  [ICON_ASSETS.watch]: "eye-outline",
  [ICON_ASSETS.advertise]: "megaphone-outline",
  [ICON_ASSETS.profile]: "person-outline",
  [ICON_ASSETS.gems]: "diamond-outline",
  [ICON_ASSETS.chat]: "chatbubble-ellipses-outline",
  [ICON_ASSETS.friends]: "people-outline",
  [ICON_ASSETS.fortunes]: "sparkles-outline",
};

const AppIcon = ({ uri, size = 18, tintColor = "#fff", style }) => {
  const mappedIcon = ICON_NAME_BY_ASSET[uri];
  if (mappedIcon) {
    return <Ionicons name={mappedIcon} size={size} color={tintColor} style={style} />;
  }
  return (
    <Image
      source={{ uri }}
      style={[{ width: size, height: size, resizeMode: "contain" }, style]}
    />
  );
};

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

const QuickActionPill = memo(({ iconSource, title, subtitle, onPress, backgroundImage }) => (
  <TouchableOpacity style={styles.quickActionPill} onPress={onPress} activeOpacity={0.85}>
    <ImageBackground
      source={{ uri: backgroundImage }}
      style={styles.quickActionPillBg}
      imageStyle={styles.quickActionPillImage}
    >
      <LinearGradient
        colors={["rgba(2,6,23,0.24)", "rgba(2,6,23,0.62)"]}
        style={styles.quickActionPillGradient}
      >
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
  ({ iconSource, title, subtitle, onPress, backgroundImage }) => (
    <TouchableOpacity style={styles.primaryAction} onPress={onPress} activeOpacity={0.9}>
      <ImageBackground
        source={{ uri: backgroundImage }}
        style={styles.primaryActionBg}
        imageStyle={styles.primaryActionImage}
      >
        <LinearGradient
          colors={["rgba(2,6,23,0.24)", "rgba(2,6,23,0.66)"]}
          style={styles.primaryActionGradient}
        >
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
            <View style={styles.playBtn}>
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
            <View style={styles.featureBtn}>
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
  const presetFade = useRef(new Animated.Value(1)).current;
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

  const quickPrimaryCards = useMemo(
    () => [
      {
        id: "ads",
        title: copy.adsPill,
        subtitle: copy.adsPillSub,
        iconName: "play-circle-outline",
        onPress: onNavigateToAds,
        backgroundImage: homeCardBackgrounds.quickAds,
      },
      {
        id: "reels",
        title: copy.reelsPill,
        subtitle: copy.reelsPillSub,
        iconName: "videocam-outline",
        onPress: onNavigateToClips,
        backgroundImage: homeCardBackgrounds.quickReels,
      },
      {
        id: "fortunes",
        title: copy.fortunesPill,
        subtitle: copy.fortunesPillSub,
        iconName: "diamond-outline",
        onPress: onNavigateToFortunes,
        backgroundImage: homeCardBackgrounds.quickFortunes,
      },
    ],
    [
      copy.adsPill,
      copy.adsPillSub,
      copy.fortunesPill,
      copy.fortunesPillSub,
      copy.reelsPill,
      copy.reelsPillSub,
      homeCardBackgrounds.quickAds,
      homeCardBackgrounds.quickFortunes,
      homeCardBackgrounds.quickReels,
      onNavigateToAds,
      onNavigateToClips,
      onNavigateToFortunes,
    ],
  );

  useEffect(() => {
    // Smoothly fade home content when switching background presets.
    Animated.sequence([
      Animated.timing(presetFade, {
        toValue: 0.35,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(presetFade, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [homePreset, presetFade]);

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
          <Animated.View style={[styles.content, { opacity: presetFade }]}>
        {/* الترويسة */}
        <View style={styles.headerShell}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <LanguageSwitcher />
              <View style={styles.headerTextWrap}>
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
              <Ionicons name="swap-horizontal" size={14} color="#e2e8f0" />
              <Text style={styles.presetSwitchText}>
                {homePreset === "brightModern" ? copy.styleBright : copy.styleLuxury}
              </Text>
            </TouchableOpacity>
          </View>
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
          {quickPrimaryCards.map((card) => (
            <QuickActionPill
              key={card.id}
              iconSource={card.iconName}
              title={card.title}
              subtitle={card.subtitle}
              backgroundImage={card.backgroundImage}
              onPress={card.onPress}
            />
          ))}
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
            onPress={onNavigateToAds}
            backgroundImage={homeCardBackgrounds.primaryWatch}
          />
          <PrimaryActionCard
            iconSource={ICON_ASSETS.fortunes}
            title={copy.fortunes}
            subtitle={copy.exchangeBadge}
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
          </Animated.View>
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
    padding: 18,
    paddingTop: 24,
    paddingBottom: 120,
  },
  quickStatsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
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
    fontSize: 15,
    fontWeight: "800",
  },
  quickStatLabel: {
    color: "rgba(255,255,255,0.66)",
    fontSize: 10,
    fontWeight: "600",
  },
  quickActionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18,
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
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  quickActionPillIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    lineHeight: 16,
  },
  quickActionPillSub: {
    marginTop: 2,
    color: "rgba(255,255,255,0.74)",
    fontSize: 10,
    lineHeight: 13,
  },

  // الترويسة
  headerShell: {
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.2)",
    backgroundColor: "rgba(2,6,23,0.42)",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  presetSwitchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(15,23,42,0.55)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.32)",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
  },
  presetSwitchText: {
    color: "#e2e8f0",
    fontSize: 9,
    fontWeight: "700",
  },
  greeting: {
    fontSize: 17,
    fontWeight: "800",
    color: "#f8fafc",
    maxWidth: "100%",
  },
  subGreeting: {
    marginTop: 2,
    fontSize: 11,
    color: "rgba(226,232,240,0.72)",
    lineHeight: 15,
  },

  // الأقسام
  section: {
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
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
    lineHeight: 17,
    textAlign: "center",
    marginTop: 10,
  },
  primaryActionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
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
    padding: 13,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
  },
  primaryActionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
    lineHeight: 17,
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
    height: 164,
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
    fontSize: 21,
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
    lineHeight: 16,
  },
  playBtn: {
    padding: 8,
  },

  // البطاقات الثنائية
  dualCards: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
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
    fontWeight: "800",
    color: "#FFF",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  featureSubtitle: {
    fontSize: 10,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
    lineHeight: 13,
  },
  featureBtn: {
    padding: 6,
  },

  // نصيحة
  tipCard: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 6,
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
    lineHeight: 17,
    flex: 1,
  },
});

export default HomeScreen;
