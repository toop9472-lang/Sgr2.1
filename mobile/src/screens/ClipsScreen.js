import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Dimensions,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Video, ResizeMode } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import api from "../services/api";
import { APP_BACKGROUND_IMAGE } from "../constants/uiAssets";

const MAX_CLIP_DURATION = 15;
const CLIP_PLACEHOLDERS = [
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=900&q=80",
];
const toAbsoluteMediaUrl = (value) => {
  const normalized = (value || "").trim();
  if (!normalized) return "";
  if (normalized.startsWith("http")) return normalized;
  if (normalized.startsWith("/")) {
    return `${api.getActiveBaseUrl()}${normalized}`;
  }
  return normalized;
};

const normalizeClip = (clip = {}) => {
  const safeComments = Array.isArray(clip?.comments)
    ? clip.comments.map((c) => ({
        ...c,
        content: c?.content || c?.comment || "",
      }))
    : [];
  return {
    ...clip,
    title: clip?.title || clip?.caption || "مقطع",
    content: clip?.content || clip?.caption || "",
    video_url: toAbsoluteMediaUrl(clip?.video_url),
    thumbnail_url: toAbsoluteMediaUrl(clip?.thumbnail_url),
    comments: safeComments,
    comments_count: Number(clip?.comments_count ?? safeComments.length) || 0,
    likes_count: Number(clip?.likes_count ?? 0) || 0,
    liked_by_me: Boolean(clip?.liked_by_me),
    followers_count: Number(clip?.followers_count ?? 0) || 0,
    following_count: Number(clip?.following_count ?? 0) || 0,
    followed_by_me: Boolean(clip?.followed_by_me),
  };
};

const parseApiErrorMessage = async (
  response,
  fallback = "تعذر تنفيذ العملية حالياً.",
) => {
  if (!response) return fallback;
  try {
    const data = await response.json();
    const detail = data?.detail;
    if (typeof detail === "string" && detail.trim()) return detail;
    if (detail && typeof detail?.message === "string" && detail.message.trim()) {
      return detail.message;
    }
    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }
  } catch (_) {
    // Ignore parse failures and fall back.
  }
  if (response.status === 404 || response.status === 405) {
    return "ميزة المقاطع غير مفعلة بعد على الخادم الحالي.";
  }
  if (response.status >= 500) {
    return "الخادم مشغول حالياً. حاول بعد قليل.";
  }
  return fallback;
};

