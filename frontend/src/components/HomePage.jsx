// Saqr Home — Web (single luxury design, no theme toggle).
// Mirrors the mobile HomeScreen exactly: full-image hero tiles + square tiles.
import React, { useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Diamond } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

const HOME_ICONS = {
  watch: '/home_icons/watch_earn.jpg',
  fortunes: '/home_icons/fortunes.jpg',
  reels: '/home_icons/reels.jpg',
  chat: '/home_icons/chat.jpg',
  friends: '/home_icons/friends.jpg',
  brand: '/home_icons/home.png',
};

const HeroTile = ({ image, title, subtitle, badge, onClick, isRTL }) => {
  const Chev = isRTL ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={onClick}
      data-testid={`home-tile-${title}`}
      className="group relative w-full overflow-hidden rounded-3xl border border-white/10 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] hover:scale-[1.01] active:scale-[0.99] transition-transform"
      style={{ aspectRatio: '16 / 9' }}
    >
      <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/40 to-transparent" />
      {badge && (
        <span
          className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} px-2.5 py-1 rounded-full text-[10px] font-extrabold border border-white/30 bg-black/50 text-white backdrop-blur-sm`}
        >
          {badge}
        </span>
      )}
      <div className={`absolute inset-x-0 bottom-0 p-4 ${isRTL ? 'text-right' : 'text-left'}`}>
        <h3 className="text-white text-lg font-extrabold drop-shadow-lg">{title}</h3>
        <p className="text-white/85 text-[12px] mt-0.5 drop-shadow">{subtitle}</p>
        <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-white/95 font-bold">
          <span className="text-yellow-400">●</span>
          <span>{isRTL ? 'افتح' : 'Open'}</span>
          <Chev size={14} />
        </div>
      </div>
    </button>
  );
};

const SquareTile = ({ image, title, subtitle, onClick, isRTL }) => (
  <button
    onClick={onClick}
    data-testid={`home-square-${title}`}
    className="relative w-full overflow-hidden rounded-3xl border border-white/10 shadow-[0_14px_40px_-18px_rgba(0,0,0,0.6)] hover:scale-[1.01] active:scale-[0.99] transition-transform"
    style={{ aspectRatio: '1 / 1' }}
  >
    <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/30 to-transparent" />
    <div className={`absolute inset-x-0 bottom-0 p-3 ${isRTL ? 'text-right' : 'text-left'}`}>
      <p className="text-white text-sm font-extrabold drop-shadow-lg leading-tight">{title}</p>
      <p className="text-white/80 text-[10px] mt-0.5 drop-shadow">{subtitle}</p>
    </div>
  </button>
);

const HomePage = ({
  user,
  onNavigateToAds,
  onNavigateToClips,
  onNavigateToChat,
  onNavigateToFortunes,
  onNavigateToFriends,
  onRefresh,
}) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

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
      chatTitle: isArabic ? 'الدردشة' : 'Chat',
      chatSub: isArabic ? 'مجانية' : 'Free',
      friendsTitle: isArabic ? 'الأصدقاء' : 'Friends',
      friendsSub: isArabic ? 'أضف وتواصل' : 'Add & connect',
      hot: isArabic ? 'الأكثر رواجاً' : 'Hot',
      new: isArabic ? 'جديد' : 'New',
      footer: isArabic
        ? 'صقر — اكسب من مشاهداتك اليومية'
        : 'Saqr — earn from your daily views',
    }),
    [isArabic],
  );

  const userName = user?.name || copy.defaultPlayer;
  const gemsValue = Number(user?.saqr_gems ?? user?.saqr_points ?? user?.points ?? 0) || 0;

  return (
    <div className="min-h-screen pb-28 bg-gradient-to-b from-[#06070d] via-[#0a0b14] to-[#0d0d1a]">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-5 pb-3 gap-2.5">
          <LanguageSwitcher />
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-extrabold truncate text-white text-right">
              {copy.welcomePrefix} {userName}
            </h1>
            <p className="text-[11px] text-slate-400 truncate text-right mt-0.5">
              {copy.welcomeSub}
            </p>
          </div>
        </div>

        {/* Hero balance */}
        <div className="mx-4 mb-4 rounded-3xl border border-yellow-400/20 overflow-hidden bg-[#11121b] shadow-2xl">
          <div className="flex items-center gap-3 p-4">
            <img
              src={HOME_ICONS.brand}
              alt="Saqr"
              className="w-14 h-14 rounded-2xl object-cover shadow-lg"
            />
            <div className="flex-1 text-right">
              <div className="inline-flex items-center justify-end gap-1.5 bg-yellow-400/15 px-2 py-0.5 rounded-md">
                <span className="text-[10px] font-bold text-yellow-400">{copy.gems}</span>
                <Diamond size={11} className="text-yellow-400" />
              </div>
              <div className="text-3xl font-black tracking-tight text-white mt-1">
                {gemsValue.toLocaleString('en-US')}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">{copy.balanceLine}</p>
            </div>
          </div>
        </div>

        {/* FEATURED */}
        <p className="text-[11px] font-bold tracking-widest px-5 mt-2 mb-2 text-slate-400 text-right uppercase">
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
          />
        </div>

        {/* EARN */}
        <p className="text-[11px] font-bold tracking-widest px-5 mt-4 mb-2 text-slate-400 text-right uppercase">
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
          />
        </div>

        {/* EXPLORE */}
        <p className="text-[11px] font-bold tracking-widest px-5 mt-4 mb-2 text-slate-400 text-right uppercase">
          {copy.sectionExplore}
        </p>
        <div className="px-4">
          <HeroTile
            image={HOME_ICONS.reels}
            title={copy.reelsTitle}
            subtitle={copy.reelsSub}
            onClick={onNavigateToClips}
            isRTL={isArabic}
          />
        </div>

        {/* CONNECT */}
        <p className="text-[11px] font-bold tracking-widest px-5 mt-4 mb-2 text-slate-400 text-right uppercase">
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
          <p className="text-[10px] text-slate-400">{copy.footer}</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
