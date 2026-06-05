// Profile Screen - User profile and settings
// Complete Professional Design with All Features
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Modal,
  TextInput,
  Share,
  ActivityIndicator,
  Image,
  Platform,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { Video, ResizeMode } from "expo-av";
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from "expo-tracking-transparency";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import api from "../services/api";
import storage from "../services/storage";
import { useAchievements } from "../services/AchievementsContext";
import FollowListModal from "../components/FollowListModal";

// Some clips share a generic placeholder thumbnail uploaded by older
// versions of the app. We treat these as "no real thumbnail" so the tile
// falls back to a clean dark play-icon placeholder.
const PLACEHOLDER_SIGNATURES = [
  "static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8",
  "example.com/t.jpg",
  "example.com/thumbnail",
];

const isPlaceholderThumb = (url) => {
  if (!url) return true;
  const lower = String(url).toLowerCase();
  return PLACEHOLDER_SIGNATURES.some((sig) => lower.includes(sig.toLowerCase()));
};

const toAbsoluteUrl = (value) => {
  const normalized = (value || "").trim();
  if (!normalized) return "";
  if (normalized.startsWith("http")) return normalized;
  if (normalized.startsWith("/")) return `${api.getActiveBaseUrl()}${normalized}`;
  return normalized;
};

// Returns the REAL thumbnail URL only — never substitutes a random image.
// When the clip has no genuine thumbnail (or only the legacy placeholder),
// returns null so the UI renders a neutral dark play-icon tile.
const resolveClipThumb = (clip) => {
  const direct = toAbsoluteUrl(clip?.thumbnail_url);
  if (direct && !isPlaceholderThumb(direct)) return direct;
  return null;
};

