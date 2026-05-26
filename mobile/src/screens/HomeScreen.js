// Saqr Home — single luxury design (no theme toggle).
// Each section is a full-image card with text overlay.
import React, { useState, useCallback, useEffect, useRef, memo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
  Animated,
  Easing,
  ImageBackground,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useLanguage } from "../i18n/LanguageContext";
import { hapticLight } from "../utils/haptics";
import { HOME_ICONS } from "../constants/uiAssets";

const { width: SCREEN_W } = Dimensions.get("window");
const TILE_W = SCREEN_W - 32;
const TILE_H = Math.round(TILE_W * 9 / 16);
const SQUARE_W = (SCREEN_W - 44) / 2;

const accent = "#fbbf24";
const accentSoft = "rgba(251,191,36,0.18)";
const borderGold = "rgba(255,215,128,0.18)";

const HeroTile = memo(({ image, title, subtitle, badge, onPress, isRTL }) => (
  <TouchableOpacity
    activeOpacity={0.9}
    accessibilityRole="button"
    accessibilityLabel={`${title}. ${subtitle}`}
    onPress={() => { hapticLight(); onPress && onPress(); }}
    style={[styles.heroTile, { width: TILE_W, height: TILE_H }]}
  >
    <ImageBackground source={image} style={styles.heroBg} imageStyle={styles.heroImg}>
      <LinearGradient
        colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0.45)", "rgba(0,0,0,0.92)"]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      {!!badge && (
        <View
          style={[
            styles.tileBadge,
            isRTL ? { left: 12 } : { right: 12 },
          ]}
        >
          <Text style={styles.tileBadgeText}>{badge}</Text>
        </View>
      )}
      <View style={styles.heroBottom}>
        <Text style={styles.heroTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.heroSub} numberOfLines={1}>{subtitle}</Text>
        <View style={styles.heroOpenRow}>
          <View style={styles.heroOpenDot} />
          <Text style={styles.heroOpenText}>{isRTL ? "افتح" : "Open"}</Text>
          <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={14} color="#fff" />
        </View>
      </View>
    </ImageBackground>
  </TouchableOpacity>
));

const SquareTile = memo(({ image, title, subtitle, onPress, isRTL }) => (
  <TouchableOpacity
    activeOpacity={0.9}
    accessibilityRole="button"
    accessibilityLabel={`${title}. ${subtitle}`}
    onPress={() => { hapticLight(); onPress && onPress(); }}
    style={[styles.squareTile, { width: SQUARE_W, height: SQUARE_W }]}
  >
    <ImageBackground source={image} style={styles.heroBg} imageStyle={styles.heroImg}>
      <LinearGradient
        colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.92)"]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.squareBottom}>
        <Text style={styles.squareTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.squareSub} numberOfLines={1}>{subtitle}</Text>
      </View>
    </ImageBackground>
  </TouchableOpacity>
));

