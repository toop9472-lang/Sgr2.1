// Admin WebView Screen - لوحة تحكم الأدمن
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';

const ADMIN_URL = `${api.baseUrl}/admin/login`;

const AdminWebViewScreen = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(ADMIN_URL);
  const [error, setError] = useState(null);
  const [quickLoading, setQuickLoading] = useState(true);
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickSettings, setQuickSettings] = useState({
    google_enabled: true,
    apple_enabled: true,
    maintenance_mode: false,
    allow_new_registrations: true,
    admob_enabled: false,
  });
  const [oauthPayload, setOauthPayload] = useState(null);
  const [appPayload, setAppPayload] = useState(null);
  const [admobPayload, setAdmobPayload] = useState(null);
  const [quickError, setQuickError] = useState(null);
  const webViewRef = useRef(null);

  const loadQuickSettings = useCallback(async () => {
    setQuickLoading(true);
    setQuickError(null);
    try {
      const [oauthRes, appRes, admobRes] = await Promise.all([
        api.fetch('/api/settings/oauth', { method: 'GET' }).catch(() => null),
        api.fetch('/api/settings/app', { method: 'GET' }).catch(() => null),
        api.fetch('/api/settings/admob', { method: 'GET' }).catch(() => null),
      ]);

      if (oauthRes?.status === 403 || appRes?.status === 403 || admobRes?.status === 403) {
        setQuickError('الإعدادات السريعة تحتاج صلاحية مدير كاملة.');
        return;
      }

      const oauthData = oauthRes?.ok ? await oauthRes.json().catch(() => ({})) : {};
      const appData = appRes?.ok ? await appRes.json().catch(() => ({})) : {};
      const admobData = admobRes?.ok ? await admobRes.json().catch(() => ({})) : {};

      setOauthPayload(oauthData);
      setAppPayload(appData);
      setAdmobPayload(admobData);
      setQuickSettings({
        google_enabled: oauthData?.google_enabled !== false,
        apple_enabled: oauthData?.apple_enabled !== false,
        maintenance_mode: appData?.maintenance_mode === true,
        allow_new_registrations: appData?.allow_new_registrations !== false,
        admob_enabled: admobData?.admob_enabled === true,
      });
    } catch (_) {
      setQuickError('تعذر تحميل الإعدادات السريعة حالياً.');
    } finally {
      setQuickLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuickSettings();
  }, [loadQuickSettings]);

  const saveOAuthToggle = async (field, value) => {
    const payload = {
      ...(oauthPayload || {}),
      google_enabled: field === 'google_enabled' ? value : (quickSettings.google_enabled),
      apple_enabled: field === 'apple_enabled' ? value : (quickSettings.apple_enabled),
    };
    const res = await api.fetch('/api/settings/oauth', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('oauth_save_failed');
    setOauthPayload(payload);
  };

  const saveAppToggle = async (field, value) => {
    if (field === 'maintenance_mode') {
      const toggleRes = await api.fetch('/api/settings/maintenance/toggle', { method: 'POST' });
      if (!toggleRes.ok) throw new Error('maintenance_toggle_failed');
      const next = await toggleRes.json().catch(() => ({}));
      setQuickSettings((prev) => ({ ...prev, maintenance_mode: next?.maintenance_mode === true }));
      return;
    }
    const payload = {
      ...(appPayload || {}),
      [field]: value,
    };
    const res = await api.fetch('/api/settings/app', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('app_save_failed');
    setAppPayload(payload);
  };

  const saveAdmobToggle = async (value) => {
    const payload = {
      ...(admobPayload || {}),
      admob_enabled: value,
    };
    const res = await api.fetch('/api/settings/admob', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('admob_save_failed');
    setAdmobPayload(payload);
  };

  const handleToggleSetting = async (field) => {
    if (quickSaving) return;
    const nextValue = !quickSettings[field];
    setQuickSaving(true);
    setQuickError(null);
    setQuickSettings((prev) => ({ ...prev, [field]: nextValue }));
    try {
      if (field === 'google_enabled' || field === 'apple_enabled') {
        await saveOAuthToggle(field, nextValue);
      } else if (field === 'maintenance_mode' || field === 'allow_new_registrations') {
        await saveAppToggle(field, nextValue);
      } else if (field === 'admob_enabled') {
        await saveAdmobToggle(nextValue);
      }
      Alert.alert('تم', 'تم حفظ الإعداد بنجاح');
    } catch (_) {
      setQuickSettings((prev) => ({ ...prev, [field]: !nextValue }));
      Alert.alert('تعذر الحفظ', 'فشل تحديث الإعداد. تحقق من صلاحية الأدمن.');
    } finally {
      setQuickSaving(false);
    }
  };

  const handleNavigationStateChange = (navState) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setCurrentUrl(navState.url);
    setLoading(navState.loading);
  };

  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    setError(nativeEvent.description || 'حدث خطأ في التحميل');
    setLoading(false);
  };

  const handleRefresh = () => {
    setError(null);
    setLoading(true);
    webViewRef.current?.reload();
  };

  const goBack = () => {
    if (canGoBack) {
      webViewRef.current?.goBack();
    }
  };

  const goForward = () => {
    if (canGoForward) {
      webViewRef.current?.goForward();
    }
  };

  // JavaScript to inject for better mobile experience
  const injectedJavaScript = `
    (function() {
      // Add meta viewport for mobile
      var meta = document.querySelector('meta[name="viewport"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1, maximum-scale=1';
        document.head.appendChild(meta);
      }
      
      // Style adjustments for better mobile view
      document.body.style.fontSize = '16px';
      
      true;
    })();
  `;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />
      
      {/* Header */}
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
          <Ionicons name="close" size={24} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Ionicons name="shield-checkmark" size={18} color="#60a5fa" />
          <Text style={styles.headerTitle}>لوحة تحكم الأدمن</Text>
        </View>
        
        <TouchableOpacity onPress={handleRefresh} style={styles.headerBtn}>
          <Ionicons name="refresh" size={22} color="#60a5fa" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Quick Admin Controls */}
      <View style={styles.quickCard}>
        <View style={styles.quickHeader}>
          <Text style={styles.quickTitle}>إعدادات مدير سريعة</Text>
          <TouchableOpacity onPress={loadQuickSettings} style={styles.quickReloadBtn} disabled={quickLoading || quickSaving}>
            {quickLoading ? (
              <ActivityIndicator size="small" color="#93c5fd" />
            ) : (
              <Ionicons name="refresh" size={16} color="#93c5fd" />
            )}
          </TouchableOpacity>
        </View>
        {quickError ? (
          <Text style={styles.quickErrorText}>{quickError}</Text>
        ) : (
          <>
            <TouchableOpacity style={styles.quickRow} onPress={() => handleToggleSetting('google_enabled')} disabled={quickSaving}>
              <Text style={styles.quickLabel}>تسجيل Google</Text>
              <Text style={[styles.quickValue, quickSettings.google_enabled ? styles.quickOn : styles.quickOff]}>
                {quickSettings.google_enabled ? 'مفعّل' : 'متوقف'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickRow} onPress={() => handleToggleSetting('apple_enabled')} disabled={quickSaving}>
              <Text style={styles.quickLabel}>تسجيل Apple</Text>
              <Text style={[styles.quickValue, quickSettings.apple_enabled ? styles.quickOn : styles.quickOff]}>
                {quickSettings.apple_enabled ? 'مفعّل' : 'متوقف'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickRow} onPress={() => handleToggleSetting('admob_enabled')} disabled={quickSaving}>
              <Text style={styles.quickLabel}>AdMob المكافآت</Text>
              <Text style={[styles.quickValue, quickSettings.admob_enabled ? styles.quickOn : styles.quickOff]}>
                {quickSettings.admob_enabled ? 'مفعّل' : 'متوقف'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickRow} onPress={() => handleToggleSetting('maintenance_mode')} disabled={quickSaving}>
              <Text style={styles.quickLabel}>وضع الصيانة</Text>
              <Text style={[styles.quickValue, quickSettings.maintenance_mode ? styles.quickWarn : styles.quickOn]}>
                {quickSettings.maintenance_mode ? 'قيد التشغيل' : 'متوقف'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickRow} onPress={() => handleToggleSetting('allow_new_registrations')} disabled={quickSaving}>
              <Text style={styles.quickLabel}>السماح بالتسجيل الجديد</Text>
              <Text style={[styles.quickValue, quickSettings.allow_new_registrations ? styles.quickOn : styles.quickOff]}>
                {quickSettings.allow_new_registrations ? 'نعم' : 'لا'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity 
          onPress={goBack} 
          style={[styles.navBtn, !canGoBack && styles.navBtnDisabled]}
          disabled={!canGoBack}
        >
          <Ionicons name="chevron-back" size={22} color={canGoBack ? '#FFF' : '#444'} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={goForward} 
          style={[styles.navBtn, !canGoForward && styles.navBtnDisabled]}
          disabled={!canGoForward}
        >
          <Ionicons name="chevron-forward" size={22} color={canGoForward ? '#FFF' : '#444'} />
        </TouchableOpacity>
        
        <View style={styles.urlContainer}>
          <Ionicons name="lock-closed" size={12} color="#22c55e" />
          <Text style={styles.urlText} numberOfLines={1}>
            {currentUrl.replace('https://', '').split('/')[0]}
          </Text>
        </View>
      </View>

      {/* WebView */}
      <View style={styles.webViewContainer}>
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="cloud-offline" size={64} color="#ef4444" />
            <Text style={styles.errorTitle}>خطأ في الاتصال</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={handleRefresh}>
              <Ionicons name="refresh" size={18} color="#FFF" />
              <Text style={styles.retryText}>إعادة المحاولة</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            source={{ uri: ADMIN_URL }}
            style={styles.webView}
            onNavigationStateChange={handleNavigationStateChange}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={handleError}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              if (nativeEvent.statusCode >= 400) {
                setError(`HTTP Error: ${nativeEvent.statusCode}`);
              }
            }}
            injectedJavaScript={injectedJavaScript}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            scalesPageToFit={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            allowsFullscreenVideo={true}
            allowsBackForwardNavigationGestures={true}
            sharedCookiesEnabled={true}
            thirdPartyCookiesEnabled={true}
            cacheEnabled={true}
            incognito={false}
            mixedContentMode="compatibility"
            userAgent={Platform.select({
              ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
              android: 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Mobile Safari/537.36',
            })}
          />
        )}
        
        {/* Loading Overlay */}
        {loading && !error && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>جاري التحميل...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  quickCard: {
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.25)',
    backgroundColor: 'rgba(15,23,42,0.72)',
    overflow: 'hidden',
  },
  quickHeader: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.22)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickTitle: {
    color: '#dbeafe',
    fontSize: 13,
    fontWeight: '700',
  },
  quickReloadBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(59,130,246,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickErrorText: {
    color: '#fca5a5',
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  quickRow: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(148,163,184,0.14)',
  },
  quickLabel: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
  quickValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  quickOn: { color: '#22c55e' },
  quickOff: { color: '#ef4444' },
  quickWarn: { color: '#f59e0b' },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(17,17,24,0.9)',
    gap: 8,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBtnDisabled: {
    opacity: 0.5,
  },
  urlContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  urlText: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,15,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default AdminWebViewScreen;
