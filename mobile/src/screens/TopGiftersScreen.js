// TopGiftersScreen — leaderboard of top gifters (most popular receivers + biggest supporters).
// Tab: استقبل (received) | أرسل (sent)
// Period: all | month | week | day
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import api from "../services/api";

const SCOPES = [
  { id: "received", label_ar: "الأكثر استلاماً", icon: "trophy" },
  { id: "sent", label_ar: "أكبر داعمين", icon: "heart" },
];

const PERIODS = [
  { id: "all", label_ar: "الكل" },
  { id: "month", label_ar: "هذا الشهر" },
  { id: "week", label_ar: "أسبوع" },
  { id: "day", label_ar: "يوم" },
];

const fetchLeaderboard = async (scope, period, limit = 50) => {
  try {
    const r = await api.fetch(
      `/api/gifts/leaderboard?scope=${scope}&period=${period}&limit=${limit}`,
    );
    if (!r.ok) return { leaderboard: [] };
    return await r.json();
  } catch (_) {
    return { leaderboard: [] };
  }
};

const rankBadgeColors = {
  1: { bg: "#facc15", border: "#fde68a" },
  2: { bg: "#94a3b8", border: "#cbd5e1" },
  3: { bg: "#f97316", border: "#fdba74" },
};

const TopGiftersScreen = ({ user, onBack, onOpenUserProfile }) => {
  const [scope, setScope] = useState("received");
  const [period, setPeriod] = useState("all");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const viewerId = user?.id || user?.user_id;

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchLeaderboard(scope, period, 50);
    setRows(Array.isArray(data?.leaderboard) ? data.leaderboard : []);
    setLoading(false);
  }, [scope, period]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const renderItem = ({ item }) => {
    const rank = item.rank;
    const medal = rankBadgeColors[rank];
    const isViewer = item.user_id === viewerId;
    return (
      <TouchableOpacity
        style={[styles.row, isViewer && styles.rowSelf]}
        activeOpacity={0.85}
        onPress={() => {
          if (onOpenUserProfile && item.user_id) {
            onOpenUserProfile(item.user_id);
          }
        }}
      >
        <View
          style={[
            styles.rankWrap,
            medal && { backgroundColor: medal.bg, borderColor: medal.border },
          ]}
        >
          {rank <= 3 ? (
            <Ionicons
              name={rank === 1 ? "trophy" : "medal"}
              size={16}
              color={rank === 1 ? "#78350f" : "#0f172a"}
            />
          ) : (
            <Text style={styles.rankNumber}>{rank}</Text>
          )}
        </View>
        <View style={styles.avatarWrap}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPh]}>
              <Text style={styles.avatarText}>
                {(item.name || "م")[0]?.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            {item.is_verified ? (
              <Ionicons name="checkmark-circle" size={13} color="#22d3ee" />
            ) : null}
          </View>
          <Text style={styles.subline}>
            {item.total_gifts} هدية · {item.total_gems} جوهرة
          </Text>
        </View>
        <View style={styles.sarBadge}>
          <Ionicons name="cash-outline" size={12} color="#fbbf24" />
          <Text style={styles.sarText}>{item.total_sar} ر.س</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerBtn} accessibilityLabel="رجوع">
          <Ionicons name="chevron-forward" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>لوحة الداعمين</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Scope toggle */}
      <View style={styles.scopeRow}>
        {SCOPES.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.scopeBtn, scope === s.id && styles.scopeBtnActive]}
            onPress={() => setScope(s.id)}
          >
            <Ionicons
              name={s.icon}
              size={14}
              color={scope === s.id ? "#fde68a" : "rgba(226,232,240,0.6)"}
            />
            <Text style={[styles.scopeText, scope === s.id && styles.scopeTextActive]}>
              {s.label_ar}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Period selector */}
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

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#fbbf24" />
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="trophy-outline" size={64} color="rgba(255,255,255,0.25)" />
          <Text style={styles.emptyTitle}>لا توجد بيانات بعد</Text>
          <Text style={styles.emptySubtitle}>
            كن أول من يرسل هدية لتظهر هنا!
          </Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.user_id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 40, gap: 8 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fbbf24"
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "rgba(5,7,13,0.55)" },
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
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "800" },
  scopeRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    marginTop: 6,
  },
  scopeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  scopeBtnActive: {
    backgroundColor: "rgba(250,204,21,0.16)",
    borderColor: "rgba(250,204,21,0.5)",
  },
  scopeText: { color: "rgba(226,232,240,0.7)", fontSize: 12, fontWeight: "700" },
  scopeTextActive: { color: "#fde68a" },
  periodRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 14,
    marginTop: 8,
    marginBottom: 6,
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
    backgroundColor: "rgba(96,165,250,0.18)",
    borderColor: "rgba(96,165,250,0.45)",
  },
  periodText: { color: "rgba(226,232,240,0.65)", fontSize: 11, fontWeight: "700" },
  periodTextActive: { color: "#bfdbfe" },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    gap: 8,
  },
  emptyTitle: { color: "#fff", fontSize: 15, fontWeight: "700", marginTop: 12 },
  emptySubtitle: {
    color: "rgba(226,232,240,0.55)",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: "rgba(15,23,42,0.6)",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  rowSelf: {
    borderColor: "rgba(96,165,250,0.55)",
    backgroundColor: "rgba(96,165,250,0.08)",
  },
  rankWrap: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  rankNumber: { color: "#cbd5e1", fontSize: 12, fontWeight: "800" },
  avatarWrap: { width: 38, height: 38 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  avatarPh: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  avatarText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  name: { color: "#fff", fontSize: 14, fontWeight: "800" },
  subline: {
    color: "rgba(226,232,240,0.55)",
    fontSize: 11,
    marginTop: 2,
  },
  sarBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(251,191,36,0.12)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.35)",
  },
  sarText: { color: "#fbbf24", fontSize: 12, fontWeight: "800" },
});

export default TopGiftersScreen;
