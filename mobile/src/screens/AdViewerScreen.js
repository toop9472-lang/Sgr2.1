// Ad Viewer Screen - Clean Design with Comments (matching Web)
import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Linking,
  Vibration,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  ImageBackground,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
import api from "../services/api";
import storage from "../services/storage";
import admobService from "../services/admobService";
import { useAchievements } from "../services/AchievementsContext";
import { shuffleArray } from "../utils/random";

const { width } = Dimensions.get("window");

const ADMOB_SLOT_PREFIX = "admob-slot-";
const ADMOB_INSERT_EVERY = 2;

const buildAdMobSlot = (slotIndex = 1) => ({
  id: `${ADMOB_SLOT_PREFIX}${slotIndex}`,
  ad_source: "admob",
  title: "إعلان Google AdMob",
  description: "إعلان ممول من Google",
  advertiser: "Google AdMob",
  duration: 60,
  image_url: null,
});

const buildMixedFeed = (advertiserAds = []) => {
  const normalized = advertiserAds
    .filter((ad) => ad?.id)
    .map((ad) => ({
      ...ad,
      ad_source: "advertiser",
      duration: Number(ad?.duration) > 0 ? Number(ad.duration) : 60,
    }));

  const mixed = [];
  let slotIndex = 1;

  normalized.forEach((ad, index) => {
    mixed.push(ad);
    if ((index + 1) % ADMOB_INSERT_EVERY === 0) {
      mixed.push(buildAdMobSlot(slotIndex));
      slotIndex += 1;
    }
  });

  // Ensure feed always contains AdMob entries even if no personal ads are available.
  if (!mixed.some((item) => item?.ad_source === "admob")) {
    mixed.unshift(buildAdMobSlot(slotIndex));
  }

  return mixed;
};

