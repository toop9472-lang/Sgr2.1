import React from 'react';
import { Home, Film, PlayCircle, Megaphone, User } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const NavButton = ({ icon: Icon, label, isActive, onClick, testId }) => (
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
      <Icon
        size={20}
        color={isActive ? '#60a5fa' : 'rgba(255,255,255,0.68)'}
        strokeWidth={isActive ? 2.5 : 2}
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

const CenterButton = ({ icon: Icon, label, onClick, gradient, glowColor, testId }) => (
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
      <Icon size={18} color="#fff" strokeWidth={2.5} />
      <span className="text-white text-[13px] font-bold whitespace-nowrap">
        {label}
      </span>
    </div>
  </button>
);

const BottomNav = ({ currentPage, onNavigate, onAdsPress, onClipsPress }) => {
  const { language } = useLanguage();

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
          icon={Home}
          label={language === 'ar' ? 'الرئيسية' : 'Home'}
          isActive={currentPage === 'home'}
          onClick={() => onNavigate('home')}
          testId="nav-home"
        />

        {/* زر المقاطع - أخضر ليموني */}
        <CenterButton
          icon={Film}
          label={language === 'ar' ? 'مقاطع' : 'Clips'}
          onClick={handleClips}
          gradient="linear-gradient(135deg, #a3e635, #65a30d)"
          glowColor="rgba(132,204,22,0.3)"
          testId="nav-clips"
        />

        {/* زر المشاهدة - أحمر وردي */}
        <CenterButton
          icon={PlayCircle}
          label={language === 'ar' ? 'شاهد' : 'Watch'}
          onClick={handleAds}
          gradient="linear-gradient(135deg, #f43f5e, #be123c)"
          glowColor="rgba(236,72,153,0.32)"
          testId="nav-watch-ads"
        />

        {/* أعلن */}
        <NavButton
          icon={Megaphone}
          label={language === 'ar' ? 'أعلن' : 'Advertise'}
          isActive={currentPage === 'advertiser'}
          onClick={() => onNavigate('advertiser')}
          testId="nav-advertiser"
        />

        {/* حسابي */}
        <NavButton
          icon={User}
          label={language === 'ar' ? 'حسابي' : 'Profile'}
          isActive={currentPage === 'profile'}
          onClick={() => onNavigate('profile')}
          testId="nav-profile"
        />
      </div>
    </div>
  );
};

export default BottomNav;