const ClipsScreen = ({ user, onClose, onNavigateToAds }) => {
  const userId = user?.id || user?.user_id;
  const [clips, setClips] = useState([]);
  const [filteredClips, setFilteredClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [activeClip, setActiveClip] = useState(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [newClipTitle, setNewClipTitle] = useState("");
  const [newClipThumb, setNewClipThumb] = useState("");
  const [newClipVideoUrl, setNewClipVideoUrl] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [followLoadingUserId, setFollowLoadingUserId] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef(null);
  const touchStartRef = useRef({ y: 0, x: 0, time: 0 });
  const { height: screenHeight } = Dimensions.get("window");

  const loadClips = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getClips(30, userId);
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data?.clips) ? data.clips : [];
        const normalized = list.map((clip) => normalizeClip(clip));
        setClips(normalized);
        setFilteredClips(normalized);
      }
    } catch (e) {
      console.log("Clips load error:", e?.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    setFilteredClips(clips);
  }, [clips]);

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

  const pickAndUploadVideo = useCallback(async () => {
    if (!ensureSignedIn()) return;
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("إذن مطلوب", "يرجى السماح بالوصول إلى الاستديو لرفع الفيديو.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 0.8,
        videoMaxDuration: MAX_CLIP_DURATION,
        allowsEditing: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const videoAsset = result.assets[0];
      setUploadingVideo(true);
      const uploadResponse = await api.uploadClipVideo(videoAsset.uri, userId);
      if (!uploadResponse.ok) {
        const message = await parseApiErrorMessage(
          uploadResponse,
          "تعذر رفع الفيديو حالياً.",
        );
        Alert.alert("خطأ", message);
        return;
      }
      const uploadData = await uploadResponse.json();
      setNewClipVideoUrl(toAbsoluteMediaUrl(uploadData?.video_url || ""));
      setNewClipThumb(uploadData?.thumbnail_url || "");
      Alert.alert("تم", "تم رفع الفيديو بنجاح.");
    } catch (e) {
      const isNetworkError =
        e?.message === "NO_CONNECTION" || e?.message === "CONNECTION_TIMEOUT";
      Alert.alert(
        "خطأ",
        isNetworkError
          ? "تعذر الاتصال بالخادم الآن. تحقق من الشبكة ثم حاول مجدداً."
          : "حدث خطأ أثناء اختيار أو رفع الفيديو.",
      );
    } finally {
      setUploadingVideo(false);
    }
  }, [ensureSignedIn, userId]);

  const publishClip = useCallback(async () => {
    if (!ensureSignedIn()) return;
    const title = newClipTitle.trim();
    if (!title) {
      Alert.alert("تنبيه", "أضف عنوانًا للمقطع قبل النشر.");
      return;
    }
    if (!newClipVideoUrl.trim()) {
      Alert.alert("تنبيه", "اختر فيديو من الاستديو أولاً.");
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
        // Upload flow now requests title only before publish.
        content: "",
        caption: title,
        video_url: newClipVideoUrl.trim(),
        thumbnail_url: newClipThumb.trim() || fallbackImage,
      });
      if (!response.ok) {
        const message = await parseApiErrorMessage(
          response,
          "تعذر نشر المقطع حالياً.",
        );
        Alert.alert("خطأ", message);
        return;
      }
      setShowCreate(false);
      setNewClipTitle("");
      setNewClipThumb("");
      setNewClipVideoUrl("");
      await loadClips();
      Alert.alert("تم", "تم نشر المقطع بنجاح.");
    } catch (e) {
      const isNetworkError =
        e?.message === "NO_CONNECTION" || e?.message === "CONNECTION_TIMEOUT";
      Alert.alert(
        "خطأ",
        isNetworkError
          ? "تعذر الاتصال بالخادم الآن. تحقق من الشبكة ثم حاول مجدداً."
          : "حدث خطأ أثناء نشر المقطع.",
      );
    } finally {
      setPublishing(false);
    }
  }, [
    ensureSignedIn,
    loadClips,
    newClipThumb,
    newClipVideoUrl,
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
        ? data.comments.map((c) => ({
            ...c,
            content: c?.content || c?.comment || "",
          }))
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

  const toggleFollow = useCallback(
    async (clip) => {
      if (!ensureSignedIn()) return;
      const targetUserId = clip?.user_id;
      if (!targetUserId || targetUserId === userId) return;
      setFollowLoadingUserId(targetUserId);
      try {
        const response = await api.toggleClipFollow(userId, targetUserId);
        if (!response.ok) return;
        const data = await response.json();
        setClips((prev) =>
          prev.map((item) =>
            item.user_id === targetUserId
              ? {
                  ...item,
                  followed_by_me: Boolean(data?.followed),
                  followers_count:
                    Number(data?.followers_count ?? item.followers_count) || 0,
                  following_count:
                    Number(data?.following_count ?? item.following_count) || 0,
                }
              : item,
          ),
        );
        setActiveClip((prev) =>
          prev?.user_id === targetUserId
            ? {
                ...prev,
                followed_by_me: Boolean(data?.followed),
                followers_count:
                  Number(data?.followers_count ?? prev.followers_count) || 0,
                following_count:
                  Number(data?.following_count ?? prev.following_count) || 0,
              }
            : prev,
        );
      } catch {
      } finally {
        setFollowLoadingUserId(null);
      }
    },
    [ensureSignedIn, userId],
  );

  const renderClip = useCallback(
    ({ item, index }) => {
      const image =
        item.thumbnail_url ||
        CLIP_PLACEHOLDERS[index % CLIP_PLACEHOLDERS.length];
      const hasVideo =
        typeof item.video_url === "string" &&
        (item.video_url.includes("/media/clips/") || item.video_url.endsWith(".mp4"));
      return (
        <View style={[styles.reelCard, { height: screenHeight }]}>
          {hasVideo ? (
            <Video
              source={{ uri: item.video_url }}
              style={styles.reelVideo}
              resizeMode={ResizeMode.COVER}
              isLooping
              shouldPlay={index === activeIndex}
              useNativeControls={false}
            />
          ) : (
            <ImageBackground source={{ uri: image }} style={styles.reelVideo}>
              <LinearGradient
                colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.7)"]}
                style={StyleSheet.absoluteFillObject}
              />
            </ImageBackground>
          )}

          <LinearGradient
            colors={["rgba(0,0,0,0.06)", "rgba(0,0,0,0.86)"]}
            style={styles.reelOverlay}
          >
            <View style={styles.reelTopRow}>
              <View style={styles.publisherStrip}>
                <Ionicons name="person-circle-outline" size={14} color="#cbd5e1" />
                <Text style={styles.publisherStripText} numberOfLines={1}>
                  الناشر: {item.user_name || "مستخدم"}
                </Text>
              </View>
              <View style={styles.clipBadge}>
                <Ionicons name="flash-outline" size={12} color="#22d3ee" />
                <Text style={styles.clipBadgeText}>{MAX_CLIP_DURATION}s</Text>
              </View>
            </View>

            <View style={styles.reelBottomRow}>
              <View style={styles.reelMetaBlock}>
                <Text style={styles.clipTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                {!!item.content && (
                  <Text style={styles.clipText} numberOfLines={2}>
                    {item.content}
                  </Text>
                )}
                <Text style={styles.followStatsText}>
                  {item.followers_count || 0} متابع • {item.following_count || 0} يتابع
                </Text>
              </View>

              <View style={styles.reelActionsStack}>
                <TouchableOpacity
                  style={styles.reelActionBtn}
                  onPress={() => toggleLike(item)}
                >
                  <Ionicons
                    name={item.liked_by_me ? "heart" : "heart-outline"}
                    size={22}
                    color={item.liked_by_me ? "#ef4444" : "#fff"}
                  />
                  <Text style={styles.actionText}>{item.likes_count || 0}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.reelActionBtn}
                  onPress={() => setActiveClip(item)}
                >
                  <Ionicons name="chatbubble-outline" size={22} color="#fff" />
                  <Text style={styles.actionText}>{item.comments_count || 0}</Text>
                </TouchableOpacity>

                {item.user_id && item.user_id !== userId && (
                  <TouchableOpacity
                    style={[
                      styles.followBtn,
                      item.followed_by_me ? styles.followBtnActive : null,
                      followLoadingUserId === item.user_id ? styles.followBtnDisabled : null,
                    ]}
                    disabled={followLoadingUserId === item.user_id}
                    onPress={() => toggleFollow(item)}
                  >
                    {followLoadingUserId === item.user_id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.followBtnText}>
                        {item.followed_by_me ? "متابَع" : "متابعة"}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </LinearGradient>
        </View>
      );
    },
    [activeIndex, followLoadingUserId, screenHeight, toggleFollow, toggleLike, userId],
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

  const navigateClip = useCallback(
    (direction) => {
      if (!filteredClips.length) return;
      setActiveIndex((prev) => {
        let next = prev;
        // المطلوب: السحب للأسفل للتنقل إلى التالي.
        if (direction === "next") next = Math.min(filteredClips.length - 1, prev + 1);
        if (direction === "prev") next = Math.max(0, prev - 1);
        if (next !== prev) {
          listRef.current?.scrollToOffset({
            offset: next * screenHeight,
            animated: true,
          });
        }
        return next;
      });
    },
    [filteredClips.length, screenHeight],
  );

  const handleTouchStart = useCallback((event) => {
    touchStartRef.current = {
      y: event.nativeEvent.pageY,
      x: event.nativeEvent.pageX,
      time: Date.now(),
    };
  }, []);

  const handleTouchEnd = useCallback(
    (event) => {
      const dx = event.nativeEvent.pageX - touchStartRef.current.x;
      const dy = event.nativeEvent.pageY - touchStartRef.current.y;
      const elapsed = Date.now() - touchStartRef.current.time;

      if (elapsed > 350) return;

      // سحب يمين: خروج. سحب يسار: انتقال لصفحة الإعلانات.
      if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        if (dx > 0) {
          onClose?.();
          return;
        }
        if (dx < 0 && onNavigateToAds) {
          onNavigateToAds();
          return;
        }
      }

      // سحب للأسفل: التالي، سحب للأعلى: السابق.
      if (Math.abs(dy) > 80 && Math.abs(dy) > Math.abs(dx)) {
        if (dy > 0) navigateClip("next");
        if (dy < 0) navigateClip("prev");
      }
    },
    [navigateClip, onClose, onNavigateToAds],
  );

  return (
    <ImageBackground
      source={{ uri: APP_BACKGROUND_IMAGE }}
      style={styles.container}
      resizeMode="cover"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <LinearGradient
        colors={["rgba(15,23,42,0.18)", "rgba(30,41,59,0.38)", "rgba(30,27,75,0.52)"]}
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
            ref={listRef}
            data={filteredClips}
            keyExtractor={(item) => item.clip_id}
            renderItem={renderClip}
            ListEmptyComponent={emptyState}
            contentContainerStyle={styles.reelsListContent}
            showsVerticalScrollIndicator={false}
            pagingEnabled
            scrollEnabled={false}
            decelerationRate="fast"
            snapToAlignment="start"
            snapToInterval={screenHeight}
            onMomentumScrollEnd={(event) => {
              const offsetY = event.nativeEvent.contentOffset.y;
              const index = Math.max(0, Math.round(offsetY / screenHeight));
              setActiveIndex(index);
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={async () => {
                  setRefreshing(true);
                  await loadClips();
                  setRefreshing(false);
                }}
                tintColor="#60a5fa"
                colors={["#60a5fa"]}
              />
            }
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
            <Text style={styles.modalTitle}>نشر ريل احترافي (15 ثانية)</Text>
            <Text style={styles.modalSubtitle}>
              المطلوب قبل النشر: عنوان الفيديو فقط، ثم اختر الفيديو.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="عنوان المقطع"
              placeholderTextColor="#64748b"
              value={newClipTitle}
              onChangeText={setNewClipTitle}
            />
            <TouchableOpacity
              style={[styles.uploadBtn, uploadingVideo ? styles.uploadBtnDisabled : null]}
              disabled={uploadingVideo}
              onPress={pickAndUploadVideo}
            >
              {uploadingVideo ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                  <Text style={styles.uploadBtnText}>
                    {newClipVideoUrl ? "تغيير الفيديو" : "اختيار فيديو من الاستديو"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            {!!newClipVideoUrl && (
              <Text style={styles.uploadedHint} numberOfLines={1}>
                تم تجهيز الفيديو: {newClipVideoUrl}
              </Text>
            )}
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
            <View style={styles.detailsFollowRow}>
              <Text style={styles.followStatsText}>
                {activeClip?.followers_count || 0} متابع •{" "}
                {activeClip?.following_count || 0} يتابع
              </Text>
              {activeClip?.user_id && activeClip.user_id !== userId && (
                <TouchableOpacity
                  style={[
                    styles.followBtn,
                    activeClip?.followed_by_me ? styles.followBtnActive : null,
                    followLoadingUserId === activeClip.user_id
                      ? styles.followBtnDisabled
                      : null,
                  ]}
                  disabled={followLoadingUserId === activeClip.user_id}
                  onPress={() => toggleFollow(activeClip)}
                >
                  {followLoadingUserId === activeClip.user_id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.followBtnText}>
                      {activeClip?.followed_by_me ? "متابَع" : "متابعة"}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
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
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  bg: { flex: 1 },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 34,
    paddingBottom: 10,
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
  reelsListContent: { paddingBottom: 0 },
  reelCard: {
    width: "100%",
    marginBottom: 0,
    borderRadius: 0,
    overflow: "hidden",
    borderWidth: 0,
    backgroundColor: "#0f172a",
  },
  reelVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  reelOverlay: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 16,
  },
  reelTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  reelBottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  reelMetaBlock: {
    flex: 1,
  },
  reelActionsStack: {
    alignItems: "center",
    gap: 12,
  },
  reelActionBtn: {
    alignItems: "center",
    gap: 5,
  },
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
  publisherStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    maxWidth: "76%",
    backgroundColor: "rgba(2,6,23,0.38)",
    borderWidth: 1,
    borderColor: "rgba(203,213,225,0.35)",
  },
  publisherStripText: {
    color: "#e2e8f0",
    fontSize: 11,
    fontWeight: "600",
  },
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
  followRow: {
    marginTop: 10,
    marginBottom: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  detailsFollowRow: {
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  followStatsText: {
    color: "#94a3b8",
    fontSize: 11,
    flex: 1,
  },
  followBtn: {
    minWidth: 78,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  followBtnActive: {
    backgroundColor: "#0ea5e9",
  },
  followBtnDisabled: {
    opacity: 0.65,
  },
  followBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
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
  modalSubtitle: {
    color: "#94a3b8",
    fontSize: 12,
    marginBottom: 10,
    lineHeight: 18,
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
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  uploadBtn: {
    marginBottom: 10,
    backgroundColor: "#0ea5e9",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  uploadBtnDisabled: {
    opacity: 0.7,
  },
  uploadBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  uploadedHint: {
    color: "#67e8f9",
    fontSize: 11,
    marginBottom: 10,
  },
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
