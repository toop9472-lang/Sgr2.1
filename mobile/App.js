// Saqr Mobile App - Main Entry Point
import { StatusBar } from "expo-status-bar";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  BackHandler,
  Alert,
  Image,
  ImageBackground,
  I18nManager,
  LogBox,
  TouchableOpacity,
  Appearance,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from "expo-tracking-transparency";
import colors from "./src/styles/colors";
import * as NavigationBar from "expo-navigation-bar";

// Ignore specific warnings that don't affect functionality
LogBox.ignoreLogs([
  "Non-serializable values were found in the navigation state",
  "Sending `onAnimatedValueUpdate`",
  "componentWillReceiveProps has been renamed",
  "componentWillMount has been renamed",
  "expo-notifications",
  "expo-device",
]);

// RTL support - will be set dynamically based on language
I18nManager.allowRTL(true);

// Screens
import AuthScreen from "./src/screens/AuthScreen";
import HomeScreen from "./src/screens/HomeScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import AdvertiserScreen from "./src/screens/AdvertiserScreen";
import AdvertiserDashboardScreen from "./src/screens/AdvertiserDashboardScreen";
import AdViewerScreen from "./src/screens/AdViewerScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import SupportScreen from "./src/screens/SupportScreen";
import ClipsScreen from "./src/screens/ClipsScreen";
import AchievementsScreen from "./src/screens/AchievementsScreen";
import AdminWebViewScreen from "./src/screens/AdminWebViewScreen";
import GlobalChatScreen from "./src/screens/GlobalChatScreen";
import SaqrFortunesScreen from "./src/screens/SaqrFortunesScreen";
import FriendsScreen from "./src/screens/FriendsScreen";
import PrivateMessagesScreen from "./src/screens/PrivateMessagesScreen";

// Components
import BottomNav from "./src/components/BottomNav";
import AIFloatingButton from "./src/components/AIFloatingButton";
import AIChatModal from "./src/components/AIChatModal";

// Contexts
import { LanguageProvider, useLanguage } from "./src/i18n/LanguageContext";
import {
  AchievementsProvider,
  useAchievements,
} from "./src/services/AchievementsContext";
import { AchievementNotification } from "./src/screens/AchievementsScreen";

// Services
import api from "./src/services/api";
import storage from "./src/services/storage";
import admobService from "./src/services/admobService";
import { APP_BACKGROUND_IMAGE } from "./src/constants/uiAssets";

// Safe notification import
let NotificationService = null;
try {
  NotificationService = require("./src/services/NotificationService");
  if (NotificationService.default) {
    NotificationService = NotificationService.default;
  }
} catch (e) {
  console.log("Notifications not available");
}

