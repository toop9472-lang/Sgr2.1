// Saqr Mobile App - Main Entry Point
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, BackHandler, Alert, Image, I18nManager, LogBox, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import colors from './src/styles/colors';

// Ignore specific warnings that don't affect functionality
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'Sending `onAnimatedValueUpdate`',
  'componentWillReceiveProps has been renamed',
  'componentWillMount has been renamed',
  'expo-notifications',
  'expo-device',
]);

// RTL support - will be set dynamically based on language
I18nManager.allowRTL(true);

// Screens
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AdvertiserScreen from './src/screens/AdvertiserScreen';
import AdvertiserDashboardScreen from './src/screens/AdvertiserDashboardScreen';
import AdViewerScreen from './src/screens/AdViewerScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SupportScreen from './src/screens/SupportScreen';
import ChallengesScreen from './src/screens/ChallengesScreen';
import GamesScreen from './src/screens/GamesScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';
import ShopScreen from './src/screens/ShopScreen';
import AdminWebViewScreen from './src/screens/AdminWebViewScreen';
import GlobalChatScreen from './src/screens/GlobalChatScreen';
import SaqrFortunesScreen from './src/screens/SaqrFortunesScreen';
import FriendsScreen from './src/screens/FriendsScreen';
import PrivateMessagesScreen from './src/screens/PrivateMessagesScreen';
import InvitationsScreen from './src/screens/InvitationsScreen';
import MillionaireScreen from './src/screens/MillionaireScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';

// Components
import BottomNav from './src/components/BottomNav';
import AIFloatingButton from './src/components/AIFloatingButton';
import AIChatModal from './src/components/AIChatModal';
import DailyRewardsModal from './src/components/DailyRewardsModal';
import DiamondShopModal from './src/components/DiamondShopModal';
import BalanceHeader from './src/components/BalanceHeader';
import DailyStreakModal, { useDailyStreak } from './src/components/DailyStreakModal';

// Contexts
import { LanguageProvider, useLanguage } from './src/i18n/LanguageContext';
import { AchievementsProvider, useAchievements } from './src/services/AchievementsContext';
import { PointsProvider } from './src/services/PointsContext';
import { AchievementNotification } from './src/screens/AchievementsScreen';

// Services
import api from './src/services/api';
import storage from './src/services/storage';

// Safe notification import
let NotificationService = null;
try {
  NotificationService = require('./src/services/NotificationService');
  if (NotificationService.default) {
    NotificationService = NotificationService.default;
  }
} catch (e) {
  console.log('Notifications not available');
}

