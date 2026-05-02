import React from 'react';
import { Home, User, Megaphone, PlayCircle, Gamepad2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const BottomNav = ({ currentPage, onNavigate }) => {
  const { language } = useLanguage();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0f]/98 backdrop-blur-xl border-t border-white/10 z-40">
      <div className="flex items-center justify-around px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {/* Home */}
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all duration-200 ${
            currentPage === 'home'
              ? 'text-[#60a5fa]'
              : 'text-gray-500 hover:text-gray-300'
          }`}
          data-testid="nav-home"
        >
          <Home size={22} strokeWidth={currentPage === 'home' ? 2.5 : 2} />
          <span className={`text-[10px] ${currentPage === 'home' ? 'font-semibold' : 'font-medium'}`}>
            {language === 'ar' ? 'الرئيسية' : 'Home'}
          </span>
        </button>

        {/* Watch - أحمر */}
        <button
          onClick={() => onNavigate('ads')}
          className="flex items-center gap-1.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 px-4 py-2 rounded-2xl transition-all shadow-lg shadow-red-500/25"
          data-testid="nav-watch-ads"
        >
          <PlayCircle size={18} className="text-white" />
          <span className="text-white text-xs font-bold">{language === 'ar' ? 'شاهد' : 'Watch'}</span>
        </button>

        {/* Games - أخضر ليموني - في المنتصف */}
        <button
          onClick={() => onNavigate('games')}
          className={`flex items-center gap-1.5 px-5 py-2.5 rounded-2xl transition-all shadow-lg ${
            currentPage === 'games'
              ? 'bg-gradient-to-r from-lime-400 to-lime-500 shadow-lime-400/40'
              : 'bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-400 hover:to-lime-500 shadow-lime-500/30'
          }`}
          data-testid="nav-games"
        >
          <Gamepad2 size={20} className="text-white" />
          <span className="text-white text-sm font-bold">{language === 'ar' ? 'ألعاب' : 'Games'}</span>
        </button>

        {/* Advertise */}
        <button
          onClick={() => onNavigate('advertiser')}
          className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all duration-200 ${
            currentPage === 'advertiser'
              ? 'text-[#60a5fa]'
              : 'text-gray-500 hover:text-gray-300'
          }`}
          data-testid="nav-advertiser"
        >
          <Megaphone size={22} strokeWidth={currentPage === 'advertiser' ? 2.5 : 2} />
          <span className={`text-[10px] ${currentPage === 'advertiser' ? 'font-semibold' : 'font-medium'}`}>
            {language === 'ar' ? 'أعلن' : 'Advertise'}
          </span>
        </button>

        {/* Profile */}
        <button
          onClick={() => onNavigate('profile')}
          className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all duration-200 ${
            currentPage === 'profile'
              ? 'text-[#60a5fa]'
              : 'text-gray-500 hover:text-gray-300'
          }`}
          data-testid="nav-profile"
        >
          <User size={22} strokeWidth={currentPage === 'profile' ? 2.5 : 2} />
          <span className={`text-[10px] ${currentPage === 'profile' ? 'font-semibold' : 'font-medium'}`}>
            {language === 'ar' ? 'حسابي' : 'Profile'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default BottomNav;
