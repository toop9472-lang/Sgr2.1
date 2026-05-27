// TrendingTodayScreen — most-gifted reels in the past day/week/month.
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import api from "../services/api";

const { width: SCREEN_W } = Dimensions.get("window");
const GAP = 10;
const CARD_W = (SCREEN_W - GAP * 3 - 28) / 2; // two columns with side padding 14

const PERIODS = [
  { id: "day", label_ar: "اليوم" },
  { id: "week", label_ar: "أسبوع" },
  { id: "month", label_ar: "شهر" },
  { id: "all", label_ar: "الكل" },
];

const fetchTrending = async (period, limit = 30) => {
  try {
    const r = await api.fetch(`/api/gifts/trending-reels?period=${period}&limit=${limit}`);
    if (!r.ok) return { reels: [] };
    return await r.json();
  } catch (_) {
    return { reels: [] };
  }
};

const TrendingTodayScreen = ({ user, onBack, onOpenUserProfile, onOpenClip }) => {
  const [period, setPeriod] = useState("day");
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const d = await fetchTrending(period, 30);
    setReels(Array.isArray(d?.reels) ? d.reels : []);
    setLoading(false);
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => onOpenClip && onOpenClip(item.clip_id)}
    >
      {item.thumbnail_url ? (
        <Image source={{ uri: item.thumbnail_url }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPh]}>
          <Ionicons name="play" size={32} color="rgba(255,255,255,0.4)" />
        </View>
      )}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.95)"]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <View style={styles.rankBadge}>
        <Ionicons name="flame" size={11} color="#fb923c" />
        <Text style={styles.rankText}>#{item.rank}</Text>
      </View>
      <View style={styles.sarBadge}>
        <Ionicons name="cash" size={11} color="#78350f" />
        <Text style={styles.sarText}>{item.total_sar}</Text>
      </View>
      <View style={styles.footer}>
        <View style={styles.userRow}>
          {item.user_avatar ? (
            <Image source={{ uri: item.user_avatar }} style={styles.userAvatar} />
          ) : null}
          <Text style={styles.userName} numberOfLines={1}>
            {item.user_name}
          </Text>
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="gift" size={10} color="#f9a8d4" />
            <Text style={styles.statText}>{item.total_gifts}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="heart" size={10} color="#fda4af" />
            <Text style={styles.statText}>{item.likes_count}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="eye" size={10} color="#cbd5e1" />
            <Text style={styles.statText}>{item.views_count}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerBtn} accessibilityLabel="رجوع">
          <Ionicons name="chevron-forward" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Ionicons name="flame" size={18} color="#fb923c" />
          <Text style={styles.headerTitle}>ترند اليوم</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroText}>🔥 الريلز التي تستلم أكثر هدايا — مرتبة حسب القيمة</Text>
      </View>

      {/* Period */}
      <View style={styles.periodRow}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[styles.periodBtn, period === p.id && styles.periodBtnActive]}
            onPress={() => setPeriod(p.id)}
          >
            <Text style={[styles.periodText, period === p.id && styles.periodTextActive]}>
              {p.label_ar}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Grid */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#fb923c" />
        </View>
      ) : reels.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="flame-outline" size={64} color="rgba(255,255,255,0.25)" />
          <Text style={styles.emptyTitle}>لا توجد ريلز في الترند بعد</Text>
          <Text style={styles.emptySub}>أرسل هدية لريل لتساعده على الوصول إلى الترند!</Text>
        </View>
      ) : (
        <FlatList
          data={reels}
          keyExtractor={(r) => r.clip_id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={{ gap: GAP, paddingHorizontal: 14 }}
          contentContainerStyle={{ gap: GAP, paddingVertical: 4, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fb923c" />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "rgba(10,4,16,0.6)" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 48,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "800" },
  hero: {
    marginHorizontal: 14,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(251,146,60,0.10)",
    borderWidth: 1,
    borderColor: "rgba(251,146,60,0.30)",
    marginBottom: 10,
  },
  heroText: {
    color: "#fed7aa",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
  },
  periodRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  periodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  periodBtnActive: {
    backgroundColor: "rgba(251,146,60,0.20)",
    borderColor: "rgba(251,146,60,0.5)",
  },
  periodText: { color: "rgba(226,232,240,0.65)", fontSize: 11, fontWeight: "700" },
  periodTextActive: { color: "#fed7aa" },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    gap: 6,
  },
  emptyTitle: { color: "#fff", fontSize: 15, fontWeight: "700", marginTop: 12 },
  emptySub: {
    color: "rgba(226,232,240,0.55)",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  card: {
    width: CARD_W,
    aspectRatio: 9 / 14,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(15,23,42,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  thumb: { ...StyleSheet.absoluteFillObject, resizeMode: "cover" },
  thumbPh: {
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
  },
  rankBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderWidth: 1,
    borderColor: "rgba(251,146,60,0.45)",
  },
  rankText: { color: "#fed7aa", fontSize: 11, fontWeight: "800" },
  sarBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(251,191,36,0.95)",
  },
  sarText: { color: "#78350f", fontSize: 11, fontWeight: "800" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    justifyContent: "flex-end",
    marginBottom: 3,
  },
  userAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  userName: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    maxWidth: CARD_W - 40,
  },
  title: {
    color: "rgba(226,232,240,0.9)",
    fontSize: 11,
    textAlign: "right",
  },
  statsRow: {
    marginTop: 5,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  stat: { flexDirection: "row", alignItems: "center", gap: 2 },
  statText: { color: "rgba(226,232,240,0.8)", fontSize: 10, fontWeight: "600" },
});

export default TrendingTodayScreen;
