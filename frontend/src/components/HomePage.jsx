import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Home as HomeIcon,
  Film,
  PlayCircle,
  Gem,
  MessageCircle,
  Users,
  RefreshCw,
  ArrowLeftRight,
  Lightbulb,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

const APP_BACKGROUND_IMAGE =
  'https://static.prod-images.emergentagent.com/jobs/40eca190-5242-4463-8c95-bc5f66df29cb/images/e35d59ccd161791b6e9cbecdfa426302685267afa2c8e806fa233976816403de.png';

const ICONS = {
  home: HomeIcon,
  clips: Film,
  watch: PlayCircle,
  gems: Gem,
  chat: MessageCircle,
  friends: Users,
  fortunes: Gem,
};

const AppIcon = ({ name, size = 18, color = '#fff', strokeWidth = 2.25 }) => {
  const Comp = ICONS[name] || HomeIcon;
  return <Comp size={size} color={color} strokeWidth={strokeWidth} className="shrink-0" />;
};

const HOME_CARD_BACKGROUND_PRESETS = {
  luxuryDark: {
    featuredFortunes: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=80',
    statGems: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=1200&q=80',
    statReels: 'https://images.unsplash.com/photo-1524253482453-3fed8d2fe12b?auto=format&fit=crop&w=1200&q=80',
    statChat: 'https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=1200&q=80',
    quickAds: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    quickReels: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    quickChat: 'https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=1200&q=80',
    quickFortunes: 'https://images.unsplash.com/photo-1559526324-593bc073d938?auto=format&fit=crop&w=1200&q=80',
    primaryWatch: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    primaryFortunes: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80',
    reels: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1400&q=80',
    friends: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=80',
    chat: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80',
    tip: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80',
  },
  brightModern: {
    featuredFortunes: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80',
    statGems: 'https://images.unsplash.com/photo-1473186505569-9c61870c11f9?auto=format&fit=crop&w=1200&q=80',
    statReels: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    statChat: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
    quickAds: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    quickReels: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1200&q=80',
    quickChat: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    quickFortunes: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=1200&q=80',
    primaryWatch: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    primaryFortunes: 'https://images.unsplash.com/photo-1462899006636-339e08d1844e?auto=format&fit=crop&w=1200&q=80',
    reels: 'https://images.unsplash.com/photo-1496559249665-c7e2874707ea?auto=format&fit=crop&w=1400&q=80',
    friends: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1400&q=80',
    chat: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1400&q=80',
    tip: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80',
  },
};

const QuickStatSticker = ({ iconName, value, label, tintColor, backgroundImage }) => (
  <div
    className="flex-1 relative rounded-[14px] overflow-hidden min-h-[82px]"
    style={{
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}
  >
    <div className="h-full w-full px-2 py-2.5 flex flex-col items-center justify-center gap-[3px]">
      <AppIcon name={iconName} size={18} color={tintColor} strokeWidth={2.5} />
      <div
        className="text-white text-[15px] font-extrabold leading-none"
        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.6)' }}
      >
        {value}
      </div>
      <div
        className="text-white/95 text-[10px] font-semibold"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}
      >
        {label}
      </div>
    </div>
  </div>
);

const QuickActionPill = ({ iconName, title, subtitle, backgroundImage, onClick, testId }) => (
  <button
    onClick={onClick}
    className="relative rounded-[14px] overflow-hidden text-right"
    style={{ width: 'calc((100% - 8px) / 2)' }}
    data-testid={testId}
  >
    <img src={backgroundImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
    <div className="relative flex items-center gap-2 px-3 py-[11px] min-h-[64px]">
      <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20">
        <AppIcon name={iconName} size={17} strokeWidth={2.5} />
      </div>
      <div className="flex-1 text-right min-w-0">
        <div
          className="text-white text-[12px] font-extrabold leading-[16px] truncate"
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.95), 0 0 6px rgba(0,0,0,0.7)' }}
        >
          {title}
        </div>
        <div
          className="text-white/95 text-[10px] leading-[13px] mt-0.5 truncate"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  </button>
);

const PrimaryActionCard = ({ iconName, title, subtitle, backgroundImage, onClick, testId }) => (
  <button
    onClick={onClick}
    className="flex-1 rounded-[14px] overflow-hidden relative text-right"
    data-testid={testId}
  >
    <img src={backgroundImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
    <div className="relative min-h-[86px] p-[13px]">
      <div className="w-[34px] h-[34px] rounded-full bg-black/40 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-2">
        <AppIcon name={iconName} size={18} strokeWidth={2.5} />
      </div>
      <div className="space-y-[3px] text-right">
        <div
          className="text-white text-[13px] font-extrabold leading-[17px]"
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.95), 0 0 6px rgba(0,0,0,0.7)' }}
        >
          {title}
        </div>
        <div
          className="text-white/95 text-[10px] leading-[14px]"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  </button>
);

