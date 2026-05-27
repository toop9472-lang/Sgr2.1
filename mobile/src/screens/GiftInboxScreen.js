// GiftInboxScreen — shows the user's received & sent gifts history.
// Tab switcher (استقبلت / أرسلت) → list of gift transactions with icon, sender/receiver, price, and gems awarded.
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { fetchInbox } from "../services/giftsService";
import api from "../services/api";

const TABS = [
  { id: "received", label_ar: "استقبلت", icon: "download-outline" },
  { id: "sent", label_ar: "أرسلت", icon: "send-outline" },
];

const fetchSent = async (userId, limit = 50) => {
  if (!userId) return { gifts: [], count: 0 };
  try {
    const r = await api.fetch(
      `/api/gifts/sent/${encodeURIComponent(userId)}?limit=${limit}`,
    );
    if (!r.ok) return { gifts: [], count: 0 };
    return await r.json();
  } catch (_) {
    return { gifts: [], count: 0 };
  }
};

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (_) {
    return "";
  }
};

const GiftInboxScreen = ({ user, onBack }) => {
  const userId = user?.id || user?.user_id;
  const [tab, setTab] = useState("received");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data =
        tab === "received" ? await fetchInbox(userId) : await fetchSent(userId);
      setItems(Array.isArray(data?.gifts) ? data.gifts : []);
    } catch (_) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [tab, userId]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const totals = useMemo(() => {
    let sar = 0;
    let gems = 0;
    for (const it of items) {
      sar += Number(it?.price_sar || 0);
      gems += Number(it?.gems_awarded || 0);
    }
    return { sar: Math.round(sar * 100) / 100, gems };
  }, [items]);

  const renderItem = ({ item }) => {
    const isReceived = tab === "received";
    const counterpartName = isReceived
      ? item?.sender_name || "مستخدم"
      : item?.receiver_name || "مستخدم";
    return (
      <View style={styles.row}>
        <View style={styles.rowIconWrap}>
          {item?.gift_icon_url ? (
            <Image source={{ uri: item.gift_icon_url }} style={styles.rowIcon} />
          ) : (
            <Ionicons name="gift-outline" size={28} color="#cbd5e1" />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.rowTitleRow}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {item?.gift_name_ar || "هدية"}
            </Text>
            <Text style={styles.rowPrice}>{item?.price_sar} ر.س</Text>
          </View>
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {isReceived ? "من " : "إلى "} {counterpartName}
          </Text>
          <View style={styles.rowMetaRow}>
            <Text style={styles.rowDate}>{formatDate(item?.created_at)}</Text>
            <View style={styles.gemsBadge}>
              <Ionicons name="diamond" size={11} color="#22d3ee" />
              <Text style={styles.gemsBadgeText}>
                {isReceived ? "+" : ""}
                {item?.gems_awarded || 0}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerBtn} accessibilityLabel="رجوع">
          <Ionicons name="chevron-forward" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>هداياي</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, tab === t.id && styles.tabActive]}
            onPress={() => setTab(t.id)}
            accessibilityRole="button"
            accessibilityLabel={t.label_ar}
          >
            <Ionicons
              name={t.icon}
              size={15}
              color={tab === t.id ? "#bfdbfe" : "rgba(226,232,240,0.65)"}
            />
            <Text
              style={[styles.tabText, tab === t.id && styles.tabTextActive]}
            >
              {t.label_ar}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totals}>
        <View style={styles.totalCard}>
          <Ionicons name="cash-outline" size={14} color="#fbbf24" />
          <Text style={styles.totalLabel}>القيمة الإجمالية</Text>
          <Text style={styles.totalValue}>{totals.sar} ر.س</Text>
        </View>
        <View style={styles.totalCard}>
          <Ionicons name="diamond" size={14} color="#22d3ee" />
          <Text style={styles.totalLabel}>الجواهر</Text>
          <Text style={styles.totalValue}>{totals.gems}</Text>
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#60a5fa" />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="gift-outline" size={64} color="rgba(255,255,255,0.25)" />
          <Text style={styles.emptyTitle}>
            {tab === "received" ? "لم تستقبل هدايا بعد" : "لم ترسل هدايا بعد"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {tab === "received"
              ? "ستظهر هنا الهدايا التي يرسلها لك أصدقاؤك."
              : "أرسل هدية من صفحة أحد المستخدمين أو من الريلز."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it?.tx_id || `${it?.gift_id}-${it?.created_at}`}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 40, gap: 10 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#60a5fa"
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
  tabs: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    marginTop: 6,
  },
  tab: {
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
  tabActive: {
    backgroundColor: "rgba(96,165,250,0.18)",
    borderColor: "rgba(96,165,250,0.45)",
  },
  tabText: { color: "rgba(226,232,240,0.7)", fontSize: 13, fontWeight: "700" },
  tabTextActive: { color: "#bfdbfe" },
  totals: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    marginTop: 12,
    marginBottom: 6,
  },
  totalCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(15,23,42,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  totalLabel: { color: "rgba(226,232,240,0.6)", fontSize: 11, fontWeight: "600" },
  totalValue: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    marginLeft: "auto",
  },
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
    gap: 12,
    alignItems: "center",
    backgroundColor: "rgba(15,23,42,0.6)",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  rowIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  rowIcon: { width: 40, height: 40, resizeMode: "contain" },
  rowTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowTitle: { color: "#fff", fontSize: 14, fontWeight: "800", flex: 1, marginRight: 8 },
  rowPrice: { color: "#fbbf24", fontSize: 12, fontWeight: "800" },
  rowSubtitle: {
    color: "rgba(226,232,240,0.65)",
    fontSize: 12,
    marginTop: 2,
  },
  rowMetaRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowDate: { color: "rgba(226,232,240,0.45)", fontSize: 11 },
  gemsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(34,211,238,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.35)",
  },
  gemsBadgeText: { color: "#67e8f9", fontSize: 11, fontWeight: "700" },
});

export default GiftInboxScreen;
