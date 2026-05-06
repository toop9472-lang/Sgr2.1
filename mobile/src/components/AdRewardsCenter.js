// مركز مكافآت الإعلانات - Ad Rewards Center
// نظام متكامل وممتع لمشاهدة الإعلانات والحصول على المكافآت
// 5 جواهر صقر لكل إعلان مكتمل - 500 جوهرة = 3 ريال سعودي

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Vibration,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import api from "../services/api";
import admobService from "../services/admobService";

const { width } = Dimensions.get("window");

// ==================== ثوابت النظام ====================
const GEMS_PER_RIYAL = 500; // 500 جوهرة = 3 ريال سعودي
const SAR_PER_EXCHANGE = 3;
const DEFAULT_DAILY_GOAL_GEMS = 130;
const DEFAULT_DAILY_GOAL_ADS = 30;

const FIXED_AD_REWARD_GEMS = 5;

const RewardResultModal = ({
  visible,
  gems,
  onClose,
  isBonus,
  bonusReason,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Vibration.vibrate([0, 50, 100, 50]);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
    }
  }, [visible]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={resultStyles.overlay}>
        <Animated.View
          style={[
            resultStyles.container,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <LinearGradient
            colors={["#1a1a2e", "#16213e"]}
            style={resultStyles.gradient}
          >
            {/* Confetti Effect */}
            <View style={resultStyles.confetti}>
              {[...Array(20)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    resultStyles.confettiPiece,
                    {
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 0.5}s`,
                      backgroundColor: [
                        "#fbbf24",
                        "#22c55e",
                        "#ec4899",
                        "#60a5fa",
                      ][Math.floor(Math.random() * 4)],
                    },
                  ]}
                />
              ))}
            </View>

            <Animated.View
              style={[resultStyles.iconContainer, { transform: [{ rotate }] }]}
            >
              <Ionicons name="sparkles" size={60} color="#f472b6" />
            </Animated.View>

            <Text style={resultStyles.title}>
              {isBonus ? "مكافأة إضافية!" : "مبروك!"}
            </Text>

            <Text style={resultStyles.gemsCount}>+{gems}</Text>
            <Text style={resultStyles.label}>جوهرة صقر</Text>

            {bonusReason && (
            <View style={resultStyles.bonusReason}>
              <Ionicons name="star" size={16} color="#fbbf24" />
              <Text style={resultStyles.bonusText}>{bonusReason}</Text>
            </View>
            )}

            <View style={resultStyles.valueInfo}>
              <Text style={resultStyles.valueText}>
                قيمتها: {(gems / GEMS_PER_RIYAL).toFixed(3)} ريال
              </Text>
            </View>

            <TouchableOpacity
              style={resultStyles.closeButton}
              onPress={onClose}
            >
              <LinearGradient
                colors={["#3b82f6", "#2563eb"]}
                style={resultStyles.closeGradient}
              >
                <Text style={resultStyles.closeButtonText}>رائع!</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const resultStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: width * 0.85,
    maxWidth: 350,
    borderRadius: 24,
    overflow: "hidden",
  },
  gradient: {
    padding: 30,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  confetti: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  confettiPiece: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    top: -10,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(96,165,250,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "#60a5fa",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 10,
  },
  gemsCount: {
    fontSize: 56,
    fontWeight: "800",
    color: "#f472b6",
    textShadowColor: "rgba(244,114,182,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  label: {
    fontSize: 18,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 16,
  },
  bonusReason: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(251,191,36,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  bonusText: {
    color: "#fbbf24",
    fontSize: 13,
  },
  valueInfo: {
    marginBottom: 20,
  },
  valueText: {
    color: "#10b981",
    fontSize: 14,
  },
  closeButton: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
  },
  closeGradient: {
    padding: 14,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

// ==================== المكون الرئيسي - مركز المكافآت ====================
const AdRewardsCenter = ({ visible, onClose, userId, onBalanceUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayAds: 0,
    todayGems: 0,
    totalGems: 0,
    remainingAds: DEFAULT_DAILY_GOAL_ADS,
    remainingGems: DEFAULT_DAILY_GOAL_GEMS,
    dailyGoalAds: DEFAULT_DAILY_GOAL_ADS,
    dailyGoalGems: DEFAULT_DAILY_GOAL_GEMS,
    challengeCompleted: false,
  });
  const [adGateLoading, setAdGateLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [currentPrize, setCurrentPrize] = useState({
    id: 1,
    gems: FIXED_AD_REWARD_GEMS,
    label: String(FIXED_AD_REWARD_GEMS),
  });
  const [userGems, setUserGems] = useState(0);

  useEffect(() => {
    if (visible) {
      loadAdStats();
      loadBalance();
    }
  }, [visible]);

  const parseApiError = async (response, fallbackMessage) => {
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
    return fallbackMessage;
  };

  const loadAdStats = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const response = await api.getAdChallengeStatus(userId);
      if (!response.ok) {
        throw new Error(`ad_stats_${response.status}`);
      }
      const data = await response.json().catch(() => ({}));
      const todayAds =
        Number(data?.today_admob_ads_watched ?? data?.today_ads_watched ?? 0) || 0;
      const todayGems =
        Number(
          data?.today_challenge_gems_earned ?? data?.today_gems_earned ?? 0,
        ) || 0;
      const totalGems = Number(data?.total_ad_gems ?? 0) || 0;
      const dailyGoalAds =
        Number(data?.daily_goal_ads ?? DEFAULT_DAILY_GOAL_ADS) || DEFAULT_DAILY_GOAL_ADS;
      const dailyGoalGems =
        Number(data?.daily_goal_gems ?? DEFAULT_DAILY_GOAL_GEMS) || DEFAULT_DAILY_GOAL_GEMS;
      const remainingAds = Math.max(
        0,
        Number(data?.remaining_ads_today ?? dailyGoalAds - todayAds) || 0,
      );
      const remainingGems = Math.max(
        0,
        Number(data?.remaining_gems_today ?? dailyGoalGems - todayGems) || 0,
      );
      setStats({
        todayAds,
        todayGems,
        totalGems,
        remainingAds,
        remainingGems,
        dailyGoalAds,
        dailyGoalGems,
        challengeCompleted: Boolean(data?.challenge_completed || remainingGems <= 0),
      });
    } catch (e) {
      console.log("Error loading ad stats:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadBalance = async () => {
    try {
      const response = await api.getBalance(userId);
      if (response.ok) {
        const data = await response.json();
        setUserGems(data.saqr_gems || 0);
      }
    } catch (e) {
      console.log("Error loading balance:", e);
    }
  };

  const startWatchingAd = async () => {
    if (loading) return;
    if (adGateLoading) return;

    setAdGateLoading(true);
    try {
      const initialized = await admobService.initialize();
      if (!initialized) {
        Alert.alert("تعذر التحميل", "إعلانات Google AdMob غير متاحة حالياً.");
        return;
      }

      const adResult = await admobService.showRewardedAd();
      if (adResult?.success && adResult?.rewarded) {
        await handleAdComplete();
      } else {
        Alert.alert(
          "لم تكتمل المشاهدة",
          "يجب إكمال الإعلان كاملاً للحصول على المكافأة.",
        );
      }
    } catch (error) {
      Alert.alert("تعذر العرض", "حدث خطأ أثناء تشغيل إعلان المكافأة.");
    } finally {
      setAdGateLoading(false);
    }
  };

  const handleAdComplete = async () => {
    try {
      const response = await api.claimAdWatchReward(
        userId,
        60,
        "admob_rewarded",
      );
      if (!response.ok) {
        const message = await parseApiError(
          response,
          "تعذر احتساب مكافأة الإعلان حالياً.",
        );
        Alert.alert("تنبيه", message);
        await loadAdStats();
        return;
      }
      const data = await response.json();
      const rewardedGems =
        Number(data?.saqr_gems_earned ?? data?.gems_earned ?? FIXED_AD_REWARD_GEMS) ||
        FIXED_AD_REWARD_GEMS;
      setCurrentPrize({
        id: 1,
        gems: rewardedGems,
        label: String(rewardedGems),
      });
      const nextBalance =
        Number(data?.new_gems_balance ?? data?.new_balance ?? userGems + rewardedGems) ||
        userGems + rewardedGems;
      setUserGems(nextBalance);
      setShowResult(true);
      await loadAdStats();
      if (onBalanceUpdate) {
        onBalanceUpdate({
          saqr_gems: nextBalance,
          today_ads_watched: data?.today_ads_watched,
          today_admob_ads_watched: data?.today_admob_ads_watched,
          today_user_ads_watched: data?.today_user_ads_watched,
          today_gems_earned: data?.today_gems_earned,
          today_challenge_gems_earned: data?.today_challenge_gems_earned,
          remaining_ads_today: data?.remaining_ads_today,
          remaining_gems_today: data?.remaining_gems_today,
          daily_goal_gems: data?.daily_goal_gems,
        });
      }
    } catch (e) {
      Alert.alert("خطأ", "تعذر إضافة الجواهر بعد الإعلان.");
    }
  };

  const closeResult = () => {
    setShowResult(false);
    setCurrentPrize({
      id: 1,
      gems: FIXED_AD_REWARD_GEMS,
      label: String(FIXED_AD_REWARD_GEMS),
    });
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      presentationStyle="overFullScreen"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={["#0a0a0f", "#1a1a2e"]}
            style={styles.gradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>مركز المكافآت</Text>
              <View style={styles.gemsBadge}>
                <Ionicons name="sparkles" size={16} color="#f472b6" />
                <Text style={styles.gemsCount}>{userGems}</Text>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Exchange Rate Banner */}
              <LinearGradient
                colors={["rgba(16,185,129,0.2)", "rgba(16,185,129,0.05)"]}
                style={styles.exchangeBanner}
              >
                <Ionicons name="swap-horizontal" size={20} color="#10b981" />
                <Text style={styles.exchangeText}>
                  500 جوهرة = 3 ريال سعودي
                </Text>
              </LinearGradient>

              {/* Stats Cards */}
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.todayAds}</Text>
                  <Text style={styles.statLabel}>إعلانات اليوم</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      {stats.todayGems}/{stats.dailyGoalGems}
                    </Text>
                    <Text style={styles.statLabel}>تحدي اليوم</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.totalGems || 0}</Text>
                  <Text style={styles.statLabel}>مجموع الجواهر</Text>
                </View>
              </View>

              {/* Main Watch Ad Button */}
              <TouchableOpacity
                style={[
                  styles.watchAdBtn,
                  (adGateLoading || loading) &&
                    styles.watchAdBtnDisabled,
                ]}
                onPress={startWatchingAd}
                disabled={adGateLoading || loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#ec4899", "#9333ea"]}
                  style={styles.watchAdGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <View style={styles.watchAdIcon}>
                    <Ionicons name="play-circle" size={40} color="#FFF" />
                  </View>
                  <View style={styles.watchAdInfo}>
                    <Text style={styles.watchAdTitle}>
                      {loading
                        ? "جاري تحديث تقدمك اليومي..."
                        : adGateLoading
                        ? "جاري فتح إعلان AdMob..."
                        : stats.challengeCompleted
                          ? "التحدي اليومي مكتمل - استمر بالكسب"
                          : "شاهد إعلان AdMob واربح الآن"}
                    </Text>
                    <Text style={styles.watchAdDesc}>
                      {loading
                        ? "لحظات من فضلك"
                        : adGateLoading
                        ? "انتظر قليلاً"
                        : stats.challengeCompleted
                          ? "ممتاز! أكملت تحدي 30 إعلان AdMob (130 جوهرة متدرجة)"
                          : `المتبقي اليوم: ${stats.remainingAds} إعلان AdMob • ${stats.remainingGems} جوهرة`}
                    </Text>
                  </View>
                  <View style={styles.watchAdBadge}>
                    {adGateLoading ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Ionicons name="sparkles" size={14} color="#FFF" />
                        <Text style={styles.watchAdBadgeText}>+5</Text>
                      </>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Tips */}
              <View style={styles.tipsCard}>
                <Ionicons name="bulb" size={18} color="#fbbf24" />
                <Text style={styles.tipsText}>
                  إعلان AdMob المكتمل يمنح 5 جواهر، وإعلان المعلن يمنح 1 جوهرة. التحدي اليومي: 30 إعلان AdMob بمجموع 130 جوهرة متدرجة.
                </Text>
              </View>

              {/* Daily Progress */}
              <View style={styles.dailyProgress}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressTitle}>تقدم اليوم</Text>
                  <Text style={styles.progressCount}>
                    {stats.todayGems}/{stats.dailyGoalGems}
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(
                          100,
                          ((stats.todayGems || 0) / Math.max(1, stats.dailyGoalGems || 1)) * 100,
                        )}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressMetaText}>
                  {stats.challengeCompleted
                    ? "اكتمل تحدي اليوم: 30 إعلان AdMob = 130 جوهرة متدرجة."
                    : `المتبقي: ${stats.remainingAds} إعلان • ${stats.remainingGems} جوهرة`}
                </Text>
              </View>

              <View style={{ height: 30 }} />
            </ScrollView>
          </LinearGradient>
        </View>

        {/* Result Modal */}
        <RewardResultModal
          visible={showResult}
          gems={currentPrize?.gems || FIXED_AD_REWARD_GEMS}
          onClose={closeResult}
          isBonus={false}
          bonusReason={null}
        />
      </View>
    </Modal>
  );
};

// ==================== الأنماط ====================
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 16,
  },
  container: {
    backgroundColor: "#0a0a0f",
    borderRadius: 24,
    width: "96%",
    maxWidth: 460,
    height: "92%",
    maxHeight: "94%",
    overflow: "hidden",
  },
  gradient: {
    flex: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
  gemsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(96, 165, 250, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  gemsCount: {
    color: "#60a5fa",
    fontWeight: "bold",
    fontSize: 14,
  },
  exchangeBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
  },
  exchangeText: {
    color: "#10b981",
    fontSize: 15,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
  },
  watchAdBtn: {
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 20,
  },
  watchAdBtnDisabled: {
    opacity: 0.65,
  },
  watchAdGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  watchAdIcon: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  watchAdInfo: {
    flex: 1,
  },
  watchAdTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 4,
  },
  watchAdDesc: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  },
  watchAdBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  watchAdBadgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
    marginBottom: 12,
    textAlign: "right",
  },
  streakGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  streakItem: {
    width: (width - 64) / 3,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    position: "relative",
  },
  streakItemAchieved: {
    backgroundColor: "rgba(251,191,36,0.1)",
    borderColor: "rgba(251,191,36,0.3)",
  },
  streakCount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
  },
  streakCountAchieved: {
    color: "#fbbf24",
  },
  streakReward: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
  },
  streakBonus: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  streakBonusAchieved: {
    color: "#fbbf24",
  },
  checkIcon: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  tipsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(251, 191, 36, 0.1)",
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.2)",
    marginBottom: 16,
  },
  tipsText: {
    flex: 1,
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 18,
  },
  dailyProgress: {
    marginHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 14,
    color: "#FFF",
    fontWeight: "500",
  },
  progressCount: {
    fontSize: 14,
    color: "#60a5fa",
    fontWeight: "600",
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#22c55e",
    borderRadius: 3,
  },
  progressMetaText: {
    marginTop: 8,
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    textAlign: "right",
  },
  wheelOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  wheelContainer: {
    width: width * 0.9,
    maxWidth: 360,
    maxHeight: "90%",
    borderRadius: 24,
    overflow: "hidden",
  },
  wheelGradient: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: "center",
    position: "relative",
  },
  wheelCloseBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  wheelTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 20,
  },
  wheelHint: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    marginTop: 20,
  },
});

export default AdRewardsCenter;
