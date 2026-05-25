import React, { useCallback, useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../services/api";
import VerifiedBadge from "./VerifiedBadge";

/**
 * Modal that lists either followers or following of a target user.
 * Respects privacy: backend returns `private: true` when the viewer
 * isn't allowed to see the list (private account, not a follower).
 */
const FollowListModal = ({
  visible,
  mode = "followers", // 'followers' | 'following'
  targetUserId,
  viewerId,
  onClose,
  onOpenUser,
}) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [isPrivate, setIsPrivate] = useState(false);

  const load = useCallback(async () => {
    if (!visible || !targetUserId) return;
    setLoading(true);
    try {
      const endpoint = mode === "following" ? "following" : "followers";
      const qs = viewerId ? `?viewer_id=${encodeURIComponent(viewerId)}` : "";
      const r = await api.fetch(
        `/api/users/${endpoint}/${encodeURIComponent(targetUserId)}${qs}`,
      );
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setUsers([]);
        setIsPrivate(false);
        return;
      }
      setUsers(Array.isArray(data?.users) ? data.users : []);
      setIsPrivate(Boolean(data?.private));
    } catch (_) {
      setUsers([]);
      setIsPrivate(false);
    } finally {
      setLoading(false);
    }
  }, [mode, targetUserId, viewerId, visible]);

  useEffect(() => {
    load();
  }, [load]);

  const renderItem = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.7}
        onPress={() => {
          if (onOpenUser) onOpenUser(item.user_id);
          if (onClose) onClose();
        }}
      >
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
            {item.is_private ? (
              <Ionicons name="lock-closed" size={11} color="#fbbf24" />
            ) : null}
          </View>
        </View>
        {item.followed_by_me ? (
          <View style={styles.followingPill}>
            <Text style={styles.followingPillText}>متابَع</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    ),
    [onClose, onOpenUser],
  );

  const title = mode === "following" ? "يتابع" : "المتابعون";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>{title}</Text>
            <View style={{ width: 40 }} />
          </View>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#60a5fa" />
            </View>
          ) : isPrivate ? (
            <View style={styles.centered}>
              <Ionicons name="lock-closed-outline" size={36} color="#fbbf24" />
              <Text style={styles.emptyText}>هذا الحساب خاص</Text>
              <Text style={styles.emptySub}>
                تابع المستخدم لعرض هذه القائمة.
              </Text>
            </View>
          ) : users.length === 0 ? (
            <View style={styles.centered}>
              <Ionicons name="people-outline" size={36} color="#64748b" />
              <Text style={styles.emptyText}>
                {mode === "following" ? "لا أحد يتابعه بعد" : "لا يوجد متابعون"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={users}
              keyExtractor={(item) => item.user_id}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: 30 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#0b1020",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "85%",
    minHeight: "55%",
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  title: { color: "#fff", fontSize: 16, fontWeight: "800" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1e293b",
  },
  avatarFallbackText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  userInfo: { flex: 1 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: { color: "#fff", fontSize: 14, fontWeight: "700", flexShrink: 1 },
  followingPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(96,165,250,0.18)",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.35)",
  },
  followingPillText: { color: "#bfdbfe", fontSize: 11, fontWeight: "700" },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: { color: "#cbd5e1", fontSize: 14, fontWeight: "600", marginTop: 6 },
  emptySub: {
    color: "rgba(226,232,240,0.55)",
    fontSize: 12,
    textAlign: "center",
  },
});

export default FollowListModal;
