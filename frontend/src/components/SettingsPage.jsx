import React, { useEffect, useState } from 'react';
import { ArrowLeft, Moon, Sun, Monitor, Globe, Shield, Bell, Palette, ChevronRight, ChevronLeft, Check, Lock, LockOpen, Share2, Eye, EyeOff, Copy, Wallet, History, HelpCircle, FileText, LogOut, KeyRound, Gift, Trophy, Flame } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const SettingsPage = ({ onBack, onNavigate, user, onUpdateProfile, onLogout }) => {
  const { t, isRTL, language, setLanguage } = useLanguage();
  const { theme, setThemeMode, isDark } = useTheme();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [isPrivate, setIsPrivate] = useState(Boolean(user?.is_private));
  const [privacyBusy, setPrivacyBusy] = useState(false);
  const [showReferralCode, setShowReferralCode] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

  const watchedAdsCount = user?.watchedAds?.length || user?.watched_ads?.length || 0;
  const totalEarned = user?.totalEarned || user?.total_earned || 0;
  const isGuest = user?.isGuest || false;
  const userId = user?.id || user?._id || '123456';
  const referralCode = user?.referral_code || ('SAQR' + userId.slice(-6).toUpperCase());

  const handleShareReferral = async () => {
    const shareData = {
      title: 'تطبيق صقر',
      text: isRTL
        ? `جرب تطبيق صقر واكسب المال من مشاهدة الإعلانات! استخدم كود الإحالة: ${referralCode}`
        : `Try Saqr app and earn from watching ads! Referral code: ${referralCode}`,
      url: window.location.origin,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (_) { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(shareData.text);
      toast.success(isRTL ? 'تم نسخ رابط المشاركة' : 'Share link copied');
    }
  };

  const handleShareApp = async () => {
    const shareData = {
      title: 'تطبيق صقر',
      text: isRTL
        ? 'جرب تطبيق صقر واكسب المال من مشاهدة الإعلانات!'
        : 'Try Saqr — earn from watching ads!',
      url: window.location.origin,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (_) { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(shareData.text);
      toast.success(isRTL ? 'تم نسخ الرابط' : 'Link copied');
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast.error(isRTL ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast.error(isRTL ? 'كلمة المرور الجديدة غير متطابقة' : 'New passwords do not match');
      return;
    }
    if (passwords.new.length < 8) {
      toast.error(isRTL ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters');
      return;
    }
    setPasswordBusy(true);
    try {
      const token = localStorage.getItem('saqr_token');
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          current_password: passwords.current,
          new_password: passwords.new,
        }),
      });
      if (response.ok) {
        toast.success(isRTL ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed');
        setShowChangePassword(false);
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error(data.detail || (isRTL ? 'فشل في تغيير كلمة المرور' : 'Failed to change password'));
      }
    } catch (_) {
      toast.error(isRTL ? 'حدث خطأ في الاتصال' : 'Connection error');
    } finally {
      setPasswordBusy(false);
    }
  };

  const menuGroups = [
    {
      id: 'wallet',
      title: isRTL ? 'المحفظة والأرباح' : 'Wallet & Earnings',
      items: [
        { id: 'withdraw', icon: Wallet, label: t('withdrawBalance'), action: () => onNavigate && onNavigate('withdraw'), color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
        { id: 'history', icon: History, label: t('transactionHistory'), action: () => setShowHistory(true), color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
      ],
    },
    {
      id: 'gifts',
      title: isRTL ? 'الهدايا والترند' : 'Gifts & Trending',
      items: [
        { id: 'gift_inbox', icon: Gift, label: isRTL ? 'هداياي' : 'My Gifts', action: () => onNavigate && onNavigate('gift-inbox'), color: 'text-pink-400', bgColor: 'bg-pink-500/10' },
        { id: 'top_gifters', icon: Trophy, label: isRTL ? 'لوحة أفضل الداعمين' : 'Top Gifters', action: () => onNavigate && onNavigate('top-gifters'), color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
        { id: 'trending_today', icon: Flame, label: isRTL ? 'ترند اليوم' : 'Trending Today', action: () => onNavigate && onNavigate('trending-today'), color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
      ],
    },
    {
      id: 'account',
      title: isRTL ? 'الحساب' : 'Account',
      items: [
        { id: 'password', icon: KeyRound, label: t('changePassword'), action: () => setShowChangePassword(true), color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
        { id: 'share', icon: Share2, label: t('shareApp'), action: handleShareApp, color: 'text-pink-400', bgColor: 'bg-pink-500/10' },
      ],
    },
    {
      id: 'help',
      title: isRTL ? 'المساعدة والقانونية' : 'Help & Legal',
      items: [
        { id: 'support', icon: HelpCircle, label: t('helpSupport'), action: () => window.open('/support', '_self'), color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
        { id: 'privacy', icon: Shield, label: t('privacyPolicy'), action: () => window.open('/privacy', '_blank'), color: 'text-indigo-400', bgColor: 'bg-indigo-500/10' },
        { id: 'terms', icon: FileText, label: t('termsConditions'), action: () => window.open('/terms', '_blank'), color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
      ],
    },
  ];

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
        {/* Referral Code Card — moved from Profile */}
        {!user?.isGuest && (
          <Card className={`shadow-xl border ${isDark ? 'border-pink-500/20 bg-gradient-to-br from-[#1a1024]/80 via-[#111118]/80 to-[#0f1a24]/80' : 'border-pink-200 bg-white'} backdrop-blur-xl overflow-hidden`} data-testid="settings-referral-card">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500/30 to-rose-500/20 flex items-center justify-center">
                    <Share2 className="text-pink-400" size={17} />
                  </div>
                  <div>
                    <p className={`font-semibold text-sm leading-tight ${isDark ? 'text-pink-400' : 'text-pink-600'}`}>
                      {isRTL ? 'كود الإحالة' : 'Referral Code'}
                    </p>
                    <p className={`text-[11px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {isRTL ? 'اربح 50 نقطة عن كل صديق يسجل' : 'Earn 50 points per signup'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReferralCode((v) => !v)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'}`}
                  title={showReferralCode ? (isRTL ? 'إخفاء' : 'Hide') : (isRTL ? 'إظهار' : 'Show')}
                  data-testid="toggle-referral-visibility"
                >
                  {showReferralCode ? (
                    <EyeOff className={isDark ? 'text-gray-400' : 'text-gray-600'} size={15} />
                  ) : (
                    <Eye className={isDark ? 'text-gray-400' : 'text-gray-600'} size={15} />
                  )}
                </button>
              </div>

              <div className={`rounded-xl px-4 py-3 flex items-center justify-between border ${isDark ? 'bg-black/40 border-white/5' : 'bg-gray-50 border-gray-200'}`}>
                <span
                  className={`font-bold text-base tracking-[0.3em] ${isDark ? 'text-white' : 'text-gray-900'} ${showReferralCode ? '' : 'select-none'}`}
                  data-testid="referral-code-display"
                >
                  {showReferralCode ? referralCode : 'SAQR••••••'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(referralCode);
                      toast.success(isRTL ? 'تم نسخ الكود' : 'Code copied');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-500 text-xs font-semibold flex items-center gap-1 transition-colors"
                    data-testid="copy-referral-btn"
                  >
                    <Copy size={12} />
                    {isRTL ? 'نسخ' : 'Copy'}
                  </button>
                  <button
                    type="button"
                    onClick={handleShareReferral}
                    className="px-2.5 py-1.5 rounded-lg bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-pink-500 text-xs font-semibold flex items-center gap-1 transition-colors"
                    data-testid="share-referral-btn"
                  >
                    <Share2 size={12} />
                    {isRTL ? 'مشاركة' : 'Share'}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Menu Groups — moved from Profile (Wallet / Account / Help & Legal) */}
        {!isGuest && menuGroups.map((group) => {
          const ArrowIcon = isRTL ? ChevronLeft : ChevronRight;
          return (
            <div key={group.id} className="space-y-2">
              <p className={`text-[11px] font-semibold uppercase tracking-wider px-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                {group.title}
              </p>
              <Card className={`shadow-xl border overflow-hidden ${isDark ? 'border-white/8 bg-[#111118]/80' : 'border-gray-200 bg-white'} backdrop-blur-xl`}>
                <CardContent className="p-0">
                  {group.items.map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={item.action}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors ${isDark ? 'hover:bg-white/5 active:bg-white/8' : 'hover:bg-gray-50 active:bg-gray-100'} ${
                        idx !== group.items.length - 1 ? (isDark ? 'border-b border-white/5' : 'border-b border-gray-100') : ''
                      }`}
                      data-testid={`menu-${item.id}`}
                    >
                      <div className={`w-9 h-9 rounded-lg ${item.bgColor} flex items-center justify-center flex-shrink-0`}>
                        <item.icon className={item.color} size={18} />
                      </div>
                      <span className={`text-sm flex-1 text-start ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.label}</span>
                      <ArrowIcon className={isDark ? 'text-gray-600' : 'text-gray-400'} size={16} />
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>
          );
        })}

        {/* Logout — Standalone prominent button */}
        {!isGuest && onLogout && (
          <Card className="shadow-xl border border-red-500/20 bg-red-500/5 backdrop-blur-xl overflow-hidden">
            <CardContent className="p-0">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-500/15 active:bg-red-500/20 transition-colors"
                data-testid="settings-logout-btn"
              >
                <div className="w-9 h-9 rounded-lg bg-red-500/15 flex items-center justify-center flex-shrink-0">
                  <LogOut className="text-red-400" size={18} />
                </div>
                <span className="text-red-400 text-sm font-semibold flex-1 text-start">
                  {isRTL ? 'تسجيل الخروج' : 'Logout'}
                </span>
              </button>
            </CardContent>
          </Card>
        )}

        {/* Version Footer */}
        <div className="flex flex-col items-center gap-1 py-6">
          <div className="flex items-center gap-1.5">
            <div className={`w-1 h-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
            <p className={`text-[11px] font-medium ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>
              {isRTL ? 'الإصدار 4.8.1' : 'Version 4.8.1'}
            </p>
            <div className={`w-1 h-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
          </div>
          <p className={`text-[10px] ${isDark ? 'text-gray-700' : 'text-gray-400'}`}>
            {isRTL ? 'صُنع بحب لمستخدمي صقر' : 'Made with care for Saqr users'}
          </p>
        </div>
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

      {/* Change Password Dialog */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="bg-[#111118] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="text-purple-400" size={20} />
              {isRTL ? 'تغيير كلمة المرور' : 'Change Password'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {isRTL ? 'أدخل كلمة المرور الحالية والجديدة' : 'Enter current and new password'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current" className="text-gray-300">{isRTL ? 'كلمة المرور الحالية' : 'Current Password'}</Label>
              <Input id="current" type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} className="bg-white/5 border-white/10 text-white" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new" className="text-gray-300">{isRTL ? 'كلمة المرور الجديدة' : 'New Password'}</Label>
              <Input id="new" type="password" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} className="bg-white/5 border-white/10 text-white" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-gray-300">{isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}</Label>
              <Input id="confirm" type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} className="bg-white/5 border-white/10 text-white" placeholder="••••••••" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangePassword(false)} className="border-white/10 text-gray-300 hover:bg-white/5">
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleChangePassword} disabled={passwordBusy} className="bg-purple-600 hover:bg-purple-700">
              {passwordBusy ? (isRTL ? 'جاري التغيير...' : 'Changing...') : (isRTL ? 'تغيير' : 'Change')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="bg-[#111118] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="text-blue-400" size={20} />
              {isRTL ? 'سجل المعاملات' : 'Transaction History'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-sm">{isRTL ? 'إجمالي الإعلانات' : 'Total Ads Watched'}</span>
                <span className="text-white font-bold">{watchedAdsCount}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-sm">{isRTL ? 'إجمالي النقاط المكتسبة' : 'Total Points Earned'}</span>
                <span className="text-white font-bold">{totalEarned}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">{isRTL ? 'الرصيد الحالي' : 'Current Balance'}</span>
                <span className="text-[#60a5fa] font-bold">{user?.points || 0}</span>
              </div>
            </div>
            <p className="text-center text-gray-500 text-sm">
              {isRTL ? 'لا توجد عمليات سحب سابقة' : 'No withdrawal history yet'}
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowHistory(false)} className="w-full bg-blue-600 hover:bg-blue-700">
              {isRTL ? 'إغلاق' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
