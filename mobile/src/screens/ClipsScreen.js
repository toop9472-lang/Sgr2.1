import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import api from "../services/api";

const MAX_CLIP_DURATION = 15;
const CLIP_PLACEHOLDERS = [
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=900&q=80",
];
const ClipsScreen = ({ user, onClose }) => {
  const userId = user?.id || user?.user_id;
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [activeClip, setActiveClip] = useState(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [newClipTitle, setNewClipTitle] = useState("");
  const [newClipText, setNewClipText] = useState("");
  const [newClipThumb, setNewClipThumb] = useState("");

  const loadClips = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getClips();
      if (response.ok) {
        const data = await response.json();
        setClips(Array.isArray(data?.clips) ? data.clips : []);
      }
    } catch (e) {
      console.log("Clips load error:", e?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClips();
  }, [loadClips]);

  const ensureSignedIn = useCallback(() => {
    if (!userId) {
      Alert.alert("تسجيل مطلوب", "سجل دخولك للمشاركة بالمقاطع.");
      return false;
    }
    return true;
  }, [userId]);

  const publishClip = useCallback(async () => {
    if (!ensureSignedIn()) return;
    const title = newClipTitle.trim();
    const text = newClipText.trim();
    if (!title || !text) {
      Alert.alert("تنبيه", "أضف عنوانًا ووصفًا للمقطع.");
      return;
    }
    setPublishing(true);
    try {
      const fallbackImage =
        CLIP_PLACEHOLDERS[Math.floor(Math.random() * CLIP_PLACEHOLDERS.length)];
      const response = await api.createClip({
        user_id: userId,
        user_name: user?.name || "مستخدم",
        title,
        content: text,
        thumbnail_url: newClipThumb.trim() || fallbackImage,
      });
      if (!response.ok) {
        Alert.alert("خطأ", "تعذر نشر المقطع حالياً.");
        return;
      }
      setShowCreate(false);
      setNewClipTitle("");
      setNewClipText("");
      setNewClipThumb("");
      await loadClips();
      Alert.alert("تم", "تم نشر المقطع بنجاح.");
    } catch (e) {
      Alert.alert("خطأ", "حدث خطأ أثناء نشر المقطع.");
    } finally {
      setPublishing(false);
    }
  }, [
    ensureSignedIn,
    loadClips,
    newClipText,
    newClipThumb,
    newClipTitle,
    user?.name,
    userId,
  ]);

  const toggleLike = useCallback(
    async (clip) => {
      if (!ensureSignedIn()) return;
      try {
        const response = await api.toggleClipLike(clip.clip_id, userId);
        if (!response.ok) return;
        const data = await response.json();
        setClips((prev) =>
          prev.map((item) =>
            item.clip_id === clip.clip_id
              ? {
                  ...item,
                  likes_count: data?.likes_count ?? item.likes_count,
                  liked_by_me: Boolean(data?.liked_by_me),
                }
              : item,
          ),
        );
        setActiveClip((prev) =>
          prev?.clip_id === clip.clip_id
            ? {
                ...prev,
                likes_count: data?.likes_count ?? prev.likes_count,
                liked_by_me: Boolean(data?.liked_by_me),
              }
            : prev,
        );
      } catch {}
    },
    [ensureSignedIn, userId],
  );

  const addComment = useCallback(async () => {
    if (!activeClip || !ensureSignedIn()) return;
    const content = commentDraft.trim();
    if (!content) return;
    try {
      const response = await api.addClipComment(activeClip.clip_id, {
        user_id: userId,
        user_name: user?.name || "مستخدم",
        content,
      });
      if (!response.ok) return;
      const data = await response.json();
      const comments = Array.isArray(data?.comments)
        ? data.comments
        : activeClip.comments || [];
      setCommentDraft("");
      setActiveClip((prev) =>
        prev ? { ...prev, comments, comments_count: comments.length } : prev,
      );
      setClips((prev) =>
        prev.map((item) =>
          item.clip_id === activeClip.clip_id
            ? { ...item, comments_count: comments.length, comments }
            : item,
        ),
      );
    } catch {}
  }, [activeClip, commentDraft, ensureSignedIn, user?.name, userId]);

  const renderClip = useCallback(
    ({ item, index }) => {
      const image =
        item.thumbnail_url ||
        CLIP_PLACEHOLDERS[index % CLIP_PLACEHOLDERS.length];
      return (
        <TouchableOpacity
          style={styles.clipCard}
          onPress={() => setActiveClip(item)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={["#111827", "#0f172a"]}
            style={styles.clipGradient}
          >
            <View style={styles.clipHeader}>
              <Text style={styles.clipUser}>{item.user_name || "مستخدم"}</Text>
              <View style={styles.clipBadge}>
                <Ionicons name="flash-outline" size={12} color="#22d3ee" />
                <Text style={styles.clipBadgeText}>{MAX_CLIP_DURATION}s</Text>
              </View>
            </View>
            <ImageBackground
              source={{ uri: image }}
              style={styles.clipVisual}
              imageStyle={styles.clipVisualImage}
            >
              <LinearGradient
                colors={["rgba(2,6,23,0.1)", "rgba(2,6,23,0.85)"]}
                style={styles.clipVisualOverlay}
              >
                <View style={styles.clipPlayRing}>
                  <Ionicons name="play" size={20} color="#fff" />
                </View>
                <Text style={styles.clipThumbUrl} numberOfLines={1}>
                  {item.title}
                </Text>
              </LinearGradient>
            </ImageBackground>
            <Text style={styles.clipTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.clipText} numberOfLines={2}>
              {item.content}
            </Text>
            <View style={styles.clipActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => toggleLike(item)}
              >
                <Ionicons
                  name={item.liked_by_me ? "heart" : "heart-outline"}
                  size={16}
                  color={item.liked_by_me ? "#ef4444" : "#cbd5e1"}
                />
                <Text style={styles.actionText}>{item.likes_count || 0}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setActiveClip(item)}
              >
                <Ionicons name="chatbubble-outline" size={16} color="#cbd5e1" />
                <Text style={styles.actionText}>
                  {item.comments_count || 0}
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      );
    },
    [toggleLike],
  );

  const emptyState = useMemo(
    () => (
      <View style={styles.emptyWrap}>
        <Ionicons name="sparkles-outline" size={42} color="#60a5fa" />
        <Text style={styles.emptyTitle}>لا توجد مقاطع بعد</Text>
        <Text style={styles.emptySub}>ابدأ أول مقطع سريع مدته 15 ثانية.</Text>
      </View>
    ),
    [],
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#060a13", "#0f172a", "#111827"]}
        style={styles.bg}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={onClose}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ميدان المقاطع</Text>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setShowCreate(true)}
          >
            <Ionicons name="add" size={22} color="#22d3ee" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#60a5fa" />
            <Text style={styles.loadingText}>جاري تحميل المقاطع...</Text>
          </View>
        ) : (
          <FlatList
            data={clips}
            keyExtractor={(item) => item.clip_id}
            renderItem={renderClip}
            ListEmptyComponent={emptyState}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </LinearGradient>

      <Modal
        visible={showCreate}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreate(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>نشر مقطع 15 ثانية</Text>
            <TextInput
              style={styles.input}
              placeholder="عنوان المقطع"
              placeholderTextColor="#64748b"
              value={newClipTitle}
              onChangeText={setNewClipTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="رابط صورة الغلاف (اختياري)"
              placeholderTextColor="#64748b"
              value={newClipThumb}
              onChangeText={setNewClipThumb}
            />
            <TextInput
              style={[styles.input, styles.inputLarge]}
              placeholder="وصف أو فكرة المقطع التعاوني..."
              placeholderTextColor="#64748b"
              multiline
              value={newClipText}
              onChangeText={setNewClipText}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => setShowCreate(false)}
              >
                <Text style={styles.secondaryBtnText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryBtn}
                disabled={publishing}
                onPress={publishClip}
              >
                {publishing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>نشر</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={Boolean(activeClip)}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveClip(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.modalCard, styles.detailsCard]}>
            <View style={styles.detailsHeader}>
              <Text style={styles.modalTitle}>
                {activeClip?.title || "المقطع"}
              </Text>
              <TouchableOpacity onPress={() => setActiveClip(null)}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.detailsText}>{activeClip?.content}</Text>
            <View style={styles.detailsQuickActions}>
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => toggleLike(activeClip)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={activeClip?.liked_by_me ? "heart" : "heart-outline"}
                  size={16}
                  color={activeClip?.liked_by_me ? "#ef4444" : "#e2e8f0"}
                />
                <Text style={styles.quickActionText}>
                  إعجاب ({activeClip?.likes_count || 0})
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.commentsArea}
              showsVerticalScrollIndicator={false}
            >
              {(activeClip?.comments || []).map((c) => (
                <View
                  key={c.comment_id || `${c.user_name}-${c.created_at}`}
                  style={styles.commentRow}
                >
                  <Text style={styles.commentName}>
                    {c.user_name || "مستخدم"}
                  </Text>
                  <Text style={styles.commentContent}>{c.content}</Text>
                </View>
              ))}
            </ScrollView>
            <View style={styles.commentInputRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="أضف تعليقًا..."
                placeholderTextColor="#64748b"
                value={commentDraft}
                onChangeText={setCommentDraft}
              />
              <TouchableOpacity style={styles.primaryBtn} onPress={addComment}>
                <Ionicons name="send" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  bg: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 34,
    paddingBottom: 14,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#cbd5e1", marginTop: 10 },
  listContent: { padding: 14, paddingBottom: 110 },
  clipCard: { marginBottom: 12, borderRadius: 16, overflow: "hidden" },
  clipGradient: {
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.22)",
    borderRadius: 16,
  },
  clipHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clipUser: { color: "#e2e8f0", fontSize: 12, fontWeight: "700" },
  clipBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(34,211,238,0.12)",
  },
  clipBadgeText: { color: "#22d3ee", fontSize: 10, fontWeight: "700" },
  clipVisual: {
    marginTop: 10,
    height: 110,
    borderRadius: 12,
    backgroundColor: "rgba(15,23,42,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  clipVisualImage: {
    borderRadius: 12,
  },
  clipVisualOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  clipPlayRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  clipThumbUrl: { color: "#64748b", fontSize: 11 },
  clipTitle: { color: "#fff", fontSize: 15, fontWeight: "700", marginTop: 10 },
  clipText: { color: "#cbd5e1", fontSize: 12, marginTop: 4 },
  clipActions: { flexDirection: "row", gap: 18, marginTop: 10 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionText: { color: "#cbd5e1", fontSize: 12 },
  emptyWrap: { alignItems: "center", marginTop: 100 },
  emptyTitle: {
    color: "#e2e8f0",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 10,
  },
  emptySub: { color: "#94a3b8", fontSize: 12, marginTop: 5 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.78)",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.2)",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.2)",
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  inputLarge: { minHeight: 90, textAlignVertical: "top" },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  secondaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(148,163,184,0.14)",
  },
  secondaryBtnText: { color: "#cbd5e1", fontWeight: "700" },
  primaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#2563eb",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
  detailsCard: { maxHeight: "85%" },
  detailsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailsText: { color: "#cbd5e1", marginBottom: 10 },
  detailsQuickActions: { marginBottom: 10 },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(148,163,184,0.12)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quickActionText: { color: "#e2e8f0", fontSize: 12, fontWeight: "600" },
  commentsArea: { maxHeight: 240, marginBottom: 10 },
  commentRow: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148,163,184,0.14)",
  },
  commentName: { color: "#93c5fd", fontSize: 11, fontWeight: "700" },
  commentContent: { color: "#e2e8f0", fontSize: 12, marginTop: 2 },
  commentInputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
});

export default memo(ClipsScreen);
