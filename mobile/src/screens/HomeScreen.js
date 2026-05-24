// Home Screen — Calm, premium, polished.
// Two distinct visual themes the user can switch between in one tap:
//   • "luxuryDark"  — Black & gold (true premium feel — App Store-tier)
//   • "brightModern" — Clean white & blue (modern / classic minimal feel)
// Both share the SAME information density (low) and use Ionicons only.
// No busy background images.
import React, { useState, useMemo, useCallback, useEffect, useRef, memo } from "react";
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
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useLanguage } from "../i18n/LanguageContext";
import { hapticLight } from "../utils/haptics";
import { HOME_ICONS } from "../constants/uiAssets";

const { width } = Dimensions.get("window");

/* ---------- Theme tokens (two highly distinct presets) ---------- */
const themes = {
  luxuryDark: {
    id: "luxuryDark",
    bg: ["#06070d", "#0a0b14", "#0d0d1a"],
    surface: "#11121b",
    surfaceAlt: "#161823",
    border: "rgba(255,215,128,0.10)",
    text: "#ffffff",
    textMuted: "#9ca3af",
    accent: "#fbbf24", // gold
    accentSoft: "rgba(251,191,36,0.13)",
    icon: "#fbbf24",
    cardElevation: 0,
    statusGood: "#34d399",
    chip: "rgba(255,255,255,0.06)",
    label: "فاخر",
    labelEn: "Luxury",
  },
  brightModern: {
    id: "brightModern",
    bg: ["#f4f6fb", "#eaf0fa", "#dfe8f5"],
    surface: "#ffffff",
    surfaceAlt: "#f8fafd",
    border: "rgba(59,130,246,0.15)",
    text: "#0f172a",
    textMuted: "#64748b",
    accent: "#3b82f6", // blue
    accentSoft: "rgba(59,130,246,0.10)",
    icon: "#3b82f6",
    cardElevation: 2,
    statusGood: "#10b981",
    chip: "rgba(15,23,42,0.05)",
    label: "كلاسيك",
    labelEn: "Classic",
  },
};

/* ---------- Reusable atoms ---------- */

const Pill = memo(({ icon, label, accent, bg, textColor }) => (
  <View style={[styles.pill, { backgroundColor: bg }]}>
    <Ionicons name={icon} size={11} color={accent} />
    <Text style={[styles.pillText, { color: textColor }]}>{label}</Text>
  </View>
));

const StatCard = memo(({ icon, value, label, theme }) => (
  <View
    style={[
      styles.statCard,
      {
        backgroundColor: theme.surface,
        borderColor: theme.border,
        shadowOpacity: theme.cardElevation ? 0.08 : 0,
      },
    ]}
  >
    <View
      style={[
        styles.statIconWrap,
        { backgroundColor: theme.accentSoft, borderColor: theme.border },
      ]}
    >
      <Ionicons name={icon} size={16} color={theme.accent} />
    </View>
    <Text style={[styles.statValue, { color: theme.text }]} numberOfLines={1}>
      {value}
    </Text>
    <Text style={[styles.statLabel, { color: theme.textMuted }]} numberOfLines={1}>
      {label}
    </Text>
  </View>
));

