import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";
import AdRewardsCenter from "../components/AdRewardsCenter";

const { width } = Dimensions.get("window");
const GEMS_PER_PACKAGE = 500;
const SAR_PER_PACKAGE = 3;
const AD_REWARD_GEMS = 5;

const StatsCard = ({ icon, value, label, color }) => (
  <View style={styles.statsCard}>
    <View style={[styles.statsIconBg, { backgroundColor: `${color}22` }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.statsValue}>{value}</Text>
    <Text style={styles.statsLabel}>{label}</Text>
  </View>
);

const RiyalProgress = ({ saqrGems }) => {
  const progress = ((saqrGems % GEMS_PER_PACKAGE) / GEMS_PER_PACKAGE) * 100;
  const fullPackages = Math.floor(saqrGems / GEMS_PER_PACKAGE);
  const riyalsEarned = fullPackages * SAR_PER_PACKAGE;
  const gemsToNext =
    saqrGems % GEMS_PER_PACKAGE === 0
      ? GEMS_PER_PACKAGE
      : GEMS_PER_PACKAGE - (saqrGems % GEMS_PER_PACKAGE);

  return (
    <View style={styles.progressCard}>
      <View style={styles.progressHeader}>
        <View style={styles.progressIcon}>
          <Text style={styles.progressIconText}>ر.س</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.progressTitle}>تقدمك نحو السحب</Text>
          <Text style={styles.progressValue}>{riyalsEarned} ريال مكتسب</Text>
        </View>
      </View>
      <View style={styles.progressTrack}>
        <LinearGradient
          colors={["#22c55e", "#16a34a"]}
          style={[styles.progressFill, { width: `${progress}%` }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </View>
      <Text style={styles.progressHint}>{gemsToNext} جوهرة للوصول إلى 3 ريال</Text>
      <View style={styles.rateChip}>
        <Ionicons name="swap-horizontal" size={14} color="#10b981" />
        <Text style={styles.rateText}>500 جوهرة صقر = 3 ريال سعودي</Text>
      </View>
    </View>
  );
};

const SaqrFortunesScreen = ({ user, onClose, onBalanceUpdate }) => {
  const userId = user?.id || user?.user_id;
  const [loading, setLoading] = useState(true);
  const [saqrGems, setSaqrGems] = useState(0);
  const [totalAds, setTotalAds] = useState(0);
  const [todayAds, setTodayAds] = useState(0);
  const [showRewardsCenter, setShowRewardsCenter] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const balanceResponse = await api.getBalance(userId);
      if (balanceResponse.ok) {
        const data = await balanceResponse.json();
        setSaqrGems(Number(data.saqr_gems || 0));
      }

      const statsKey = `saqr_fortunes_stats_${userId}`;
      const savedStats = await AsyncStorage.getItem(statsKey);
      const today = new Date().toDateString();
      if (!savedStats) return;

      const parsed = JSON.parse(savedStats);
      setTotalAds(parsed.totalAds || 0);
      if (parsed.lastDate === today) {
        setTodayAds(parsed.todayAds || 0);
      } else {
        setTodayAds(0);
      }
    } catch (e) {
      console.log("Error loading fortunes data:", e);
    } finally {
      setLoading(false);
    }
  };

  const refreshBalance = async () => {
    try {
      const response = await api.getBalance(userId);
      if (response.ok) {
        const data = await response.json();
        setSaqrGems(Number(data.saqr_gems || 0));
      }
    } catch (e) {
      console.log("Error refreshing balance:", e);
    }
  };

  const persistStats = async (nextToday, nextTotal) => {
    try {
      await AsyncStorage.setItem(
        `saqr_fortunes_stats_${userId}`,
        JSON.stringify({
          todayAds: nextToday,
          totalAds: nextTotal,
          lastDate: new Date().toDateString(),
        }),
      );
    } catch (e) {
      console.log("Error saving fortunes stats:", e);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#60a5fa" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0a0a0f", "#1a1a2e", "#0a0a0f"]} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>ثروات صقر</Text>
            <Text style={styles.headerSub}>5 جواهر لكل إعلان مكتمل</Text>
          </View>
          <View style={styles.gemsHeader}>
            <Ionicons name="sparkles" size={14} color="#FFF" />
            <Text style={styles.gemsHeaderText}>{saqrGems}</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.statsRow}>
            <StatsCard icon="tv" value={todayAds} label="إعلانات اليوم" color="#60a5fa" />
            <StatsCard icon="videocam" value={totalAds} label="إجمالي الإعلانات" color="#ec4899" />
            <StatsCard
              icon="cash"
              value={`${Math.floor(saqrGems / GEMS_PER_PACKAGE) * SAR_PER_PACKAGE} ر.س`}
              label="القيمة القابلة للسحب"
              color="#22c55e"
            />
          </View>

          <RiyalProgress saqrGems={saqrGems} />

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.9}
            onPress={() => setShowRewardsCenter(true)}
          >
            <LinearGradient
              colors={["#ec4899", "#9333ea"]}
              style={styles.primaryBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="play-circle" size={28} color="#FFF" />
              <View style={{ flex: 1 }}>
                <Text style={styles.primaryTitle}>شاهد إعلان AdMob واربح</Text>
                <Text style={styles.primarySubtitle}>
                  تحصل مباشرة على {AD_REWARD_GEMS} جواهر صقر
                </Text>
              </View>
              <View style={styles.primaryRewardChip}>
                <Text style={styles.primaryRewardText}>+{AD_REWARD_GEMS}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.tipCard}>
            <Ionicons name="information-circle" size={18} color="#fbbf24" />
            <Text style={styles.tipText}>
              المكافآت الآن موحدة: لا ألماس نهائياً، وكل إعلان مكتمل يضيف 5 جواهر صقر فقط.
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>

      <AdRewardsCenter
        visible={showRewardsCenter}
        onClose={() => {
          setShowRewardsCenter(false);
          refreshBalance();
        }}
        userId={userId}
        onBalanceUpdate={async (rewardData = {}) => {
          const nextToday =
            Number(
              rewardData?.today_admob_ads_watched ??
                rewardData?.today_ads_watched ??
                todayAds + 1,
            ) || todayAds + 1;
          const nextTotal = totalAds + 1;
          const nextBalance =
            Number(rewardData?.saqr_gems ?? saqrGems + AD_REWARD_GEMS) ||
            saqrGems + AD_REWARD_GEMS;
          setTodayAds(nextToday);
          setTotalAds(nextTotal);
          setSaqrGems(nextBalance);
          await persistStats(nextToday, nextTotal);
          onBalanceUpdate?.({ saqr_gems: nextBalance, ...rewardData });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0f" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0a0f",
  },
  gradient: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#FFF" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 },
  gemsHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(244,114,182,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  gemsHeaderText: { color: "#f472b6", fontWeight: "bold", fontSize: 14 },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 10,
  },
  statsCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  statsIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statsValue: { fontSize: 18, fontWeight: "bold", color: "#FFF", marginBottom: 2 },
  statsLabel: { fontSize: 10, color: "rgba(255,255,255,0.5)", textAlign: "center" },
  progressCard: {
    marginHorizontal: 16,
    backgroundColor: "rgba(34,197,94,0.1)",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.2)",
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  progressIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(34,197,94,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  progressIconText: { fontSize: 20, fontWeight: "bold", color: "#22c55e" },
  progressTitle: { fontSize: 13, color: "rgba(255,255,255,0.7)" },
  progressValue: { fontSize: 18, fontWeight: "bold", color: "#22c55e", marginTop: 2 },
  progressTrack: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: { height: "100%", borderRadius: 4 },
  progressHint: { fontSize: 12, color: "rgba(255,255,255,0.6)", textAlign: "center" },
  rateChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 10,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(34,197,94,0.2)",
  },
  rateText: { fontSize: 12, color: "#22c55e", fontWeight: "500" },
  primaryBtn: {
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 16,
  },
  primaryBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  primaryTitle: { color: "#FFF", fontSize: 16, fontWeight: "700", marginBottom: 3 },
  primarySubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 12 },
  primaryRewardChip: {
    backgroundColor: "rgba(0,0,0,0.28)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  primaryRewardText: { color: "#FFF", fontSize: 14, fontWeight: "700" },
  tipCard: {
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(251,191,36,0.12)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.2)",
    padding: 12,
  },
  tipText: { flex: 1, color: "rgba(255,255,255,0.82)", fontSize: 12, lineHeight: 18 },
});

export default SaqrFortunesScreen;
