import React, { useEffect, useState } from 'react';
import { ArrowLeft, Moon, Sun, Monitor, Globe, Shield, Bell, Palette, ChevronRight, Check, Lock, LockOpen } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const SettingsPage = ({ onBack, onNavigate, user, onUpdateProfile }) => {
  const { t, isRTL, language, setLanguage } = useLanguage();
  const { theme, setThemeMode, isDark } = useTheme();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [isPrivate, setIsPrivate] = useState(Boolean(user?.is_private));
  const [privacyBusy, setPrivacyBusy] = useState(false);

  useEffect(() => {
    setIsPrivate(Boolean(user?.is_private));
  }, [user?.is_private]);

  const togglePrivacy = async () => {
    if (privacyBusy) return;
    const userId = user?.id || user?._id;
    if (!userId) {
      toast.error(isRTL ? 'يجب تسجيل الدخول' : 'Sign in required');
      return;
    }
    const next = !isPrivate;
    setPrivacyBusy(true);
    try {
      const r = await fetch(`${API_URL}/api/users/privacy/${encodeURIComponent(userId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_private: next }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.detail || (isRTL ? 'فشلت العملية' : 'Operation failed'));
      setIsPrivate(next);
      if (onUpdateProfile) onUpdateProfile({ is_private: next });
      toast.success(
        next
          ? (isRTL ? 'تم تفعيل الحساب الخاص. مقاطعك ستكون مرئية للمتابعين فقط.' : 'Private account enabled.')
          : (isRTL ? 'الحساب عام الآن.' : 'Account is now public.'),
      );
    } catch (e) {
      toast.error(String(e?.message || e));
    } finally {
      setPrivacyBusy(false);
    }
  };

  const languages = [
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'ur', name: 'اردو', flag: '🇵🇰' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  ];

  const themes = [
    { id: 'dark', name: isRTL ? 'داكن' : 'Dark', icon: Moon },
    { id: 'light', name: isRTL ? 'فاتح' : 'Light', icon: Sun },
    { id: 'system', name: isRTL ? 'حسب النظام' : 'System', icon: Monitor },
  ];

  const settingsItems = [
    {
      id: 'language',
      icon: Globe,
      label: isRTL ? 'اللغة' : 'Language',
      value: languages.find(l => l.code === language)?.name,
      action: () => setShowLanguageModal(true),
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      id: 'theme',
      icon: Palette,
      label: isRTL ? 'المظهر' : 'Appearance',
      value: themes.find(t => t.id === theme)?.name,
      action: () => setShowThemeModal(true),
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    {
      id: '2fa',
      icon: Shield,
      label: isRTL ? 'التحقق بخطوتين' : 'Two-Factor Auth',
      value: '',
      action: () => onNavigate('2fa'),
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    },
    {
      id: 'notifications',
      icon: Bell,
      label: isRTL ? 'الإشعارات' : 'Notifications',
      value: isRTL ? 'مفعّلة' : 'Enabled',
      action: () => {},
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10'
    },
    {
      id: 'account_privacy',
      icon: isPrivate ? Lock : LockOpen,
      label: isRTL ? 'خصوصية الحساب' : 'Account Privacy',
      value: privacyBusy
        ? (isRTL ? 'جاري...' : 'Updating...')
        : isPrivate
          ? (isRTL ? 'حساب خاص' : 'Private')
          : (isRTL ? 'حساب عام' : 'Public'),
      action: togglePrivacy,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
  ];

  return (
    <div className={`min-h-screen pb-24 ${isDark ? 'bg-[#0a0a0f]' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#3b82f6] to-[#6366f1] px-4 pt-8 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="text-white">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-white text-xl font-bold">{isRTL ? 'الإعدادات' : 'Settings'}</h1>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        <Card className={`${isDark ? 'bg-[#111118]/80 border-white/10' : 'bg-white border-gray-200'} overflow-hidden`}>
          <CardContent className="p-0">
            {settingsItems.map((item, index) => (
              <button
                key={item.id}
                onClick={item.action}
                className={`w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors ${
                  index !== settingsItems.length - 1 ? (isDark ? 'border-b border-white/5' : 'border-b border-gray-100') : ''
                }`}
                data-testid={`settings-${item.id}`}
              >
                <div className={`w-10 h-10 rounded-lg ${item.bgColor} flex items-center justify-center`}>
                  <item.icon className={item.color} size={20} />
                </div>
                <div className="flex-1 text-left">
                  <span className={isDark ? 'text-white' : 'text-gray-900'}>{item.label}</span>
                  {item.value && (
                    <span className={`block text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.value}</span>
                  )}
                </div>
                <ChevronRight className={isDark ? 'text-gray-600' : 'text-gray-400'} size={20} />
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Language Modal */}
      <Dialog open={showLanguageModal} onOpenChange={setShowLanguageModal}>
        <DialogContent className={`${isDark ? 'bg-[#111118] border-white/10' : 'bg-white'} text-${isDark ? 'white' : 'gray-900'}`}>
          <DialogHeader>
            <DialogTitle>{isRTL ? 'اختر اللغة' : 'Select Language'}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setShowLanguageModal(false);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  language === lang.code 
                    ? 'bg-[#3b82f6]/20 border border-[#3b82f6]/30' 
                    : isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'
                }`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <span className={`flex-1 text-left ${isDark ? 'text-white' : 'text-gray-900'}`}>{lang.name}</span>
                {language === lang.code && <Check className="text-[#3b82f6]" size={20} />}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Theme Modal */}
      <Dialog open={showThemeModal} onOpenChange={setShowThemeModal}>
        <DialogContent className={`${isDark ? 'bg-[#111118] border-white/10' : 'bg-white'} text-${isDark ? 'white' : 'gray-900'}`}>
          <DialogHeader>
            <DialogTitle>{isRTL ? 'اختر المظهر' : 'Select Theme'}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            {themes.map((themeOption) => {
              const Icon = themeOption.icon;
              return (
                <button
                  key={themeOption.id}
                  onClick={() => {
                    setThemeMode(themeOption.id);
                    setShowThemeModal(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    theme === themeOption.id 
                      ? 'bg-[#3b82f6]/20 border border-[#3b82f6]/30' 
                      : isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg ${isDark ? 'bg-white/10' : 'bg-gray-100'} flex items-center justify-center`}>
                    <Icon className={isDark ? 'text-white' : 'text-gray-700'} size={20} />
                  </div>
                  <span className={`flex-1 text-left ${isDark ? 'text-white' : 'text-gray-900'}`}>{themeOption.name}</span>
                  {theme === themeOption.id && <Check className="text-[#3b82f6]" size={20} />}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