const HomeScreen = ({
  user,
  onNavigateToAds,
  onNavigateToClips,
  onNavigateToChat,
  onNavigateToFortunes,
  onNavigateToFriends,
  onNavigateToGifts,
  onRefresh,
}) => {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [refreshing, setRefreshing] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [fade]);

  useEffect(() => {
    if (onRefresh) onRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (onRefresh) await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);

  const userName = user?.name || (isArabic ? "لاعب" : "Player");
  const gemsValue =
    Number(user?.saqr_gems ?? user?.saqr_points ?? user?.points ?? 0) || 0;

  return (
    <LinearGradient
      colors={["#06070d", "#0a0b14", "#0d0d1a"]}
      style={styles.bg}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={accent}
            colors={[accent]}
          />
        }
      >
        <Animated.View style={{ opacity: fade }}>
          {/* Header */}
          <View style={styles.header}>
            <LanguageSwitcher />
            <View style={styles.greetBlock}>
              <Text style={styles.greet} numberOfLines={1}>
                {isArabic ? "أهلاً" : "Welcome"} {userName}
              </Text>
              <Text style={styles.subGreet} numberOfLines={1}>
                {isArabic
                  ? "شاهد، اربح، شارك — كل شيء في صقر"
                  : "Watch, earn, share — all in Saqr"}
              </Text>
            </View>
          </View>

          {/* Hero balance */}
          <View style={styles.balanceCard}>
            <Image source={HOME_ICONS.brand} style={styles.balanceBrand} />
            <View style={styles.balanceRight}>
              <View style={styles.balancePillRow}>
                <Ionicons name="diamond" size={12} color={accent} />
                <Text style={styles.balancePill}>{isArabic ? "جوهرة" : "Gems"}</Text>
              </View>
              <Text style={styles.balanceValue}>
                {gemsValue.toLocaleString("en-US")}
              </Text>
              <Text style={styles.balanceMuted}>
                {isArabic ? "رصيدك الحالي • يُحدّث تلقائياً" : "Auto-synced balance"}
              </Text>
            </View>
          </View>

          {/* FEATURED — Watch & Earn */}
          <Text style={styles.sectionLabel}>{isArabic ? "مميز" : "FEATURED"}</Text>
          <View style={styles.tileWrap}>
            <HeroTile
              image={HOME_ICONS.watch}
              title={isArabic ? "شاهد وأكسب" : "Watch & Earn"}
              subtitle={isArabic ? "إعلانات قصيرة = جواهر فورية" : "Short ads = instant gems"}
              badge={isArabic ? "الأكثر رواجاً" : "Hot"}
              onPress={onNavigateToAds}
              isRTL={isArabic}
            />
          </View>

          {/* EARN — Fortunes */}
          <Text style={styles.sectionLabel}>{isArabic ? "اكسب جواهر" : "EARN GEMS"}</Text>
          <View style={styles.tileWrap}>
            <HeroTile
              image={HOME_ICONS.fortunes}
              title={isArabic ? "ثروات صقر" : "Saqr Fortunes"}
              subtitle={isArabic ? "500 جوهرة = 3 ﷼" : "500 gems = 3 SAR"}
              badge={isArabic ? "جديد" : "New"}
              onPress={onNavigateToFortunes}
              isRTL={isArabic}
            />
          </View>

          {/* EXPLORE — Reels */}
          <Text style={styles.sectionLabel}>{isArabic ? "استكشف" : "EXPLORE"}</Text>
          <View style={styles.tileWrap}>
            <HeroTile
              image={HOME_ICONS.reels}
              title={isArabic ? "ريلز المجتمع" : "Community Reels"}
              subtitle={isArabic ? "15 ثانية لكل مقطع" : "15 seconds each"}
              onPress={onNavigateToClips}
              isRTL={isArabic}
            />
          </View>

          {/* GIFTS — Hub */}
          <Text style={styles.sectionLabel}>{isArabic ? "الهدايا" : "GIFTS"}</Text>
          <View style={styles.tileWrap}>
            <HeroTile
              image={HOME_ICONS.gifts}
              title={isArabic ? "مركز الهدايا" : "Gifts Hub"}
              subtitle={isArabic ? "متجر • هداياي • لوحة الداعمين • ترند" : "Store • Inbox • Leaderboard • Trending"}
              badge={isArabic ? "جديد ✨" : "New ✨"}
              onPress={onNavigateToGifts}
              isRTL={isArabic}
            />
          </View>

          {/* CONNECT — two squares */}
          <Text style={styles.sectionLabel}>{isArabic ? "تواصل" : "CONNECT"}</Text>
          <View style={styles.squareRow}>
            <SquareTile
              image={HOME_ICONS.chat}
              title={isArabic ? "الدردشة" : "Chat"}
              subtitle={isArabic ? "مجانية" : "Free"}
              onPress={onNavigateToChat}
              isRTL={isArabic}
            />
            <SquareTile
              image={HOME_ICONS.friends}
              title={isArabic ? "الأصدقاء" : "Friends"}
              subtitle={isArabic ? "أضف وتواصل" : "Add & connect"}
              onPress={onNavigateToFriends}
              isRTL={isArabic}
            />
          </View>

          {/* Footer */}
          <View style={styles.footerNote}>
            <View style={styles.footerDot} />
            <Text style={styles.footerText}>
              {isArabic
                ? "صقر — اكسب من مشاهداتك اليومية"
                : "Saqr — earn from your daily views"}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 10,
  },
  greetBlock: { flex: 1 },
  greet: { color: "#fff", fontSize: 16, fontWeight: "800", textAlign: "right" },
  subGreet: { color: "#94a3b8", fontSize: 11, marginTop: 2, textAlign: "right" },

  balanceCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: borderGold,
    backgroundColor: "#11121b",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 5,
  },
  balanceBrand: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#0a0a0f",
  },
  balanceRight: { flex: 1, alignItems: "flex-end" },
  balancePillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
  },
  balancePill: { color: accent, fontSize: 10, fontWeight: "700" },
  balanceValue: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.8,
    marginTop: 4,
  },
  balanceMuted: { color: "#94a3b8", fontSize: 10, marginTop: 2 },

  sectionLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    paddingHorizontal: 20,
    marginTop: 14,
    marginBottom: 8,
    textAlign: "right",
    textTransform: "uppercase",
  },

  tileWrap: { paddingHorizontal: 16 },
  heroTile: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#0a0a0f",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.5,
    shadowRadius: 22,
    elevation: 6,
  },
  heroBg: { flex: 1, justifyContent: "flex-end" },
  heroImg: { borderRadius: 22 },
  tileBadge: {
    position: "absolute",
    top: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  tileBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  heroBottom: { padding: 16 },
  heroTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  heroSub: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2 },
  heroOpenRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  heroOpenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: accent },
  heroOpenText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  squareRow: {
    paddingHorizontal: 16,
    flexDirection: "row",
    gap: 12,
  },
  squareTile: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#0a0a0f",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 5,
  },
  squareBottom: { padding: 12 },
  squareTitle: { color: "#fff", fontSize: 14, fontWeight: "800" },
  squareSub: { color: "rgba(255,255,255,0.8)", fontSize: 10, marginTop: 2 },

  footerNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 24,
  },
  footerDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#34d399" },
  footerText: { color: "#94a3b8", fontSize: 11 },
});

export default memo(HomeScreen);