const AdViewerScreen = ({
  onClose,
  onNavigateToProfile,
  onRewardsEarned,
  user,
}) => {
  const [ads, setAds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [watchTime, setWatchTime] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [fullScreenWatchMode, setFullScreenWatchMode] = useState(false);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [earnedGems, setEarnedGems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(true);
  const [isAdMobLoading, setIsAdMobLoading] = useState(false);
  const [adMobReady, setAdMobReady] = useState(false);
  const [adMobStatusMessage, setAdMobStatusMessage] = useState(
    "جاري تجهيز إعلان المكافأة...",
  );

  // Achievements context for recording ad watches
  const { recordAdWatched } = useAchievements();

  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const videoRef = useRef(null);
  const watchTimerRef = useRef(null);
  const controlsTimerRef = useRef(null);
  const lastRewardedTimeRef = useRef(0);
  const touchStartRef = useRef({ y: 0, x: 0, time: 0 });

  const currentAd = ads[currentIndex];
  const isAdMobSlot = currentAd?.ad_source === "admob";
  const toAbsoluteMediaUrl = (value) => {
    const normalized = (value || "").trim();
    if (!normalized) return "";
    if (normalized.startsWith("http")) return normalized;
    if (normalized.startsWith("/")) {
      return `${api.getActiveBaseUrl()}${normalized}`;
    }
    return normalized;
  };
  const isPlayableVideoUrl = (value) => {
    const v = (value || "").toLowerCase();
    if (!v) return false;
    return (
      v.endsWith(".mp4") ||
      v.endsWith(".mov") ||
      v.endsWith(".m4v") ||
      v.endsWith(".webm") ||
      v.includes("/media/ads/") ||
      v.includes("/api/clips/media/") ||
      v.includes("/clips/media/")
    );
  };
  const rawVideoUrl = !isAdMobSlot ? currentAd?.video_url : null;
  const currentVideoUri = isPlayableVideoUrl(rawVideoUrl)
    ? toAbsoluteMediaUrl(rawVideoUrl)
    : null;
  const currentVisualUri =
    currentAd?.image_url || currentAd?.thumbnail_url || null;
  const advertiserLabel = isAdMobSlot
    ? "Google AdMob"
    : currentAd?.advertiser ||
      currentAd?.advertiser_name ||
      "معلن";
  const currentUserId = user?.user_id || user?.id;

  // Initialize AdMob
  useEffect(() => {
    const unsubscribe = admobService.subscribe(({ eventType }) => {
      if (eventType === "loaded") {
        setAdMobReady(true);
        setAdMobStatusMessage("الإعلان جاهز");
      } else if (eventType === "error") {
        setAdMobReady(false);
        setAdMobStatusMessage("لا يوجد إعلان متاح الآن");
      } else if (eventType === "unavailable") {
        setAdMobReady(false);
        setAdMobStatusMessage("تعذر تحميل إعلان AdMob حالياً");
      } else if (eventType === "closed") {
        const ready = admobService.isReady();
        setAdMobReady(ready);
        setAdMobStatusMessage(
          ready ? "الإعلان جاهز" : "جاري تحميل إعلان جديد...",
        );
      }
    });

    initAdMob();

    return () => {
      unsubscribe?.();
    };
  }, []);

  const initAdMob = async () => {
    try {
      const initialized = await admobService.initialize();
      if (initialized) {
        const ready = admobService.isReady();
        setAdMobReady(ready);
        setAdMobStatusMessage(
          ready ? "الإعلان جاهز" : "جاري تحميل إعلان المكافأة...",
        );
        console.log("✅ AdMob جاهز");
      } else {
        setAdMobReady(false);
        setAdMobStatusMessage("تعذر تهيئة إعلانات المكافأة");
      }
    } catch (error) {
      setAdMobReady(false);
      setAdMobStatusMessage("فشل تهيئة الإعلانات");
      console.log("❌ خطأ في تهيئة AdMob:", error);
    }
  };

  const parseRewardErrorMessage = useCallback(async (response) => {
    try {
      const payload = await response.json().catch(() => ({}));
      const detail = payload?.detail;
      if (typeof detail === "string" && detail.trim()) return detail;
      if (detail && typeof detail?.message === "string" && detail.message.trim()) {
        return detail.message;
      }
      if (typeof payload?.message === "string" && payload.message.trim()) {
        return payload.message;
      }
    } catch (_) {
      // ignore
    }
    if (response?.status === 429) {
      return "أنهيت تحديات إعلانات اليوم (30 جوهرة). عد غداً.";
    }
    return "تعذر احتساب مكافأة الإعلان حالياً.";
  }, []);

  const persistReward = useCallback(
    async ({ watchDuration, adType }) => {
      if (!currentUserId) {
        return { ok: false, message: "تسجيل الدخول مطلوب لاحتساب المكافأة." };
      }
      try {
        const rewardResponse = await api.claimAdWatchReward(
          currentUserId,
          watchDuration,
          adType,
        );
        if (!rewardResponse.ok) {
          const message = await parseRewardErrorMessage(rewardResponse);
          return { ok: false, status: rewardResponse.status, message };
        }
        const payload = await rewardResponse.json().catch(() => ({}));
        return { ok: true, payload };
      } catch (error) {
        return {
          ok: false,
          message: "تعذر الاتصال بالخادم أثناء حفظ مكافأة الإعلان.",
        };
      }
    },
    [currentUserId, parseRewardErrorMessage],
  );

  // Show AdMob Rewarded Ad
  const showAdMobAd = async ({ advanceAfterWatch = false } = {}) => {
    if (!adMobReady) {
      setAdMobStatusMessage("جاري إعادة تحميل إعلان المكافأة...");
      await initAdMob();
      if (!admobService.isReady()) {
        Alert.alert("انتظر", adMobStatusMessage || "جاري تحميل الإعلان...");
        return false;
      }
      setAdMobReady(true);
    }

    setIsAdMobLoading(true);
    try {
      const result = await admobService.showRewardedAd();
      if (!result.success) {
        Alert.alert(
          "تنبيه",
          result.error || "لا تتوفر إعلانات حالياً. حاول لاحقاً.",
        );
        setAdMobReady(admobService.isReady());
        return false;
      }

      if (!result.rewarded) {
        Alert.alert("تنبيه", "يجب إكمال الإعلان للحصول على المكافأة.");
        setAdMobReady(admobService.isReady());
        return false;
      }

      const persisted = await persistReward({
        watchDuration: 60,
        adType: "admob_rewarded",
      });

      if (!persisted?.ok) {
        Alert.alert("تنبيه", persisted?.message || "تعذر احتساب المكافأة حالياً.");
      } else {
        const gems =
          Number(
            persisted?.payload?.saqr_gems_earned ??
              persisted?.payload?.gems_earned ??
              persisted?.payload?.points_earned ??
              0,
          ) || 0;
        setEarnedGems(gems);
        setShowPointsAnimation(true);
        Vibration.vibrate(100);
        if (onRewardsEarned) {
          onRewardsEarned({ gems });
        }
        if (recordAdWatched) {
          recordAdWatched();
        }
      }

      if (advanceAfterWatch && ads.length > 0) {
        setCurrentIndex((prev) => (prev + 1) % ads.length);
      }

      setTimeout(() => setShowPointsAnimation(false), 3000);
      return true;
    } catch (error) {
      console.log("AdMob error:", error);
      Alert.alert("خطأ", "لا تتوفر إعلانات حالياً. حاول لاحقاً.");
      return false;
    } finally {
      setIsAdMobLoading(false);
    }
  };

  // Load ads
  useEffect(() => {
    loadAds();
    return () => {
      if (watchTimerRef.current) clearInterval(watchTimerRef.current);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, []);

  const loadAds = async () => {
    try {
      const response = await api.getAds();
      if (!response.ok) {
        throw new Error(`ads_fetch_${response.status}`);
      }
      const data = await response.json().catch(() => ({}));
      const adsList = Array.isArray(data)
        ? data
        : Array.isArray(data?.ads)
          ? data.ads
          : [];
      const mixedFeed = buildMixedFeed(
        shuffleArray((adsList || []).slice(0, 16)),
      );
      setAds(mixedFeed);
      setCurrentIndex(0);
      if (!adsList.length) {
        setAdMobStatusMessage(
          "لا توجد إعلانات معلنين حالياً - تظهر إعلانات AdMob",
        );
      }
    } catch (error) {
      console.log("Loading advertiser ads failed:", error.message);
      // No fake ads fallback: keep the feed AdMob-only until advertiser ads are available.
      setAds([buildAdMobSlot(1)]);
      setCurrentIndex(0);
      setAdMobStatusMessage("Google AdMob متاح حالياً");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch comments for current ad
  const fetchComments = useCallback(async () => {
    if (!currentAd || isAdMobSlot) {
      setComments([]);
      return;
    }
    setLoadingComments(true);
    try {
      const response = await api.getComments(currentAd.id);
      if (response.ok) {
        const data = await response.json();
        setComments(data || []);
      }
    } catch (e) {
      console.log("Error fetching comments");
    } finally {
      setLoadingComments(false);
    }
  }, [currentAd, isAdMobSlot]);

  // Load comments when opening panel or changing ad
  useEffect(() => {
    if (showComments && currentAd) {
      fetchComments();
    }
  }, [showComments, currentAd, fetchComments]);

  // Reset comments when changing ad
  useEffect(() => {
    setComments([]);
    setNewComment("");
  }, [currentIndex]);

  // Submit comment
  const handleSubmitComment = async () => {
    if (isAdMobSlot) {
      Alert.alert("تنبيه", "التعليقات متاحة لإعلانات المعلنين فقط.");
      return;
    }
    if (!newComment.trim() || !user || user.is_guest || submittingComment)
      return;

    setSubmittingComment(true);
    try {
      const token = await storage.getToken();
      const response = await api.createComment(
        currentAd.id,
        newComment.trim(),
        token,
      );
      if (response.ok) {
        setNewComment("");
        fetchComments();
      }
    } catch (e) {
      console.log("Error submitting comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  // Like comment
  const handleLikeComment = async (commentId) => {
    if (isAdMobSlot) return;
    if (!user || user.is_guest) return;
    try {
      const token = await storage.getToken();
      await api.likeComment(commentId, token);
      fetchComments();
    } catch (e) {
      console.log("Error liking comment");
    }
  };

  // Watch timer with points
  useEffect(() => {
    // Keep this screen lightweight: rewards are handled by AdMob rewarded ads.
    if (false && isPlaying && currentAd) {
      watchTimerRef.current = setInterval(() => {
        setWatchTime((prev) => {
          const newTime = prev + 1;

          const currentMinute = Math.floor(newTime / 60);
          const lastRewardedMinute = Math.floor(
            lastRewardedTimeRef.current / 60,
          );

          if (
            newTime > 0 &&
            newTime % 60 === 0 &&
            newTime <= currentAd.duration &&
            currentMinute > lastRewardedMinute
          ) {
            lastRewardedTimeRef.current = newTime;
            handlePointsEarned(1);
          }

          if (newTime >= currentAd.duration) {
            clearInterval(watchTimerRef.current);
            return currentAd.duration;
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(watchTimerRef.current);
  }, [isPlaying, currentAd]);

  // Reset on ad change
  useEffect(() => {
    setWatchTime(0);
    lastRewardedTimeRef.current = 0;
    setVideoLoading(true);
  }, [currentIndex]);

  // AdMob slots may not provide visual media, so stop loader in this case.
  useEffect(() => {
    if (!currentVisualUri) {
      setVideoLoading(false);
    }
  }, [currentVisualUri]);

  // Auto-hide controls after 2 seconds (matching web behavior)
  useEffect(() => {
    if (showControls && isPlaying && !showComments) {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2000);
    }
    return () => clearTimeout(controlsTimerRef.current);
  }, [showControls, isPlaying, showComments]);

  const handlePointsEarned = useCallback(
    async (points) => {
      const requestedMinutes = Math.max(1, Number(points) || 1);
      if (currentAd) {
        const persisted = await persistReward({
          watchDuration: requestedMinutes * 60,
          adType: "advertiser_rewarded",
        });
        if (!persisted?.ok) {
          Alert.alert("تنبيه", persisted?.message || "تعذر احتساب المكافأة حالياً.");
          return;
        }
        const gems =
          Number(
            persisted?.payload?.saqr_gems_earned ??
              persisted?.payload?.gems_earned ??
              persisted?.payload?.points_earned ??
              0,
          ) || 0;
        setEarnedGems(gems);
        setShowPointsAnimation(true);
        Vibration.vibrate(100);
        setTimeout(() => setShowPointsAnimation(false), 3000);

        if (onRewardsEarned) onRewardsEarned({ gems });
        if (recordAdWatched) {
          recordAdWatched();
        }
      }
    },
    [currentAd, onRewardsEarned, persistReward, recordAdWatched],
  );

  const navigateAd = (direction) => {
    setShowComments(false);
    if (direction === "next" && currentIndex < ads.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else if (direction === "prev" && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleTap = () => {
    if (showComments) return;
    setShowControls((prev) => !prev);
  };

  const handleTouchStart = (e) => {
    touchStartRef.current = {
      y: e.nativeEvent.pageY,
      x: e.nativeEvent.pageX,
      time: Date.now(),
    };
  };

  const handleTouchEnd = (e) => {
    if (showComments) return;
    const dy = e.nativeEvent.pageY - touchStartRef.current.y;
    const dx = e.nativeEvent.pageX - touchStartRef.current.x;
    const timeDiff = Date.now() - touchStartRef.current.time;

    if (Math.abs(dy) > 80 && timeDiff < 300) {
      if (dy < 0) navigateAd("next");
      else navigateAd("prev");
    } else if (Math.abs(dy) < 10 && Math.abs(dx) < 10) {
      handleTap();
    }
  };

  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleOpenAdvertiserAd = useCallback(async () => {
    if (!currentAd) return;
    const externalUrl = currentAd?.website_url || currentAd?.video_url;
    if (!externalUrl || !/^https?:\/\//i.test(externalUrl)) {
      Alert.alert("تنبيه", "لا يوجد رابط خارجي لهذا الإعلان.");
      return;
    }
    try {
      await Linking.openURL(externalUrl);
    } catch (e) {
      Alert.alert("خطأ", "تعذر فتح رابط الإعلان.");
    }
  }, [currentAd]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  if (ads.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="play-circle-outline" size={80} color="#4b5563" />
        <Text style={styles.emptyText}>لا توجد إعلانات متاحة</Text>
        <TouchableOpacity style={styles.backBtn} onPress={onClose}>
          <Text style={styles.backBtnText}>العودة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={styles.container}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Full-screen background for current feed item */}
      {currentVideoUri ? (
        <Video
          ref={videoRef}
          source={{ uri: currentVideoUri }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isPlaying}
          isLooping
          isMuted={isMuted}
          volume={isMuted ? 0 : 1.0}
          useNativeControls={false}
          onLoadStart={() => setVideoLoading(true)}
          onLoad={() => setVideoLoading(false)}
          onError={() => setVideoLoading(false)}
          posterSource={currentVisualUri ? { uri: currentVisualUri } : undefined}
          usePoster={Boolean(currentVisualUri)}
        />
      ) : currentVisualUri ? (
        <ImageBackground
          source={{ uri: currentVisualUri }}
          style={styles.video}
          resizeMode="cover"
          onLoadStart={() => setVideoLoading(true)}
          onLoadEnd={() => setVideoLoading(false)}
        />
      ) : (
        <View style={[styles.video, styles.videoFallback]}>
          <Ionicons
            name="tv-outline"
            size={72}
            color="rgba(255,255,255,0.35)"
          />
          <Text style={styles.videoFallbackText}>Google AdMob</Text>
        </View>
      )}

      {/* Dark overlay when paused */}
      {!isPlaying && <View style={styles.pauseOverlay} />}

      {/* Video loading */}
      {videoLoading && (
        <View style={styles.videoLoadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      )}

      {/* Points Animation */}
      {showPointsAnimation && (
        <View style={styles.pointsAnimContainer}>
          <View style={styles.pointsAnimCard}>
            <View style={styles.pointsAnimIcon}>
              <Ionicons name="sparkles" size={32} color="#fff" />
            </View>
            <Text style={styles.pointsAnimTitle}>مبروك! أكملت دقيقة إعلان</Text>
            <View style={styles.pointsAnimRow}>
              <Ionicons name="sparkles" size={28} color="#fbbf24" />
              <Text style={styles.pointsAnimValue}>+{earnedGems}</Text>
            </View>
            <Text style={styles.pointsAnimSubtext}>+5 جواهر صقر لكل إعلان مكتمل</Text>
          </View>
        </View>
      )}

      {/* Top Bar - Always visible */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.topBtn}
          onPress={() => {
            // السهم يرجع للملف الشخصي
            if (onNavigateToProfile) {
              onNavigateToProfile();
            } else {
              onClose();
            }
          }}
        >
          <Ionicons name="arrow-forward" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.infoBar}>
          <Text style={styles.infoText}>{currentAd?.duration || 60}s</Text>
          <Text style={styles.infoDivider}>·</Text>
          <Text style={styles.infoText}>{formatTime(watchTime)}</Text>
        </View>

        <TouchableOpacity style={styles.topBtn} onPress={onClose}>
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Full-screen watch CTA (primary AdMob flow) */}
      {!showComments && (
        <View style={styles.watchPrimaryContainer}>
          <View style={styles.watchPrimaryCard}>
            <Text style={styles.watchPrimaryTitle}>
              {isAdMobSlot
                ? "إعلان Google AdMob"
                : currentAd?.title || "إعلان معلن"}
            </Text>
            <Text style={styles.watchPrimarySubtitle}>
              {isAdMobSlot
                ? "إعلان ممول من Google بكامل الشاشة"
                : "إعلان ممول من معلن موثّق"}
            </Text>
            <View style={styles.advertiserStrip}>
              <Ionicons name="megaphone-outline" size={13} color="#cbd5e1" />
              <Text style={styles.advertiserStripText} numberOfLines={1}>
                المعلن: {advertiserLabel}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.watchPrimaryBtn,
                ((isAdMobSlot && (!adMobReady || isAdMobLoading)) ||
                  (!isAdMobSlot && !currentAd)) &&
                  styles.watchPrimaryBtnDisabled,
              ]}
              onPress={() => {
                if (isAdMobSlot) {
                  setFullScreenWatchMode(true);
                  showAdMobAd({ advanceAfterWatch: true }).finally(() =>
                    setFullScreenWatchMode(false),
                  );
                  return;
                }
                handleOpenAdvertiserAd();
              }}
              disabled={
                isAdMobSlot ? isAdMobLoading || !adMobReady : !currentAd
              }
              activeOpacity={0.9}
            >
              {isAdMobLoading || fullScreenWatchMode ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name={isAdMobSlot ? "play-circle" : "open-outline"}
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.watchPrimaryBtnText}>
                    {isAdMobSlot
                      ? "مشاهدة AdMob بكامل الشاشة"
                      : "فتح إعلان المعلن"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.watchPrimaryHint}>
              {isAdMobSlot
                ? "بعد إكمال إعلان Google تنتقل تلقائياً للعنصر التالي"
                : "يمكنك الانتقال بين الإعلانات الشخصية وAdMob من أزرار السابق/التالي"}
            </Text>
            <View style={styles.watchPrimaryNavRow}>
              <TouchableOpacity
                style={[
                  styles.watchPrimaryNavBtn,
                  currentIndex === 0 && styles.watchPrimaryNavBtnDisabled,
                ]}
                onPress={() => navigateAd("prev")}
                disabled={currentIndex === 0}
              >
                <Ionicons name="chevron-up" size={18} color="#fff" />
                <Text style={styles.watchPrimaryNavText}>السابق</Text>
              </TouchableOpacity>
              <Text style={styles.watchPrimaryCounterText}>
                {currentIndex + 1}/{ads.length}
              </Text>
              <TouchableOpacity
                style={[
                  styles.watchPrimaryNavBtn,
                  currentIndex === ads.length - 1 &&
                    styles.watchPrimaryNavBtnDisabled,
                ]}
                onPress={() => navigateAd("next")}
                disabled={currentIndex === ads.length - 1}
              >
                <Text style={styles.watchPrimaryNavText}>التالي</Text>
                <Ionicons name="chevron-down" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Right Side Actions - Always visible */}
      <View style={styles.rightActions}>
        {/* Main action button (AdMob slot or advertiser ad) */}
        <TouchableOpacity
          style={[
            styles.actionBtn,
            isAdMobSlot ? styles.adMobBtn : styles.advertiserBtn,
            isAdMobSlot &&
              (!adMobReady || isAdMobLoading) &&
              styles.actionBtnDisabled,
          ]}
          onPress={() => {
            if (isAdMobSlot) {
              showAdMobAd({ advanceAfterWatch: true });
            } else {
              handleOpenAdvertiserAd();
            }
          }}
          disabled={isAdMobSlot ? isAdMobLoading || !adMobReady : false}
        >
          {isAdMobLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons
              name={isAdMobSlot ? "play" : "open-outline"}
              size={22}
              color={isAdMobSlot ? "#fbbf24" : "#c4b5fd"}
            />
          )}
        </TouchableOpacity>
        <Text style={styles.adMobStatusText}>
          {isAdMobSlot ? adMobStatusMessage : "إعلان معلن"}
        </Text>

        {/* Comments Button */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            if (isAdMobSlot) {
              Alert.alert("تنبيه", "التعليقات متاحة لإعلانات المعلنين فقط.");
              return;
            }
            setShowComments(true);
          }}
        >
          <Ionicons name="chatbubble-outline" size={24} color="#fff" />
          <Text style={styles.actionCount}>
            {isAdMobSlot ? 0 : comments.length}
          </Text>
        </TouchableOpacity>

        {/* Sound Button */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setIsMuted(!isMuted)}
        >
          <Ionicons
            name={isMuted ? "volume-mute" : "volume-high"}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* Tap hint */}
      {!showControls && !showComments && (
        <View style={styles.tapHint}>
          <Text style={styles.tapHintText}>المس للتحكم</Text>
        </View>
      )}

      {/* Controls on tap */}
      {showControls && !showComments && (
        <>
          <TouchableOpacity
            style={styles.playPauseBtn}
            onPress={togglePlayPause}
          >
            {isPlaying ? (
              <View style={styles.pauseIcon}>
                <View style={styles.pauseBar} />
                <View style={styles.pauseBar} />
              </View>
            ) : (
              <Ionicons name="play" size={32} color="#fff" />
            )}
          </TouchableOpacity>

          <View style={styles.navContainer}>
            <TouchableOpacity
              style={[
                styles.navBtn,
                currentIndex === 0 && styles.navBtnDisabled,
              ]}
              onPress={() => navigateAd("prev")}
              disabled={currentIndex === 0}
            >
              <Ionicons name="chevron-up" size={24} color="#fff" />
              <Text style={styles.navText}>السابق</Text>
            </TouchableOpacity>

            <View style={styles.adCounter}>
              {ads
                .slice(
                  Math.max(0, currentIndex - 2),
                  Math.min(ads.length, currentIndex + 3),
                )
                .map((_, idx) => {
                  const actualIdx = Math.max(0, currentIndex - 2) + idx;
                  return (
                    <View
                      key={actualIdx}
                      style={[
                        styles.counterDot,
                        actualIdx === currentIndex && styles.counterDotActive,
                      ]}
                    />
                  );
                })}
            </View>

            <TouchableOpacity
              style={[
                styles.navBtn,
                currentIndex === ads.length - 1 && styles.navBtnDisabled,
              ]}
              onPress={() => navigateAd("next")}
              disabled={currentIndex === ads.length - 1}
            >
              <Text style={styles.navText}>التالي</Text>
              <Ionicons name="chevron-down" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Comments Panel */}
      {showComments && (
        <KeyboardAvoidingView
          style={styles.commentsOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableOpacity
            style={styles.commentsBackdrop}
            onPress={() => setShowComments(false)}
            activeOpacity={1}
          />

          <View style={styles.commentsSheet}>
            {/* Handle */}
            <View style={styles.commentsHandle}>
              <View style={styles.handleBar} />
            </View>

            {/* Header */}
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>
                التعليقات{" "}
                <Text style={styles.commentsCount}>({comments.length})</Text>
              </Text>
              <TouchableOpacity
                style={styles.commentsCloseBtn}
                onPress={() => setShowComments(false)}
              >
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Comments List */}
            <ScrollView
              style={styles.commentsList}
              showsVerticalScrollIndicator={false}
            >
              {loadingComments ? (
                <View style={styles.commentsLoading}>
                  <ActivityIndicator size="large" color="#6366f1" />
                </View>
              ) : comments.length === 0 ? (
                <View style={styles.commentsEmpty}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={48}
                    color="rgba(255,255,255,0.2)"
                  />
                  <Text style={styles.emptyTitle}>لا توجد تعليقات بعد</Text>
                  <Text style={styles.emptySubtitle}>كن أول من يعلق!</Text>
                </View>
              ) : (
                comments.map((comment) => (
                  <View key={comment.comment_id} style={styles.commentItem}>
                    <View style={styles.commentAvatar}>
                      <Text style={styles.avatarText}>
                        {(comment.user_name || "U")[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.commentContent}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentName}>
                          {comment.user_name || "مستخدم"}
                        </Text>
                        <Text style={styles.commentDate}>
                          {new Date(comment.created_at).toLocaleDateString(
                            "ar-SA",
                          )}
                        </Text>
                      </View>
                      <Text style={styles.commentText}>{comment.content}</Text>
                      <TouchableOpacity
                        style={styles.likeBtn}
                        onPress={() => handleLikeComment(comment.comment_id)}
                      >
                        <Ionicons
                          name={
                            comment.likes?.includes(currentUserId)
                              ? "heart"
                              : "heart-outline"
                          }
                          size={16}
                          color={
                            comment.likes?.includes(currentUserId)
                              ? "#ef4444"
                              : "rgba(255,255,255,0.5)"
                          }
                        />
                        <Text style={styles.likeCount}>
                          {comment.likes_count || 0}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Comment Input */}
            <View style={styles.commentInputContainer}>
              {user && !user.is_guest ? (
                <View style={styles.commentInputRow}>
                  <TextInput
                    style={styles.commentInput}
                    value={newComment}
                    onChangeText={setNewComment}
                    placeholder="اكتب تعليقك..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    multiline={false}
                  />
                  <TouchableOpacity
                    style={[
                      styles.sendBtn,
                      (!newComment.trim() || submittingComment) &&
                        styles.sendBtnDisabled,
                    ]}
                    onPress={handleSubmitComment}
                    disabled={!newComment.trim() || submittingComment}
                  >
                    {submittingComment ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="send" size={20} color="#fff" />
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.guestText}>سجل دخولك للتعليق</Text>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  videoFallback: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0b1020",
    gap: 10,
  },
  videoFallbackText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    fontWeight: "600",
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 16,
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
  },
  backBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
  },
  backBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  videoLoadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  // Points Animation
  pointsAnimContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 50,
  },
  pointsAnimCard: {
    backgroundColor: "rgba(0,0,0,0.9)",
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#f59e0b",
  },
  pointsAnimIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f59e0b",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  pointsAnimTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  pointsAnimRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pointsAnimValue: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fbbf24",
  },
  pointsAnimSubtext: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    marginTop: 8,
  },

  // Top Bar
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 34,
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 30,
  },
  topBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  infoBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
  },
  infoDivider: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
  },
  watchPrimaryContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 22,
    zIndex: 25,
  },
  watchPrimaryCard: {
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: "rgba(9,11,24,0.75)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  watchPrimaryTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "right",
  },
  watchPrimarySubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginTop: 3,
    textAlign: "right",
  },
  advertiserStrip: {
    marginTop: 8,
    alignSelf: "flex-end",
    maxWidth: "90%",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(2,6,23,0.36)",
    borderWidth: 1,
    borderColor: "rgba(203,213,225,0.34)",
  },
  advertiserStripText: {
    color: "#e2e8f0",
    fontSize: 11,
    fontWeight: "600",
  },
  watchPrimaryBtn: {
    height: 46,
    borderRadius: 14,
    backgroundColor: "#2563eb",
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  watchPrimaryBtnDisabled: {
    opacity: 0.55,
  },
  watchPrimaryBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  watchPrimaryHint: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    textAlign: "right",
    marginTop: 6,
  },
  watchPrimaryNavRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  watchPrimaryNavBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  watchPrimaryNavBtnDisabled: {
    opacity: 0.4,
  },
  watchPrimaryNavText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  watchPrimaryCounterText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "600",
  },

  // Right Actions
  rightActions: {
    position: "absolute",
    right: 16,
    bottom: 180,
    alignItems: "center",
    gap: 16,
    zIndex: 20,
  },
  actionBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  adMobBtn: {
    backgroundColor: "rgba(251,191,36,0.2)",
    borderColor: "rgba(251,191,36,0.5)",
  },
  advertiserBtn: {
    backgroundColor: "rgba(129,140,248,0.22)",
    borderColor: "rgba(196,181,253,0.6)",
  },
  actionBtnDisabled: {
    opacity: 0.45,
  },
  adMobStatusText: {
    maxWidth: 78,
    textAlign: "center",
    color: "rgba(255,255,255,0.65)",
    fontSize: 10,
    marginTop: -10,
    marginBottom: 2,
  },
  actionCount: {
    color: "#fff",
    fontSize: 10,
    marginTop: 2,
    position: "absolute",
    bottom: -16,
  },

  // Tap Hint
  tapHint: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    zIndex: 10,
  },
  tapHintText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
  },

  // Play/Pause
  playPauseBtn: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -32,
    marginLeft: -32,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  pauseIcon: {
    flexDirection: "row",
    gap: 6,
  },
  pauseBar: {
    width: 6,
    height: 24,
    backgroundColor: "#fff",
    borderRadius: 3,
  },

  // Navigation
  navContainer: {
    position: "absolute",
    bottom: 60, // زيادة المسافة من الأسفل للأجهزة الحديثة
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
    paddingBottom: Platform.OS === "ios" ? 20 : 0, // مسافة إضافية لـ iOS
  },
  navBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  navText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  adCounter: {
    flexDirection: "row",
    gap: 4,
    marginVertical: 12,
  },
  counterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  counterDotActive: {
    width: 24,
    backgroundColor: "#fff",
  },

  // Comments Panel
  commentsOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  commentsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  commentsSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0f0f14",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
  },
  commentsHandle: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  handleBar: {
    width: 48,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
  },
  commentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  commentsTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  commentsCount: {
    color: "rgba(255,255,255,0.5)",
    fontWeight: "normal",
    fontSize: 14,
  },
  commentsCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  commentsList: {
    maxHeight: 300,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  commentsLoading: {
    paddingVertical: 40,
    alignItems: "center",
  },
  commentsEmpty: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 16,
    marginTop: 16,
  },
  emptySubtitle: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 14,
    marginTop: 4,
  },
  commentItem: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  commentName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  commentDate: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
  },
  commentText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    lineHeight: 20,
  },
  likeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  likeCount: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
  },
  commentInputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  commentInputRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  commentInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    textAlign: "right",
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  guestText: {
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    fontSize: 14,
  },
});

export default memo(AdViewerScreen);