const FeaturedCard = ({ title, subtitle, image, iconName, onClick, badge, testId }) => (
  <button
    onClick={onClick}
    className="w-full rounded-2xl overflow-hidden relative shadow-xl group text-right"
    style={{ boxShadow: '0 4px 12px rgba(236,72,153,0.35)' }}
    data-testid={testId}
  >
    <img
      src={image}
      alt={title}
      className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
    />
    <div className="relative h-[164px] p-4 flex flex-col justify-between">
      {badge && (
        <div className="self-start bg-emerald-500 px-3 py-1 rounded-xl shadow-md">
          <span
            className="text-white text-[11px] font-bold"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
          >
            {badge}
          </span>
        </div>
      )}
      <div className="flex items-end justify-between">
        <div className="text-right flex-1">
          <h3
            className="text-white text-[21px] font-extrabold"
            style={{ textShadow: '0 2px 6px rgba(0,0,0,0.95), 0 0 12px rgba(0,0,0,0.8)' }}
          >
            {title}
          </h3>
          <p
            className="text-white/95 text-[12px] mt-1 leading-[16px]"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
          >
            {subtitle}
          </p>
        </div>
        <div className="p-2">
          <AppIcon name={iconName} size={20} color="#fff" strokeWidth={2.5} />
        </div>
      </div>
    </div>
  </button>
);

const FeatureCard = ({ title, subtitle, image, iconName, onClick, badge, testId }) => (
  <button
    onClick={onClick}
    className="flex-1 rounded-[14px] overflow-hidden relative group text-right"
    data-testid={testId}
  >
    <img
      src={image}
      alt={title}
      className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
    />
    <div className="relative h-[110px] p-3 flex flex-col justify-between">
      {badge && (
        <div
          className="self-start px-2 py-[3px] rounded-lg shadow-md"
          style={{ backgroundColor: 'rgba(96,165,250,0.95)' }}
        >
          <span
            className="text-white text-[9px] font-bold"
            style={{ textShadow: '0 1px 1px rgba(0,0,0,0.5)' }}
          >
            {badge}
          </span>
        </div>
      )}
      <div className="flex items-end justify-between">
        <div className="text-right flex-1">
          <h4
            className="text-white text-[14px] font-extrabold"
            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.75)' }}
          >
            {title}
          </h4>
          <p
            className="text-white/95 text-[10px] mt-0.5 leading-[13px]"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}
          >
            {subtitle}
          </p>
        </div>
        <div className="p-1.5">
          <AppIcon name={iconName} size={16} color="#fff" strokeWidth={2.5} />
        </div>
      </div>
    </div>
  </button>
);

const PRESET_STORAGE_KEY = 'saqr_home_preset';