// Main App Content (wrapped with providers)
function AppContent() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState("home");
  const [showAdsViewer, setShowAdsViewer] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [settings, setSettings] = useState(null);
  const [balanceRefresh, setBalanceRefresh] = useState(0);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [themeMode, setThemeMode] = useState("dark");
  const [systemColorScheme, setSystemColorScheme] = useState(
    Appearance.getColorScheme() || "dark",
  );
  const userId = user?.id || user?.user_id;

  // Language context
  const { language } = useLanguage();

  // Achievements context
  const { newAchievement, clearNewAchievement, updateCurrency } =
    useAchievements();

  // Notification listener ref
  const notificationListenerRef = useRef(null);

  // Dynamic RTL based on language
  useEffect(() => {
    const isRTL = language === "ar";
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
      // Note: RTL changes require app restart to take effect
    }
  }, [language]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    NavigationBar.setBackgroundColorAsync("#0a0a0f").catch(() => {});
    NavigationBar.setButtonStyleAsync("light").catch(() => {});
  }, []);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme || "dark");
    });
    return () => sub?.remove?.();
  }, []);

  // Initialize app
  useEffect(() => {
    initApp();
    setupNotifications();

    return () => {
      if (notificationListenerRef.current) {
        notificationListenerRef.current();
      }
    };
  }, []);

  // Setup push notifications
  const setupNotifications = async () => {
    if (!NotificationService) {
      console.log("NotificationService not available, skipping setup");
      return;
    }

    try {
      // Register for push notifications
      if (NotificationService.registerForPushNotifications) {
        await NotificationService.registerForPushNotifications();
      }

      // Schedule daily reward reminder
      if (NotificationService.scheduleDailyRewardReminder) {
        await NotificationService.scheduleDailyRewardReminder(10, 0, language);
      }

      // Add notification listeners
      if (NotificationService.addNotificationListeners) {
        notificationListenerRef.current =
          NotificationService.addNotificationListeners(
            // On notification received
            (notification) => {
              console.log("Notification received:", notification);
            },
            // On notification response (user tapped)
            (response) => {
              const data = response?.notification?.request?.content?.data;
              if (!data) return;

              console.log("Notification response:", data);

              // Navigate based on notification type
              const TYPES = NotificationService.NOTIFICATION_TYPES || {};
              if (data.type === TYPES.ACHIEVEMENT) {
                setShowAchievements(true);
              }
            },
          );
      }
    } catch (error) {
      console.log("Notification setup error:", error.message);
    }
  };

  // Handle back button press
  useEffect(() => {
    const backAction = () => {
      if (showAdminPanel) {
        setShowAdminPanel(false);
        return true;
      }

      if (showAchievements) {
        setShowAchievements(false);
        return true;
      }

      if (showAIChat) {
        setShowAIChat(false);
        return true;
      }

      if (showAdsViewer) {
        setShowAdsViewer(false);
        return true;
      }

      if (currentPage !== "home") {
        setCurrentPage("home");
        return true;
      }

      // Show exit confirmation dialog
      Alert.alert(
        language === "ar" ? "الخروج من التطبيق" : "Exit App",
        language === "ar"
          ? "هل أنت متأكد من الخروج؟"
          : "Are you sure you want to exit?",
        [
          {
            text: language === "ar" ? "إلغاء" : "Cancel",
            style: "cancel",
            onPress: () => null,
          },
          {
            text: language === "ar" ? "خروج" : "Exit",
            style: "destructive",
            onPress: () => BackHandler.exitApp(),
          },
        ],
      );
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );

    return () => backHandler.remove();
  }, [
    showAIChat,
    showAdsViewer,
    showAchievements,
    showAdminPanel,
    currentPage,
    language,
  ]);

  // Send notification when achievement is unlocked
  useEffect(() => {
    if (
      newAchievement &&
      NotificationService &&
      NotificationService.sendAchievementNotification
    ) {
      NotificationService.sendAchievementNotification(newAchievement, language);
    }
  }, [newAchievement, language]);

  const initApp = async () => {
    try {
      await ensureTrackingPermission();
      // Prime AdMob early so consent/ATT and rewarded pipeline are ready before opening watch page.
      admobService.initialize().catch(() => {});

      // Load saved user data
      const [savedToken, savedUser] = await Promise.all([
        storage.getToken(),
        storage.getUserData(),
      ]);

      if (savedToken && savedUser) {
        setUser(savedUser);
        setIsAuthenticated(true);

        // Try to sync with server (but don't block on failure)
        try {
          api.setTokens(savedToken, null);
          const response = await api.getCurrentUser();
          if (response.ok) {
            const userData = await response.json();
            if (userData.user) {
              const updatedUser = {
                ...savedUser,
                ...userData.user,
                points: userData.user.points || savedUser.points || 0,
                saqr_gems: userData.user.saqr_gems || savedUser.saqr_gems || 0,
                total_earned:
                  userData.user.total_earned || savedUser.total_earned || 0,
              };
              setUser(updatedUser);
              await storage.setUserData(updatedUser);

              // Initialize economy for user if needed
              try {
                await api.initializeUserEconomy(updatedUser.id);
              } catch (e) {
                // Ignore economy init errors
              }

            }
          }
        } catch (syncError) {
          // Sync error - continue with saved data
        }
      }

      // Load settings
      await loadSettings();
      const storedTheme = await AsyncStorage.getItem("saqr_theme");
      if (storedTheme) {
        setThemeMode(storedTheme);
      }
    } catch (error) {
      console.error("Init error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const ensureTrackingPermission = async () => {
    if (Platform.OS !== "ios") return;
    try {
      const current = await getTrackingPermissionsAsync();
      if (current?.canAskAgain && current?.status === "undetermined") {
        await requestTrackingPermissionsAsync();
      }
    } catch (e) {
      console.log("ATT permission check skipped:", e?.message);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await api.getRewardsSettings();
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Settings error:", error);
    }
  };

  const persistUserSnapshot = useCallback((nextUser) => {
    if (!nextUser) return;
    storage.setUserData(nextUser).catch(() => {});
  }, []);

  const updateUserBalanceLocally = useCallback(
    (partial = {}) => {
      if (!partial || typeof partial !== "object") return;
      setUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...partial };
        const unchanged =
          prev.saqr_gems === next.saqr_gems &&
          prev.saqr_points === next.saqr_points;
        if (unchanged) return prev;
        persistUserSnapshot(next);
        return next;
      });
    },
    [persistUserSnapshot],
  );

  const syncBalanceFromServer = useCallback(
    async (targetUserId = userId) => {
      if (!targetUserId) return null;
      try {
        const response = await api.getBalance(targetUserId);
        if (!response.ok) return null;
        const data = await response.json();
        const normalizedGems =
          Number(data?.saqr_gems ?? data?.saqr_points ?? 0) || 0;
        updateUserBalanceLocally({
          saqr_gems: normalizedGems,
          saqr_points: normalizedGems,
        });
        return data;
      } catch (_) {
        return null;
      }
    },
    [updateUserBalanceLocally, userId],
  );

  const handleBalanceUpdate = useCallback(
    (partial) => {
      updateUserBalanceLocally(partial);
    },
    [updateUserBalanceLocally],
  );

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    persistUserSnapshot(userData);
    storage
      .getToken()
      .then((token) => {
        if (token) api.setTokens(token, null);
      })
      .catch(() => {});
    setTimeout(() => {
      const incomingUserId = userData?.id || userData?.user_id;
      if (incomingUserId) {
        syncBalanceFromServer(incomingUserId);
      }
    }, 0);
  };

  const handleLogout = async () => {
    await storage.clearAll();
    setUser(null);
    setIsAuthenticated(false);
    setCurrentPage("home");
  };

  const handleGemsEarned = async (gems = 0) => {
    if (user && !user.isGuest) {
      setUser((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          saqr_gems: (prev.saqr_gems || 0) + gems,
          saqr_points: (prev.saqr_points || prev.saqr_gems || 0) + gems,
        };
        persistUserSnapshot(next);
        return next;
      });
      setBalanceRefresh((prev) => prev + 1);

      // Update achievements
      await updateCurrency(gems);
      setTimeout(() => {
        syncBalanceFromServer();
      }, 0);
    }
  };

  const handleThemeChange = (nextTheme) => {
    setThemeMode(nextTheme || "dark");
  };

  const effectiveTheme =
    themeMode === "system"
      ? systemColorScheme === "light"
        ? "light"
        : "dark"
      : themeMode;
  const appGradient =
    effectiveTheme === "light"
      ? ["#f8fafc", "#eef2ff", "#e2e8f0"]
      : colors.gradients.dark;

  // Loading Screen
  if (isLoading) {
    return (
      <LinearGradient colors={appGradient} style={styles.loadingContainer}>
        <View style={styles.loadingLogoContainer}>
          <Image
            source={require("./assets/logo_saqr.png")}
            style={styles.loadingLogo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.loadingAppName}>صقر</Text>
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: 20 }}
        />
        <Text
          style={[
            styles.loadingText,
            effectiveTheme === "light" && styles.loadingTextLight,
          ]}
        >
          جاري التحميل...
        </Text>
      </LinearGradient>
    );
  }

  // Ad Viewer (Full Screen)
  if (showAdsViewer) {
    return (
      <AdViewerScreen
        onClose={() => {
          setShowAdsViewer(false);
          setCurrentPage("home");
        }}
        onNavigateToProfile={() => {
          setShowAdsViewer(false);
          setCurrentPage("profile");
        }}
        onRewardsEarned={({ gems = 0 }) => handleGemsEarned(gems)}
        user={user}
      />
    );
  }

  // Auth Screen
  if (!isAuthenticated) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  // Main App
  return (
    <View
      style={[
        styles.container,
        effectiveTheme === "light" && styles.containerLight,
      ]}
    >
      <ImageBackground
        source={{ uri: APP_BACKGROUND_IMAGE }}
        style={styles.mainArea}
        resizeMode="cover"
      >
        <LinearGradient colors={appGradient} style={styles.mainAreaOverlay}>
          {currentPage === "home" && (
            <HomeScreen
              user={user}
              settings={settings}
              onNavigateToAds={() => setShowAdsViewer(true)}
              onNavigateToClips={() => setCurrentPage("clips")}
              onNavigateToChat={() => setCurrentPage("chat")}
              onNavigateToFortunes={() => setCurrentPage("fortunes")}
              onNavigateToFriends={() => setCurrentPage("friends")}
              onRefresh={initApp}
            />
          )}
          {currentPage === "profile" && (
            <ProfileScreen
              user={user}
              onLogout={handleLogout}
              onNavigate={setCurrentPage}
              onOpenAchievements={() => setShowAchievements(true)}
              onOpenAdminPanel={() => setShowAdminPanel(true)}
              onUpdateProfile={async (updates) => {
                const updatedUser = { ...(user || {}), ...(updates || {}) };
                setUser(updatedUser);
                await storage.setUserData(updatedUser);
              }}
            />
          )}
          {currentPage === "settings" && (
            <SettingsScreen
              onBack={() => setCurrentPage("profile")}
              onLogout={handleLogout}
              currentTheme={themeMode}
              onThemeChange={handleThemeChange}
            />
          )}
          {currentPage === "advertiser" && <AdvertiserScreen />}
          {currentPage === "advertiser-dashboard" && (
            <AdvertiserDashboardScreen
              navigation={{ navigate: setCurrentPage }}
            />
          )}
          {currentPage === "support" && (
            <SupportScreen navigation={{ navigate: setCurrentPage }} />
          )}
          {currentPage === "clips" && (
            <ClipsScreen user={user} onClose={() => setCurrentPage("home")} />
          )}
          {currentPage === "chat" && (
            <GlobalChatScreen
              user={user}
              onBalanceUpdate={handleBalanceUpdate}
              onClose={() => setCurrentPage("home")}
              onNavigateToFortunes={() => setCurrentPage("fortunes")}
            />
          )}
          {currentPage === "fortunes" && (
            <SaqrFortunesScreen
              user={user}
              onClose={() => setCurrentPage("home")}
              onBalanceUpdate={(partial) => {
                if (partial) handleBalanceUpdate(partial);
                setBalanceRefresh((prev) => prev + 1);
              }}
            />
          )}
          {currentPage === "friends" && (
            <FriendsScreen
              user={user}
              onClose={() => setCurrentPage("home")}
              onOpenMessages={(friend) => {
                setSelectedFriend(friend);
                setCurrentPage("messages");
              }}
            />
          )}
          {currentPage === "messages" && (
            <PrivateMessagesScreen
              user={user}
              onClose={() => setCurrentPage("friends")}
              initialFriend={selectedFriend}
            />
          )}
        </LinearGradient>
      </ImageBackground>

      {/* Achievements Screen */}
      {showAchievements && (
        <View style={StyleSheet.absoluteFill}>
          <AchievementsScreen
            onClose={() => setShowAchievements(false)}
            language={language}
          />
        </View>
      )}

      {/* Admin Panel WebView */}
      {showAdminPanel && (
        <View style={StyleSheet.absoluteFill}>
          <AdminWebViewScreen onClose={() => setShowAdminPanel(false)} />
        </View>
      )}

      {/* Achievement Notification */}
      <AchievementNotification
        achievement={newAchievement}
        language={language}
        onClose={clearNewAchievement}
      />

      {/* AI Floating Button */}
      <AIFloatingButton onPress={() => setShowAIChat(true)} />

      {/* AI Chat Modal */}
      <AIChatModal visible={showAIChat} onClose={() => setShowAIChat(false)} />

      {/* Bottom Navigation - إخفاء عند فتح المقاطع أو الدردشة أو الأصدقاء */}
      {!["clips", "chat", "fortunes", "friends", "messages"].includes(
        currentPage,
      ) && (
        <BottomNav
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          onAdsPress={() => setShowAdsViewer(true)}
          onClipsPress={() => setCurrentPage("clips")}
        />
      )}

      <StatusBar style={effectiveTheme === "light" ? "dark" : "light"} />
    </View>
  );
}

