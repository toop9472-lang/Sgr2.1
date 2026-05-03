import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

const ICON_ASSETS = {
  home: 'https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/80a9b958945b14e3f85f8b8e2b49544963122866ce9cdc8af6f2ab70c5c8bb31.png',
  clips: 'https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/e02071f57750c77c0db321a70a51ed7bceb6eeb4df5f78e29d834466fcf3f354.png',
  watch: 'https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/e14c91a9e40e8d29b6f8d3bf567a4fcb7020c985b1a9d3e96e2035b06f9921e6.png',
  advertise: 'https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/9571396ba276f9f9cf70ce0622c4303850d05054256c99581ef235eec62d9760.png',
  profile: 'https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/45a8a3fbd10c46b785a5178ca02ae00c0c4aa43973b95689ebf41e18eb5cbada.png',
};

const NavButton = ({ id, icon, label, isActive, onClick, testId }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center min-w-[50px] flex-shrink-0"
    data-testid={testId}
  >
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
        isActive ? 'bg-blue-400/15' : ''
      }`}
    >
      <img
        src={icon}
        alt={label}
        className="w-5 h-5 object-contain transition-opacity"
        style={{
          opacity: isActive ? 1 : 0.68,
          filter: isActive
            ? 'brightness(0) saturate(100%) invert(94%) sepia(8%) saturate(1138%) hue-rotate(176deg) brightness(99%) contrast(98%)'
            : 'brightness(0) invert(1)',
        }}
      />
    </div>
    <span
      className={`text-[10px] mt-0.5 font-medium transition-colors ${
        isActive ? 'text-blue-400 font-semibold' : 'text-white/50'
      }`}
    >
      {label}
    </span>
  </button>
);

const CenterButton = ({ icon, label, onClick, gradient, glowColor, testId }) => (
  <button
    onClick={onClick}
    className="relative rounded-2xl overflow-hidden flex-shrink-0 shadow-lg shadow-black/30"
    style={{ minHeight: 44 }}
    data-testid={testId}
  >
    <div
      className="absolute -inset-1 blur-md opacity-60 -z-10"
      style={{ backgroundColor: glowColor }}
    />
    <div
      className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl"
      style={{ background: gradient }}
    >
      <img
        src={icon}
        alt={label}
        className="w-[18px] h-[18px] object-contain"
        style={{ filter: 'brightness(0) invert(1)' }}
      />
      <span className="text-white text-[13px] font-bold whitespace-nowrap">
        {label}
      </span>
    </div>
  </button>
);

const BottomNav = ({ currentPage, onNavigate, onAdsPress, onClipsPress }) => {
  const { language } = useLanguage();

  const navItems = {
    home: { id: 'home', label: language === 'ar' ? 'الرئيسية' : 'Home', icon: ICON_ASSETS.home },
    advertiser: { id: 'advertiser', label: language === 'ar' ? 'أعلن' : 'Advertise', icon: ICON_ASSETS.advertise },
    profile: { id: 'profile', label: language === 'ar' ? 'حسابي' : 'Profile', icon: ICON_ASSETS.profile },
  };

  const handleClips = () => {
    if (onClipsPress) onClipsPress();
    else onNavigate('clips');
  };

  const handleAds = () => {
    if (onAdsPress) onAdsPress();
    else onNavigate('ads');
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-2xl"
      style={{
        backgroundColor: 'rgba(10, 10, 15, 0.85)',
        borderTop: '0.5px solid rgba(255,255,255,0.1)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center justify-around px-2.5 pt-2 pb-1">
        {/* الرئيسية */}
        <NavButton
          {...navItems.home}
          isActive={currentPage === 'home'}
          onClick={() => onNavigate('home')}
          testId="nav-home"
        />

        {/* زر المقاطع - أخضر ليموني */}
        <CenterButton
          icon={ICON_ASSETS.clips}
          label={language === 'ar' ? 'مقاطع' : 'Clips'}
          onClick={handleClips}
          gradient="linear-gradient(135deg, #a3e635, #65a30d)"
          glowColor="rgba(132,204,22,0.3)"
          testId="nav-clips"
        />

        {/* زر المشاهدة - أحمر وردي */}
        <CenterButton
          icon={ICON_ASSETS.watch}
          label={language === 'ar' ? 'شاهد' : 'Watch'}
          onClick={handleAds}
          gradient="linear-gradient(135deg, #f43f5e, #be123c)"
          glowColor="rgba(236,72,153,0.32)"
          testId="nav-watch-ads"
        />

        {/* أعلن */}
        <NavButton
          {...navItems.advertiser}
          isActive={currentPage === 'advertiser'}
          onClick={() => onNavigate('advertiser')}
          testId="nav-advertiser"
        />

        {/* حسابي */}
        <NavButton
          {...navItems.profile}
          isActive={currentPage === 'profile'}
          onClick={() => onNavigate('profile')}
          testId="nav-profile"
        />
      </div>
    </div>
  );
};

export default BottomNav;
