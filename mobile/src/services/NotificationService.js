// Push Notification Service - خدمة الإشعارات
// Note: Notifications are optional and will fail silently if not configured
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

let Notifications = null;
let Device = null;
let notificationsAvailable = false;

// Try to import notifications modules
try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
  notificationsAvailable = true;
  
  // Configure notification handling only if available
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (error) {
  console.log('Notifications not available:', error.message);
}

// Notification types
export const NOTIFICATION_TYPES = {
  ACHIEVEMENT: 'achievement',
  DAILY_REWARD: 'daily_reward',
  GAME_INVITE: 'game_invite',
  POINTS_EARNED: 'points_earned',
  STREAK_REMINDER: 'streak_reminder',
  NEW_GAME: 'new_game',
  LEADERBOARD: 'leaderboard',
};

// Register for push notifications
export const registerForPushNotifications = async () => {
  if (!notificationsAvailable || !Device || !Notifications) {
    console.log('Notifications not available on this build');
    return null;
  }
  
  let token;
  
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }
    
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Push token:', token);
    
    // Save token
    await AsyncStorage.setItem('push_token', token);
  } else {
    console.log('Must use physical device for Push Notifications');
  }
  
  // Android specific channel
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3b82f6',
    });
    
    Notifications.setNotificationChannelAsync('achievements', {
      name: 'الإنجازات',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#fbbf24',
    });
    
    Notifications.setNotificationChannelAsync('rewards', {
      name: 'المكافآت',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10b981',
    });
  }
  
  return token;
};

// Schedule local notification
export const scheduleLocalNotification = async ({
  title,
  body,
  data = {},
  trigger = null,
  channelId = 'default',
}) => {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        ...(Platform.OS === 'android' && { channelId }),
      },
      trigger: trigger || null, // null = immediate
    });
    
    console.log('Notification scheduled:', id);
    return id;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
};

// Send achievement notification
export const sendAchievementNotification = async (achievement, language = 'ar') => {
  const name = achievement.name[language] || achievement.name.ar;
  
  const titles = {
    ar: 'إنجاز جديد',
    en: 'Achievement Unlocked',
    fr: 'Succès débloqué',
    tr: 'Başarı Kazanıldı',
  };
  
  const bodies = {
    ar: `تهانينا! لقد حصلت على "${name}" واربحت ${achievement.reward.points} نقطة و ${achievement.reward.diamonds} ماسة`,
    en: `Congratulations! You earned "${name}" and won ${achievement.reward.points} points and ${achievement.reward.diamonds} diamonds`,
    fr: `Félicitations! Vous avez gagné "${name}" et remporté ${achievement.reward.points} points et ${achievement.reward.diamonds} diamants`,
    tr: `Tebrikler! "${name}" kazandınız ve ${achievement.reward.points} puan ile ${achievement.reward.diamonds} elmas aldınız`,
  };
  
  return scheduleLocalNotification({
    title: titles[language] || titles.ar,
    body: bodies[language] || bodies.ar,
    data: { type: NOTIFICATION_TYPES.ACHIEVEMENT, achievementId: achievement.id },
    channelId: 'achievements',
  });
};

// Send daily reward reminder
export const sendDailyRewardReminder = async (language = 'ar') => {
  const titles = {
    ar: 'مكافأتك اليومية بانتظارك',
    en: 'Your daily reward is waiting',
    fr: 'Votre récompense quotidienne vous attend',
    tr: 'Günlük ödülünüz sizi bekliyor',
  };
  
  const bodies = {
    ar: 'افتح التطبيق الآن واحصل على مكافأتك اليومية قبل انتهاء الوقت',
    en: 'Open the app now and get your daily reward before time runs out',
    fr: 'Ouvrez l\'app maintenant et obtenez votre récompense quotidienne',
    tr: 'Uygulamayı şimdi açın ve günlük ödülünüzü alın',
  };
  
  return scheduleLocalNotification({
    title: titles[language] || titles.ar,
    body: bodies[language] || bodies.ar,
    data: { type: NOTIFICATION_TYPES.DAILY_REWARD },
    channelId: 'rewards',
  });
};

// Schedule daily reward reminder (every day at specific time)
export const scheduleDailyRewardReminder = async (hour = 10, minute = 0, language = 'ar') => {
  // Cancel existing daily reminders
  await cancelScheduledNotifications('daily_reminder');
  
  const titles = {
    ar: 'لا تنسَ مكافأتك اليومية',
    en: "Don't forget your daily reward",
    fr: "N'oubliez pas votre récompense quotidienne",
    tr: 'Günlük ödülünüzü unutmayın',
  };
  
  const bodies = {
    ar: 'افتح صقر واحصل على نقاط وألماسات مجانية كل يوم',
    en: 'Open Saqr and get free points and diamonds every day',
    fr: 'Ouvrez Saqr et obtenez des points et diamants gratuits chaque jour',
    tr: 'Saqr\'ı açın ve her gün ücretsiz puan ve elmas kazanın',
  };
  
  // Schedule for tomorrow
  const trigger = {
    hour,
    minute,
    repeats: true,
  };
  
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: titles[language] || titles.ar,
      body: bodies[language] || bodies.ar,
      data: { type: 'daily_reminder' },
      sound: true,
      ...(Platform.OS === 'android' && { channelId: 'rewards' }),
    },
    trigger,
  });
  
  // Save the notification ID
  await AsyncStorage.setItem('daily_reminder_id', id);
  
  console.log('Daily reminder scheduled:', id);
  return id;
};

