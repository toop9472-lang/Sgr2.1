import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

const APP_BACKGROUND_IMAGE =
  'https://static.prod-images.emergentagent.com/jobs/40eca190-5242-4463-8c95-bc5f66df29cb/images/e35d59ccd161791b6e9cbecdfa426302685267afa2c8e806fa233976816403de.png';

const ICON_ASSETS = {
  home: 'https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/80a9b958945b14e3f85f8b8e2b49544963122866ce9cdc8af6f2ab70c5c8bb31.png',
  clips: 'https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/e02071f57750c77c0db321a70a51ed7bceb6eeb4df5f78e29d834466fcf3f354.png',
  watch: 'https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/e14c91a9e40e8d29b6f8d3bf567a4fcb7020c985b1a9d3e96e2035b06f9921e6.png',
  gems: 'https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/8cdadba2892459ff5914f65842239cb7d223d973dca3d9c0e02dc176bdacf78d.png',
  chat: 'https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/bcdacd75d090c4626f5432d13b9b6c4c4560cc34282e9424de1cbc6732f06abf.png',
  friends: 'https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/7f2948052c933ae7604200fd2c98d91f4504fce293deb36ce108cba1d36f062a.png',
  fortunes: 'https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/8cdadba2892459ff5914f65842239cb7d223d973dca3d9c0e02dc176bdacf78d.png',
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
    reels: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1400&q=80',
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
    reels: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1400&q=80',
    friends: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1400&q=80',
    chat: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1400&q=80',
    tip: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80',
  },
};

const AppIcon = ({ uri, size = 18 }) => (
  <img
    src={uri}
    alt=""
    className="object-contain"
    style={{
      width: size,
      height: size,
      filter: 'brightness(0) invert(1)',
    }}
  />
);

const QuickStatSticker = ({ iconSource, value, label, backgroundImage, valueColor = '#fff' }) => (
  <div
    className="relative rounded-2xl overflow-hidden border border-white/10"
    style={{
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}
  >
    <div
      className="px-3 py-3 text-center"
      style={{ background: 'linear-gradient(to bottom, rgba(15,23,42,0.24), rgba(15,23,42,0.76))' }}
    >
      <div className="flex items-center justify-center mb-1">
        <AppIcon uri={iconSource} size={16} />
      </div>
      <div className="text-lg font-bold leading-none" style={{ color: valueColor }}>
        {value}
      </div>
      <div className="text-white/55 text-[10px] mt-1">{label}</div>
    </div>
  </div>
);

const QuickActionPill = ({ iconSource, title, subtitle, gradient, backgroundImage, onClick, testId }) => (
  <button
    onClick={onClick}
    className="flex-1 min-w-[150px] rounded-2xl overflow-hidden text-right relative"
    data-testid={testId}
  >
    <img src={backgroundImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
    <div
      className="relative flex items-center gap-3 px-4 py-3 backdrop-blur-[2px]"
      style={{ background: gradient }}
    >
      <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center flex-shrink-0">
        <AppIcon uri={iconSource} size={17} />
      </div>
      <div className="flex-1 text-right">
        <div className="text-white font-bold text-sm leading-tight drop-shadow">{title}</div>
        <div className="text-white/85 text-[11px] leading-tight mt-0.5">{subtitle}</div>
      </div>
    </div>
  </button>
);

const FeaturedCard = ({ title, subtitle, image, color, iconSource, onClick, badge, testId }) => (
  <button
    onClick={onClick}
    className="w-full rounded-3xl overflow-hidden relative h-44 shadow-xl group"
    data-testid={testId}
  >
    <img
      src={image}
      alt={title}
      className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
    />
    <div
      className="absolute inset-0"
      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)' }}
    />
    {badge && (
      <div className="absolute top-3 right-3 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full">
        <span className="text-white text-xs font-semibold">{badge}</span>
      </div>
    )}
    <div className="absolute bottom-0 right-0 left-0 p-4 flex items-center justify-between">
      <div className="text-right flex-1">
        <h3 className="text-white text-xl font-bold drop-shadow-lg">{title}</h3>
        <p className="text-white/85 text-sm mt-1">{subtitle}</p>
      </div>
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0"
        style={{ backgroundColor: color }}
      >
        <AppIcon uri={iconSource} size={20} />
      </div>
    </div>
  </button>
);

const FeatureCard = ({ title, subtitle, image, color, iconSource, onClick, badge, testId }) => (
  <button
    onClick={onClick}
    className="flex-1 rounded-2xl overflow-hidden relative h-32 shadow-lg group min-w-[140px]"
    data-testid={testId}
  >
    <img
      src={image}
      alt={title}
      className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
    />
    <div
      className="absolute inset-0"
      style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.78) 100%)' }}
    />
    {badge && (
      <div
        className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {badge}
      </div>
    )}
    <div className="absolute bottom-2 right-2 left-2 flex items-end justify-between">
      <div className="text-right flex-1">
        <h4 className="text-white text-sm font-bold drop-shadow-md">{title}</h4>
        <p className="text-white/80 text-[11px] mt-0.5">{subtitle}</p>
      </div>
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
        style={{ backgroundColor: color }}
      >
        <AppIcon uri={iconSource} size={16} />
      </div>
    </div>
  </button>
);

