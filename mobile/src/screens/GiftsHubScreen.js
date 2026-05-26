// GiftsHubScreen — single luxury entry point for everything gifts-related.
// 4 large tiles: Gift Store (catalog), My Gifts (inbox), Top Gifters, Trending Today.
// Plus a small "send to a friend" CTA.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ImageBackground,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { GIFT_HUB_ICONS } from "../constants/uiAssets";
import { getCatalog, fetchInbox } from "../services/giftsService";
import { hapticLight } from "../utils/haptics";
import api from "../services/api";

const { width: SCREEN_W } = Dimensions.get("window");
const TILE_W = (SCREEN_W - 32 - 12) / 2;
const TILE_H = Math.round(TILE_W * 1.05);

const HubTile = ({ image, title, subtitle, badge, accent, onPress, testId }) => (
  <TouchableOpacity
    activeOpacity={0.88}
    accessibilityRole="button"
    accessibilityLabel={`${title}. ${subtitle}`}
    onPress={() => { hapticLight(); onPress && onPress(); }}
    style={[styles.tile, { width: TILE_W, height: TILE_H }]}
    testID={testId}
  >
    <LinearGradient
      colors={[`${accent}28`, "rgba(15,23,42,0.85)"]}
      style={StyleSheet.absoluteFillObject}
    />
    {/* Decorative glow */}
    <View style={[styles.tileGlow, { backgroundColor: `${accent}55` }]} />
    {/* 3D Icon */}
    <View style={styles.tileIconWrap}>
      <Image source={{ uri: image }} style={styles.tileIcon} />
    </View>
    {!!badge && (
      <View style={[styles.tileBadge, { backgroundColor: `${accent}40`, borderColor: accent }]}>
        <Text style={[styles.tileBadgeText, { color: accent }]}>{badge}</Text>
      </View>
    )}
    <View style={styles.tileFooter}>
      <Text style={styles.tileTitle} numberOfLines={1}>{title}</Text>
      <Text style={styles.tileSub} numberOfLines={2}>{subtitle}</Text>
      <View style={styles.tileOpenRow}>
        <Text style={[styles.tileOpenText, { color: accent }]}>افتح</Text>
        <Ionicons name="chevron-back" size={13} color={accent} />
      </View>
    </View>
  </TouchableOpacity>
);

