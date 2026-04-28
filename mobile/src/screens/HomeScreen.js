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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useLanguage } from "../i18n/LanguageContext";

const { width } = Dimensions.get("window");

const QuickActionPill = memo(({ icon, title, subtitle, colors, onPress }) => (
  <TouchableOpacity style={styles.quickActionPill} onPress={onPress} activeOpacity={0.85}>
    <LinearGradient colors={colors} style={styles.quickActionPillGradient}>
      <View style={styles.quickActionPillIcon}>
        <Ionicons name={icon} size={17} color="#fff" />
      </View>
      <View style={styles.quickActionPillTextWrap}>
        <Text style={styles.quickActionPillTitle}>{title}</Text>
        <Text style={styles.quickActionPillSub}>{subtitle}</Text>
      </View>
    </LinearGradient>
  </TouchableOpacity>
));

// بطاقة مميزة كبيرة
const FeaturedCard = memo(
  ({ title, subtitle, image, colors, icon, onPress, badge }) => (
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
              <Ionicons name={icon || "play"} size={16} color="#FFF" />
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  ),
);

// بطاقة ميزة
const FeatureCard = memo(
  ({ title, subtitle, image, color, icon, onPress, badge }) => (
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
              <Ionicons name={icon} size={14} color="#FFF" />
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

  return (
    <ImageBackground
      source={{
        uri: "https://static.prod-images.emergentagent.com/jobs/40eca190-5242-4463-8c95-bc5f66df29cb/images/e35d59ccd161791b6e9cbecdfa426302685267afa2c8e806fa233976816403de.png",
      }}
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
            <Ionicons name="sparkles-outline" size={16} color="#fbbf24" />
            <Text style={styles.quickStatValue}>{user?.saqr_gems || 0}</Text>
            <Text style={styles.quickStatLabel}>جواهر</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Ionicons name="videocam-outline" size={16} color="#a5f3fc" />
            <Text style={styles.quickStatValue}>{user?.clips_count || 0}</Text>
            <Text style={styles.quickStatLabel}>ريلز</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Ionicons name="chatbubble-ellipses-outline" size={16} color="#93c5fd" />
            <Text style={styles.quickStatValue}>24/7</Text>
            <Text style={styles.quickStatLabel}>دردشة</Text>
          </View>
        </View>

        <View style={styles.quickActionsWrap}>
          <QuickActionPill
            icon="play-circle-outline"
            title={copy.adsPill}
            subtitle={copy.adsPillSub}
            colors={["rgba(245,158,11,0.35)", "rgba(180,83,9,0.45)"]}
            onPress={onNavigateToAds}
          />
          <QuickActionPill
            icon="videocam-outline"
            title={copy.reelsPill}
            subtitle={copy.reelsPillSub}
            colors={["rgba(99,102,241,0.35)", "rgba(79,70,229,0.45)"]}
            onPress={onNavigateToClips}
          />
          <QuickActionPill
            icon="chatbubble-ellipses-outline"
            title={copy.chatPill}
            subtitle={copy.chatPillSub}
            colors={["rgba(14,165,233,0.35)", "rgba(3,105,161,0.45)"]}
            onPress={onNavigateToChat}
          />
          <QuickActionPill
            icon="planet-outline"
            title={copy.fortunesPill}
            subtitle={copy.fortunesPillSub}
            colors={["rgba(236,72,153,0.34)", "rgba(124,58,237,0.44)"]}
            onPress={onNavigateToFortunes}
          />
        </View>

        {/* ثروات صقر - القسم الرئيسي */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles" size={18} color="#ec4899" />
            <Text style={styles.sectionTitle}>{copy.fortunes}</Text>
            <View style={styles.newTag}>
              <Text style={styles.newTagText}>{copy.newLabel}</Text>
            </View>
          </View>

          <FeaturedCard
            title={copy.fortunes}
            subtitle={copy.fortunesSubtitle}
            image="https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/8cdadba2892459ff5914f65842239cb7d223d973dca3d9c0e02dc176bdacf78d.png"
            colors={["#ec4899", "#be185d"]}
            icon="sparkles"
            onPress={onNavigateToFortunes}
            badge={copy.exchangeBadge}
          />

          <Text style={styles.fortunesDesc}>{copy.fortunesDesc}</Text>
        </View>

        <View style={styles.primaryActionsRow}>
          <TouchableOpacity style={styles.primaryAction} onPress={onNavigateToAds}>
            <LinearGradient
              colors={["rgba(245,158,11,0.30)", "rgba(194,65,12,0.35)"]}
              style={styles.primaryActionGradient}
            >
              <View style={styles.primaryActionIcon}>
                <Ionicons name="play-circle-outline" size={18} color="#fff" />
              </View>
              <View style={styles.primaryActionTextWrap}>
                <Text style={styles.primaryActionTitle}>{copy.watchAndEarn}</Text>
                <Text style={styles.primaryActionSub}>{copy.watchAndEarnSubtitle}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryAction}
            onPress={onNavigateToFortunes}
          >
            <LinearGradient
              colors={["rgba(236,72,153,0.32)", "rgba(99,102,241,0.36)"]}
              style={styles.primaryActionGradient}
            >
              <View style={styles.primaryActionIcon}>
                <Ionicons name="planet-outline" size={18} color="#fff" />
              </View>
              <View style={styles.primaryActionTextWrap}>
                <Text style={styles.primaryActionTitle}>{copy.fortunes}</Text>
                <Text style={styles.primaryActionSub}>{copy.exchangeBadge}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* البطاقات الثنائية */}
        <View style={styles.dualCards}>
          <FeatureCard
            title={copy.clips}
            subtitle={copy.clipsSub}
            image="https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/e02071f57750c77c0db321a70a51ed7bceb6eeb4df5f78e29d834466fcf3f354.png"
            color="#8b5cf6"
            icon="film"
            onPress={onNavigateToClips}
          />
          <FeatureCard
            title={copy.friends}
            subtitle={copy.friendsSub}
            image="https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/7f2948052c933ae7604200fd2c98d91f4504fce293deb36ce108cba1d36f062a.png"
            color="#22c55e"
            icon="person-add"
            onPress={onNavigateToFriends}
          />
        </View>

        {/* بطاقات إضافية */}
        <View style={styles.dualCards}>
          <FeatureCard
            title={copy.chat}
            subtitle={copy.chatSub}
            image="https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/bcdacd75d090c4626f5432d13b9b6c4c4560cc34282e9424de1cbc6732f06abf.png"
            color="#3b82f6"
            icon="chatbubbles"
            onPress={onNavigateToChat}
            badge={copy.chatCostBadge}
          />
          <View style={{ flex: 1 }} />
        </View>

        {/* نصيحة */}
        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={18} color="#fbbf24" />
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