const ActionRow = memo(({ icon, iconImage, title, subtitle, theme, onPress, badge }) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={() => {
      hapticLight();
      onPress && onPress();
    }}
    style={[
      styles.actionRow,
      {
        backgroundColor: theme.surface,
        borderColor: theme.border,
        shadowOpacity: theme.cardElevation ? 0.06 : 0.18,
      },
    ]}
  >
    <View
      style={[
        styles.actionIconWrap,
        {
          backgroundColor: iconImage ? "transparent" : theme.accentSoft,
          borderColor: iconImage ? "transparent" : theme.border,
        },
      ]}
    >
      {iconImage ? (
        <Image
          source={iconImage}
          style={styles.actionIconImage}
          resizeMode="contain"
        />
      ) : (
        <Ionicons name={icon} size={20} color={theme.accent} />
      )}
    </View>
    <View style={styles.actionBody}>
      <View style={styles.actionTitleRow}>
        <Text
          style={[styles.actionTitle, { color: theme.text }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {badge && (
          <View
            style={[
              styles.actionBadge,
              {
                backgroundColor: theme.accentSoft,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.actionBadgeText, { color: theme.accent }]}>
              {badge}
            </Text>
          </View>
        )}
      </View>
      <Text
        style={[styles.actionSubtitle, { color: theme.textMuted }]}
        numberOfLines={1}
      >
        {subtitle}
      </Text>
    </View>
    <Ionicons
      name="chevron-back"
      size={16}
      color={theme.textMuted}
      style={{ opacity: 0.5 }}
    />
  </TouchableOpacity>
));

/* ---------- Main screen ---------- */

const HomeScreen = ({
  user,
  onNavigateToAds,
  onNavigateToClips,
  onNavigateToChat,
  onNavigateToFortunes,
  onNavigateToFriends,
  homePreset,
  onHomePresetChange,
  onRefresh,
}) => {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [refreshing, setRefreshing] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;

  // Resolve theme (default luxuryDark to feel premium on first launch)
  const theme = useMemo(
    () => themes[homePreset === "brightModern" ? "brightModern" : "luxuryDark"],
    [homePreset],
  );
  const otherTheme = useMemo(
    () =>
      themes[theme.id === "luxuryDark" ? "brightModern" : "luxuryDark"],
    [theme.id],
  );

  // Soft fade-in whenever preset changes — gives the toggle real feedback
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [theme.id, fade]);

  const copy = useMemo(
    () => ({
      welcomePrefix: isArabic ? "أهلاً" : "Welcome",
      welcomeSub: isArabic
        ? "ابدأ يومك بمشاهدة إعلانات واكتساب جواهر صقر"
        : "Start your day by watching ads and earning Saqr gems",
      defaultPlayer: isArabic ? "لاعب" : "Player",
      gems: isArabic ? "جوهرة" : "Gems",
      reels: isArabic ? "ريلز" : "Reels",
      friends: isArabic ? "أصدقاء" : "Friends",
      sectionExplore: isArabic ? "استكشف" : "Explore",
      sectionEarn: isArabic ? "اكسب جواهر" : "Earn Gems",
      sectionConnect: isArabic ? "تواصل" : "Connect",
      adsTitle: isArabic ? "شاهد وأكسب" : "Watch & Earn",
      adsSub: isArabic ? "إعلانات قصيرة = جواهر فورية" : "Short ads = instant gems",
      reelsTitle: isArabic ? "ريلز المجتمع" : "Community Reels",
      reelsSub: isArabic ? "15 ثانية لكل مقطع" : "15 seconds each",
      fortunesTitle: isArabic ? "ثروات صقر" : "Saqr Fortunes",
      fortunesSub: isArabic ? "500 جوهرة = 3 ﷼" : "500 gems = 3 SAR",
      chatTitle: isArabic ? "الدردشة العامة" : "Global Chat",
      chatSub: isArabic ? "مجانية بالكامل" : "Always free",
      friendsTitle: isArabic ? "الأصدقاء" : "Friends",
      friendsSub: isArabic ? "أضف وتواصل" : "Add & connect",
      free: isArabic ? "مجاني" : "Free",
      new: isArabic ? "جديد" : "New",
    }),
    [isArabic],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (onRefresh) await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);

  useEffect(() => {
    if (onRefresh) onRefresh();
  }, []);

  const handleToggleTheme = useCallback(() => {
    hapticLight();
    const next = theme.id === "luxuryDark" ? "brightModern" : "luxuryDark";
    onHomePresetChange && onHomePresetChange(next);
  }, [theme.id, onHomePresetChange]);

  const userName = user?.name || copy.defaultPlayer;
  const gemsValue =
    Number(user?.saqr_gems ?? user?.saqr_points ?? user?.points ?? 0) || 0;

  return (
    <LinearGradient
      colors={theme.bg}
      style={styles.bg}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
      >
        <Animated.View style={{ opacity: fade }}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <LanguageSwitcher />
              <View style={styles.greetingBlock}>
                <Text style={[styles.greeting, { color: theme.text }]}>
                  {copy.welcomePrefix} {userName}
                </Text>
                <Text
                  style={[styles.subGreeting, { color: theme.textMuted }]}
                  numberOfLines={1}
                >
                  {copy.welcomeSub}
                </Text>
              </View>
            </View>

            {/* Theme toggle — large and obvious */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleToggleTheme}
              style={[
                styles.themeToggle,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <Ionicons
                name={theme.id === "luxuryDark" ? "moon" : "sunny"}
                size={14}
                color={theme.accent}
              />
              <Text
                style={[styles.themeToggleText, { color: theme.text }]}
              >
                {isArabic ? theme.label : theme.labelEn}
              </Text>
              <View
                style={[styles.themeNextDot, { backgroundColor: otherTheme.accent }]}
              />
            </TouchableOpacity>
          </View>

          {/* Hero balance — gems are the soul of this app */}
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                shadowOpacity: theme.cardElevation ? 0.10 : 0,
              },
            ]}
          >
            <View style={styles.heroTop}>
              <Pill
                icon="diamond"
                label={copy.gems}
                accent={theme.accent}
                bg={theme.accentSoft}
                textColor={theme.text}
              />
              <View
                style={[styles.dotBadge, { backgroundColor: theme.statusGood }]}
              />
            </View>
            <Text style={[styles.heroValue, { color: theme.text }]}>
              {gemsValue.toLocaleString("en-US")}
            </Text>
            <Text style={[styles.heroLabel, { color: theme.textMuted }]}>
              {isArabic
                ? "رصيدك الحالي • يُحدّث تلقائياً"
                : "Your current balance • auto-synced"}
            </Text>

            <View style={styles.miniStats}>
              <StatCard
                icon="play-circle"
                value={user?.clips_count || 0}
                label={copy.reels}
                theme={theme}
              />
              <StatCard
                icon="people"
                value={user?.friends_count || 0}
                label={copy.friends}
                theme={theme}
              />
              <StatCard
                icon="eye"
                value={user?.watched_ads_today || 0}
                label={isArabic ? "اليوم" : "Today"}
                theme={theme}
              />
            </View>
          </View>

          {/* Earn section */}
          <Text
            style={[styles.sectionLabel, { color: theme.textMuted }]}
          >
            {copy.sectionEarn}
          </Text>
          <ActionRow
            icon="play-circle"
            iconImage={HOME_ICONS.watch}
            title={copy.adsTitle}
            subtitle={copy.adsSub}
            theme={theme}
            onPress={onNavigateToAds}
          />
          <ActionRow
            icon="diamond"
            iconImage={HOME_ICONS.fortunes}
            title={copy.fortunesTitle}
            subtitle={copy.fortunesSub}
            theme={theme}
            onPress={onNavigateToFortunes}
            badge={copy.new}
          />

          {/* Explore section */}
          <Text
            style={[styles.sectionLabel, { color: theme.textMuted }]}
          >
            {copy.sectionExplore}
          </Text>
          <ActionRow
            icon="film"
            iconImage={HOME_ICONS.reels}
            title={copy.reelsTitle}
            subtitle={copy.reelsSub}
            theme={theme}
            onPress={onNavigateToClips}
          />

          {/* Connect section */}
          <Text
            style={[styles.sectionLabel, { color: theme.textMuted }]}
          >
            {copy.sectionConnect}
          </Text>
          <ActionRow
            icon="chatbubble-ellipses"
            iconImage={HOME_ICONS.chat}
            title={copy.chatTitle}
            subtitle={copy.chatSub}
            theme={theme}
            onPress={onNavigateToChat}
            badge={copy.free}
          />
          <ActionRow
            icon="people"
            iconImage={HOME_ICONS.friends}
            title={copy.friendsTitle}
            subtitle={copy.friendsSub}
            theme={theme}
            onPress={onNavigateToFriends}
          />

          {/* Footer note */}
          <View style={styles.footerNote}>
            <View
              style={[
                styles.footerDot,
                { backgroundColor: theme.statusGood },
              ]}
            />
            <Text style={{ color: theme.textMuted, fontSize: 11 }}>
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

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  greetingBlock: { flex: 1 },
  greeting: { fontSize: 17, fontWeight: "800", textAlign: "right" },
  subGreeting: { fontSize: 11, marginTop: 2, textAlign: "right" },

  themeToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 22,
    borderWidth: 1,
  },
  themeToggleText: { fontSize: 12, fontWeight: "700" },
  themeNextDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 2,
  },

  /* Hero */
  heroCard: {
    marginHorizontal: 16,
    marginBottom: 22,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
    borderRadius: 22,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 4,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillText: { fontSize: 11, fontWeight: "700" },
  dotBadge: { width: 8, height: 8, borderRadius: 4 },
  heroValue: {
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: -1.2,
    textAlign: "right",
    marginTop: 6,
    marginBottom: 2,
  },
  heroLabel: { fontSize: 11, textAlign: "right" },

  /* Mini stats inside hero */
  miniStats: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  statCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  statValue: { fontSize: 15, fontWeight: "800" },
  statLabel: { fontSize: 10, marginTop: 1 },

  /* Section labels */
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textAlign: "right",
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 8,
    textTransform: "uppercase",
  },

  /* Action rows */
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
  actionIconImage: {
    width: 48,
    height: 48,
  },
  actionBody: { flex: 1, alignItems: "flex-end" },
  actionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionTitle: { fontSize: 14, fontWeight: "700", textAlign: "right" },
  actionSubtitle: { fontSize: 11, marginTop: 2, textAlign: "right" },
  actionBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBadgeText: { fontSize: 10, fontWeight: "700" },

  /* Footer */
  footerNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 24,
    paddingHorizontal: 16,
  },
  footerDot: { width: 5, height: 5, borderRadius: 3 },
});

export default memo(HomeScreen);
