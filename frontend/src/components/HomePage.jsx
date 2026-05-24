// Saqr Home — Web Preview of the new "world-class" Home design.
// Cards where the icon IS the full image (large hero tiles + image-rich rows).
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Moon, Sun, Diamond } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

const APP_BG_URL =
  'https://static.prod-images.emergentagent.com/jobs/40eca190-5242-4463-8c95-bc5f66df29cb/images/e35d59ccd161791b6e9cbecdfa426302685267afa2c8e806fa233976816403de.png';

const HOME_ICONS = {
  watch: '/home_icons/watch_earn.png',
  fortunes: '/home_icons/fortunes.png',
  reels: '/home_icons/reels.png',
  chat: '/home_icons/chat.png',
  friends: '/home_icons/friends.png',
  brand: '/home_icons/home.png',
};

const themes = {
  luxuryDark: {
    id: 'luxuryDark',
    pageBg: 'bg-[#06070d]',
    surface: 'bg-[#11121b]/85 backdrop-blur-md',
    border: 'border-yellow-400/15',
    text: 'text-white',
    textMuted: 'text-slate-400',
    accent: 'text-yellow-400',
    accentBg: 'bg-yellow-400/12',
    accentBorder: 'border-yellow-400/25',
    label: 'فاخر',
    labelEn: 'Luxury',
    icon: Moon,
  },
  brightModern: {
    id: 'brightModern',
    pageBg: 'bg-[#f4f6fb]',
    surface: 'bg-white/85 backdrop-blur-md shadow-sm',
    border: 'border-blue-500/15',
    text: 'text-slate-900',
    textMuted: 'text-slate-600',
    accent: 'text-blue-500',
    accentBg: 'bg-blue-500/10',
    accentBorder: 'border-blue-500/25',
    label: 'كلاسيك',
    labelEn: 'Classic',
    icon: Sun,
  },
};