const PrimaryActionCard = ({ iconSource, title, subtitle, gradient, backgroundImage, onClick, testId }) => (
  <button
    onClick={onClick}
    className="flex-1 rounded-2xl overflow-hidden min-w-[150px] text-right relative h-[72px]"
    data-testid={testId}
  >
    <img src={backgroundImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
    <div
      className="relative h-full flex items-center gap-3 px-4 py-4 backdrop-blur-[2px]"
      style={{ background: gradient }}
    >
      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
        <AppIcon uri={iconSource} size={18} />
      </div>
      <div className="flex-1 text-right">
        <div className="text-white font-bold text-sm leading-tight drop-shadow">{title}</div>
        <div className="text-white/85 text-[11px] leading-tight mt-0.5">{subtitle}</div>
      </div>
    </div>
  </button>
);

const PRESET_STORAGE_KEY = 'saqr_home_preset';

const HomePage = ({ user, onNavigate, onNavigateToAds }) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [refreshing, setRefreshing] = useState(false);
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
      chat: isArabic ? 'الدردشة' : 'Chat',
      chatSub: isArabic ? 'تواصل مع اللاعبين' : 'Connect with players',
      friends: isArabic ? 'الأصدقاء' : 'Friends',
      friendsSub: isArabic ? 'أضف أصدقاء جدد' : 'Add new friends',
      chatCostBadge: isArabic ? 'مجاني' : 'Free',
      tip: isArabic
        ? 'ادعُ أصدقاءك واربح جواهر صقر مضاعفة!'
        : 'Invite friends and earn boosted Saqr gems!',
      adsPill: isArabic ? 'صفحة الإعلانات' : 'Ads Feed',
      adsPillSub: isArabic ? 'AdMob + المعلنين' : 'AdMob + advertisers',
      reelsPill: isArabic ? 'صفحة الريلز' : 'Reels Feed',
      reelsPillSub: isArabic ? '15 ثانية لكل فيديو' : '15s per reel',
      chatPill: isArabic ? 'الدردشة العامة' : 'Global Chat',
      chatPillSub: isArabic ? 'مجانية بالكامل' : 'Always free',
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

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      if (typeof window !== 'undefined') window.location.reload();
    }, 600);
  }, []);

  const handleQuickPresetToggle = useCallback(() => {
    const next = homePreset === 'brightModern' ? 'luxuryDark' : 'brightModern';
    // Fade animation like mobile
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
  const goChat = () => onNavigate && onNavigate('chat');
  const goFortunes = () => onNavigate && onNavigate('fortunes');
  const goFriends = () => onNavigate && onNavigate('friends');

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
        className="max-w-2xl mx-auto px-4 pt-6 pb-4 space-y-5 transition-opacity duration-200"
        style={{ opacity: fadeOpacity }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <div className="text-right">
              <div className="text-white text-lg font-bold leading-tight">
                {copy.welcomePrefix} {userName}
              </div>
              <div className="text-white/65 text-[12px] leading-tight">
                {copy.welcomeSub}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleQuickPresetToggle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/15 border border-white/15 transition"
              data-testid="home-preset-toggle"
            >
              <svg
                className="w-3.5 h-3.5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m-4 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              <span className="text-white text-[11px] font-semibold whitespace-nowrap">
                {homePreset === 'brightModern' ? copy.styleBright : copy.styleLuxury}
              </span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/15 transition flex items-center justify-center disabled:opacity-50"
              data-testid="home-refresh"
              aria-label="Refresh"
            >
              <svg
                className={`w-3.5 h-3.5 text-white ${refreshing ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h5m11 11v-5h-5M5.5 9A7 7 0 0118 6.5M18.5 15A7 7 0 016 17.5"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Quick Stats Row with backgrounds */}
        <div className="grid grid-cols-3 gap-2">
          <QuickStatSticker
            iconSource={ICON_ASSETS.gems}
            value={user?.saqr_gems || 0}
            label={copy.gemsLabel}
            valueColor="#fbbf24"
            backgroundImage={bg.statGems}
          />
          <QuickStatSticker
            iconSource={ICON_ASSETS.clips}
            value={user?.clips_count || 0}
            label={copy.reelsLabel}
            valueColor="#a5f3fc"
            backgroundImage={bg.statReels}
          />
          <QuickStatSticker
            iconSource={ICON_ASSETS.chat}
            value="24/7"
            label={copy.chatLabel}
            valueColor="#93c5fd"
            backgroundImage={bg.statChat}
          />
        </div>

        {/* Quick Actions - Pills with backgrounds */}
        <div className="grid grid-cols-2 gap-2">
          <QuickActionPill
            iconSource={ICON_ASSETS.watch}
            title={copy.adsPill}
            subtitle={copy.adsPillSub}
            gradient="linear-gradient(135deg, rgba(245,158,11,0.55), rgba(180,83,9,0.65))"
            backgroundImage={bg.quickAds}
            onClick={goAds}
            testId="home-pill-ads"
          />
          <QuickActionPill
            iconSource={ICON_ASSETS.clips}
            title={copy.reelsPill}
            subtitle={copy.reelsPillSub}
            gradient="linear-gradient(135deg, rgba(99,102,241,0.55), rgba(79,70,229,0.65))"
            backgroundImage={bg.quickReels}
            onClick={goClips}
            testId="home-pill-clips"
          />
          <QuickActionPill
            iconSource={ICON_ASSETS.chat}
            title={copy.chatPill}
            subtitle={copy.chatPillSub}
            gradient="linear-gradient(135deg, rgba(14,165,233,0.55), rgba(3,105,161,0.65))"
            backgroundImage={bg.quickChat}
            onClick={goChat}
            testId="home-pill-chat"
          />
          <QuickActionPill
            iconSource={ICON_ASSETS.fortunes}
            title={copy.fortunesPill}
            subtitle={copy.fortunesPillSub}
            gradient="linear-gradient(135deg, rgba(236,72,153,0.54), rgba(124,58,237,0.64))"
            backgroundImage={bg.quickFortunes}
            onClick={goFortunes}
            testId="home-pill-fortunes"
          />
        </div>

        {/* Saqr Fortunes Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AppIcon uri={ICON_ASSETS.fortunes} size={18} />
            <h2 className="text-white text-base font-bold flex-1 text-right">
              {copy.fortunes}
            </h2>
            <span className="bg-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {copy.newLabel}
            </span>
          </div>

          <FeaturedCard
            title={copy.fortunes}
            subtitle={copy.fortunesSubtitle}
            image={bg.featuredFortunes}
            color="#ec4899"
            iconSource={ICON_ASSETS.fortunes}
            onClick={goFortunes}
            badge={copy.exchangeBadge}
            testId="home-featured-fortunes"
          />

          <p className="text-white/65 text-xs mt-2.5 text-right">
            {copy.fortunesDesc}
          </p>
        </div>

        {/* Primary Actions Row with backgrounds */}
        <div className="grid grid-cols-2 gap-2.5">
          <PrimaryActionCard
            iconSource={ICON_ASSETS.watch}
            title={copy.watchAndEarn}
            subtitle={copy.watchAndEarnSubtitle}
            gradient="linear-gradient(135deg, rgba(245,158,11,0.50), rgba(194,65,12,0.55))"
            backgroundImage={bg.primaryWatch}
            onClick={goAds}
            testId="home-primary-ads"
          />
          <PrimaryActionCard
            iconSource={ICON_ASSETS.fortunes}
            title={copy.fortunes}
            subtitle={copy.exchangeBadge}
            gradient="linear-gradient(135deg, rgba(236,72,153,0.52), rgba(99,102,241,0.56))"
            backgroundImage={bg.primaryFortunes}
            onClick={goFortunes}
            testId="home-primary-fortunes"
          />
        </div>

        {/* Dual Cards: Reels + Friends */}
        <div className="grid grid-cols-2 gap-2.5">
          <FeatureCard
            title={copy.clips}
            subtitle={copy.clipsSub}
            image={bg.reels}
            color="#8b5cf6"
            iconSource={ICON_ASSETS.clips}
            onClick={goClips}
            testId="home-card-clips"
          />
          <FeatureCard
            title={copy.friends}
            subtitle={copy.friendsSub}
            image={bg.friends}
            color="#22c55e"
            iconSource={ICON_ASSETS.friends}
            onClick={goFriends}
            testId="home-card-friends"
          />
        </div>

        {/* Chat Card (single row like mobile) */}
        <div className="grid grid-cols-2 gap-2.5">
          <FeatureCard
            title={copy.chat}
            subtitle={copy.chatSub}
            image={bg.chat}
            color="#3b82f6"
            iconSource={ICON_ASSETS.chat}
            onClick={goChat}
            badge={copy.chatCostBadge}
            testId="home-card-chat"
          />
          <div />
        </div>

        {/* Tip Card with background */}
        <div className="relative rounded-2xl overflow-hidden border border-amber-500/20 shadow-lg">
          <img src={bg.tip} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
          <div
            className="relative px-4 py-3 flex items-center gap-3"
            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(0,0,0,0.55))' }}
          >
            <AppIcon uri={ICON_ASSETS.home} size={18} />
            <p className="text-white/90 text-[12px] flex-1 text-right leading-snug drop-shadow">
              {copy.tip}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