// Main App with Providers
function App() {
  return (
    <LanguageProvider>
      <AchievementsProvider>
        <AppContent />
      </AchievementsProvider>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark.bg },
  containerLight: { backgroundColor: colors.light.bg },
  mainArea: { flex: 1 }, // No fixed padding - handled per screen
  mainAreaOverlay: { flex: 1 },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingLogoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#0a0a0f",
    borderWidth: 2,
    borderColor: "rgba(59, 130, 246, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingLogo: { width: 96, height: 96 },
  loadingAppName: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#60a5fa",
    marginTop: 16,
  },
  loadingText: {
    color: "rgba(255,255,255,0.6)",
    marginTop: 16,
    fontSize: 16,
  },
  loadingTextLight: {
    color: "#334155",
  },
});

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.log("App Error:", error, errorInfo);
    console.log("Error details:", error?.message, error?.stack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <LinearGradient
            colors={["#0a0a0f", "#1a1a2e"]}
            style={errorStyles.gradient}
          >
            <Text style={errorStyles.icon}>!</Text>
            <Text style={errorStyles.title}>حدث خطأ غير متوقع</Text>
            <Text style={errorStyles.message}>
              نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى.
            </Text>
            <TouchableOpacity
              style={errorStyles.retryBtn}
              onPress={this.handleRetry}
            >
              <Text style={errorStyles.retryText}>إعادة المحاولة</Text>
            </TouchableOpacity>
            <Text style={errorStyles.support}>للدعم: sky-321@hotmail.com</Text>
            {__DEV__ && this.state.error && (
              <Text style={errorStyles.errorDetails}>
                {this.state.error.toString()}
              </Text>
            )}
          </LinearGradient>
        </View>
      );
    }

    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: { flex: 1 },
  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  icon: { fontSize: 60, marginBottom: 20 },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  retryText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  support: { fontSize: 14, color: "#60a5fa", textAlign: "center" },
  errorDetails: {
    fontSize: 10,
    color: "#ef4444",
    marginTop: 20,
    textAlign: "center",
  },
});

// Export with Error Boundary
export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
