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

        {/* شاهد واربح */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="play-circle" size={18} color="#f59e0b" />
            <Text style={styles.sectionTitle}>{copy.watchAndEarn}</Text>
          </View>

          <FeaturedCard
            title={copy.watchAndEarn}
            subtitle={copy.watchAndEarnSubtitle}
            image="https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/e14c91a9e40e8d29b6f8d3bf567a4fcb7020c985b1a9d3e96e2035b06f9921e6.png"
            colors={["#f59e0b", "#d97706"]}
            icon="play"
            onPress={onNavigateToAds}
          />
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
