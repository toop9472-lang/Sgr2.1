import React, { useEffect, useState } from 'react';
import { User, Award, TrendingUp, Clock, LogOut, Lock, History, Share2, Shield, MessageCircle, LockKeyhole, Settings, Wallet, HelpCircle, FileText, ChevronLeft, ChevronRight, Film, Play, Heart, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Progress } from './ui/progress';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const ProfilePage = ({ user, onLogout, onNavigate }) => {
  const { t, isRTL, language } = useLanguage();
  const { isDark } = useTheme();
  const pointsToNextDollar = 500 - (user.points % 500);
  const progressToNextDollar = ((user.points % 500) / 500) * 100;
  const isGuest = user?.isGuest || false;
  
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [myClips, setMyClips] = useState([]);
  const [myClipsLoading, setMyClipsLoading] = useState(false);

  // Load user's own reels — shown inline on the profile page
  useEffect(() => {
    const uid = user?.id || user?._id;
    if (!uid || isGuest) return;
    let cancelled = false;
    (async () => {
      try {
        setMyClipsLoading(true);
        const r = await fetch(
          `${API_URL}/api/users/clips/${encodeURIComponent(uid)}?viewer_id=${encodeURIComponent(uid)}&limit=60`,
          { credentials: 'include' },
        );
        if (!r.ok) return;
        const d = await r.json().catch(() => ({}));
        if (!cancelled) {
          setMyClips(Array.isArray(d?.clips) ? d.clips : []);
        }
      } catch (_) {
        // silent
      } finally {
        if (!cancelled) setMyClipsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, user?._id, isGuest]);

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

    setIsLoading(true);
    try {
      const token = localStorage.getItem('saqr_token');
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: passwords.current,
          new_password: passwords.new
        })
      });

      if (response.ok) {
        toast.success(isRTL ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully');
        setShowChangePassword(false);
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        const data = await response.json();
        toast.error(data.detail || (isRTL ? 'فشل في تغيير كلمة المرور' : 'Failed to change password'));
      }
    } catch (error) {
      toast.error(isRTL ? 'حدث خطأ في الاتصال' : 'Connection error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'تطبيق صقر',
      text: isRTL 
        ? `جرب تطبيق صقر واكسب المال من مشاهدة الإعلانات! استخدم كود الإحالة: SAQR${user?.id?.slice(-6) || '123456'}`
        : `Try Saqr app and earn money from watching ads! Use referral code: SAQR${user?.id?.slice(-6) || '123456'}`,
      url: window.location.origin
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(shareData.text);
      toast.success(isRTL ? 'تم نسخ رابط المشاركة' : 'Share link copied');
    }
  };

  const menuGroups = [
    {
      id: 'wallet',
      title: isRTL ? 'المحفظة والأرباح' : 'Wallet & Earnings',
      items: [
        { id: 'withdraw', icon: Wallet, label: t('withdrawBalance'), action: () => onNavigate('withdraw'), color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
        { id: 'history', icon: History, label: t('transactionHistory'), action: () => setShowHistory(true), color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
      ],
    },
    {
      id: 'account',
      title: isRTL ? 'الحساب' : 'Account',
      items: [
        { id: 'settings', icon: Settings, label: t('settings'), action: () => onNavigate('settings'), color: 'text-slate-300', bgColor: 'bg-slate-500/15' },
        { id: 'password', icon: Lock, label: t('changePassword'), action: () => setShowChangePassword(true), color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
        { id: 'share', icon: Share2, label: t('shareApp'), action: handleShare, color: 'text-pink-400', bgColor: 'bg-pink-500/10' },
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

  // Legacy flat list kept for backward compat (not rendered)
  const menuItems = menuGroups.flatMap((g) => g.items);

  const watchedAds = user?.watchedAds || user?.watched_ads || [];
  const totalEarned = user?.totalEarned || user?.total_earned || 0;
  const referralCode = 'SAQR' + (user?.id?.slice(-6) || '123456').toUpperCase();

  // Theme classes
  const bgClass = isDark ? 'bg-[#0a0a0f]' : 'bg-gray-50';
  const cardClass = isDark ? 'bg-[#111118]/80 border-white/10' : 'bg-white border-gray-200';
  const textClass = isDark ? 'text-white' : 'text-gray-900';

  return (
    <div className={`min-h-screen ${bgClass} pb-20 relative overflow-hidden`}>
      {/* Decorative Blue Circles */}
      {isDark && <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-[#3b82f6]/20 blur-3xl pointer-events-none"></div>}
      {isDark && <div className="absolute bottom-[-150px] right-[-150px] w-[400px] h-[400px] rounded-full bg-[#3b82f6]/15 blur-3xl pointer-events-none"></div>}
      
      {/* Header */}
      <div className="relative z-10 bg-gradient-to-r from-[#3b82f6] to-[#6366f1] px-4 pt-8 pb-24 rounded-b-3xl shadow-lg shadow-[#3b82f6]/20">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-white text-2xl font-bold">{t('profile')}</h1>
          <Button
            onClick={onLogout}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            title={t('logout')}
            data-testid="logout-btn"
          >
            <LogOut size={20} />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Avatar className="w-20 h-20 border-4 border-white/20 shadow-lg">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="bg-[#111118] text-white text-2xl">{user.name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-white text-xl font-bold">{user.name}</h2>
            <p className="text-white/80 text-sm">{user.email}</p>
            {isGuest && (
              <div className="mt-1 bg-[#3b82f6]/30 text-[#60a5fa] px-2 py-1 rounded text-xs flex items-center gap-1">
                <User size={12} />
                {t('guestModeLabel')}
              </div>
            )}
            {!isGuest && user.joined_date && (
              <p className="text-white/60 text-xs mt-1">
                {isRTL ? 'عضو منذ' : 'Member since'} {new Date(user.joined_date || user.joinedDate).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10 px-4 -mt-16 space-y-4">
        {/* Guest Warning */}
        {isGuest && (
          <Card className="shadow-xl border border-[#3b82f6]/30 bg-[#111118]/80 backdrop-blur-xl">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#3b82f6]/20 flex items-center justify-center">
                  <LockKeyhole className="text-[#60a5fa]" size={32} />
                </div>
                <h3 className="font-bold text-lg mb-2 text-white">
                  {isRTL ? 'أنت في وضع الزائر' : "You're in Guest Mode"}
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  {isRTL ? 'سجّل الدخول للحصول على النقاط وكسب المال!' : 'Login to earn points and make money!'}
                </p>
                <Button
                  onClick={onLogout}
                  className="w-full bg-gradient-to-r from-[#3b82f6] to-[#6366f1] hover:from-[#2563eb] hover:to-[#4f46e5] rounded-full"
                  data-testid="guest-login-btn"
                >
                  {isRTL ? 'تسجيل الدخول الآن' : 'Login Now'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Balance Card */}
        {!isGuest && (
          <Card className="shadow-xl border border-white/10 bg-[#111118]/80 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-white">
                <Award className="text-[#60a5fa]" size={24} />
                {isRTL ? 'رصيد النقاط' : 'Points Balance'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className="text-5xl font-bold text-[#60a5fa] mb-2">
                  {user.points}
                </div>
                <p className="text-gray-400">{isRTL ? 'نقطة متاحة' : 'points available'}</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">
                    {isRTL ? 'التقدم نحو $1' : 'Progress to $1'}
                  </span>
                  <span className="text-sm font-bold text-[#60a5fa]">
                    {pointsToNextDollar} {isRTL ? 'نقطة متبقية' : 'points remaining'}
                  </span>
                </div>
                <Progress value={progressToNextDollar} className="h-3" />
              </div>

              <Button
                onClick={() => onNavigate('withdraw')}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-12 shadow-md hover:shadow-lg transition-all"
                disabled={user.points < 500}
                data-testid="withdraw-btn"
              >
                {user.points >= 500 
                  ? (isRTL ? 'استبدال النقاط' : 'Redeem Points')
                  : (isRTL ? `تحتاج ${pointsToNextDollar} نقطة للاستبدال` : `Need ${pointsToNextDollar} more points`)}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        {!isGuest && (
          <div className="grid grid-cols-3 gap-3">
            <Card className="shadow-xl border border-white/10 bg-[#111118]/80 backdrop-blur-xl">
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col items-center text-center">
                  <Award className="text-yellow-400 mb-1" size={20} />
                  <div className="text-xl font-bold text-white">{user.points}</div>
                  <p className="text-[10px] text-gray-400">{isRTL ? 'النقاط' : 'Points'}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl border border-white/10 bg-[#111118]/80 backdrop-blur-xl">
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col items-center text-center">
                  <Clock className="text-blue-400 mb-1" size={20} />
                  <div className="text-xl font-bold text-white">{watchedAds.length}</div>
                  <p className="text-[10px] text-gray-400">{isRTL ? 'إعلانات' : 'Ads'}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl border border-white/10 bg-[#111118]/80 backdrop-blur-xl">
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col items-center text-center">
                  <TrendingUp className="text-green-400 mb-1" size={20} />
                  <div className="text-xl font-bold text-white">${(totalEarned / 500).toFixed(2)}</div>
                  <p className="text-[10px] text-gray-400">{isRTL ? 'الأرباح' : 'Earned'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* My Reels Grid — Inline section on Profile page */}
        {!isGuest && (
          <Card className="shadow-xl border border-white/8 bg-[#111118]/80 backdrop-blur-xl overflow-hidden" data-testid="my-reels-card">
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/30 to-indigo-500/20 flex items-center justify-center">
                    <Film className="text-blue-400" size={17} />
                  </div>
                  <div>
                    <p className="text-blue-400 font-semibold text-sm leading-tight">
                      {isRTL ? 'ريلزاتي' : 'My Reels'}
                    </p>
                    <p className="text-gray-500 text-[11px] mt-0.5">
                      {isRTL
                        ? `${myClips.length} مقطع منشور`
                        : `${myClips.length} clip${myClips.length === 1 ? '' : 's'} posted`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('clips')}
                  className="px-3 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                  data-testid="my-reels-new-btn"
                >
                  <Plus size={13} />
                  {isRTL ? 'جديد' : 'New'}
                </button>
              </div>

              {myClipsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-7 h-7 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
                </div>
              ) : myClips.length === 0 ? (
                <div className="flex flex-col items-center py-10 px-3 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
                    <Film className="text-white/40" size={28} />
                  </div>
                  <p className="text-gray-300 text-sm font-medium mb-1">
                    {isRTL ? 'لم تنشر أي ريلز بعد' : 'No reels yet'}
                  </p>
                  <p className="text-gray-500 text-xs mb-4 max-w-xs">
                    {isRTL
                      ? 'انشر أول ريلز من صفحة المقاطع وسيظهر هنا تلقائياً'
                      : 'Post your first reel from the Clips page and it will appear here.'}
                  </p>
                  <button
                    onClick={() => onNavigate('clips')}
                    className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors"
                    data-testid="my-reels-create-btn"
                  >
                    <Plus size={16} />
                    {isRTL ? 'أنشر ريلز الآن' : 'Create a Reel'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {myClips.map((clip) => {
                    const thumb = clip.thumbnail_url || clip.video_url || '';
                    return (
                      <button
                        key={clip.clip_id}
                        onClick={() => onNavigate('clips')}
                        className="relative aspect-[2/3] bg-slate-800/80 rounded-md overflow-hidden group"
                        data-testid={`my-reel-tile-${clip.clip_id}`}
                      >
                        {thumb ? (
                          <img
                            src={thumb}
                            alt=""
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-700/60">
                            <Play className="text-white/70" size={20} />
                          </div>
                        )}
                        {/* gradient overlay for readability */}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
                        <div className="absolute bottom-1 left-1 flex items-center gap-0.5 bg-black/55 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                          <Heart className="text-rose-400" size={10} fill="currentColor" />
                          <span className="text-white text-[10px] font-semibold">
                            {clip.likes_count || 0}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Menu Groups - Professional Sectioned Layout */}
        {!isGuest && menuGroups.map((group) => {
          const ArrowIcon = isRTL ? ChevronLeft : ChevronRight;
          return (
            <div key={group.id} className="space-y-2">
              <p className="text-gray-500 text-[11px] font-semibold uppercase tracking-wider px-1">
                {group.title}
              </p>
              <Card className="shadow-xl border border-white/8 bg-[#111118]/80 backdrop-blur-xl overflow-hidden">
                <CardContent className="p-0">
                  {group.items.map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={item.action}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 active:bg-white/8 transition-colors ${
                        idx !== group.items.length - 1 ? 'border-b border-white/5' : ''
                      }`}
                      data-testid={`menu-${item.id}`}
                    >
                      <div className={`w-9 h-9 rounded-lg ${item.bgColor} flex items-center justify-center flex-shrink-0`}>
                        <item.icon className={item.color} size={18} />
                      </div>
                      <span className="text-white text-sm flex-1 text-start">{item.label}</span>
                      <ArrowIcon className="text-gray-600" size={16} />
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>
          );
        })}

        {/* Logout - Standalone prominent button */}
        {!isGuest && (
          <Card className="shadow-xl border border-red-500/20 bg-red-500/5 backdrop-blur-xl overflow-hidden">
            <CardContent className="p-0">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-500/15 active:bg-red-500/20 transition-colors"
                data-testid="menu-logout"
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

        {/* Version - Clean centered footer */}
        <div className="flex flex-col items-center gap-1 py-6">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-gray-700" />
            <p className="text-gray-600 text-[11px] font-medium">
              {isRTL ? 'الإصدار 4.8.1' : 'Version 4.8.1'}
            </p>
            <div className="w-1 h-1 rounded-full bg-gray-700" />
          </div>
          <p className="text-gray-700 text-[10px]">
            {isRTL ? 'صُنع بحب لمستخدمي صقر' : 'Made with care for Saqr users'}
          </p>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="bg-[#111118] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="text-purple-400" size={20} />
              {isRTL ? 'تغيير كلمة المرور' : 'Change Password'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {isRTL ? 'أدخل كلمة المرور الحالية والجديدة' : 'Enter your current and new password'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current" className="text-gray-300">
                {isRTL ? 'كلمة المرور الحالية' : 'Current Password'}
              </Label>
              <Input
                id="current"
                type="password"
                value={passwords.current}
                onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
                placeholder="••••••••"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new" className="text-gray-300">
                {isRTL ? 'كلمة المرور الجديدة' : 'New Password'}
              </Label>
              <Input
                id="new"
                type="password"
                value={passwords.new}
                onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
                placeholder="••••••••"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-gray-300">
                {isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
              </Label>
              <Input
                id="confirm"
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowChangePassword(false)}
              className="border-white/10 text-gray-300 hover:bg-white/5"
            >
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? (isRTL ? 'جاري التغيير...' : 'Changing...') : (isRTL ? 'تغيير' : 'Change')}
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
                <span className="text-white font-bold">{watchedAds.length}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-sm">{isRTL ? 'إجمالي النقاط المكتسبة' : 'Total Points Earned'}</span>
                <span className="text-white font-bold">{totalEarned}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">{isRTL ? 'الرصيد الحالي' : 'Current Balance'}</span>
                <span className="text-[#60a5fa] font-bold">{user.points}</span>
              </div>
            </div>
            
            <p className="text-center text-gray-500 text-sm">
              {isRTL ? 'لا توجد عمليات سحب سابقة' : 'No withdrawal history yet'}
            </p>
          </div>
          
          <DialogFooter>
            <Button
              onClick={() => setShowHistory(false)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isRTL ? 'إغلاق' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePage;