const GiftsHubScreen = ({
  user,
  onBack,
  onOpenStore,        // → opens GiftStore (catalog browse)
  onOpenInbox,
  onOpenLeaderboard,
  onOpenTrending,
  onOpenFriends,      // optional — used by send CTA
}) => {
  const userId = user?.id || user?.user_id;
  const [stats, setStats] = useState({ received: 0, gems: 0, catalog: 12 });

  const loadStats = useCallback(async () => {
    try {
      const [cat, inbox] = await Promise.all([
        getCatalog(false).catch(() => null),
        userId ? fetchInbox(userId, 100).catch(() => null) : Promise.resolve(null),
      ]);
      const list = inbox?.gifts || [];
      const gemsSum = list.reduce((s, g) => s + Number(g?.gems_awarded || 0), 0);
      setStats({
        received: list.length,
        gems: gemsSum,
        catalog: Array.isArray(cat?.gifts) ? cat.gifts.length : 12,
      });
    } catch (_) {
      // ignore
    }
  }, [userId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <LinearGradient colors={["#0a0410", "#15102a", "#1c0f30"]} style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Header with hero image */}
        <View style={styles.heroWrap}>
          <ImageBackground
            source={{ uri: GIFT_HUB_ICONS.hero }}
            style={styles.heroBg}
            imageStyle={styles.heroImg}
          >
            <LinearGradient
              colors={["rgba(10,4,16,0.35)", "rgba(28,15,48,0.95)"]}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.heroTopRow}>
              <TouchableOpacity onPress={onBack} style={styles.headerBtn} accessibilityLabel="رجوع">
                <Ionicons name="chevron-forward" size={22} color="#fff" />
              </TouchableOpacity>
              <View style={{ width: 36 }} />
            </View>
            <View style={styles.heroBottom}>
              <Image source={{ uri: GIFT_HUB_ICONS.sparkles }} style={styles.heroSparkle} />
              <Text style={styles.heroTitle}>مركز الهدايا</Text>
              <Text style={styles.heroSub}>كل ما يتعلق بالهدايا — في مكان واحد</Text>
            </View>
          </ImageBackground>
        </View>

        {/* Stats strip */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="gift" size={16} color="#f472b6" />
            <Text style={styles.statValue}>{stats.catalog}</Text>
            <Text style={styles.statLabel}>هدية في المتجر</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="download" size={16} color="#60a5fa" />
            <Text style={styles.statValue}>{stats.received}</Text>
            <Text style={styles.statLabel}>هدية استلمتها</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="diamond" size={16} color="#22d3ee" />
            <Text style={styles.statValue}>{stats.gems}</Text>
            <Text style={styles.statLabel}>جوهرة كسبتها</Text>
          </View>
        </View>

        {/* Section label */}
        <Text style={styles.sectionLabel}>أقسام الهدايا</Text>

        {/* 4 tiles grid */}
        <View style={styles.grid}>
          <HubTile
            image={GIFT_HUB_ICONS.store}
            title="متجر الهدايا"
            subtitle="تصفّح 12 هدية فاخرة بأسعار من 3 إلى 299 ر.س"
            badge="جديد"
            accent="#f472b6"
            onPress={onOpenStore}
            testId="gifts-hub-store"
          />
          <HubTile
            image={GIFT_HUB_ICONS.inbox}
            title="هداياي"
            subtitle="الهدايا التي استقبلتها وأرسلتها"
            accent="#60a5fa"
            onPress={onOpenInbox}
            testId="gifts-hub-inbox"
          />
          <HubTile
            image={GIFT_HUB_ICONS.leaderboard}
            title="لوحة الداعمين"
            subtitle="الأكثر استلاماً وأكبر داعمين"
            accent="#fbbf24"
            onPress={onOpenLeaderboard}
            testId="gifts-hub-leaderboard"
          />
          <HubTile
            image={GIFT_HUB_ICONS.trending}
            title="ترند اليوم"
            subtitle="الريلز الأكثر استلاماً للهدايا"
            badge="🔥"
            accent="#fb923c"
            onPress={onOpenTrending}
            testId="gifts-hub-trending"
          />
        </View>

        {/* How it works */}
        <Text style={styles.sectionLabel}>كيف تعمل الهدايا؟</Text>
        <View style={styles.howCard}>
          <View style={styles.howRow}>
            <View style={[styles.howNum, { backgroundColor: "rgba(244,114,182,0.18)", borderColor: "rgba(244,114,182,0.45)" }]}>
              <Text style={[styles.howNumText, { color: "#f9a8d4" }]}>1</Text>
            </View>
            <Text style={styles.howText}>
              ادخل إلى ملف أي مستخدم أو ريل واضغط زر <Text style={styles.bold}>"هدية"</Text>.
            </Text>
          </View>
          <View style={styles.howRow}>
            <View style={[styles.howNum, { backgroundColor: "rgba(96,165,250,0.18)", borderColor: "rgba(96,165,250,0.45)" }]}>
              <Text style={[styles.howNumText, { color: "#bfdbfe" }]}>2</Text>
            </View>
            <Text style={styles.howText}>
              اختر هدية من 12 خياراً واتمم الشراء عبر <Text style={styles.bold}>Apple Pay</Text>.
            </Text>
          </View>
          <View style={styles.howRow}>
            <View style={[styles.howNum, { backgroundColor: "rgba(34,211,238,0.18)", borderColor: "rgba(34,211,238,0.45)" }]}>
              <Text style={[styles.howNumText, { color: "#67e8f9" }]}>3</Text>
            </View>
            <Text style={styles.howText}>
              المستلم يحصل على <Text style={styles.bold}>20%</Text> من قيمة الهدية كجواهر قابلة للسحب.
            </Text>
          </View>
        </View>

        {/* Send CTA */}
        {onOpenFriends ? (
          <TouchableOpacity
            style={styles.sendCta}
            onPress={() => { hapticLight(); onOpenFriends(); }}
            activeOpacity={0.85}
            accessibilityLabel="أرسل هدية لصديق"
          >
            <LinearGradient
              colors={["#ec4899", "#a855f7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <Ionicons name="paper-plane" size={18} color="#fff" />
            <Text style={styles.sendCtaText}>أرسل هدية لصديق الآن</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroWrap: { height: 200 },
  heroBg: { flex: 1 },
  heroImg: { resizeMode: "cover" },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 48,
    paddingHorizontal: 14,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroBottom: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 14,
    alignItems: "flex-end",
  },
  heroSparkle: { width: 36, height: 36, marginBottom: 4 },
  heroTitle: { color: "#fff", fontSize: 24, fontWeight: "900", textAlign: "right" },
  heroSub: { color: "rgba(244,114,182,0.95)", fontSize: 12, marginTop: 2, fontWeight: "700" },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    marginTop: -22,
    zIndex: 5,
  },
  statCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: "rgba(15,23,42,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    gap: 3,
  },
  statValue: { color: "#fff", fontSize: 18, fontWeight: "900" },
  statLabel: { color: "rgba(226,232,240,0.6)", fontSize: 10, fontWeight: "600", textAlign: "center" },
  sectionLabel: {
    color: "rgba(244,114,182,0.85)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    paddingHorizontal: 18,
    marginTop: 22,
    marginBottom: 10,
    textAlign: "right",
  },
  grid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 14,
  },
  tile: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  tileGlow: {
    position: "absolute",
    top: -32,
    right: -32,
    width: 130,
    height: 130,
    borderRadius: 65,
    opacity: 0.6,
  },
  tileIconWrap: {
    position: "absolute",
    top: 18,
    right: 18,
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  tileIcon: { width: 60, height: 60, resizeMode: "contain" },
  tileBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  tileBadgeText: { fontSize: 10, fontWeight: "800" },
  tileFooter: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 12,
    alignItems: "flex-end",
  },
  tileTitle: { color: "#fff", fontSize: 15, fontWeight: "900", textAlign: "right" },
  tileSub: {
    color: "rgba(226,232,240,0.75)",
    fontSize: 11,
    marginTop: 3,
    textAlign: "right",
    lineHeight: 15,
  },
  tileOpenRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  tileOpenText: { fontSize: 11, fontWeight: "800" },
  howCard: {
    marginHorizontal: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(15,23,42,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 12,
  },
  howRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: 10,
  },
  howNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  howNumText: { fontSize: 12, fontWeight: "900" },
  howText: {
    flex: 1,
    color: "rgba(226,232,240,0.85)",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "right",
  },
  bold: { color: "#fff", fontWeight: "900" },
  sendCta: {
    marginHorizontal: 14,
    marginTop: 18,
    height: 50,
    borderRadius: 16,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sendCtaText: { color: "#fff", fontSize: 14, fontWeight: "900" },
});

export default GiftsHubScreen;
