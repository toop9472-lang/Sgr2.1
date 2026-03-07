// Settings Screen - Theme, Language settings and Logout
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import storage from '../services/storage';
import { useLanguage } from '../i18n/LanguageContext';

const SettingsScreen = ({ onBack, onLogout }) => {
  const [theme, setTheme] = useState('dark');
  const { language, setLanguage, supportedLanguages } = useLanguage();
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('saqr_theme');
      const saved2FA = await AsyncStorage.getItem('saqr_2fa_enabled');
      const savedNotifications = await AsyncStorage.getItem('saqr_notifications_enabled');
      if (savedTheme) setTheme(savedTheme);
      if (saved2FA !== null) setTwoFactorEnabled(saved2FA === 'true');
      if (savedNotifications !== null) setNotificationsEnabled(savedNotifications === 'true');
    } catch (error) {
      console.log('Error loading settings:', error);
    }
  };

  const saveTheme = async (newTheme) => {
    try {
      await AsyncStorage.setItem('saqr_theme', newTheme);
      await AsyncStorage.setItem('app_theme', newTheme); // For ThemeContext if exists
      setTheme(newTheme);
      setShowThemeModal(false);
      Alert.alert('تم الحفظ', 'تم تغيير المظهر بنجاح');
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  const saveLanguage = async (newLanguage) => {
    try {
      // Save in both keys for compatibility and update app context immediately.
      await AsyncStorage.setItem('saqr_language', newLanguage);
      await setLanguage(newLanguage);
      setShowLanguageModal(false);
      Alert.alert('تم الحفظ', 'تم تغيير اللغة بنجاح');
    } catch (error) {
      console.log('Error saving language:', error);
    }
  };

  const toggleTwoFactor = async () => {
    const next = !twoFactorEnabled;
    try {
      await AsyncStorage.setItem('saqr_2fa_enabled', String(next));
      setTwoFactorEnabled(next);
      Alert.alert('التحقق بخطوتين', next ? 'تم تفعيل التحقق بخطوتين' : 'تم إيقاف التحقق بخطوتين');
    } catch (error) {
      Alert.alert('خطأ', 'تعذر تحديث إعداد التحقق بخطوتين');
    }
  };

  const toggleNotifications = async () => {
    const next = !notificationsEnabled;
    try {
      await AsyncStorage.setItem('saqr_notifications_enabled', String(next));
      setNotificationsEnabled(next);
      Alert.alert('الإشعارات', next ? 'تم تفعيل الإشعارات' : 'تم إيقاف الإشعارات');
    } catch (error) {
      Alert.alert('خطأ', 'تعذر تحديث إعداد الإشعارات');
    }
  };

  const themes = [
    { id: 'dark', name: 'داكن', icon: 'moon' },
    { id: 'light', name: 'فاتح', icon: 'sunny' },
    { id: 'system', name: 'حسب النظام', icon: 'phone-portrait' },
  ];

  const languages = supportedLanguages.map((lang) => ({
    code: lang.code,
    name: lang.name,
    icon: 'globe',
  }));

  const getThemeName = () => themes.find(t => t.id === theme)?.name || 'داكن';
  const getLanguageName = () => languages.find(l => l.code === language)?.name || 'العربية';

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'تسجيل الخروج', 
          style: 'destructive',
          onPress: async () => {
            try {
              await storage.clearAll();
              await AsyncStorage.removeItem('saqr_user');
              await AsyncStorage.removeItem('saqr_token');
              if (onLogout) {
                onLogout();
              }
            } catch (error) {
              console.log('Logout error:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء تسجيل الخروج');
            }
          }
        }
      ]
    );
  };

  const settingsItems = [
    {
      id: 'language',
      icon: 'globe-outline',
      label: 'اللغة',
      value: getLanguageName(),
      action: () => setShowLanguageModal(true),
      color: '#3b82f6',
    },
    {
      id: 'theme',
      icon: 'color-palette-outline',
      label: 'المظهر',
      value: getThemeName(),
      action: () => setShowThemeModal(true),
      color: '#a855f7',
    },
    {
      id: '2fa',
      icon: 'shield-checkmark-outline',
      label: 'التحقق بخطوتين',
      value: twoFactorEnabled ? 'مفعّل' : 'غير مفعّل',
      action: toggleTwoFactor,
      color: '#22c55e',
    },
    {
      id: 'notifications',
      icon: 'notifications-outline',
      label: 'الإشعارات',
      value: notificationsEnabled ? 'مفعّلة' : 'متوقفة',
      action: toggleNotifications,
      color: '#fbbf24',
    },
    {
      id: 'logout',
      icon: 'log-out-outline',
      label: 'تسجيل الخروج',
      value: '',
      action: handleLogout,
      color: '#ef4444',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-forward" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الإعدادات</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {settingsItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index !== settingsItems.length - 1 && styles.menuItemBorder
              ]}
              onPress={item.action}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemLabel}>{item.label}</Text>
                {item.value ? (
                  <Text style={styles.menuItemValue}>{item.value}</Text>
                ) : null}
              </View>
              <Ionicons name="chevron-back" size={20} color="#666" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Language Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>اختر اللغة</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.optionItem,
                  language === lang.code && styles.optionItemSelected
                ]}
                onPress={() => saveLanguage(lang.code)}
              >
                <View style={styles.langIconContainer}>
                  <Ionicons name={lang.icon} size={20} color="#60a5fa" />
                </View>
                <Text style={styles.optionText}>{lang.name}</Text>
                {language === lang.code && (
                  <Ionicons name="checkmark" size={20} color="#3b82f6" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Theme Modal */}
      <Modal
        visible={showThemeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>اختر المظهر</Text>
              <TouchableOpacity onPress={() => setShowThemeModal(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            {themes.map((themeOption) => (
              <TouchableOpacity
                key={themeOption.id}
                style={[
                  styles.optionItem,
                  theme === themeOption.id && styles.optionItemSelected
                ]}
                onPress={() => saveTheme(themeOption.id)}
              >
                <View style={styles.themeIconContainer}>
                  <Ionicons name={themeOption.icon} size={22} color="#FFF" />
                </View>
                <Text style={styles.optionText}>{themeOption.name}</Text>
                {theme === themeOption.id && (
                  <Ionicons name="checkmark" size={20} color="#3b82f6" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#6366f1',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: 'rgba(17, 17, 24, 0.8)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemLabel: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'right',
  },
  menuItemValue: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#111118',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  optionItemSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  langIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
    textAlign: 'right',
  },
  themeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
});

export default SettingsScreen;
