import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, Play, ChevronRight, BarChart3, Award, Calendar, Zap, Lightbulb, Star, Trophy, CheckCircle, Timer, PlayCircle, Film, LogIn, Rocket, Gift, MessageCircle, Users, Flame, Gamepad2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import LanguageSwitcher from './LanguageSwitcher';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const HomePage = ({ user, onNavigateToAds, onNavigate }) => {
  const { t, isRTL, language } = useLanguage();
  const { isDark } = useTheme();
  const [currentTip, setCurrentTip] = useState(0);
  const [settings, setSettings] = useState(null);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyChallenges, setDailyChallenges] = useState([]);
  const [challengeStats, setChallengeStats] = useState({ earned_today: 0, max_daily_points: 69 });

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

      const token = localStorage.getItem('user_token');
      
      if (token) {
        // Fetch daily challenges from challenges API
        try {
          const challengesRes = await axios.get(`${API_URL}/api/challenges/daily`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setDailyChallenges(challengesRes.data.challenges || []);
          setChallengeStats({
            earned_today: challengesRes.data.earned_today || 0,
            max_daily_points: challengesRes.data.max_daily_points || 69
          });
        } catch (e) {
          console.log('Challenges not available');
        }

        // Fetch user analytics
        try {
          const analyticsRes = await axios.get(`${API_URL}/api/users/analytics`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUserAnalytics(analyticsRes.data);
        } catch (e) {
          console.log('Analytics not available');
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

  // Get icon component for challenge
  const getChallengeIcon = (iconName) => {
    const icons = {
      'play-circle': PlayCircle,
      'film': Film,
      'log-in': LogIn,
      'rocket': Rocket,
      'timer': Timer,
    };
    return icons[iconName] || Trophy;
  };

  const tips = settings?.tips || [
    { icon: 'bulb', text: t('watchAdsEarnPoints'), enabled: true },
  ];

  // Dynamic theme classes
  const bgClass = isDark ? 'bg-[#0a0a0f]' : 'bg-gray-50';
  const cardClass = isDark ? 'bg-[#111118]/80 backdrop-blur-xl border-white/10' : 'bg-white border-gray-200 shadow-sm';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const textMutedClass = isDark ? 'text-gray-400' : 'text-gray-600';
  const textDimClass = isDark ? 'text-gray-500' : 'text-gray-500';

  if (isLoading) {
    return (
      <div className={`min-h-screen ${bgClass} flex flex-col items-center justify-center relative overflow-hidden`}>
        {isDark && <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-[#3b82f6]/20 blur-3xl"></div>}
        {isDark && <div className="absolute bottom-[-150px] right-[-150px] w-[400px] h-[400px] rounded-full bg-[#3b82f6]/15 blur-3xl"></div>}
        <div className={`w-24 h-24 rounded-full ${isDark ? 'bg-[#0a0a0f] border-[#3b82f6]/30' : 'bg-white border-blue-200'} border-2 flex items-center justify-center overflow-hidden mb-4 animate-pulse shadow-lg ${isDark ? 'shadow-[#3b82f6]/20' : 'shadow-blue-100'}`}>
          <img src="/logo_saqr.png" alt={t('appName')} className="w-20 h-20 object-contain" />
        </div>
        <div className={`${textClass} text-lg`}>{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} pb-28 relative overflow-y-auto overflow-x-hidden`} dir={isRTL ? 'rtl' : 'ltr'}>
      {isDark && <div className="fixed top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-[#3b82f6]/20 blur-3xl pointer-events-none"></div>}
      {isDark && <div className="fixed bottom-[-150px] right-[-150px] w-[400px] h-[400px] rounded-full bg-[#3b82f6]/15 blur-3xl pointer-events-none"></div>}
      
      {/* Language Switcher - Fixed Position */}
      <div className="fixed top-4 left-4 z-50">
        <LanguageSwitcher />
      </div>
      
      <div className="relative z-10 pt-8 px-5 pb-6">
        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-full ${isDark ? 'bg-[#0a0a0f] border-[#3b82f6]/30' : 'bg-white border-blue-200'} border-2 flex items-center justify-center overflow-hidden shadow-lg ${isDark ? 'shadow-[#3b82f6]/20' : 'shadow-blue-100'}`}>
              <img src="/logo_saqr.png" alt={t('appName')} className="w-11 h-11 object-contain" />
            </div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-[#60a5fa]' : 'text-blue-600'}`}>{t('appName')}</h1>
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

        {/* Balance Card - New Image Design */}
        <div className="rounded-3xl mb-6 shadow-xl relative overflow-hidden h-32 group">
          <img 
            src="https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/80a9b958945b14e3f85f8b8e2b49544963122866ce9cdc8af6f2ab70c5c8bb31.png"
            alt="الرصيد"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/30" />
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="text-center">
              <p className="text-white/80 text-sm mb-2">{t('currentBalance')}</p>
              <div className="flex items-center justify-center gap-8">
                <div className="flex items-center gap-2">
                  <Star className="w-6 h-6 text-yellow-400" />
                  <span className="text-3xl font-bold text-white drop-shadow-lg">{userPoints}</span>
                  <span className="text-white/70 text-sm">نقاط</span>
                </div>
                <div className="w-px h-10 bg-white/30" />
                <div className="flex items-center gap-2">
                  <Gift className="w-6 h-6 text-blue-400" />
                  <span className="text-3xl font-bold text-white drop-shadow-lg">{user?.diamonds || 0}</span>
                  <span className="text-white/70 text-sm">ألماسة</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Watch Button - New Image Design */}
        <button
          onClick={onNavigateToAds}
          className="w-full rounded-2xl mb-4 shadow-xl transform transition-all hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden h-32 group"
          data-testid="start-watching-btn"
        >
          <img 
            src="https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/e14c91a9e40e8d29b6f8d3bf567a4fcb7020c985b1a9d3e96e2035b06f9921e6.png"
            alt="شاهد واربح"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10 group-hover:from-black/80 transition-all" />
          <div className="absolute inset-0 flex items-end p-5">
            <div className="flex items-center justify-between w-full">
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <p className="text-white font-bold text-xl drop-shadow-lg mb-1">{t('startWatching')}</p>
                <p className="text-white/90 text-sm">{t('earnPerAd')}</p>
              </div>
              <div className="bg-gradient-to-r from-red-500 to-pink-500 px-5 py-3 rounded-xl flex items-center gap-2">
                <Play className="w-5 h-5 text-white fill-white" />
                <span className="text-white font-bold">ابدأ</span>
              </div>
            </div>
          </div>
        </button>

        {/* Saqr Fortunes Button - New Image Design */}
        <button
          onClick={() => onNavigate('fortunes')}
          className="w-full rounded-2xl mb-4 shadow-xl transform transition-all hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden h-36 group"
          data-testid="saqr-fortunes-btn"
        >
          <img 
            src="https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/8cdadba2892459ff5914f65842239cb7d223d973dca3d9c0e02dc176bdacf78d.png"
            alt="ثروات صقر"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10 group-hover:from-black/80 transition-all" />
          <div className="absolute inset-0 flex items-end p-5">
            <div className="flex items-center justify-between w-full">
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white font-bold text-xl drop-shadow-lg">ثروات صقر</p>
                  <span className="bg-green-500 text-white text-xs px-2.5 py-1 rounded-full font-bold">جديد</span>
                </div>
                <p className="text-white/90 text-sm">جواهر صقر للاستبدال بالمال!</p>
              </div>
              <div className="bg-pink-500 px-4 py-2.5 rounded-xl flex items-center gap-2">
                <span className="text-white font-bold text-sm">ابدأ</span>
                <ChevronRight className={`w-5 h-5 text-white ${isRTL ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </div>
        </button>

        {/* Global Chat Button - New Image Design */}
        <button
          onClick={() => onNavigate('chat')}
          className="w-full rounded-2xl mb-4 shadow-xl transform transition-all hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden h-32 group"
          data-testid="global-chat-btn"
        >
          <img 
            src="https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/bcdacd75d090c4626f5432d13b9b6c4c4560cc34282e9424de1cbc6732f06abf.png"
            alt="الدردشة العامة"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10 group-hover:from-black/80 transition-all" />
          <div className="absolute inset-0 flex items-end p-5">
            <div className="flex items-center justify-between w-full">
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white font-bold text-lg drop-shadow-lg">الدردشة العامة</p>
                  <span className="bg-blue-500/60 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Gift className="w-3 h-3" />5
                  </span>
                </div>
                <p className="text-white/90 text-sm">تواصل مع لاعبين من حول العالم!</p>
              </div>
              <div className="bg-blue-500 px-4 py-2.5 rounded-xl flex items-center gap-2">
                <span className="text-white font-bold text-sm">انضم</span>
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </button>

        {/* Friends Button - New Image Design */}
        <button
          onClick={() => onNavigate('friends')}
          className="w-full rounded-2xl mb-6 shadow-xl transform transition-all hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden h-28 group"
          data-testid="friends-btn"
        >
          <img 
            src="https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/7f2948052c933ae7604200fd2c98d91f4504fce293deb36ce108cba1d36f062a.png"
            alt="الأصدقاء"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10 group-hover:from-black/80 transition-all" />
          <div className="absolute inset-0 flex items-end p-5">
            <div className="flex items-center justify-between w-full">
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <p className="text-white font-bold text-lg drop-shadow-lg mb-1">الأصدقاء والبريد</p>
                <p className="text-white/90 text-sm">أضف أصدقاء وادعهم للألعاب!</p>
              </div>
              <div className="bg-green-500 p-3 rounded-xl">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </button>

        {/* Stats - New Professional Design */}
        <div className="rounded-2xl mb-6 overflow-hidden shadow-xl" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 className="w-5 h-5 text-[#60a5fa]" />
              <h3 className="text-white font-bold">{t('yourStats')}</h3>
            </div>
            
            {/* Stats Row */}
            <div className="flex items-center justify-around mb-5">
              {/* Games Played */}
              <div className="text-center">
                <div className="w-11 h-11 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
                  <Gamepad2 className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-white">{user?.games_played || 0}</p>
                <p className="text-xs text-white/60">مباراة لُعبت</p>
              </div>
              
              {/* Divider */}
              <div className="w-px h-12 bg-white/10" />
              
              {/* Wins */}
              <div className="text-center">
                <div className="w-11 h-11 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                </div>
                <p className="text-2xl font-bold text-white">{user?.games_won || 0}</p>
                <p className="text-xs text-white/60">انتصار</p>
              </div>
              
              {/* Divider */}
              <div className="w-px h-12 bg-white/10" />
              
              {/* Win Rate */}
              <div className="text-center">
                <div className="w-11 h-11 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {(user?.games_played || 0) > 0 ? Math.round(((user?.games_won || 0) / (user?.games_played || 1)) * 100) : 0}%
                </p>
                <p className="text-xs text-white/60">نسبة الفوز</p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="bg-black/20 rounded-xl p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-white/70">تقدمك نحو المستوى التالي</span>
                <span className="text-xs text-blue-400 font-semibold">{Math.min(userPoints % 100, 100)}/100</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${Math.min(userPoints % 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Daily Challenges - New Image Design */}
        <button className="w-full rounded-2xl mb-4 shadow-xl transform transition-all hover:scale-[1.02] relative overflow-hidden h-24 group">
          <img 
            src="https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/9571396ba276f9f9cf70ce0622c4303850d05054256c99581ef235eec62d9760.png"
            alt="التحدي اليومي"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10 group-hover:from-black/80 transition-all" />
          <div className="absolute inset-0 flex items-end p-4">
            <div className="flex items-center justify-between w-full">
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <p className="text-white font-bold text-lg drop-shadow-lg">{language === 'ar' ? 'التحدي اليومي' : 'Daily Challenge'}</p>
                <p className="text-white/90 text-sm">{language === 'ar' ? 'اربح نقاط إضافية!' : 'Earn bonus points!'}</p>
              </div>
              <div className="bg-amber-500 p-3 rounded-xl">
                <Flame className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </button>

        {/* Multiplayer - New Image Design */}
        <button 
          onClick={() => onNavigate('games')}
          className="w-full rounded-2xl mb-6 shadow-xl transform transition-all hover:scale-[1.02] relative overflow-hidden h-28 group"
        >
          <img 
            src="https://static.prod-images.emergentagent.com/jobs/3943d011-4c0b-4252-9b99-046dc8c507ce/images/45a8a3fbd10c46b785a5178ca02ae00c0c4aa43973b95689ebf41e18eb5cbada.png"
            alt="اللعب الجماعي"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10 group-hover:from-black/80 transition-all" />
          <div className="absolute inset-0 flex items-end p-4">
            <div className="flex items-center justify-between w-full">
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <p className="text-white font-bold text-lg drop-shadow-lg">{language === 'ar' ? 'اللعب الجماعي' : 'Multiplayer'}</p>
                <p className="text-white/90 text-sm">{language === 'ar' ? 'تحدى لاعبين من حول العالم!' : 'Challenge players worldwide!'}</p>
              </div>
              <div className="bg-purple-500 px-4 py-2.5 rounded-xl flex items-center gap-2">
                <span className="text-white font-bold text-sm">{language === 'ar' ? 'ابدأ' : 'Start'}</span>
                <ChevronRight className={`w-4 h-4 text-white ${isRTL ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </div>
        </button>

        {/* Daily Challenges from API */}
        {dailyChallenges.length > 0 && (
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-amber-400 font-bold">{language === 'ar' ? 'التحديات اليومية' : 'Daily Challenges'}</p>
                  <p className={`${textMutedClass} text-sm`}>{challengeStats.earned_today}/{challengeStats.max_daily_points} {language === 'ar' ? 'نقطة' : 'points'}</p>
                </div>
              </div>
              <button 
                onClick={() => onNavigate && onNavigate('challenges')}
                className="text-amber-400 text-sm flex items-center gap-1 hover:text-amber-300 transition-colors"
              >
                {language === 'ar' ? 'عرض الكل' : 'View All'}
                <ChevronRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            </div>
            
            <div className="space-y-3">
              {dailyChallenges.slice(0, 3).map((challenge) => {
                const Icon = getChallengeIcon(challenge.icon);
                const progress = (challenge.current / challenge.target) * 100;
                
                return (
                  <div key={challenge.id} className="bg-black/20 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        challenge.completed ? 'bg-green-500/20' : 'bg-white/5'
                      }`}>
                        <Icon className={`w-4 h-4 ${challenge.completed ? 'text-green-400' : 'text-gray-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`${textClass} text-sm font-medium truncate`}>{challenge.title}</p>
                          <div className="flex items-center gap-1 ml-2">
                            <Star className="w-3 h-3 text-amber-400" />
                            <span className="text-amber-400 text-xs font-bold">{challenge.points}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-white/10 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full transition-all ${challenge.completed ? 'bg-green-400' : 'bg-amber-400'}`}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          <span className={`${textDimClass} text-xs`}>
                            {challenge.claimed ? (
                              <span className="text-green-400 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                              </span>
                            ) : challenge.can_claim ? (
                              <span className="text-green-400 flex items-center gap-1">
                                <Gift className="w-3 h-3" />
                              </span>
                            ) : (
                              `${challenge.current}/${challenge.target}`
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