// Send streak reminder
export const sendStreakReminder = async (currentStreak, language = 'ar') => {
  const titles = {
    ar: 'حافظ على سلسلتك',
    en: 'Keep your streak going',
    fr: 'Gardez votre série',
    tr: 'Serinizi koruyun',
  };
  
  const bodies = {
    ar: `لديك سلسلة ${currentStreak} يوم! العب الآن للحفاظ عليها`,
    en: `You have a ${currentStreak} day streak! Play now to keep it`,
    fr: `Vous avez une série de ${currentStreak} jours! Jouez maintenant`,
    tr: `${currentStreak} günlük seriniz var! Korumak için şimdi oynayın`,
  };
  
  return scheduleLocalNotification({
    title: titles[language] || titles.ar,
    body: bodies[language] || bodies.ar,
    data: { type: NOTIFICATION_TYPES.STREAK_REMINDER, streak: currentStreak },
    channelId: 'rewards',
  });
};

// Send points earned notification
export const sendPointsEarnedNotification = async (points, source, language = 'ar') => {
  const titles = {
    ar: `+${points} نقطة`,
    en: `+${points} points`,
    fr: `+${points} points`,
    tr: `+${points} puan`,
  };
  
  const bodies = {
    ar: `أحسنت! لقد ربحت ${points} نقطة من ${source}`,
    en: `Great job! You earned ${points} points from ${source}`,
    fr: `Bien joué! Vous avez gagné ${points} points de ${source}`,
    tr: `Harika! ${source}\'den ${points} puan kazandınız`,
  };
  
  return scheduleLocalNotification({
    title: titles[language] || titles.ar,
    body: bodies[language] || bodies.ar,
    data: { type: NOTIFICATION_TYPES.POINTS_EARNED, points },
    channelId: 'default',
  });
};

// Send new game notification
export const sendNewGameNotification = async (gameName, language = 'ar') => {
  const titles = {
    ar: 'لعبة جديدة متاحة',
    en: 'New game available',
    fr: 'Nouveau jeu disponible',
    tr: 'Yeni oyun mevcut',
  };
  
  const bodies = {
    ar: `جرّب الآن "${gameName}" واربح نقاط إضافية`,
    en: `Try "${gameName}" now and earn bonus points`,
    fr: `Essayez "${gameName}" maintenant et gagnez des points bonus`,
    tr: `"${gameName}" şimdi deneyin ve bonus puan kazanın`,
  };
  
  return scheduleLocalNotification({
    title: titles[language] || titles.ar,
    body: bodies[language] || bodies.ar,
    data: { type: NOTIFICATION_TYPES.NEW_GAME, gameName },
    channelId: 'default',
  });
};

// Cancel all scheduled notifications
export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('All notifications cancelled');
};

// Cancel specific scheduled notifications
export const cancelScheduledNotifications = async (type) => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  
  for (const notification of scheduled) {
    if (notification.content.data?.type === type) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
};

// Get notification settings
export const getNotificationSettings = async () => {
  const enabled = await AsyncStorage.getItem('notifications_enabled');
  const dailyReminderEnabled = await AsyncStorage.getItem('daily_reminder_enabled');
  const achievementNotifications = await AsyncStorage.getItem('achievement_notifications');
  
  return {
    enabled: enabled !== 'false',
    dailyReminder: dailyReminderEnabled !== 'false',
    achievements: achievementNotifications !== 'false',
  };
};

// Save notification settings
export const saveNotificationSettings = async (settings) => {
  await AsyncStorage.setItem('notifications_enabled', String(settings.enabled));
  await AsyncStorage.setItem('daily_reminder_enabled', String(settings.dailyReminder));
  await AsyncStorage.setItem('achievement_notifications', String(settings.achievements));
  
  // Handle daily reminder
  if (settings.dailyReminder) {
    await scheduleDailyRewardReminder();
  } else {
    await cancelScheduledNotifications('daily_reminder');
  }
};

// Add notification listeners
export const addNotificationListeners = (onReceive, onResponse) => {
  const receiveSubscription = Notifications.addNotificationReceivedListener(onReceive);
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(onResponse);
  
  return () => {
    receiveSubscription.remove();
    responseSubscription.remove();
  };
};

export default {
  registerForPushNotifications,
  scheduleLocalNotification,
  sendAchievementNotification,
  sendDailyRewardReminder,
  scheduleDailyRewardReminder,
  sendStreakReminder,
  sendPointsEarnedNotification,
  sendNewGameNotification,
  cancelAllNotifications,
  cancelScheduledNotifications,
  getNotificationSettings,
  saveNotificationSettings,
  addNotificationListeners,
  NOTIFICATION_TYPES,
};
