import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, Play, ChevronRight, BarChart3, Award, Calendar, Zap, Lightbulb, Star, Trophy, CheckCircle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const HomePage = ({ user, onNavigateToAds }) => {
  const { t, isRTL } = useLanguage();
  const [currentTip, setCurrentTip] = useState(0);
  const [settings, setSettings] = useState(null);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % (settings?.tips?.length || 5));
    }, 4000);
    return () => clearInterval(interval);
  }, [settings?.tips?.length]);

  const loadData = async () => {
    try {
      const settingsRes = await axios.get(`${API_URL}/api/settings/public/rewards`);
      setSettings(settingsRes.data);

      if (user?.id || user?.user_id) {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const analyticsRes = await axios.get(`${API_URL}/api/users/analytics`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            setUserAnalytics(analyticsRes.data);
          } catch (e) {
            console.log('Analytics not available');
          }
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const userPoints = user?.points || 0;
  const pointsPerDollar = settings?.points_per_dollar || 500;
  const userBalance = (userPoints / pointsPerDollar).toFixed(2);
  const watchedToday = user?.watched_today || userAnalytics?.today_watches || 0;
  const dailyLimit = settings?.daily_limit || 50;
  const pointsPerAd = settings?.points_per_ad || 5;

  const challenges = settings?.daily_challenges || [
    { title: t('watchedAds'), target: 5, reward: 25, icon: 'eye', desc: t('earnPerAd'), enabled: true },
  ];
  const today = new Date().getDate();
  const dailyChallenge = challenges[today % challenges.length];

  const tips = settings?.tips || [
    { icon: 'bulb', text: t('watchAdsEarnPoints'), enabled: true },
  ];

  const bgClass = 'bg-[#0a0a0f]';
  const cardClass = 'bg-[#111118]/80 backdrop-blur-xl border-white/10';
  const textClass = 'text-white';
  const textMutedClass = 'text-gray-400';
  const textDimClass = 'text-gray-500';

  if (isLoading) {
    return (
      <div className={`min-h-screen ${bgClass} flex flex-col items-center justify-center relative overflow-hidden`}>
        <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-[#3b82f6]/20 blur-3xl"></div>
        <div className="absolute bottom-[-150px] right-[-150px] w-[400px] h-[400px] rounded-full bg-[#3b82f6]/15 blur-3xl"></div>
        <div className="w-24 h-24 rounded-full bg-[#0a0a0f] border-2 border-[#3b82f6]/30 flex items-center justify-center overflow-hidden mb-4 animate-pulse shadow-lg shadow-[#3b82f6]/20">
          <img src="/logo_saqr.png" alt={t('appName')} className="w-20 h-20 object-contain" />
        </div>
        <div className={`${textClass} text-lg`}>{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} pb-28 relative overflow-y-auto overflow-x-hidden`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="fixed top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-[#3b82f6]/20 blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-[-150px] right-[-150px] w-[400px] h-[400px] rounded-full bg-[#3b82f6]/15 blur-3xl pointer-events-none"></div>
      
      <div className="relative z-10 pt-8 px-5 pb-6">
        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#0a0a0f] border-2 border-[#3b82f6]/30 flex items-center justify-center overflow-hidden shadow-lg shadow-[#3b82f6]/20">
              <img src="/logo_saqr.png" alt={t('appName')} className="w-11 h-11 object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-[#60a5fa]">{t('appName')}</h1>
          </div>
        </div>
        
        {/* Welcome */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-xl font-bold ${textClass}`}>{t('welcome')} {user?.name || ''}</h2>
            <p className={`${textMutedClass} text-sm mt-1`}>{t('watchAdsEarnPoints')}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-[#3b82f6]/20 border border-[#3b82f6]/30 rounded-full px-4 py-2 flex items-center gap-1">
              <Star className="w-4 h-4 text-[#60a5fa]" />
              <span className="text-[#60a5fa] font-bold">{userPoints}</span>
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-r from-[#3b82f6] to-[#6366f1] rounded-3xl p-6 mb-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm mb-1">{t('currentBalance')}</p>
              <p className="text-4xl font-bold text-white">${userBalance}</p>
              <p className="text-white/60 text-xs mt-2">{userPoints} {t('points')}</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Watch Button */}
        <button
          onClick={onNavigateToAds}
          className="w-full bg-gradient-to-r from-[#ef4444] to-[#ec4899] hover:from-[#dc2626] hover:to-[#db2777] rounded-2xl p-5 mb-6 shadow-xl transform transition-all hover:scale-[1.02] active:scale-[0.98]"
          data-testid="start-watching-btn"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                <Play className="w-8 h-8 text-white fill-white" />
              </div>
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <p className="text-white font-bold text-lg">{t('startWatching')}</p>
                <p className="text-white/80 text-sm">{t('earnPerAd')}</p>
              </div>
            </div>
            <ChevronRight className={`w-6 h-6 text-white ${isRTL ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Stats */}
        <div className={`${cardClass} rounded-2xl p-5 mb-6 border`}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-[#60a5fa]" />
            <h3 className={`${textClass} font-bold`}>{t('yourStats')}</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-green-400" />
                <span className={`${textDimClass} text-xs`}>{t('today')}</span>
              </div>
              <p className={`${textClass} text-xl font-bold`}>{watchedToday}</p>
              <p className={`${textDimClass} text-xs`}>{dailyLimit} {t('available')}</p>
              <div className="mt-2 bg-white/10 rounded-full h-1.5">
                <div 
                  className="bg-green-400 h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min((watchedToday / dailyLimit) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-[#60a5fa]" />
                <span className={`${textDimClass} text-xs`}>{t('remaining')}</span>
              </div>
              <p className={`${textClass} text-xl font-bold`}>{Math.max(dailyLimit - watchedToday, 0)}</p>
              <p className={`${textDimClass} text-xs`}>{t('available')}</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-yellow-400" />
                <span className={`${textDimClass} text-xs`}>{t('totalPoints')}</span>
              </div>
              <p className={`${textClass} text-xl font-bold`}>{user?.total_earned || userPoints}</p>
              <p className={`${textDimClass} text-xs`}>{t('points')}</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-[#a855f7]" />
                <span className={`${textDimClass} text-xs`}>{t('earnRate')}</span>
              </div>
              <p className={`${textClass} text-xl font-bold`}>{pointsPerAd}</p>
              <p className={`${textDimClass} text-xs`}>{t('points')}</p>
            </div>
          </div>
        </div>

        {/* Daily Challenge */}
        {dailyChallenge && dailyChallenge.enabled && (
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-amber-400 font-bold">{dailyChallenge.title}</p>
                <p className={`${textMutedClass} text-sm`}>{dailyChallenge.desc}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1 bg-white/10 rounded-full h-2 mx-4">
                <div 
                  className="bg-amber-400 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((watchedToday / dailyChallenge.target) * 100, 100)}%` }}
                />
              </div>
              <span className="text-amber-400 text-sm font-bold flex items-center gap-1">
                <Star className="w-3 h-3" /> +{dailyChallenge.reward}
              </span>
            </div>
            <p className={`${textDimClass} text-xs mt-2 text-center flex items-center justify-center gap-1`}>
              {watchedToday >= dailyChallenge.target ? (
                <><CheckCircle className="w-3 h-3 text-green-400" /> {t('success')}</>
              ) : (
                `${watchedToday}/${dailyChallenge.target}`
              )}
            </p>
          </div>
        )}

        {/* Tips */}
        {tips.length > 0 && (
          <div className={`${cardClass} rounded-2xl p-4 border`}>
            <div className="flex items-center gap-3">
              <Lightbulb className="w-5 h-5 text-amber-400 animate-pulse" />
              <p className={`${textMutedClass} text-sm`}>{tips[currentTip % tips.length]?.text || t('watchAdsEarnPoints')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