/* -------- Big hero tile: image takes the full card -------- */
const HeroTile = ({ image, title, subtitle, badge, onClick, isRTL, accent }) => {
  const Chev = isRTL ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={onClick}
      data-testid={`home-tile-${title}`}
      className="group relative w-full overflow-hidden rounded-3xl border border-white/10 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] hover:scale-[1.01] active:scale-[0.99] transition-transform"
      style={{ aspectRatio: '16 / 9' }}
    >
      <img
        src={image}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Soft gradient overlay so text is always legible regardless of theme */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      {badge && (
        <span
          className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} px-2.5 py-1 rounded-full text-[10px] font-extrabold border border-white/30 bg-black/40 text-white backdrop-blur-sm`}
        >
          {badge}
        </span>
      )}
      <div className={`absolute inset-x-0 bottom-0 p-4 ${isRTL ? 'text-right' : 'text-left'}`}>
        <h3 className="text-white text-lg font-extrabold drop-shadow-lg">{title}</h3>
        <p className="text-white/85 text-[12px] mt-0.5 drop-shadow">{subtitle}</p>
        <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-white/95 font-bold">
          <span className={accent}>●</span>
          <span>{isRTL ? 'افتح' : 'Open'}</span>
          <Chev size={14} />
        </div>
      </div>
    </button>
  );
};

/* -------- Mid tile: square image card, image fills entire square -------- */
const SquareTile = ({ image, title, subtitle, onClick, isRTL }) => (
  <button
    onClick={onClick}
    data-testid={`home-square-${title}`}
    className="relative w-full overflow-hidden rounded-3xl border border-white/10 shadow-[0_14px_40px_-18px_rgba(0,0,0,0.6)] hover:scale-[1.01] active:scale-[0.99] transition-transform"
    style={{ aspectRatio: '1 / 1' }}
  >
    <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
    <div className={`absolute inset-x-0 bottom-0 p-3 ${isRTL ? 'text-right' : 'text-left'}`}>
      <p className="text-white text-sm font-extrabold drop-shadow-lg leading-tight">{title}</p>
      <p className="text-white/80 text-[10px] mt-0.5 drop-shadow">{subtitle}</p>
    </div>
  </button>
);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copy = useMemo(
    () => ({
      welcomePrefix: isArabic ? 'أهلاً' : 'Welcome',
      welcomeSub: isArabic
        ? 'شاهد، اربح، شارك — كل شيء في صقر'
        : 'Watch, earn, share — all in Saqr',
      defaultPlayer: isArabic ? 'لاعب' : 'Player',
      gems: isArabic ? 'جوهرة' : 'Gems',
      balanceLine: isArabic ? 'رصيدك الحالي • يُحدّث تلقائياً' : 'Auto-synced balance',
      sectionFeatured: isArabic ? 'مميز' : 'FEATURED',
      sectionEarn: isArabic ? 'اكسب جواهر' : 'EARN GEMS',
      sectionExplore: isArabic ? 'استكشف' : 'EXPLORE',
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
      hot: isArabic ? 'الأكثر رواجاً' : 'Hot',
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
    <div
      key={fadeKey}
      className={`min-h-screen pb-28 ${theme.pageBg} bg-cover bg-center bg-no-repeat bg-fixed`}
      style={{ backgroundImage: `url(${APP_BG_URL})` }}
    >
      {/* Subtle dark overlay so cards/text always read well on top of the artwork */}
      <div
        className={
          theme.id === 'luxuryDark'
            ? 'min-h-screen bg-gradient-to-b from-black/55 via-black/40 to-black/55'
            : 'min-h-screen bg-gradient-to-b from-white/50 via-white/30 to-white/50'
        }
      >
      <div className="animate-fadeIn max-w-md mx-auto">
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
          <button
            onClick={handleToggleTheme}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border ${theme.surface} ${theme.border}`}
            data-testid="home-theme-toggle"
          >
            <theme.icon size={13} className={theme.accent} />
            <span className={`text-[11px] font-bold ${theme.text}`}>
              {isArabic ? theme.label : theme.labelEn}
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${otherTheme.accent.replace('text-', 'bg-')}`} />
          </button>
        </div>

        {/* Hero balance card — luxury */}
        <div
          className={`mx-4 mb-4 rounded-3xl border overflow-hidden ${theme.surface} ${theme.border} shadow-2xl`}
        >
          <div className="flex items-center gap-3 p-4">
            <img
              src={HOME_ICONS.brand}
              alt="Saqr"
              className="w-14 h-14 rounded-2xl object-cover shadow-lg"
            />
            <div className="flex-1 text-right">
              <div className="flex items-center justify-end gap-1.5">
                <span className={`text-[11px] font-bold ${theme.textMuted}`}>{copy.gems}</span>
                <Diamond size={13} className={theme.accent} />
              </div>
              <div className={`text-3xl font-black tracking-tight ${theme.text}`}>
                {gemsValue.toLocaleString('en-US')}
              </div>
              <p className={`text-[10px] ${theme.textMuted}`}>{copy.balanceLine}</p>
            </div>
          </div>
        </div>

        {/* FEATURED — big hero tile */}
        <p className={`text-[11px] font-bold tracking-widest px-5 mb-2 ${theme.textMuted} text-right`}>
          {copy.sectionFeatured}
        </p>
        <div className="px-4">
          <HeroTile
            image={HOME_ICONS.watch}
            title={copy.adsTitle}
            subtitle={copy.adsSub}
            badge={copy.hot}
            onClick={onNavigateToAds}
            isRTL={isArabic}
            accent={theme.accent}
          />
        </div>

        {/* EARN — second hero tile */}
        <p className={`text-[11px] font-bold tracking-widest px-5 mt-4 mb-2 ${theme.textMuted} text-right`}>
          {copy.sectionEarn}
        </p>
        <div className="px-4">
          <HeroTile
            image={HOME_ICONS.fortunes}
            title={copy.fortunesTitle}
            subtitle={copy.fortunesSub}
            badge={copy.new}
            onClick={onNavigateToFortunes}
            isRTL={isArabic}
            accent={theme.accent}
          />
        </div>

        {/* EXPLORE — wide reels tile */}
        <p className={`text-[11px] font-bold tracking-widest px-5 mt-4 mb-2 ${theme.textMuted} text-right`}>
          {copy.sectionExplore}
        </p>
        <div className="px-4">
          <HeroTile
            image={HOME_ICONS.reels}
            title={copy.reelsTitle}
            subtitle={copy.reelsSub}
            onClick={onNavigateToClips}
            isRTL={isArabic}
            accent={theme.accent}
          />
        </div>

        {/* CONNECT — two square tiles side-by-side */}
        <p className={`text-[11px] font-bold tracking-widest px-5 mt-4 mb-2 ${theme.textMuted} text-right`}>
          {copy.sectionConnect}
        </p>
        <div className="px-4 grid grid-cols-2 gap-3">
          <SquareTile
            image={HOME_ICONS.chat}
            title={copy.chatTitle}
            subtitle={copy.chatSub}
            onClick={onNavigateToChat}
            isRTL={isArabic}
          />
          <SquareTile
            image={HOME_ICONS.friends}
            title={copy.friendsTitle}
            subtitle={copy.friendsSub}
            onClick={onNavigateToFriends}
            isRTL={isArabic}
          />
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-6 px-4">
          <span className="w-1 h-1 rounded-full bg-emerald-400" />
          <p className={`text-[10px] ${theme.textMuted}`}>{copy.footer}</p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default HomePage;