const HomePage = ({ user, onNavigate, onNavigateToAds }) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [homePreset, setHomePreset] = useState('luxuryDark');
  const [fadeOpacity, setFadeOpacity] = useState(1);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PRESET_STORAGE_KEY);
      if (saved === 'luxuryDark' || saved === 'brightModern') {
        setHomePreset(saved);
      }
    } catch (_) { /* ignore */ }
  }, []);

  const bg = HOME_CARD_BACKGROUND_PRESETS[homePreset] || HOME_CARD_BACKGROUND_PRESETS.luxuryDark;

  const copy = useMemo(
    () => ({
      defaultPlayer: isArabic ? 'لاعب' : 'Player',
      welcomePrefix: isArabic ? 'أهلاً' : 'Welcome',
      welcomeSub: isArabic ? 'مرحباً بك في صقر' : 'Welcome to Saqr',
      fortunes: isArabic ? 'ثروات صقر' : 'Saqr Fortunes',
      newLabel: isArabic ? 'جديد' : 'NEW',
      fortunesSubtitle: isArabic
        ? 'اربح جواهر صقر للاستبدال بالمال الحقيقي!'
        : 'Earn Saqr gems and exchange them for real cash!',
      exchangeBadge: isArabic ? '500 جوهرة = 3 ريال' : '500 gems = 3 SAR',
      fortunesDesc: isArabic
        ? 'إعلانات AdMob مكتملة • مكافأة ثابتة 5 جواهر • سحب مرن'
        : 'Completed AdMob ads • Fixed 5 gems reward • Flexible cashout',
      watchAndEarn: isArabic ? 'شاهد واربح' : 'Watch & Earn',
      watchAndEarnSubtitle: isArabic
        ? 'إعلانات AdMob كاملة الشاشة + إعلانات المعلنين'
        : 'Full-screen AdMob + advertiser ads',
      clips: isArabic ? 'ريلز المجتمع' : 'Community Reels',
      clipsSub: isArabic ? 'مقاطع 15 ثانية من المستخدمين' : '15-second clips by users',
      friends: isArabic ? 'الأصدقاء' : 'Friends',
      friendsSub: isArabic ? 'أضف أصدقاء جدد' : 'Add new friends',
      tip: isArabic
        ? 'ادعُ أصدقاءك واربح جواهر صقر مضاعفة!'
        : 'Invite friends and earn boosted Saqr gems!',
      adsPill: isArabic ? 'صفحة الإعلانات' : 'Ads Feed',
      adsPillSub: isArabic ? 'AdMob + المعلنين' : 'AdMob + advertisers',
      reelsPill: isArabic ? 'صفحة الريلز' : 'Reels Feed',
      reelsPillSub: isArabic ? '15 ثانية لكل فيديو' : '15s per reel',
      fortunesPill: isArabic ? 'ثروات صقر' : 'Saqr Fortunes',
      fortunesPillSub: isArabic ? '500 = 3 ريال' : '500 = 3 SAR',
      styleLuxury: isArabic ? 'فاخر داكن' : 'Luxury Dark',
      styleBright: isArabic ? 'مشرق عصري' : 'Bright Modern',
      gemsLabel: isArabic ? 'جواهر' : 'Gems',
      reelsLabel: isArabic ? 'ريلز' : 'Reels',
      chatLabel: isArabic ? 'دردشة' : 'Chat',
    }),
    [isArabic]
  );

  const userName = user?.name || copy.defaultPlayer;

  const handleQuickPresetToggle = useCallback(() => {
    const next = homePreset === 'brightModern' ? 'luxuryDark' : 'brightModern';
    setFadeOpacity(0.35);
    setTimeout(() => {
      setHomePreset(next);
      try {
        localStorage.setItem(PRESET_STORAGE_KEY, next);
      } catch (_) { /* ignore */ }
      setTimeout(() => setFadeOpacity(1), 60);
    }, 140);
  }, [homePreset]);

  const goAds = onNavigateToAds || (() => onNavigate && onNavigate('ads'));
  const goClips = () => onNavigate && onNavigate('clips');
  const goFortunes = () => onNavigate && onNavigate('fortunes');
  const goFriends = () => onNavigate && onNavigate('friends');

  // Quick pills - 3 items like the latest mobile (ads, reels, fortunes)
  const quickPrimaryCards = [
    {
      id: 'ads',
      title: copy.adsPill,
      subtitle: copy.adsPillSub,
      iconName: 'watch',
      onClick: goAds,
      backgroundImage: bg.quickAds,
    },
    {
      id: 'reels',
      title: copy.reelsPill,
      subtitle: copy.reelsPillSub,
      iconName: 'clips',
      onClick: goClips,
      backgroundImage: bg.quickReels,
    },
    {
      id: 'fortunes',
      title: copy.fortunesPill,
      subtitle: copy.fortunesPillSub,
      iconName: 'fortunes',
      onClick: goFortunes,
      backgroundImage: bg.quickFortunes,
    },
  ];

  return (
    <div
      className="min-h-screen relative pb-28"
      data-testid="home-page"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* Fixed background */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: `url(${APP_BACKGROUND_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            'linear-gradient(to bottom, rgba(15,23,42,0.26) 0%, rgba(30,41,59,0.68) 50%, rgba(30,27,75,0.88) 100%)',
        }}
      />

      <div
        className="max-w-2xl mx-auto px-[18px] pt-6 pb-4 transition-opacity duration-200"
        style={{ opacity: fadeOpacity }}
      >
        {/* Header Shell */}
        <div
          className="mb-4 rounded-[16px] border overflow-hidden"
          style={{
            borderColor: 'rgba(148,163,184,0.2)',
            backgroundColor: 'rgba(2,6,23,0.42)',
          }}
        >
          <div className="flex items-center justify-between px-3 py-[11px] gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <LanguageSwitcher />
              <div className="flex-1 min-w-0 text-right">
                <div
                  className="text-[17px] font-extrabold leading-tight truncate"
                  style={{ color: '#f8fafc' }}
                >
                  {copy.welcomePrefix} {userName}
                </div>
                <div
                  className="text-[11px] leading-[15px] mt-0.5 truncate"
                  style={{ color: 'rgba(226,232,240,0.72)' }}
                >
                  {copy.welcomeSub}
                </div>
              </div>
            </div>
            <button
              onClick={handleQuickPresetToggle}
              className="flex items-center gap-1.5 rounded-full border transition hover:bg-slate-900/70"
              style={{
                backgroundColor: 'rgba(15,23,42,0.55)',
                borderColor: 'rgba(148,163,184,0.32)',
                paddingInline: '9px',
                paddingBlock: '6px',
              }}
              data-testid="home-preset-toggle"
            >
              <ArrowLeftRight size={14} color="#e2e8f0" className="shrink-0" />
              <span
                className="text-[9px] font-bold whitespace-nowrap"
                style={{ color: '#e2e8f0' }}
              >
                {homePreset === 'brightModern' ? copy.styleBright : copy.styleLuxury}
              </span>
            </button>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="flex gap-2 mb-3">
          <QuickStatSticker
            iconName="gems"
            value={user?.saqr_gems || 0}
            label={copy.gemsLabel}
            tintColor="#fbbf24"
            backgroundImage={bg.statGems}
          />
          <QuickStatSticker
            iconName="clips"
            value={user?.clips_count || 0}
            label={copy.reelsLabel}
            tintColor="#a5f3fc"
            backgroundImage={bg.statReels}
          />
          <QuickStatSticker
            iconName="chat"
            value="24/7"
            label={copy.chatLabel}
            tintColor="#93c5fd"
            backgroundImage={bg.statChat}
          />
        </div>

        {/* Quick Actions - 3 Pills (flex-wrap) */}
        <div className="flex flex-wrap gap-2 mb-[18px]">
          {quickPrimaryCards.map((card) => (
            <QuickActionPill
              key={card.id}
              iconName={card.iconName}
              title={card.title}
              subtitle={card.subtitle}
              backgroundImage={card.backgroundImage}
              onClick={card.onClick}
              testId={`home-pill-${card.id}`}
            />
          ))}
        </div>

        {/* Saqr Fortunes Section */}
        <div className="mb-[18px]">
          <div className="flex items-center gap-2 mb-2.5">
            <AppIcon name="fortunes" size={18} color="#ec4899" />
            <h2 className="text-white text-[17px] font-extrabold flex-1 text-right">
              {copy.fortunes}
            </h2>
            <div
              className="px-2.5 py-1 rounded-lg"
              style={{ backgroundColor: '#22c55e' }}
            >
              <span className="text-white text-[10px] font-bold">{copy.newLabel}</span>
            </div>
          </div>

          <FeaturedCard
            title={copy.fortunes}
            subtitle={copy.fortunesSubtitle}
            image={bg.featuredFortunes}
            iconName="fortunes"
            onClick={goFortunes}
            badge={copy.exchangeBadge}
            testId="home-featured-fortunes"
          />

          <p className="text-white/60 text-[12px] leading-[17px] text-center mt-2.5">
            {copy.fortunesDesc}
          </p>
        </div>

        {/* Primary Actions Row */}
        <div className="flex gap-2.5 mb-[14px]">
          <PrimaryActionCard
            iconName="watch"
            title={copy.watchAndEarn}
            subtitle={copy.watchAndEarnSubtitle}
            backgroundImage={bg.primaryWatch}
            onClick={goAds}
            testId="home-primary-ads"
          />
          <PrimaryActionCard
            iconName="fortunes"
            title={copy.fortunes}
            subtitle={copy.exchangeBadge}
            backgroundImage={bg.primaryFortunes}
            onClick={goFortunes}
            testId="home-primary-fortunes"
          />
        </div>

        {/* Dual Cards: Reels + Friends (no chat card, removed) */}
        <div className="flex gap-2.5 mb-2.5">
          <FeatureCard
            title={copy.clips}
            subtitle={copy.clipsSub}
            image={bg.reels}
            iconName="clips"
            onClick={goClips}
            testId="home-card-clips"
          />
          <FeatureCard
            title={copy.friends}
            subtitle={copy.friendsSub}
            image={bg.friends}
            iconName="friends"
            onClick={goFriends}
            testId="home-card-friends"
          />
        </div>

        {/* Tip Card - no overlay, only image */}
        <div className="relative rounded-xl overflow-hidden mt-1.5 shadow-lg">
          <img src={bg.tip} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="relative flex items-center gap-2.5 p-3.5">
            <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm border border-amber-400/40 flex items-center justify-center shrink-0">
              <Lightbulb size={18} color="#fbbf24" strokeWidth={2.5} />
            </div>
            <p
              className="text-white text-[12px] leading-[17px] flex-1 text-right font-semibold"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.75)' }}
            >
              {copy.tip}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
