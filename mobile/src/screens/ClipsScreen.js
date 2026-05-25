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
import * as Sharing from "expo-sharing";
import * as Linking from "expo-linking";
import api from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { APP_BACKGROUND_IMAGE } from "../constants/uiAssets";
import { hapticLight, hapticMedium } from "../utils/haptics";
import ReportBlockSheet from "../components/ReportBlockSheet";
import StoriesBar from "../components/StoriesBar";
import StoryViewer from "../components/StoryViewer";
import TrendingHashtags from "../components/TrendingHashtags";
import EmptyState from "../components/EmptyState";
import VerifiedBadge from "../components/VerifiedBadge";
import { ReelsListSkeleton } from "../components/Skeleton";
import GiftPickerModal from "../components/GiftPickerModal";
import { useGiftCenter } from "../components/GiftCenterProvider";

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

const ClipsScreen = ({ user, onClose, onNavigateToAds, onOpenUserProfile }) => {
  const userId = user?.id || user?.user_id;
  const isAdmin = Boolean(
    user?.is_admin ||
      user?.role === "admin" ||
      user?.role === "super_admin" ||
      (user?.email && user?.email.toLowerCase() === "sky-321@hotmail.com"),
  );
  const [clips, setClips] = useState([]);
  const [filteredClips, setFilteredClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [activeClip, setActiveClip] = useState(null);
  const [giftPickerOpen, setGiftPickerOpen] = useState(false);
  const { playLocal } = useGiftCenter();
  const [commentDraft, setCommentDraft] = useState("");
  const [newClipTitle, setNewClipTitle] = useState("");
  const [newClipThumb, setNewClipThumb] = useState("");
  const [newClipVideoUrl, setNewClipVideoUrl] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [followLoadingUserId, setFollowLoadingUserId] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [reportSheet, setReportSheet] = useState(null);
  const [activeStories, setActiveStories] = useState(null);
  const [showTrending, setShowTrending] = useState(false);
  const [bookmarked, setBookmarked] = useState(new Set());
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const listRef = useRef(null);
  const touchStartRef = useRef({ y: 0, x: 0, time: 0 });
  const { height: windowHeight } = Dimensions.get("window");
  // Reserve space for the top header overlay + stories bar so each reel
  // fits perfectly inside the viewport without clipping action buttons.
  const STORIES_BAR_HEIGHT = 86;
  const screenHeight = Math.max(360, windowHeight - STORIES_BAR_HEIGHT);

  // Restore bookmarks from disk on mount
  useEffect(() => {
    AsyncStorage.getItem("saqr_bookmarked_clips")
      .then((raw) => {
        if (raw) {
          try {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) setBookmarked(new Set(arr));
          } catch (_) {
            /* ignore */
          }
        }
      })
      .catch(() => {});
  }, []);

  const toggleBookmark = useCallback((clip) => {
    hapticLight();
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(clip.clip_id)) next.delete(clip.clip_id);
      else next.add(clip.clip_id);
      AsyncStorage.setItem(
        "saqr_bookmarked_clips",
        JSON.stringify(Array.from(next)),
      ).catch(() => {});
      return next;
    });
  }, []);

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
      } else {
        const message = await parseApiErrorMessage(
          response,
          "تعذر تحميل المقاطع حالياً.",
        );
        Alert.alert("تنبيه", message);
      }
    } catch (e) {
      console.log("Clips load error:", e?.message);
      const isNetworkError =
        e?.message === "NO_CONNECTION" || e?.message === "CONNECTION_TIMEOUT";
      if (isNetworkError) {
        Alert.alert("خطأ", "تعذر الاتصال بالخادم أثناء تحميل المقاطع.");
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredClips(clips);
      return;
    }
    const q = searchQuery.trim().toLowerCase();
    setFilteredClips(
      clips.filter((c) => {
        const fields = [c.title, c.content, c.caption, c.user_name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return fields.includes(q);
      }),
    );
  }, [clips, searchQuery]);

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
        quality: 1.0,
        videoMaxDuration: MAX_CLIP_DURATION,
        videoExportPreset: ImagePicker.VideoExportPreset?.HighestQuality,
        allowsEditing: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const videoAsset = result.assets[0];

      // Check file size before uploading (200 MB limit matches backend, supports high-quality clips)
      const fileSizeMB = videoAsset.fileSize
        ? videoAsset.fileSize / (1024 * 1024)
        : 0;
      if (fileSizeMB > 200) {
        Alert.alert(
          "حجم كبير",
          `حجم الفيديو ${fileSizeMB.toFixed(1)} ميجابايت. الحد الأقصى 200 ميجابايت. اختر مقطعاً أقصر.`,
        );
        return;
      }

      setUploadingVideo(true);
      const uploadResponse = await api.uploadClipVideo(videoAsset.uri, userId);
      if (!uploadResponse.ok) {
        const message = await parseApiErrorMessage(
          uploadResponse,
          "تعذر رفع الفيديو حالياً.",
        );
        Alert.alert("خطأ", `${message}\n(HTTP ${uploadResponse.status})`);
        return;
      }
      const uploadData = await uploadResponse.json();
      if (!uploadData?.video_url) {
        Alert.alert("خطأ", "لم يتم إرجاع رابط الفيديو من الخادم.");
        return;
      }
      setNewClipVideoUrl(toAbsoluteMediaUrl(uploadData.video_url));
      setNewClipThumb(uploadData?.thumbnail_url || "");
      Alert.alert("تم", "تم رفع الفيديو بنجاح.");
    } catch (e) {
      console.log("[pickAndUploadVideo] error:", e?.name, e?.message);
      const isNetworkError =
        e?.message === "NO_CONNECTION" || e?.message === "CONNECTION_TIMEOUT";
      const isAborted = e?.name === "AbortError";
      Alert.alert(
        "خطأ",
        isAborted
          ? "استغرق رفع الفيديو وقتاً طويلاً وتم إلغاؤه. تحقق من سرعة الإنترنت وحاول بمقطع أقصر."
          : isNetworkError
          ? "تعذر الاتصال بالخادم الآن. تحقق من الشبكة ثم حاول مجدداً."
          : `حدث خطأ أثناء اختيار أو رفع الفيديو.\n${e?.message || ""}`,
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
      // Haptic feedback the instant the user taps — matches premium apps
      hapticMedium();
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

  const deleteClip = useCallback(
    (clip) => {
      if (!ensureSignedIn()) return;
      const isOwner = clip?.user_id === userId;
      if (!isOwner && !isAdmin) {
        Alert.alert("غير مصرح", "ليس لديك صلاحية حذف هذا المقطع.");
        return;
      }
      Alert.alert(
        "حذف المقطع",
        isAdmin && !isOwner
          ? "سيتم حذف هذا المقطع نهائياً (إجراء إداري)."
          : "هل أنت متأكد من حذف مقطعك نهائياً؟",
        [
          { text: "إلغاء", style: "cancel" },
          {
            text: "حذف",
            style: "destructive",
            onPress: async () => {
              try {
                const response = await api.fetch(
                  `/api/clips/${clip.clip_id}?user_id=${encodeURIComponent(userId)}`,
                  { method: "DELETE" },
                );
                if (!response.ok) {
                  const data = await response.json().catch(() => ({}));
                  throw new Error(data?.detail || "فشل الحذف");
                }
                setClips((prev) =>
                  prev.filter((c) => c.clip_id !== clip.clip_id),
                );
                Alert.alert("✓", "تم حذف المقطع.");
              } catch (e) {
                Alert.alert("خطأ", String(e?.message || e));
              }
            },
          },
        ],
      );
    },
    [ensureSignedIn, isAdmin, userId],
  );

  const renderClip = useCallback(
    ({ item, index }) => {
      const image =
        item.thumbnail_url ||
        CLIP_PLACEHOLDERS[index % CLIP_PLACEHOLDERS.length];
      const rawUrl = typeof item.video_url === "string" ? item.video_url : "";
      const lower = rawUrl.toLowerCase();
      const hasVideo =
        rawUrl.length > 0 &&
        (lower.includes("/clips/media/") ||
          lower.includes("/media/clips/") ||
          lower.includes("/media/ads/") ||
          /\.(mp4|mov|m4v|webm)(\?|#|$)/.test(lower));
      const isActive = index === activeIndex;
      return (
        <View style={[styles.reelCard, { height: screenHeight }]}>
          {hasVideo ? (
            <Video
              source={{ uri: toAbsoluteMediaUrl(rawUrl) }}
              style={styles.reelVideo}
              resizeMode={ResizeMode.COVER}
              isLooping
              shouldPlay={isActive}
              useNativeControls={false}
              isMuted={false}
              volume={1.0}
              progressUpdateIntervalMillis={500}
              posterSource={{ uri: image }}
              posterStyle={styles.reelVideo}
              usePoster={false}
              onError={(err) => {
                if (__DEV__) {
                  console.warn("Reel video failed to load", rawUrl, err);
                }
              }}
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
            colors={["rgba(0,0,0,0.3)", "transparent", "rgba(0,0,0,0.85)"]}
            locations={[0, 0.35, 1]}
            style={styles.reelOverlay}
          >
            <View style={styles.reelTopRow}>
              <TouchableOpacity
                style={styles.publisherStrip}
                activeOpacity={0.7}
                onPress={() => {
                  if (item.user_id && item.user_id !== userId && onOpenUserProfile) {
                    onOpenUserProfile(item.user_id);
                  }
                }}
              >
                <Ionicons name="person-circle-outline" size={14} color="#cbd5e1" />
                <Text style={styles.publisherStripText} numberOfLines={1}>
                  الناشر: {item.user_name || "مستخدم"}
                </Text>
                <VerifiedBadge verified={item.is_verified} size={12} />
              </TouchableOpacity>
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
            </View>

            <View style={styles.reelActionsStack} pointerEvents="box-none">
                <TouchableOpacity
                  style={styles.reelActionBtn}
                  onPress={() => toggleLike(item)}
                >
                  <Ionicons
                    name={item.liked_by_me ? "heart" : "heart-outline"}
                    size={28}
                    color={item.liked_by_me ? "#ef4444" : "#fff"}
                  />
                  <Text style={styles.actionText}>{item.likes_count || 0}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.reelActionBtn}
                  onPress={() => setActiveClip(item)}
                >
                  <Ionicons name="chatbubble-outline" size={26} color="#fff" />
                  <Text style={styles.actionText}>{item.comments_count || 0}</Text>
                </TouchableOpacity>

                {(item.user_id === userId || isAdmin) && (
                  <TouchableOpacity
                    style={styles.reelActionBtn}
                    onPress={() => deleteClip(item)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={24}
                      color={isAdmin && item.user_id !== userId ? "#fbbf24" : "#fca5a5"}
                    />
                    <Text style={styles.actionText}>حذف</Text>
                  </TouchableOpacity>
                )}

                {item.user_id !== userId && (
                  <TouchableOpacity
                    style={styles.reelActionBtn}
                    onPress={() => {
                      hapticLight();
                      setReportSheet({
                        targetId: item.clip_id,
                        targetUserId: item.user_id,
                        targetUserName: item.user_name,
                      });
                    }}
                  >
                    <Ionicons name="flag-outline" size={22} color="#fbbf24" />
                    <Text style={styles.actionText}>إبلاغ</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.reelActionBtn}
                  onPress={() => toggleBookmark(item)}
                >
                  <Ionicons
                    name={bookmarked.has(item.clip_id) ? "bookmark" : "bookmark-outline"}
                    size={24}
                    color={bookmarked.has(item.clip_id) ? "#fbbf24" : "#fff"}
                  />
                  <Text style={styles.actionText}>
                    {bookmarked.has(item.clip_id) ? "محفوظ" : "حفظ"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.reelActionBtn}
                  onPress={async () => {
                    hapticLight();
                    try {
                      const shareUrl = `https://saqr.app/clips/${item.clip_id}`;
                      if (await Sharing.isAvailableAsync()) {
                        await Sharing.shareAsync(shareUrl, {
                          mimeType: "text/plain",
                          dialogTitle: "شارك هذا الريل",
                        });
                      } else {
                        await Linking.openURL(`mailto:?subject=ريل صقر&body=${shareUrl}`);
                      }
                    } catch (_) {
                      /* user cancelled */
                    }
                  }}
                >
                  <Ionicons name="share-social-outline" size={24} color="#fff" />
                  <Text style={styles.actionText}>مشاركة</Text>
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
          </LinearGradient>
        </View>
      );
    },
    [activeIndex, bookmarked, deleteClip, followLoadingUserId, isAdmin, onOpenUserProfile, screenHeight, toggleBookmark, toggleFollow, toggleLike, userId],
  );

  const emptyState = useMemo(
    () => (
      <EmptyState
        icon="film-outline"
        iconColor="#60a5fa"
        title="لا توجد مقاطع بعد"
        subtitle="ابدأ أول مقطع سريع مدته 15 ثانية وشاركه مع المجتمع."
        cta={{
          label: "أنشئ مقطع",
          icon: "add-circle-outline",
          onPress: () => setShowCreate(true),
        }}
      />
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
        if (dx < 0) {
          onClose?.();
          return;
        }
        if (dx > 0 && onNavigateToAds) {
          onNavigateToAds();
          return;
        }
      }

      // المطلوب: سحب للأعلى = التالي، سحب للأسفل = السابق.
      if (Math.abs(dy) > 80 && Math.abs(dy) > Math.abs(dx)) {
        if (dy < 0) navigateClip("next");
        if (dy > 0) navigateClip("prev");
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

          {/* Reels / Live tab toggle — TikTok style */}
          <View style={styles.topTabs}>
            <TouchableOpacity
              style={styles.topTab}
              activeOpacity={0.85}
              onPress={() => {
                hapticLight();
                Alert.alert(
                  "قريباً",
                  "ميزة البث المباشر ستتوفر قريباً. ترقّبها!",
                );
              }}
            >
              <Text style={styles.topTabText}>لايف</Text>
            </TouchableOpacity>
            <View style={styles.topTabDivider} />
            <TouchableOpacity style={styles.topTab} activeOpacity={1}>
              <Text style={[styles.topTabText, styles.topTabActive]}>ريلز</Text>
              <View style={styles.topTabUnderline} />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <TouchableOpacity
              style={styles.headerBtn}
              accessibilityRole="button"
              accessibilityLabel="بحث في الريلز"
              onPress={() => {
                hapticLight();
                setShowSearch((v) => !v);
                if (showSearch) setSearchQuery("");
              }}
            >
              <Ionicons
                name={showSearch ? "close" : "search"}
                size={18}
                color="#fff"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerBtn}
              accessibilityRole="button"
              accessibilityLabel="الهاشتاجات الرائجة"
              onPress={() => {
                hapticLight();
                setShowTrending(true);
              }}
            >
              <Ionicons name="trending-up" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerBtn}
              accessibilityRole="button"
              accessibilityLabel="إنشاء ريل جديد"
              onPress={() => setShowCreate(true)}
            >
              <Ionicons name="add" size={22} color="#22d3ee" />
            </TouchableOpacity>
          </View>
        </View>

        {showSearch && (
          <View style={styles.searchBarWrap}>
            <Ionicons name="search" size={16} color="#94a3b8" />
            <TextInput
              style={styles.searchBarInput}
              placeholder="ابحث عن ريل، عنوان، أو ناشر..."
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              accessibilityLabel="حقل البحث في الريلز"
            />
            {!!searchQuery && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={16} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Stories carousel */}
        <StoriesBar
          user={user}
          onOpenUserStories={(u) => setActiveStories(u)}
        />

        {loading ? (
          <ReelsListSkeleton />
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
            scrollEnabled={true}
            decelerationRate="fast"
            snapToAlignment="start"
            snapToInterval={screenHeight}
            disableIntervalMomentum
            windowSize={3}
            maxToRenderPerBatch={2}
            initialNumToRender={1}
            removeClippedSubviews={Platform.OS === "android"}
            onViewableItemsChanged={({ viewableItems }) => {
              if (viewableItems && viewableItems.length > 0) {
                const firstVisible = viewableItems[0];
                if (typeof firstVisible.index === "number") {
                  setActiveIndex(firstVisible.index);
                }
              }
            }}
            viewabilityConfig={{
              itemVisiblePercentThreshold: 60,
              minimumViewTime: 200,
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
          style={styles.commentsSheetOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Dismiss area — tap to close, keeps video visible behind */}
          <TouchableOpacity
            style={styles.commentsSheetBackdrop}
            activeOpacity={1}
            onPress={() => setActiveClip(null)}
          />
          <View style={styles.commentsSheet}>
            {/* Drag handle */}
            <View style={styles.sheetHandle} />
            <View style={styles.commentsSheetHeader}>
              <Text style={styles.commentsSheetTitle}>
                {(activeClip?.comments_count || activeClip?.comments?.length || 0)} تعليق
              </Text>
              <TouchableOpacity
                onPress={() => setActiveClip(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.commentsSheetList}
              contentContainerStyle={{ paddingBottom: 14 }}
              showsVerticalScrollIndicator={false}
            >
              {(activeClip?.comments || []).length === 0 ? (
                <View style={styles.commentsEmptyWrap}>
                  <Ionicons name="chatbubbles-outline" size={36} color="#475569" />
                  <Text style={styles.commentsEmptyText}>
                    كن أول من يعلق على هذا الريل
                  </Text>
                </View>
              ) : (
                (activeClip?.comments || []).map((c) => (
                  <View
                    key={c.comment_id || `${c.user_name}-${c.created_at}`}
                    style={styles.commentSheetRow}
                  >
                    <View style={styles.commentAvatar}>
                      <Ionicons name="person-circle" size={32} color="#64748b" />
                    </View>
                    <View style={styles.commentBody}>
                      <Text style={styles.commentName}>{c.user_name || "مستخدم"}</Text>
                      <Text style={styles.commentContent}>{c.content}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
            <View style={styles.commentSheetComposer}>
              <TouchableOpacity
                style={styles.commentGiftBtn}
                onPress={() => {
                  if (activeClip?.user_id && activeClip.user_id !== userId) {
                    setGiftPickerOpen(true);
                  }
                }}
                disabled={!activeClip?.user_id || activeClip.user_id === userId}
                accessibilityRole="button"
                accessibilityLabel="إرسال هدية للناشر"
              >
                <Ionicons name="gift" size={18} color="#f472b6" />
              </TouchableOpacity>
              <TextInput
                style={styles.commentSheetInput}
                placeholder="أضف تعليقًا..."
                placeholderTextColor="#64748b"
                value={commentDraft}
                onChangeText={setCommentDraft}
              />
              <TouchableOpacity
                style={[
                  styles.commentSendBtn,
                  !commentDraft.trim() && styles.commentSendBtnDisabled,
                ]}
                disabled={!commentDraft.trim()}
                onPress={addComment}
              >
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ReportBlockSheet
        visible={Boolean(reportSheet)}
        onClose={() => setReportSheet(null)}
        reporterUserId={userId}
        targetType="clip"
        targetId={reportSheet?.targetId}
        targetUserId={reportSheet?.targetUserId}
        targetUserName={reportSheet?.targetUserName}
        onBlockedUser={(blockedId) => {
          setClips((prev) => prev.filter((c) => c.user_id !== blockedId));
        }}
      />

      <GiftPickerModal
        visible={giftPickerOpen}
        user={user}
        receiver={{
          user_id: activeClip?.user_id,
          name: activeClip?.user_name,
        }}
        contextType="reel_comment"
        contextId={activeClip?.clip_id}
        onClose={() => setGiftPickerOpen(false)}
        onSent={(res) => {
          playLocal({
            ...res.gift,
            sender_name: user?.name || "أنت",
            gift_animation: res.gift?.animation,
            gift_icon_url: res.gift?.icon_url,
            gift_accent_color: res.gift?.accent_color,
            gift_particle_count: res.gift?.particle_count,
            gift_name_ar: res.gift?.name_ar,
            gems_awarded: res.gems_awarded,
            price_sar: res.gift?.price_sar,
          });
          // Post a small comment marking the gift in the conversation
          if (activeClip?.clip_id) {
            api.addClipComment(activeClip.clip_id, {
              user_id: userId,
              user_name: user?.name || "مستخدم",
              content: `🎁 أرسل ${res.gift?.name_ar || "هدية"} (${res.gift?.price_sar} ر.س)`,
            }).catch(() => {});
          }
        }}
      />

      <StoryViewer
        visible={Boolean(activeStories)}
        userStories={activeStories}
        viewerId={userId}
        onClose={() => setActiveStories(null)}
      />

      <TrendingHashtags
        visible={showTrending}
        viewerId={userId}
        onClose={() => setShowTrending(false)}
        onPlayClip={(clip) => {
          // Push selected clip to top of feed
          setClips((prev) => [clip, ...prev.filter((c) => c.clip_id !== clip.clip_id)]);
          setActiveIndex(0);
        }}
      />
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
    paddingHorizontal: 12,
    paddingTop: Platform.OS === "ios" ? 50 : 22,
    paddingBottom: 6,
  },
  headerBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  topTabs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  topTab: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignItems: "center",
  },
  topTabText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontWeight: "700",
  },
  topTabActive: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },
  topTabUnderline: {
    marginTop: 3,
    width: 18,
    height: 2,
    borderRadius: 2,
    backgroundColor: "#fff",
  },
  topTabDivider: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginHorizontal: 2,
  },
  searchBarWrap: {
    position: "absolute",
    top: 86,
    left: 14,
    right: 14,
    zIndex: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(15,23,42,0.92)",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.22)",
  },
  searchBarInput: {
    flex: 1,
    color: "#fff",
    fontSize: 13,
    textAlign: "right",
    padding: 0,
  },
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
    paddingBottom: Platform.OS === "ios" ? 28 : 18,
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
    paddingRight: 64, // leave room for the absolute right-side action stack
  },
  reelMetaBlock: {
    flex: 1,
  },
  reelActionsStack: {
    position: "absolute",
    right: 8,
    bottom: Platform.OS === "ios" ? 90 : 70,
    alignItems: "center",
    gap: 14,
    zIndex: 5,
  },
  reelActionBtn: {
    alignItems: "center",
    gap: 3,
    minWidth: 48,
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
    minWidth: 70,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
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

  // Bottom Sheet Comments (TikTok style)
  commentsSheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  commentsSheetBackdrop: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  commentsSheet: {
    backgroundColor: "#0b0c14",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderTopColor: "rgba(148,163,184,0.18)",
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 34 : 14,
    paddingHorizontal: 0,
    height: "72%",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#475569",
    marginBottom: 8,
  },
  commentsSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148,163,184,0.12)",
  },
  commentsSheetTitle: { color: "#fff", fontSize: 15, fontWeight: "800" },
  commentsSheetList: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  commentsEmptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  commentsEmptyText: { color: "#94a3b8", marginTop: 10, fontSize: 12 },
  commentSheetRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 10,
  },
  commentAvatar: { paddingTop: 2 },
  commentBody: { flex: 1 },
  commentSheetComposer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(148,163,184,0.12)",
  },
  commentSheetInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.18)",
  },
  commentSendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  commentSendBtnDisabled: { opacity: 0.45 },
  commentGiftBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(244,114,182,0.12)",
    borderWidth: 1,
    borderColor: "rgba(244,114,182,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default memo(ClipsScreen);