const ProfileScreen = ({
  user,
  onLogout,
  onNavigate,
  onOpenAchievements,
  onOpenAdminPanel,
  onUpdateProfile,
  onOpenSettings,
  onOpenUserProfile,
  adminLoginTrigger = 0,
}) => {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [adminTapCount, setAdminTapCount] = useState(0);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Open the admin login modal whenever Settings asks us to (uses a changing
  // timestamp as the trigger so a repeated tap re-opens reliably).
  useEffect(() => {
    if (adminLoginTrigger && adminLoginTrigger > 0) {
      setShowAdminLogin(true);
    }
  }, [adminLoginTrigger]);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [editName, setEditName] = useState(user?.name || "");
  const [editAvatarUrl, setEditAvatarUrl] = useState(user?.avatar || "");
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || "");
  const [profileFrame, setProfileFrame] = useState(null);
  const [economy, setEconomy] = useState({
    saqr_points: user?.points || 0,
    saqr_gems: user?.saqr_gems || 0,
  });
  const [followStats, setFollowStats] = useState({
    followers_count: 0,
    following_count: 0,
  });
  const [myClips, setMyClips] = useState([]);
  const [myClipsLoading, setMyClipsLoading] = useState(false);
  const [followListMode, setFollowListMode] = useState(null); // 'followers' | 'following' | null

  // Achievements context
  const { recordAppShared } = useAchievements();

  const userGems = economy?.saqr_gems ?? user?.saqr_gems ?? 0;
  const userIdentifier = user?.id || user?.user_id || "N/A";
  const watchedAds = user?.ads_watched || 0;
  const referralCode =
    user?.referral_code ||
    "SAQR" + (user?.id?.slice(-6) || "123456").toUpperCase();
  const referrals = user?.referrals_count || 0;
  const redeemableRiyals = Math.floor(userGems / 500);
  const riyalValue = redeemableRiyals.toFixed(0);
  const gemsRemainder = userGems % 500;
  const gemsProgress = (gemsRemainder / 500) * 100;
  const gemsToNextRiyal = gemsRemainder === 0 ? 500 : 500 - gemsRemainder;

  useEffect(() => {
    const loadProfileAppearance = async () => {
      try {
        const savedAvatar = await AsyncStorage.getItem(
          "selected_profile_avatar",
        );
        const savedFrame = await AsyncStorage.getItem("selected_profile_frame");
        if (savedAvatar) {
          setProfileAvatar(savedAvatar);
          setEditAvatarUrl(savedAvatar);
        }
        if (savedFrame) {
          setProfileFrame(JSON.parse(savedFrame));
        }
      } catch (e) {
        console.log("Profile appearance load error:", e);
      }
    };

    const loadBalance = async () => {
      try {
        const uid = user?.id || user?.user_id;
        if (!uid) return;
        const response = await api.getBalance(uid);
        if (response.ok) {
          const data = await response.json();
          setEconomy({
            saqr_points: data.saqr_points ?? data.points ?? 0,
            saqr_gems: data.saqr_gems ?? 0,
          });
        }
      } catch (e) {
        console.log("Profile balance load error:", e);
      }
    };

    const loadFollowStats = async () => {
      try {
        const uid = user?.id || user?.user_id;
        if (!uid) return;
        const response = await api.getClipProfileStats(uid, uid);
        if (!response.ok) return;
        const data = await response.json().catch(() => ({}));
        setFollowStats({
          followers_count: Number(data?.followers_count ?? 0) || 0,
          following_count: Number(data?.following_count ?? 0) || 0,
        });
      } catch (e) {
        console.log("Profile follow stats load error:", e);
      }
    };

    const loadMyClips = async () => {
      try {
        const uid = user?.id || user?.user_id;
        if (!uid) return;
        setMyClipsLoading(true);
        const r = await api.fetch(
          `/api/users/clips/${encodeURIComponent(uid)}?viewer_id=${encodeURIComponent(uid)}`,
        );
        if (!r.ok) return;
        const d = await r.json().catch(() => ({}));
        setMyClips(Array.isArray(d?.clips) ? d.clips : []);
      } catch (e) {
        console.log("loadMyClips error:", e);
      } finally {
        setMyClipsLoading(false);
      }
    };

    loadProfileAppearance();
    loadBalance();
    loadFollowStats();
    loadMyClips();
  }, [user?.id, user?.user_id]);

  const handleWithdraw = () => {
    if (redeemableRiyals < 1) {
      Alert.alert(
        "رصيد غير كافٍ",
        `تحتاج 500 جوهرة صقر على الأقل للسحب. لديك حالياً ${userGems} جوهرة.`,
        [{ text: "حسناً" }],
      );
    } else {
      Alert.alert(
        "طلب سحب",
        `هل تريد سحب ${redeemableRiyals} ر.س؟\nسيتم خصم ${redeemableRiyals * 500} جوهرة صقر ومراجعة الطلب خلال 24 ساعة.`,
        [
          { text: "إلغاء", style: "cancel" },
          { text: "تأكيد السحب", onPress: submitWithdrawal },
        ],
      );
    }
  };

  const submitWithdrawal = async () => {
    setIsLoading(true);
    try {
      const token = await storage.getToken();
      const response = await api.requestWithdrawal(
        { amount: redeemableRiyals },
        token,
      );
      if (response.ok) {
        Alert.alert(
          "تم الطلب",
          "تم إرسال طلب السحب بنجاح. سيتم مراجعته خلال 24 ساعة.",
        );
      } else {
        Alert.alert("خطأ", "فشل في إرسال الطلب. حاول مرة أخرى.");
      }
    } catch (error) {
      Alert.alert("خطأ", "حدث خطأ في الاتصال.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      Alert.alert("خطأ", "يرجى ملء جميع الحقول");
      return;
    }
    if (passwords.new !== passwords.confirm) {
      Alert.alert("خطأ", "كلمة المرور الجديدة غير متطابقة");
      return;
    }
    if (passwords.new.length < 8) {
      Alert.alert("خطأ", "كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }

    setIsLoading(true);
    try {
      const token = await storage.getToken();
      const response = await api.changePassword(
        {
          current_password: passwords.current,
          new_password: passwords.new,
        },
        token,
      );

      if (response.ok) {
        Alert.alert("تم بنجاح", "تم تغيير كلمة المرور بنجاح");
        setShowChangePassword(false);
        setPasswords({ current: "", new: "", confirm: "" });
      } else {
        const data = await response.json();
        Alert.alert("خطأ", data.detail || "فشل في تغيير كلمة المرور");
      }
    } catch (error) {
      Alert.alert("خطأ", "حدث خطأ في الاتصال");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareApp = async () => {
    try {
      const result = await Share.share({
        message: `جرب تطبيق صقر واكسب المال من مشاهدة الإعلانات!\n\nاستخدم كود الإحالة: ${referralCode}\n\nحمّل التطبيق الآن!`,
        title: "شارك تطبيق صقر",
      });

      // Record app share for achievements if share was successful
      if (result.action === Share.sharedAction && recordAppShared) {
        recordAppShared();
      }
    } catch (error) {
      console.log("Share error:", error);
    }
  };

  const copyReferralCode = async () => {
    await Clipboard.setStringAsync(referralCode);
    Alert.alert("تم النسخ", `تم نسخ كود الإحالة: ${referralCode}`);
  };

  const copyUserIdentifier = async () => {
    await Clipboard.setStringAsync(String(userIdentifier));
    Alert.alert("تم النسخ", `تم نسخ معرّف الحساب: ${userIdentifier}`);
  };

  const handleSupport = () => {
    Alert.alert("الدعم الفني", "اختر طريقة التواصل:", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "البريد الإلكتروني",
        onPress: () =>
          Linking.openURL("mailto:support@saqr.app?subject=طلب دعم"),
      },
      {
        text: "واتساب",
        onPress: () => Linking.openURL("https://wa.me/966500000000"),
      },
    ]);
  };

  const handleHistory = () => {
    Alert.alert(
      "سجل المعاملات",
      `إجمالي الإعلانات المشاهدة: ${watchedAds}\nرصيد الجواهر الحالي: ${userGems}\n\nلا توجد عمليات سحب سابقة.`,
      [{ text: "حسناً" }],
    );
  };

  const handlePrivacy = () => {
    Linking.openURL(`${api.baseUrl}/privacy`);
  };

  const handleTerms = () => {
    Linking.openURL(`${api.baseUrl}/terms`);
  };

  const handleSettings = () => {
    if (onNavigate) {
      onNavigate("settings");
    }
  };

  const handleTrackingPermission = async () => {
    if (Platform.OS !== "ios") {
      Alert.alert("معلومات", "إذن التتبع (ATT) متاح على iOS فقط.");
      return;
    }
    try {
      const current = await getTrackingPermissionsAsync();
      if (current?.status === "undetermined") {
        const next = await requestTrackingPermissionsAsync();
        Alert.alert(
          "إذن التتبع",
          `الحالة الحالية: ${next?.status || "unknown"}`,
        );
        return;
      }
      Alert.alert(
        "إذن التتبع",
        `الحالة الحالية: ${current?.status || "unknown"}`,
      );
    } catch (e) {
      Alert.alert("تعذر الفحص", "حدث خطأ أثناء قراءة إذن التتبع.");
    }
  };

  // معالجة الضغط المتكرر على رقم الإصدار لفتح تسجيل دخول الأدمن
  const handleVersionTap = () => {
    const newCount = adminTapCount + 1;
    setAdminTapCount(newCount);

    if (newCount >= 7) {
      setShowAdminLogin(true);
      setAdminTapCount(0);
    }

    // إعادة تعيين العداد بعد 3 ثواني
    setTimeout(() => setAdminTapCount(0), 3000);
  };

  // تسجيل دخول الأدمن
  const handleAdminLogin = async () => {
    if (!adminEmail.trim() || !adminPassword.trim()) {
      Alert.alert("خطأ", "يرجى إدخال البريد وكلمة المرور");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.adminLogin(adminEmail.trim(), adminPassword);
      const data = await response.json();

      if (response.ok && data.token) {
        await AsyncStorage.setItem("admin_token", data.token);
        setShowAdminLogin(false);
        setAdminEmail("");
        setAdminPassword("");
        if (onOpenAdminPanel) {
          onOpenAdminPanel();
        }
      } else {
        Alert.alert("خطأ", data.detail || "فشل تسجيل الدخول");
      }
    } catch (error) {
      Alert.alert("خطأ", "حدث خطأ في الاتصال");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert("تسجيل الخروج", "هل أنت متأكد من تسجيل الخروج؟", [
      { text: "إلغاء", style: "cancel" },
      { text: "خروج", style: "destructive", onPress: onLogout },
    ]);
  };

  const handleSaveProfile = async () => {
    const trimmedName = editName.trim();
    if (!trimmedName) {
      Alert.alert("خطأ", "يرجى إدخال اسم صحيح");
      return;
    }
    const trimmedAvatarUrl = editAvatarUrl.trim();
    if (trimmedAvatarUrl && !/^https?:\/\//i.test(trimmedAvatarUrl)) {
      Alert.alert("خطأ", "رابط الصورة يجب أن يبدأ بـ http أو https");
      return;
    }

    if (trimmedAvatarUrl) {
      await AsyncStorage.setItem("selected_profile_avatar", trimmedAvatarUrl);
      setProfileAvatar(trimmedAvatarUrl);
    }

    onUpdateProfile &&
      onUpdateProfile({
        name: trimmedName,
        avatar: trimmedAvatarUrl || profileAvatar || null,
      });
    setShowEditProfile(false);
    Alert.alert("تم", "تم تحديث الملف الشخصي بنجاح");
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirmText.trim()) {
      Alert.alert("خطأ", "اكتب DELETE أو حذف لتأكيد العملية");
      return;
    }

    setIsDeletingAccount(true);
    try {
      const response = await api.deleteAccount(
        deleteConfirmText.trim(),
        deletePassword || null,
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        Alert.alert(
          "تعذر حذف الحساب",
          data?.detail || "حدث خطأ أثناء حذف الحساب",
        );
        return;
      }

      Alert.alert("تم حذف الحساب", "تم حذف الحساب نهائيًا من النظام.", [
        {
          text: "حسناً",
          onPress: async () => {
            setShowDeleteAccount(false);
            setDeleteConfirmText("");
            setDeletePassword("");
            await storage.clearAll();
            onLogout && onLogout();
          },
        },
      ]);
    } catch (error) {
      Alert.alert("خطأ اتصال", "تعذر حذف الحساب حالياً. حاول مرة أخرى.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const menuItems = [
    {
      id: "achievements",
      icon: "trophy",
      label: "الإنجازات",
      action: onOpenAchievements,
      color: "#fbbf24",
    },
    {
      id: "settings",
      icon: "settings-outline",
      label: "الإعدادات",
      action: handleSettings,
      color: "#94a3b8",
    },
    {
      id: "withdraw",
      icon: "wallet-outline",
      label: "سحب الأرباح",
      action: handleWithdraw,
      color: "#22c55e",
    },
    {
      id: "history",
      icon: "receipt-outline",
      label: "سجل المعاملات",
      action: handleHistory,
      color: "#60a5fa",
    },
    {
      id: "password",
      icon: "lock-closed-outline",
      label: "تغيير كلمة المرور",
      action: () => setShowChangePassword(true),
      color: "#a855f7",
    },
    {
      id: "support",
      icon: "headset-outline",
      label: "الدعم الفني",
      action: () => onNavigate("support"),
      color: "#f97316",
    },
    {
      id: "advertiser-dashboard",
      icon: "bar-chart-outline",
      label: "لوحة تحكم المعلن",
      action: () => onNavigate("advertiser-dashboard"),
      color: "#ec4899",
    },
    {
      id: "share",
      icon: "share-social-outline",
      label: "شارك التطبيق",
      action: handleShareApp,
      color: "#6366f1",
    },
    {
      id: "privacy",
      icon: "shield-checkmark-outline",
      label: "سياسة الخصوصية",
      action: handlePrivacy,
      color: "#14b8a6",
    },
    {
      id: "terms",
      icon: "document-text-outline",
      label: "شروط الاستخدام",
      action: handleTerms,
      color: "#06b6d4",
    },
    ...(Platform.OS === "ios"
      ? [
          {
            id: "tracking",
            icon: "eye-outline",
            label: "إذن تتبع الإعلانات (ATT)",
            action: handleTrackingPermission,
            color: "#38bdf8",
          },
        ]
      : []),
    {
      id: "delete-account",
      icon: "trash-outline",
      label: "حذف الحساب نهائياً",
      action: () => setShowDeleteAccount(true),
      color: "#ef4444",
    },
  ];

  // إضافة زر الأدمن فقط إذا كان المستخدم مدير (role = admin أو super_admin)
  const isAdmin =
    user?.role === "admin" ||
    user?.role === "super_admin" ||
    user?.is_admin === true;
  if (isAdmin && onOpenAdminPanel) {
    menuItems.splice(2, 0, {
      id: "admin",
      icon: "shield-checkmark",
      label: "لوحة تحكم الأدمن",
      action: onOpenAdminPanel,
      color: "#ef4444",
    });
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Top bar with Settings gear (top-right) */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={onOpenSettings}
            style={styles.settingsBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="الإعدادات"
          >
            <Ionicons name="settings-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity
            style={[
              styles.avatar,
              profileFrame?.colors?.[0]
                ? { borderColor: profileFrame.colors[0] }
                : null,
            ]}
            activeOpacity={0.8}
            onPress={() => {
              setEditName(user?.name || editName);
              setEditAvatarUrl(profileAvatar || "");
              setShowEditProfile(true);
            }}
          >
            {profileAvatar ? (
              <Image
                source={{ uri: profileAvatar }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarText}>
                {(user?.name || "U")[0].toUpperCase()}
              </Text>
            )}
            <View style={styles.editAvatarBadge}>
              <Ionicons name="camera" size={12} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{user?.name || "مستخدم"}</Text>
          <Text style={styles.email}>{user?.email || ""}</Text>
          <TouchableOpacity
            style={styles.userIdChip}
            onPress={copyUserIdentifier}
            activeOpacity={0.7}
          >
            <Ionicons name="id-card-outline" size={14} color="#93c5fd" />
            <Text style={styles.userIdLabel}>ID: {userIdentifier}</Text>
            <Ionicons name="copy-outline" size={14} color="#93c5fd" />
          </TouchableOpacity>
          {user?.isGuest && (
            <View style={styles.guestBadge}>
              <Ionicons name="person-outline" size={12} color="#fbbf24" />
              <Text style={styles.guestText}>زائر</Text>
            </View>
          )}
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceIcon}>
            <Ionicons name="wallet" size={24} color="#60a5fa" />
          </View>
          <Text style={styles.balanceLabel}>القيمة القابلة للسحب</Text>
          <Text style={styles.balanceValue}>{riyalValue} ر.س</Text>
          <Text style={styles.balancePoints}>{userGems} جوهرة صقر</Text>
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${Math.min(gemsProgress, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {gemsToNextRiyal} جوهرة للريال التالي
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Ionicons name="sparkles" size={18} color="#f472b6" />
            <Text style={styles.statValue}>{userGems}</Text>
            <Text style={styles.statLabel}>الجواهر</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="play-circle" size={18} color="#60a5fa" />
            <Text style={styles.statValue}>{watchedAds}</Text>
            <Text style={styles.statLabel}>إعلانات</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="people" size={18} color="#22c55e" />
            <Text style={styles.statValue}>{referrals}</Text>
            <Text style={styles.statLabel}>إحالات</Text>
          </View>
          <TouchableOpacity
            style={styles.statBox}
            activeOpacity={0.7}
            onPress={() => setFollowListMode("following")}
            accessibilityRole="button"
            accessibilityLabel="عرض قائمة من تتابعهم"
          >
            <Ionicons name="person-add-outline" size={18} color="#FFF" />
            <Text style={styles.statValue}>{followStats.following_count}</Text>
            <Text style={styles.statLabel}>يتابع</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statBox}
            activeOpacity={0.7}
            onPress={() => setFollowListMode("followers")}
            accessibilityRole="button"
            accessibilityLabel="عرض المتابعين"
          >
            <Ionicons name="people-outline" size={18} color="#FFF" />
            <Text style={styles.statValue}>{followStats.followers_count}</Text>
            <Text style={styles.statLabel}>متابعون</Text>
          </TouchableOpacity>
        </View>

        {/* My Reels Grid */}
        <View style={styles.myReelsCard}>
          <View style={styles.referralHeader}>
            <Ionicons name="film-outline" size={20} color="#60a5fa" />
            <Text style={styles.referralTitle}>ريلزي ({myClips.length})</Text>
          </View>
          {myClipsLoading ? (
            <ActivityIndicator size="small" color="#60a5fa" style={{ marginTop: 8 }} />
          ) : myClips.length === 0 ? (
            <View style={styles.emptyReelsBox}>
              <Ionicons
                name="videocam-outline"
                size={28}
                color="rgba(255,255,255,0.4)"
              />
              <Text style={styles.emptyReelsText}>
                لم تنشر أي ريلز بعد
              </Text>
              <TouchableOpacity
                style={styles.createReelBtn}
                onPress={() => onNavigate && onNavigate("clips")}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.createReelText}>أنشر ريلز</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.reelsGrid}>
              {myClips.slice(0, 9).map((clip) => {
                const thumb = resolveClipThumb(clip);
                const videoUrl = toAbsoluteUrl(clip?.video_url);
                return (
                  <TouchableOpacity
                    key={clip.clip_id}
                    style={styles.reelTile}
                    onPress={() => onNavigate && onNavigate("clips")}
                    activeOpacity={0.7}
                  >
                    {thumb ? (
                      <Image source={{ uri: thumb }} style={styles.reelTileImage} />
                    ) : videoUrl ? (
                      // Render the actual video's first frame as a paused poster.
                      // This guarantees each tile shows its OWN video without
                      // relying on a stored thumbnail.
                      <Video
                        source={{ uri: videoUrl }}
                        style={styles.reelTileImage}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay={false}
                        isMuted
                        positionMillis={300}
                        useNativeControls={false}
                      />
                    ) : (
                      <LinearGradient
                        colors={["#0f172a", "#1e293b"]}
                        style={StyleSheet.absoluteFillObject}
                      />
                    )}
                    <View style={styles.reelTilePlayOverlay}>
                      <Ionicons name="play" size={18} color="rgba(255,255,255,0.92)" />
                    </View>
                    <View style={styles.reelTileBadge}>
                      <Ionicons name="heart" size={10} color="#fff" />
                      <Text style={styles.reelTileBadgeText}>
                        {clip.likes_count || 0}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* App Version - اضغط 7 مرات لفتح لوحة الأدمن */}
        <TouchableOpacity onPress={handleVersionTap} activeOpacity={0.7}>
          <Text style={styles.versionText}>الإصدار 7.3.1</Text>
        </TouchableOpacity>

        {/* Maroof Verification Badge - وزارة التجارة السعودية */}
        <View style={styles.maroofContainer}>
          <Ionicons name="shield-checkmark" size={14} color="#10b981" />
          <Text style={styles.maroofText}>
            موثّق من وزارة التجارة · رقم التوثيق: 0000294044
          </Text>
        </View>
      </View>

      {/* Admin Login Modal */}
      <Modal visible={showAdminLogin} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تسجيل دخول الأدمن</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAdminLogin(false);
                  setAdminEmail("");
                  setAdminPassword("");
                }}
              >
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.adminLoginIcon}>
              <Ionicons name="shield-checkmark" size={40} color="#ef4444" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>البريد الإلكتروني</Text>
              <TextInput
                style={styles.input}
                placeholder="أدخل بريد الأدمن"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="email-address"
                autoCapitalize="none"
                value={adminEmail}
                onChangeText={setAdminEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>كلمة المرور</Text>
              <TextInput
                style={styles.input}
                placeholder="أدخل كلمة المرور"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry
                value={adminPassword}
                onChangeText={setAdminPassword}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.adminLoginBtn,
                isLoading && styles.modalButtonDisabled,
              ]}
              onPress={handleAdminLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="enter-outline" size={20} color="#FFF" />
                  <Text style={styles.adminLoginBtnText}>دخول لوحة التحكم</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={showChangePassword} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تغيير كلمة المرور</Text>
              <TouchableOpacity onPress={() => setShowChangePassword(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>كلمة المرور الحالية</Text>
              <TextInput
                style={styles.input}
                placeholder="أدخل كلمة المرور الحالية"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry
                value={passwords.current}
                onChangeText={(t) => setPasswords({ ...passwords, current: t })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>كلمة المرور الجديدة</Text>
              <TextInput
                style={styles.input}
                placeholder="أدخل كلمة المرور الجديدة"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry
                value={passwords.new}
                onChangeText={(t) => setPasswords({ ...passwords, new: t })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>تأكيد كلمة المرور</Text>
              <TextInput
                style={styles.input}
                placeholder="أعد إدخال كلمة المرور الجديدة"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry
                value={passwords.confirm}
                onChangeText={(t) => setPasswords({ ...passwords, confirm: t })}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.modalButton,
                isLoading && styles.modalButtonDisabled,
              ]}
              onPress={handleChangePassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.modalButtonText}>تغيير كلمة المرور</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={showEditProfile} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تعديل الملف الشخصي</Text>
              <TouchableOpacity onPress={() => setShowEditProfile(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>الاسم</Text>
              <TextInput
                style={styles.input}
                placeholder="أدخل اسمك"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={editName}
                onChangeText={setEditName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>الصورة الشخصية</Text>
              <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                {!!editAvatarUrl && (
                  <Image
                    source={{ uri: editAvatarUrl }}
                    style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: "rgba(96,165,250,0.4)" }}
                  />
                )}
                <TouchableOpacity
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(96,165,250,0.18)",
                    borderColor: "rgba(96,165,250,0.45)",
                    borderWidth: 1,
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    borderRadius: 14,
                    gap: 8,
                  }}
                  onPress={async () => {
                    try {
                      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                      if (!perm.granted) {
                        Alert.alert("الإذن مطلوب", "يحتاج التطبيق إذن الوصول إلى الصور.");
                        return;
                      }
                      const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: true,
                        aspect: [1, 1],
                        quality: 0.85,
                      });
                      if (result.canceled || !result.assets?.length) return;
                      const asset = result.assets[0];
                      // Upload to backend (advertiser upload-video accepts images too via multipart)
                      const formData = new FormData();
                      formData.append("file", {
                        uri: asset.uri,
                        name: `avatar_${Date.now()}.jpg`,
                        type: "image/jpeg",
                      });
                      const uploadResponse = await api.fetch(
                        `/api/users/upload-avatar?user_id=${encodeURIComponent(user?.id || user?.user_id || "")}`,
                        { method: "POST", body: formData },
                      );
                      if (uploadResponse.ok) {
                        const data = await uploadResponse.json();
                        const url = data?.avatar_url || data?.url;
                        if (url) {
                          const fullUrl = url.startsWith("http")
                            ? url
                            : `${api.getActiveBaseUrl()}${url}`;
                          setEditAvatarUrl(fullUrl);
                          Alert.alert("✓", "تم تحديث الصورة. اضغط حفظ للتأكيد.");
                          return;
                        }
                      }
                      // Fallback: store local URI
                      setEditAvatarUrl(asset.uri);
                    } catch (e) {
                      Alert.alert("خطأ", String(e?.message || e));
                    }
                  }}
                >
                  <Ionicons name="image-outline" size={20} color="#bfdbfe" />
                  <Text style={{ color: "#bfdbfe", fontWeight: "600" }}>
                    اختر صورة من الاستديو
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleSaveProfile}
            >
              <Text style={styles.modalButtonText}>حفظ التغييرات</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal visible={showDeleteAccount} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>حذف الحساب نهائياً</Text>
              <TouchableOpacity
                onPress={() => {
                  if (isDeletingAccount) return;
                  setShowDeleteAccount(false);
                  setDeleteConfirmText("");
                  setDeletePassword("");
                }}
              >
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.dangerBox}>
              <Ionicons name="warning-outline" size={20} color="#fecaca" />
              <Text style={styles.dangerText}>
                سيتم حذف الحساب وجميع بياناته نهائياً. لا يمكن التراجع عن هذه
                العملية.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>اكتب DELETE أو حذف للتأكيد</Text>
              <TextInput
                style={styles.input}
                placeholder="DELETE"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={deleteConfirmText}
                onChangeText={setDeleteConfirmText}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                كلمة المرور (لحسابات البريد فقط)
              </Text>
              <TextInput
                style={styles.input}
                placeholder="أدخل كلمة المرور"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry
                value={deletePassword}
                onChangeText={setDeletePassword}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.deleteAccountBtn,
                isDeletingAccount && styles.modalButtonDisabled,
              ]}
              onPress={handleDeleteAccount}
              disabled={isDeletingAccount}
            >
              {isDeletingAccount ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.deleteAccountBtnText}>
                  تأكيد حذف الحساب
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <FollowListModal
        visible={Boolean(followListMode)}
        mode={followListMode || "followers"}
        targetUserId={user?.id || user?.user_id}
        viewerId={user?.id || user?.user_id}
        onClose={() => setFollowListMode(null)}
        onOpenUser={(uid) => {
          setFollowListMode(null);
          if (onOpenUserProfile && uid) onOpenUserProfile(uid);
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060814" },
  content: { padding: 16, paddingTop: 30, paddingBottom: 96 },

  profileHeader: { alignItems: "center", marginBottom: 20 },
  topBar: {
    flexDirection: "row-reverse",
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  myReelsCard: {
    backgroundColor: "rgba(15,23,42,0.55)",
    borderColor: "rgba(96,165,250,0.18)",
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  reelsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  reelTile: {
    width: (Dimensions.get("window").width - 64 - 12) / 3,
    height: ((Dimensions.get("window").width - 64 - 12) / 3) * 1.5,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "rgba(30,41,59,0.7)",
  },
  reelTileImage: { width: "100%", height: "100%", resizeMode: "cover" },
  reelTilePlayOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  reelTilePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  reelTileBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  reelTileBadgeText: { color: "#fff", fontSize: 9, fontWeight: "600" },
  emptyReelsBox: {
    alignItems: "center",
    paddingVertical: 22,
  },
  emptyReelsText: {
    color: "rgba(226,232,240,0.6)",
    fontSize: 13,
    marginTop: 8,
  },
  createReelBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#3b82f6",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  createReelText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "rgba(96, 165, 250, 0.3)",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 40,
  },
  editAvatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#22c55e",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#0a0a0f",
  },
  avatarText: { color: "#FFF", fontSize: 32, fontWeight: "bold" },
  name: { color: "#FFF", fontSize: 20, fontWeight: "bold" },
  email: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 4 },
  userIdChip: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(59,130,246,0.18)",
    borderWidth: 1,
    borderColor: "rgba(147,197,253,0.35)",
  },
  userIdLabel: {
    color: "#93c5fd",
    fontSize: 12,
    fontWeight: "700",
  },
  guestBadge: {
    backgroundColor: "rgba(251,191,36,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.3)",
  },
  guestText: { color: "#fbbf24", fontSize: 11 },

  balanceCard: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
  },
  balanceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  balanceLabel: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  balanceValue: {
    color: "#60a5fa",
    fontSize: 36,
    fontWeight: "bold",
    marginVertical: 2,
  },
  balancePoints: { color: "rgba(255,255,255,0.5)", fontSize: 13 },
  progressContainer: {
    width: "100%",
    height: 5,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 3,
    marginTop: 12,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#60a5fa",
    borderRadius: 3,
  },
  progressText: { color: "rgba(255,255,255,0.4)", fontSize: 10, marginTop: 6 },

  statsGrid: { flexDirection: "row", gap: 10, marginBottom: 14 },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  statValue: { color: "#FFF", fontSize: 20, fontWeight: "bold", marginTop: 4 },
  statLabel: { color: "rgba(255,255,255,0.5)", fontSize: 10, marginTop: 2 },

  referralCard: {
    backgroundColor: "rgba(236, 72, 153, 0.1)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(236, 72, 153, 0.2)",
  },
  referralHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  referralTitle: { color: "#ec4899", fontSize: 14, fontWeight: "600" },
  referralCodeBox: {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  referralCode: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 2,
  },
  referralDesc: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    textAlign: "center",
  },

  menuSection: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    backgroundColor: "transparent",
    gap: 10,
  },
  menuIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  menuLabel: { flex: 1, color: "#FFF", fontSize: 14 },
  logoutItem: { borderBottomWidth: 0 },
  logoutText: { color: "#ef4444" },

  versionText: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 10,
    textAlign: "center",
    marginTop: 20,
  },

  maroofContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
    alignSelf: "center",
  },
  maroofText: {
    color: "rgba(167, 243, 208, 0.9)",
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#0a0a0f",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 14,
    color: "#FFF",
    fontSize: 15,
    textAlign: "right",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 10,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  // Admin Login Styles
  adminLoginIcon: {
    alignSelf: "center",
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(239,68,68,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "rgba(239,68,68,0.3)",
  },
  adminLoginBtn: {
    backgroundColor: "#ef4444",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
  },
  adminLoginBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  dangerBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(239,68,68,0.15)",
    borderColor: "rgba(248,113,113,0.4)",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  dangerText: {
    color: "#fecaca",
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  deleteAccountBtn: {
    backgroundColor: "#dc2626",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 10,
  },
  deleteAccountBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ProfileScreen;
