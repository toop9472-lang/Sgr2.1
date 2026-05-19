// Saqr Home — Web (mirrors the new mobile HomeScreen design exactly).
// Two distinct themes the user can toggle with one tap:
//   - "luxuryDark"   black + gold, premium feel
//   - "brightModern" white + blue, calm classic feel
import React, { useEffect, useMemo, useState } from 'react';
import {
  Diamond,
  Film,
  PlayCircle,
  MessageCircle,
  Users,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

const themes = {
  luxuryDark: {
    id: 'luxuryDark',
    bg: 'bg-gradient-to-b from-[#06070d] via-[#0a0b14] to-[#0d0d1a]',
    surface: 'bg-[#11121b]',
    border: 'border-yellow-400/10',
    text: 'text-white',
    textMuted: 'text-gray-400',
    accent: 'text-yellow-400',
    accentBg: 'bg-yellow-400/12',
    accentBorder: 'border-yellow-400/20',
    label: 'فاخر',
    labelEn: 'Luxury',
    icon: Moon,
  },
  brightModern: {
    id: 'brightModern',
    bg: 'bg-gradient-to-b from-[#f4f6fb] via-[#eaf0fa] to-[#dfe8f5]',
    surface: 'bg-white shadow-sm',
    border: 'border-blue-500/15',
    text: 'text-slate-900',
    textMuted: 'text-slate-500',
    accent: 'text-blue-500',
    accentBg: 'bg-blue-500/10',
    accentBorder: 'border-blue-500/25',
    label: 'كلاسيك',
    labelEn: 'Classic',
    icon: Sun,
  },
};

const Pill = ({ icon: Icon, label, accent, bg, textColor }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${bg}`}>
    <Icon size={11} className={accent} />
    <span className={`text-[11px] font-bold ${textColor}`}>{label}</span>
  </span>
);

const StatCard = ({ icon: Icon, value, label, theme }) => (
  <div
    className={`flex-1 flex flex-col items-center py-2.5 px-2 rounded-2xl border ${theme.surface} ${theme.border}`}
  >
    <div
      className={`w-7 h-7 rounded-lg border flex items-center justify-center mb-1.5 ${theme.accentBg} ${theme.accentBorder}`}
    >
      <Icon size={14} className={theme.accent} />
    </div>
    <span className={`text-sm font-extrabold ${theme.text}`}>{value}</span>
    <span className={`text-[10px] mt-0.5 ${theme.textMuted}`}>{label}</span>
  </div>
);

const ActionRow = ({ icon: Icon, title, subtitle, theme, onPress, badge, isRTL }) => {
  const Chev = isRTL ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={onPress}
      className={`w-full flex items-center gap-3 py-3 px-3.5 mx-4 mb-2 rounded-2xl border transition-all hover:scale-[1.01] active:scale-[0.99] ${theme.surface} ${theme.border}`}
      data-testid={`home-action-${title}`}
    >
      <div
        className={`w-10 h-10 rounded-xl border flex items-center justify-center ${theme.accentBg} ${theme.accentBorder}`}
      >
        <Icon size={20} className={theme.accent} />
      </div>
      <div className="flex-1 text-right min-w-0">
        <div className="flex items-center gap-1.5 justify-end">
          {badge && (
            <span
              className={`px-1.5 py-0.5 rounded-md border text-[10px] font-bold ${theme.accentBg} ${theme.accentBorder} ${theme.accent}`}
            >
              {badge}
            </span>
          )}
          <span className={`text-sm font-bold ${theme.text} truncate`}>{title}</span>
        </div>
        <div className={`text-[11px] mt-0.5 ${theme.textMuted} truncate`}>{subtitle}</div>
      </div>
      <Chev size={16} className={`${theme.textMuted} opacity-50`} />
    </button>
  );
};

const HomePage = ({
  user,
  homePreset,
  onHomePresetChange,
  onNavigateToAds,
  onNavigateToClips,
  onNavigateToChat,
  onNavigateToFortunes,
  onNavigateToFriends,
  onRefresh,
}) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const theme = themes[homePreset === 'brightModern' ? 'brightModern' : 'luxuryDark'];
  const otherTheme = themes[theme.id === 'luxuryDark' ? 'brightModern' : 'luxuryDark'];
  const [fadeKey, setFadeKey] = useState(0);

  useEffect(() => {
    setFadeKey((k) => k + 1);
  }, [theme.id]);

  useEffect(() => {
    if (onRefresh) onRefresh();
  }, []);

  const copy = useMemo(
    () => ({
      welcomePrefix: isArabic ? 'أهلاً' : 'Welcome',
      welcomeSub: isArabic
        ? 'ابدأ يومك بمشاهدة إعلانات واكتساب جواهر صقر'
        : 'Watch ads & earn Saqr gems',
      defaultPlayer: isArabic ? 'لاعب' : 'Player',
      gems: isArabic ? 'جوهرة' : 'Gems',
      reels: isArabic ? 'ريلز' : 'Reels',
      friends: isArabic ? 'أصدقاء' : 'Friends',
      today: isArabic ? 'اليوم' : 'Today',
      balanceLine: isArabic ? 'رصيدك الحالي • يُحدّث تلقائياً' : 'Auto-synced balance',
      sectionExplore: isArabic ? 'استكشف' : 'EXPLORE',
      sectionEarn: isArabic ? 'اكسب جواهر' : 'EARN',
      sectionConnect: isArabic ? 'تواصل' : 'CONNECT',
      adsTitle: isArabic ? 'شاهد وأكسب' : 'Watch & Earn',
      adsSub: isArabic ? 'إعلانات قصيرة = جواهر فورية' : 'Short ads = instant gems',
      reelsTitle: isArabic ? 'ريلز المجتمع' : 'Community Reels',
      reelsSub: isArabic ? '15 ثانية لكل مقطع' : '15 seconds each',
      fortunesTitle: isArabic ? 'ثروات صقر' : 'Saqr Fortunes',
      fortunesSub: isArabic ? '500 جوهرة = 3 ﷼' : '500 gems = 3 SAR',
      chatTitle: isArabic ? 'الدردشة العامة' : 'Global Chat',
      chatSub: isArabic ? 'مجانية بالكامل' : 'Always free',
      friendsTitle: isArabic ? 'الأصدقاء' : 'Friends',
      friendsSub: isArabic ? 'أضف وتواصل' : 'Add & connect',
      free: isArabic ? 'مجاني' : 'Free',
      new: isArabic ? 'جديد' : 'New',
      footer: isArabic ? 'صقر — اكسب من مشاهداتك اليومية' : 'Saqr — earn from your daily views',
    }),
    [isArabic],
  );

  const handleToggleTheme = () => {
    const next = theme.id === 'luxuryDark' ? 'brightModern' : 'luxuryDark';
    onHomePresetChange && onHomePresetChange(next);
  };

  const userName = user?.name || copy.defaultPlayer;
  const gemsValue = Number(user?.saqr_gems ?? user?.saqr_points ?? user?.points ?? 0) || 0;

  return (
    <div className={`min-h-screen ${theme.bg} pb-28`} key={fadeKey}>
      <div className="animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-5 pb-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <LanguageSwitcher />
            <div className="flex-1 min-w-0">
              <h1 className={`text-base font-extrabold truncate ${theme.text} text-right`}>
                {copy.welcomePrefix} {userName}
              </h1>
              <p className={`text-[11px] ${theme.textMuted} truncate text-right mt-0.5`}>
                {copy.welcomeSub}
              </p>
            </div>
          </div>

          {/* Theme toggle */}
          <button
            onClick={handleToggleTheme}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border ${theme.surface} ${theme.border}`}
            data-testid="home-theme-toggle"
          >
            <theme.icon size={13} className={theme.accent} />
            <span className={`text-[11px] font-bold ${theme.text}`}>
              {isArabic ? theme.label : theme.labelEn}
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${otherTheme.accent.replace('text-', 'bg-')}`}
            />
          </button>
        </div>

        {/* Hero balance */}
        <div className={`mx-4 mb-5 p-4 rounded-3xl border ${theme.surface} ${theme.border} shadow-2xl`}>
          <div className="flex items-center justify-between mb-1">
            <Pill
              icon={Diamond}
              label={copy.gems}
              accent={theme.accent}
              bg={theme.accentBg}
              textColor={theme.text}
            />
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className={`text-4xl font-black text-right mt-1 tracking-tight ${theme.text}`}>
            {gemsValue.toLocaleString('en-US')}
          </div>
          <p className={`text-[11px] text-right ${theme.textMuted}`}>{copy.balanceLine}</p>

          {/* Mini stats */}
          <div className="flex gap-2 mt-3.5">
            <StatCard icon={Film} value={user?.clips_count || 0} label={copy.reels} theme={theme} />
            <StatCard
              icon={Users}
              value={user?.friends_count || 0}
              label={copy.friends}
              theme={theme}
            />
            <StatCard
              icon={PlayCircle}
              value={user?.watched_ads_today || 0}
              label={copy.today}
              theme={theme}
            />
          </div>
        </div>

        {/* Earn */}
        <p
          className={`text-[11px] font-bold tracking-widest px-5 mt-2 mb-2 ${theme.textMuted} text-right`}
        >
          {copy.sectionEarn}
        </p>
        <ActionRow
          icon={PlayCircle}
          title={copy.adsTitle}
          subtitle={copy.adsSub}
          theme={theme}
          onPress={onNavigateToAds}
          isRTL={isArabic}
        />
        <ActionRow
          icon={Diamond}
          title={copy.fortunesTitle}
          subtitle={copy.fortunesSub}
          theme={theme}
          onPress={onNavigateToFortunes}
          badge={copy.new}
          isRTL={isArabic}
        />

        {/* Explore */}
        <p
          className={`text-[11px] font-bold tracking-widest px-5 mt-3 mb-2 ${theme.textMuted} text-right`}
        >
          {copy.sectionExplore}
        </p>
        <ActionRow
          icon={Film}
          title={copy.reelsTitle}
          subtitle={copy.reelsSub}
          theme={theme}
          onPress={onNavigateToClips}
          isRTL={isArabic}
        />

        {/* Connect */}
        <p
          className={`text-[11px] font-bold tracking-widest px-5 mt-3 mb-2 ${theme.textMuted} text-right`}
        >
          {copy.sectionConnect}
        </p>
        <ActionRow
          icon={MessageCircle}
          title={copy.chatTitle}
          subtitle={copy.chatSub}
          theme={theme}
          onPress={onNavigateToChat}
          badge={copy.free}
          isRTL={isArabic}
        />
        <ActionRow
          icon={Users}
          title={copy.friendsTitle}
          subtitle={copy.friendsSub}
          theme={theme}
          onPress={onNavigateToFriends}
          isRTL={isArabic}
        />

        {/* Footer */}
        <div className="flex items-center justify-center gap-1.5 mt-6 px-4">
          <span className="w-1 h-1 rounded-full bg-emerald-400" />
          <p className={`text-[10px] ${theme.textMuted}`}>{copy.footer}</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
