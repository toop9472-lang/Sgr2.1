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
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from '@react-native-async-storage/async-storage';
import storage from '../services/storage';
import { useLanguage } from '../i18n/LanguageContext';

const SettingsScreen = ({
  onBack,
  onLogout,
  user,
  currentTheme = 'dark',
  onThemeChange,
  currentHomePreset = 'luxuryDark',
  onHomePresetChange,
  onUpdateProfile,
  onOpenBlockedUsers,
}) => {
  const [theme, setTheme] = useState(currentTheme);
  const [homePreset, setHomePreset] = useState(currentHomePreset);
  const { language, setLanguage, supportedLanguages, t } = useLanguage();
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showHomePresetModal, setShowHomePresetModal] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isPrivate, setIsPrivate] = useState(Boolean(user?.is_private));
  const [privacyBusy, setPrivacyBusy] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    setTheme(currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    setHomePreset(currentHomePreset);
  }, [currentHomePreset]);

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
      if (onThemeChange) onThemeChange(newTheme);
      setShowThemeModal(false);
      Alert.alert(t('success'), language === 'ar' ? 'تم تغيير المظهر بنجاح' : 'Theme updated successfully');
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
      Alert.alert(t('success'), language === 'ar' ? 'تم تغيير اللغة بنجاح' : 'Language updated successfully');
    } catch (error) {
      console.log('Error saving language:', error);
    }
  };

  const saveHomePreset = async (nextPreset) => {
    try {
      await AsyncStorage.setItem('saqr_home_preset', nextPreset);
      setHomePreset(nextPreset);
      if (onHomePresetChange) onHomePresetChange(nextPreset);
      setShowHomePresetModal(false);
      Alert.alert(
        t('success'),
        language === 'ar' ? 'تم تغيير نمط الصفحة الرئيسية بنجاح' : 'Home style updated successfully',
      );
    } catch (error) {
      console.log('Error saving home preset:', error);
    }
  };

  const toggleTwoFactor = async () => {
    const next = !twoFactorEnabled;
    try {
      await AsyncStorage.setItem('saqr_2fa_enabled', String(next));
      setTwoFactorEnabled(next);
      Alert.alert(language === 'ar' ? 'التحقق بخطوتين' : 'Two-Factor Authentication', next ? (language === 'ar' ? 'تم تفعيل التحقق بخطوتين' : 'Two-factor authentication enabled') : (language === 'ar' ? 'تم إيقاف التحقق بخطوتين' : 'Two-factor authentication disabled'));
    } catch (error) {
      Alert.alert('خطأ', 'تعذر تحديث إعداد التحقق بخطوتين');
    }
  };

  const toggleNotifications = async () => {
    const next = !notificationsEnabled;
    try {
      await AsyncStorage.setItem('saqr_notifications_enabled', String(next));
      setNotificationsEnabled(next);
      Alert.alert(t('notifications'), next ? (language === 'ar' ? 'تم تفعيل الإشعارات' : 'Notifications enabled') : (language === 'ar' ? 'تم إيقاف الإشعارات' : 'Notifications disabled'));
    } catch (error) {
      Alert.alert(t('error'), language === 'ar' ? 'تعذر تحديث إعداد الإشعارات' : 'Unable to update notifications setting');
    }
  };

  const themes = [
    { id: 'dark', name: language === 'ar' ? 'داكن' : 'Dark', icon: 'moon' },
    { id: 'light', name: language === 'ar' ? 'فاتح' : 'Light', icon: 'sunny' },
    { id: 'system', name: language === 'ar' ? 'حسب النظام' : 'System', icon: 'phone-portrait' },
  ];

  const languages = supportedLanguages.map((lang) => ({
    code: lang.code,
    name: lang.name,
    icon: 'globe',
  }));

  const homePresets = [
    {
      id: 'luxuryDark',
      name: language === 'ar' ? 'فاخر داكن' : 'Luxury Dark',
      icon: 'moon',
    },
    {
      id: 'brightModern',
      name: language === 'ar' ? 'مشرق حديث' : 'Bright Modern',
      icon: 'sunny',
    },
  ];

  const getThemeName = () => themes.find(tItem => tItem.id === theme)?.name || (language === 'ar' ? 'داكن' : 'Dark');
  const getLanguageName = () => languages.find(l => l.code === language)?.name || (language === 'ar' ? 'العربية' : 'Arabic');
  const getHomePresetName = () =>
    homePresets.find((item) => item.id === homePreset)?.name ||
    (language === 'ar' ? 'فاخر داكن' : 'Luxury Dark');

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      t('logout'),
      language === 'ar' ? 'هل أنت متأكد من تسجيل الخروج؟' : 'Are you sure you want to logout?',
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('logout'),
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
              Alert.alert(t('error'), language === 'ar' ? 'حدث خطأ أثناء تسجيل الخروج' : 'Logout failed');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    setIsPrivate(Boolean(user?.is_private));
  }, [user?.is_private]);

  const togglePrivacy = async () => {
    if (privacyBusy) return;
    const userId = user?.id || user?.user_id;
    if (!userId) {
      Alert.alert(language === 'ar' ? 'خطأ' : 'Error', language === 'ar' ? 'يجب تسجيل الدخول' : 'Sign in required');
      return;
    }
    const next = !isPrivate;
    setPrivacyBusy(true);
    try {
      const api = (await import('../services/api')).default;
      const r = await api.fetch(`/api/users/privacy/${encodeURIComponent(userId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_private: next }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.detail || 'فشلت العملية');
      setIsPrivate(next);
      if (onUpdateProfile) onUpdateProfile({ is_private: next });
      Alert.alert(
        '✓',
        next
          ? (language === 'ar' ? 'تم تفعيل الحساب الخاص. مقاطعك ستكون مرئية للمتابعين فقط.' : 'Private account enabled.')
          : (language === 'ar' ? 'الحساب عام الآن.' : 'Account is now public.'),
      );
    } catch (e) {
      Alert.alert(language === 'ar' ? 'خطأ' : 'Error', String(e?.message || e));
    } finally {
      setPrivacyBusy(false);
    }
  };

  const settingsSections = [
    {
      id: 'account',
      title: language === 'ar' ? 'الحساب' : 'Account',
      items: [
        {
          id: 'account_privacy',
          icon: isPrivate ? 'lock-closed-outline' : 'lock-open-outline',
          label: language === 'ar' ? 'خصوصية الحساب' : 'Account Privacy',
          value: privacyBusy
            ? (language === 'ar' ? 'جاري...' : 'Updating...')
            : isPrivate
              ? (language === 'ar' ? 'حساب خاص' : 'Private')
              : (language === 'ar' ? 'حساب عام' : 'Public'),
          action: togglePrivacy,
        },
        {
          id: 'blocked_users',
          icon: 'remove-circle-outline',
          label: language === 'ar' ? 'المستخدمون المحظورون' : 'Blocked Users',
          value: language === 'ar' ? 'إدارة' : 'Manage',
          action: () => {
            if (onOpenBlockedUsers) {
              onOpenBlockedUsers();
            } else {
              Alert.alert(
                language === 'ar' ? 'غير متاح' : 'Unavailable',
                language === 'ar' ? 'الميزة غير مفعلة في هذه الشاشة.' : 'Not enabled here.',
              );
            }
          },
        },
        {
          id: '2fa',
          icon: 'shield-checkmark-outline',
          label: language === 'ar' ? 'التحقق بخطوتين' : 'Two-Factor Auth',
          value: twoFactorEnabled
            ? (language === 'ar' ? 'مفعّل' : 'Enabled')
            : (language === 'ar' ? 'غير مفعّل' : 'Disabled'),
          action: toggleTwoFactor,
        },
      ],
    },
    {
      id: 'preferences',
      title: language === 'ar' ? 'التفضيلات' : 'Preferences',
      items: [
        {
          id: 'notifications',
          icon: 'notifications-outline',
          label: t('notifications'),
          value: notificationsEnabled
            ? (language === 'ar' ? 'مفعّلة' : 'Enabled')
            : (language === 'ar' ? 'متوقفة' : 'Disabled'),
          action: toggleNotifications,
        },
        {
          id: 'language',
          icon: 'globe-outline',
          label: t('language'),
          value: getLanguageName(),
          action: () => setShowLanguageModal(true),
        },
        {
          id: 'theme',
          icon: 'color-palette-outline',
          label: language === 'ar' ? 'المظهر' : 'Theme',
          value: getThemeName(),
          action: () => setShowThemeModal(true),
        },
      ],
    },
    {
      id: 'about',
      title: language === 'ar' ? 'المعلومات والدعم' : 'About & Support',
      items: [
        {
          id: 'help',
          icon: 'help-circle-outline',
          label: language === 'ar' ? 'المساعدة والدعم' : 'Help & Support',
          value: '',
          action: () => Alert.alert(
            language === 'ar' ? 'الدعم' : 'Support',
            language === 'ar' ? 'تواصل معنا عبر: support@saqr4u.com' : 'Contact us at: support@saqr4u.com',
          ),
        },
        {
          id: 'terms',
          icon: 'document-text-outline',
          label: language === 'ar' ? 'الشروط والأحكام' : 'Terms of Service',
          value: '',
          action: () => Alert.alert(
            language === 'ar' ? 'الشروط' : 'Terms',
            language === 'ar' ? 'تخضع جميع التعاملات لشروط الاستخدام المنشورة على saqr4u.com' : 'All terms are published on saqr4u.com',
          ),
        },
        {
          id: 'privacy_policy',
          icon: 'shield-outline',
          label: language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy',
          value: '',
          action: () => Alert.alert(
            language === 'ar' ? 'الخصوصية' : 'Privacy',
            language === 'ar' ? 'نلتزم بحماية بياناتك. التفاصيل على saqr4u.com/privacy' : 'See our privacy policy at saqr4u.com/privacy',
          ),
        },
        {
          id: 'version',
          icon: 'information-circle-outline',
          label: language === 'ar' ? 'الإصدار' : 'Version',
          value: '7.2.23',
          action: () => {},
        },
      ],
    },
    {
      id: 'danger',
      title: language === 'ar' ? 'إجراءات الحساب' : 'Account Actions',
      items: [
        {
          id: 'logout',
          icon: 'log-out-outline',
          label: t('logout'),
          value: '',
          action: handleLogout,
          tint: '#fca5a5',
        },
      ],
    },
  ];

  return (
    <LinearGradient
      colors={["#05070d", "#0b1020", "#0e172d"]}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel={language === 'ar' ? 'رجوع' : 'Back'}
        >
          <Ionicons name="arrow-forward" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {settingsSections.map((section) => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    index !== section.items.length - 1 && styles.menuItemBorder,
                  ]}
                  onPress={item.action}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconContainer}>
                    <Ionicons name={item.icon} size={20} color="#FFF" />
                  </View>
                  <View style={styles.menuItemContent}>
                    <Text
                      style={[
                        styles.menuItemLabel,
                        item.tint ? { color: item.tint } : null,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {item.value ? (
                      <Text style={styles.menuItemValue}>{item.value}</Text>
                    ) : null}
                  </View>
                  <Ionicons
                    name={language === 'ar' ? 'chevron-back' : 'chevron-forward'}
                    size={18}
                    color="rgba(255,255,255,0.35)"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
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
            <Text style={styles.modalTitle}>{language === 'ar' ? 'اختر اللغة' : 'Select Language'}</Text>
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
                  <Ionicons name={lang.icon} size={20} color="#FFF" />
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
            <Text style={styles.modalTitle}>{language === 'ar' ? 'اختر المظهر' : 'Select Theme'}</Text>
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

      {/* Home preset modal removed — single design now */}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05070d',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(8, 14, 28, 0.92)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 18,
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginHorizontal: 6,
    textAlign: 'right',
  },
  card: {
    backgroundColor: "rgba(12,20,40,0.78)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemLabel: {
    fontSize: 15,
    color: '#FFF',
    fontWeight: '600',
    textAlign: 'right',
  },
  menuItemValue: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
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
    backgroundColor: '#0e172d',
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
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFF',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  optionItemSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  langIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#FFF',
    textAlign: 'right',
  },
  themeIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
});

export default SettingsScreen;
