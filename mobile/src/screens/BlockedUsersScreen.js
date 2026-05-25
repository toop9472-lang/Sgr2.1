import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import api from "../services/api";
import VerifiedBadge from "../components/VerifiedBadge";

/**
 * Screen that lists the users this account has blocked, with the ability
 * to unblock each entry. Wired to the existing moderation endpoints:
 *   GET  /api/moderation/blocks/{user_id}
 *   POST /api/moderation/unblock
 */
const BlockedUsersScreen = ({ user, onBack }) => {
  const userId = user?.id || user?.user_id;
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const r = await api.fetch(
        `/api/moderation/blocks/${encodeURIComponent(userId)}`,
      );
      const data = await r.json().catch(() => ({}));
      setItems(Array.isArray(data?.users) ? data.users : []);
    } catch (_) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUnblock = useCallback(
    (target) => {
      Alert.alert(
        "إلغاء الحظر",
        `هل تريد إلغاء حظر ${target.name}؟ سيتمكن من رؤية محتواك والتفاعل معك مجدداً.`,
        [
          { text: "إلغاء", style: "cancel" },
          {
            text: "إلغاء الحظر",
            style: "destructive",
            onPress: async () => {
              setBusyId(target.user_id);
              try {
                const r = await api.fetch("/api/moderation/unblock", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    user_id: userId,
                    target_user_id: target.user_id,
                  }),
                });
                const data = await r.json().catch(() => ({}));
                if (!r.ok) throw new Error(data?.detail || "فشلت العملية");
                setItems((prev) => prev.filter((u) => u.user_id !== target.user_id));
              } catch (e) {
                Alert.alert("خطأ", String(e?.message || e));
              } finally {
                setBusyId(null);
              }
            },
          },
        ],
      );
    },
    [userId],
  );

  const renderItem = useCallback(
    ({ item }) => (
      <View style={styles.row}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarFallbackText}>
              {(item.name || "U")[0].toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <VerifiedBadge verified={item.is_verified} size={12} />
          </View>
          <Text style={styles.subtitle}>محظور</Text>
        </View>
        <TouchableOpacity
          style={[styles.unblockBtn, busyId === item.user_id && styles.unblockBtnBusy]}
          onPress={() => handleUnblock(item)}
          disabled={busyId === item.user_id}
          activeOpacity={0.7}
        >
          {busyId === item.user_id ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.unblockBtnText}>إلغاء الحظر</Text>
          )}
        </TouchableOpacity>
      </View>
    ),
    [busyId, handleUnblock],
  );

  return (
    <LinearGradient
      colors={["#05070d", "#0b1020", "#0e172d"]}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel="رجوع"
        >
          <Ionicons name="arrow-forward" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>المستخدمون المحظورون</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#60a5fa" />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="shield-checkmark-outline" size={48} color="#22c55e" />
          <Text style={styles.emptyTitle}>لا يوجد مستخدمون محظورون</Text>
          <Text style={styles.emptySub}>
            عندما تحظر شخصاً، سيظهر هنا ويمكنك إلغاء الحظر في أي وقت.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.user_id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#05070d" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: "rgba(8, 14, 28, 0.92)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  sep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginLeft: 76,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1e293b",
  },
  avatarFallbackText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  userInfo: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { color: "#fff", fontSize: 15, fontWeight: "700", flexShrink: 1 },
  subtitle: {
    color: "rgba(248,113,113,0.85)",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  unblockBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(239,68,68,0.16)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.4)",
    minWidth: 90,
    alignItems: "center",
  },
  unblockBtnBusy: { opacity: 0.6 },
  unblockBtnText: { color: "#fca5a5", fontSize: 12, fontWeight: "700" },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
  },
  emptySub: {
    color: "rgba(226,232,240,0.55)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
});

export default BlockedUsersScreen;