// Main App Content (wrapped with providers)
function AppContent() {
  // Theme support
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');
  const [showAdsViewer, setShowAdsViewer] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showDailyRewards, setShowDailyRewards] = useState(false);
  const [showDiamondShop, setShowDiamondShop] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showMillionaire, setShowMillionaire] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [networkStatus, setNetworkStatus] = useState('checking');
  const [settings, setSettings] = useState(null);
  const [balanceRefresh, setBalanceRefresh] = useState(0);
  const [selectedFriend, setSelectedFriend] = useState(null);

  // Language context
  const { language, t } = useLanguage();
  
  // Achievements context
  const { 
    newAchievement, 
    clearNewAchievement, 
    updateCurrency,
    recordAdWatched,
    recordAppShared,
  } = useAchievements();

  // Notification listener ref
  const notificationListenerRef = useRef(null);

  // Dynamic RTL based on language
  useEffect(() => {
    const isRTL = language === 'ar';
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
      // Note: RTL changes require app restart to take effect
    }
  }, [language]);

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
      console.log('NotificationService not available, skipping setup');
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
        notificationListenerRef.current = NotificationService.addNotificationListeners(
          // On notification received
          (notification) => {
            console.log('Notification received:', notification);
          },
          // On notification response (user tapped)
          (response) => {
            const data = response?.notification?.request?.content?.data;
            if (!data) return;
            
            console.log('Notification response:', data);
            
            // Navigate based on notification type
            const TYPES = NotificationService.NOTIFICATION_TYPES || {};
            if (data.type === TYPES.ACHIEVEMENT) {
              setShowAchievements(true);
            } else if (data.type === TYPES.DAILY_REWARD) {
              setShowDailyRewards(true);
            }
          }
        );
      }
    } catch (error) {
      console.log('Notification setup error:', error.message);
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
      
      if (showShop) {
        setShowShop(false);
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

      if (currentPage !== 'home') {
        setCurrentPage('home');
        return true;
      }

      // Show exit confirmation dialog
      Alert.alert(
        language === 'ar' ? 'الخروج من التطبيق' : 'Exit App',
        language === 'ar' ? 'هل أنت متأكد من الخروج؟' : 'Are you sure you want to exit?',
        [
          { text: language === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel', onPress: () => null },
          { text: language === 'ar' ? 'خروج' : 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() }
        ]
      );
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [showAIChat, showAdsViewer, showAchievements, showShop, showAdminPanel, currentPage, language]);

  // Send notification when achievement is unlocked
  useEffect(() => {
    if (newAchievement && NotificationService && NotificationService.sendAchievementNotification) {
      NotificationService.sendAchievementNotification(newAchievement, language);
    }
  }, [newAchievement, language]);

  const initApp = async () => {
    try {
      // Skip connection check - go directly to loading saved data
      // This prevents false "no internet" errors
      setNetworkStatus('connected');
      
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
                diamonds: userData.user.diamonds || savedUser.diamonds || 300,
                total_earned: userData.user.total_earned || savedUser.total_earned || 0,
              };
              setUser(updatedUser);
              await storage.setUserData(updatedUser);
              
              // Initialize economy for user if needed
              try {
                await api.initializeUserEconomy(updatedUser.id);
              } catch (e) {
                // Ignore economy init errors
              }
              
              // Check daily login rewards
              try {
                const dailyResponse = await api.getDailyLoginStatus(updatedUser.id);
                if (dailyResponse.ok) {
                  const dailyData = await dailyResponse.json();
                  if (dailyData.should_show_reward && !dailyData.today_claimed) {
                    setTimeout(() => setShowDailyRewards(true), 1000);
                  }
                }
              } catch (e) {
                // Daily check skipped
              }
            }
          }
        } catch (syncError) {
          // Sync error - continue with saved data
        }
      }

      // Load settings
      await loadSettings();
    } catch (error) {
      console.error('Init error:', error);
    } finally {
      setIsLoading(false);
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
      console.error('Settings error:', error);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleGuestMode = () => {
    setUser({ 
      name: 'زائر', 
      points: 0, 
      isGuest: true,
      id: 'guest_' + Date.now()
    });
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await storage.clearAll();
    setUser(null);
    setIsAuthenticated(false);
    setCurrentPage('home');
  };

  const handlePointsEarned = async (points) => {
    if (user && !user.isGuest) {
      setUser(prev => ({ 
        ...prev, 
        points: (prev.points || 0) + points 
      }));
      setBalanceRefresh(prev => prev + 1);
      
      // Update achievements
      await updateCurrency(points, 0);
    }
  };

  // Handle ad watched for achievements
  const handleAdWatched = async () => {
    await recordAdWatched();
  };

  // Handle app shared for achievements
  const handleAppShared = async () => {
    await recordAppShared();
  };

  const handleDailyRewardClaimed = (data) => {
    setBalanceRefresh(prev => prev + 1);
    if (data.reward_type === 'points') {
      handlePointsEarned(data.amount);
    }
  };

  const handleDiamondPurchase = (data) => {
    setBalanceRefresh(prev => prev + 1);
  };

  // Loading Screen
  if (isLoading) {
    return (
      <LinearGradient colors={colors.gradients.dark} style={styles.loadingContainer}>
        <View style={styles.loadingLogoContainer}>
          <Image 
            source={require('./assets/logo_saqr.png')} 
            style={styles.loadingLogo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.loadingAppName}>صقر</Text>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </LinearGradient>
    );
  }

  // Ad Viewer (Full Screen)
  if (showAdsViewer) {
    return (
      <AdViewerScreen
        onClose={() => {
          setShowAdsViewer(false);
          setCurrentPage('home');
        }}
        onNavigateToProfile={() => {
          setShowAdsViewer(false);
          setCurrentPage('profile');
        }}
        onPointsEarned={handlePointsEarned}
        user={user}
      />
    );
  }

  // Auth Screen
  if (!isAuthenticated) {
    return <AuthScreen onLogin={handleLogin} onGuestMode={handleGuestMode} />;
  }

  // Main App
  return (
    <View style={styles.container}>
      <LinearGradient colors={colors.gradients.dark} style={styles.mainArea}>
        {/* Balance Header - عرض الرصيد في أعلى الصفحة */}
        {user && !user.isGuest && (
          <BalanceHeader 
            userId={user.id}
            onDiamondPress={() => setShowDiamondShop(true)}
            refreshTrigger={balanceRefresh}
          />
        )}
        
        {currentPage === 'home' && (
          <HomeScreen 
            user={user} 
            settings={settings}
            onNavigateToAds={() => setShowAdsViewer(true)}
            onNavigateToGames={() => setCurrentPage('games')}
            onNavigateToChat={() => setCurrentPage('chat')}
            onNavigateToFortunes={() => setCurrentPage('fortunes')}
            onNavigateToFriends={() => setCurrentPage('friends')}
            onOpenDailyChallenge={() => setShowDailyRewards(true)}
            onRefresh={initApp}
          />
        )}
        {currentPage === 'profile' && (
          <ProfileScreen 
            user={user} 
            onLogout={handleLogout}
            onNavigate={setCurrentPage}
            onOpenAchievements={() => setShowAchievements(true)}
            onOpenShop={() => setShowShop(true)}
            onOpenAdminPanel={() => setShowAdminPanel(true)}
          />
        )}
        {currentPage === 'settings' && (
          <SettingsScreen 
            onBack={() => setCurrentPage('profile')}
            onLogout={handleLogout}
          />
        )}
        {currentPage === 'advertiser' && (
          <AdvertiserScreen />
        )}
        {currentPage === 'advertiser-dashboard' && (
          <AdvertiserDashboardScreen 
            navigation={{ navigate: setCurrentPage }}
          />
        )}
        {currentPage === 'support' && (
          <SupportScreen 
            navigation={{ navigate: setCurrentPage }}
          />
        )}
        {currentPage === 'challenges' && (
          <ChallengesScreen 
            user={user}
            onPointsEarned={handlePointsEarned}
          />
        )}
        {currentPage === 'games' && (
          <GamesScreen 
            user={user}
            onPointsEarned={handlePointsEarned}
            onOpenDiamondShop={() => setShowDiamondShop(true)}
            onOpenAchievements={() => setShowAchievements(true)}
            balanceRefresh={balanceRefresh}
            language={language}
            onClose={() => setCurrentPage('home')}
          />
        )}
        {currentPage === 'chat' && (
          <GlobalChatScreen 
            user={user}
            onClose={() => setCurrentPage('home')}
            onNavigateToFortunes={() => setCurrentPage('fortunes')}
          />
        )}
        {currentPage === 'fortunes' && (
          <SaqrFortunesScreen 
            user={user}
            onClose={() => setCurrentPage('home')}
            onBalanceUpdate={() => setBalanceRefresh(prev => prev + 1)}
          />
        )}
        {currentPage === 'friends' && (
          <FriendsScreen 
            user={user}
            onClose={() => setCurrentPage('home')}
            onOpenMessages={(friend) => {
              setSelectedFriend(friend);
              setCurrentPage('messages');
            }}
            onOpenGameInvite={(friend) => {
              // TODO: Open game invite modal
            }}
          />
        )}
        {currentPage === 'messages' && (
          <PrivateMessagesScreen 
            user={user}
            onClose={() => setCurrentPage('friends')}
            initialFriend={selectedFriend}
          />
        )}
        {currentPage === 'invitations' && (
          <InvitationsScreen 
            user={user}
            onClose={() => setCurrentPage('home')}
          />
        )}
      </LinearGradient>

      {/* Achievements Screen */}
      {showAchievements && (
        <View style={StyleSheet.absoluteFill}>
          <AchievementsScreen 
            onClose={() => setShowAchievements(false)}
            language={language}
          />
        </View>
      )}

      {/* Shop Screen */}
      {showShop && (
        <View style={StyleSheet.absoluteFill}>
          <ShopScreen
            user={user}
            userDiamonds={user?.diamonds || 0}
            onClose={() => setShowShop(false)}
            onUpdateDiamonds={(newBalance) => {
              setUser(prev => ({ ...prev, diamonds: newBalance }));
              setBalanceRefresh(prev => prev + 1);
            }}
            onPurchaseItem={(item) => {
              console.log('Item purchased:', item);
            }}
          />
        </View>
      )}

      {/* Admin Panel WebView */}
      {showAdminPanel && (
        <View style={StyleSheet.absoluteFill}>
          <AdminWebViewScreen onClose={() => setShowAdminPanel(false)} />
        </View>
      )}

      {/* Millionaire Game Screen */}
      {showMillionaire && (
        <View style={StyleSheet.absoluteFill}>
          <MillionaireScreen
            onClose={() => setShowMillionaire(false)}
            onComplete={(points, result) => {
              if (result === 'win') {
                setUser(prev => ({ ...prev, points: (prev.points || 0) + points }));
                setBalanceRefresh(prev => prev + 1);
              }
            }}
          />
        </View>
      )}

      {/* Leaderboard Screen */}
      {showLeaderboard && (
        <View style={StyleSheet.absoluteFill}>
          <LeaderboardScreen
            userId={user?.id}
            onClose={() => setShowLeaderboard(false)}
          />
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
      <AIChatModal 
        visible={showAIChat} 
        onClose={() => setShowAIChat(false)} 
      />

      {/* Daily Rewards Modal - مكافآت الدخول اليومي */}
      <DailyRewardsModal
        visible={showDailyRewards}
        onClose={() => setShowDailyRewards(false)}
        userId={user?.id}
        onRewardClaimed={handleDailyRewardClaimed}
      />

      {/* Diamond Shop Modal - متجر شحن الألماسات */}
      <DiamondShopModal
        visible={showDiamondShop}
        onClose={() => setShowDiamondShop(false)}
        userId={user?.id}
        onPurchaseComplete={handleDiamondPurchase}
      />

      {/* Bottom Navigation - إخفاء عند فتح الألعاب أو الدردشة أو الأصدقاء */}
      {!['games', 'chat', 'fortunes', 'friends', 'messages'].includes(currentPage) && (
        <BottomNav
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          onAdsPress={() => setShowAdsViewer(true)}
          onGamesPress={() => setCurrentPage('games')}
        />
      )}

      <StatusBar style="light" />
    </View>
  );
}

// Main App with Providers
function App() {
  return (
    <LanguageProvider>
      <AchievementsProvider>
        <PointsProvider>
          <AppContent />
        </PointsProvider>
      </AchievementsProvider>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark.bg },
  mainArea: { flex: 1 }, // No fixed padding - handled per screen
  
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingLogoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#0a0a0f',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingLogo: { width: 96, height: 96 },
  loadingAppName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#60a5fa',
    marginTop: 16,
  },
  loadingText: { 
    color: 'rgba(255,255,255,0.6)', 
    marginTop: 16, 
    fontSize: 16 
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
    console.log('App Error:', error, errorInfo);
    console.log('Error details:', error?.message, error?.stack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <LinearGradient colors={['#0a0a0f', '#1a1a2e']} style={errorStyles.gradient}>
            <Text style={errorStyles.icon}>⚠️</Text>
            <Text style={errorStyles.title}>حدث خطأ غير متوقع</Text>
            <Text style={errorStyles.message}>نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى.</Text>
            <TouchableOpacity style={errorStyles.retryBtn} onPress={this.handleRetry}>
              <Text style={errorStyles.retryText}>إعادة المحاولة</Text>
            </TouchableOpacity>
            <Text style={errorStyles.support}>للدعم: sky-321@hotmail.com</Text>
            {__DEV__ && this.state.error && (
              <Text style={errorStyles.errorDetails}>{this.state.error.toString()}</Text>
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
  gradient: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  icon: { fontSize: 60, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#FFF', marginBottom: 10, textAlign: 'center' },
  message: { fontSize: 16, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 20 },
  retryBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 10, marginBottom: 20 },
  retryText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  support: { fontSize: 14, color: '#60a5fa', textAlign: 'center' },
  errorDetails: { fontSize: 10, color: '#ef4444', marginTop: 20, textAlign: 'center' },
});

// Export with Error Boundary
export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
