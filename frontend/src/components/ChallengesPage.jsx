import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Flame, Calendar, Star, Gift, CheckCircle, Lock, ArrowLeft, Zap, Target, LogIn, Rocket, Film, PlayCircle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { toast } from '../hooks/use-toast';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ChallengesPage = ({ user, onNavigate, onPointsEarned }) => {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [challenges, setChallenges] = useState([]);
  const [loginRewards, setLoginRewards] = useState([]);
  const [stats, setStats] = useState({});
  const [claimingId, setClaimingId] = useState(null);

  // Default challenges for display
  const defaultChallenges = [
    { id: 'watch_5_ads', title: language === 'ar' ? 'مشاهد نشط' : 'Active Viewer', description: language === 'ar' ? 'شاهد 5 إعلانات' : 'Watch 5 ads', target: 5, current: 0, points: 15, icon: 'play-circle', completed: false, claimed: false, can_claim: false },
    { id: 'watch_10_ads', title: language === 'ar' ? 'مشاهد متفاني' : 'Dedicated Viewer', description: language === 'ar' ? 'شاهد 10 إعلانات' : 'Watch 10 ads', target: 10, current: 0, points: 25, icon: 'film', completed: false, claimed: false, can_claim: false },
    { id: 'daily_login', title: language === 'ar' ? 'الحضور اليومي' : 'Daily Login', description: language === 'ar' ? 'سجل دخولك اليوم' : 'Login today', target: 1, current: 0, points: 10, icon: 'log-in', completed: false, claimed: false, can_claim: false },
    { id: 'first_ad', title: language === 'ar' ? 'البداية' : 'First Step', description: language === 'ar' ? 'شاهد إعلانك الأول اليوم' : 'Watch first ad today', target: 1, current: 0, points: 5, icon: 'rocket', completed: false, claimed: false, can_claim: false },
    { id: 'streak_bonus', title: language === 'ar' ? 'سلسلة النشاط' : 'Activity Streak', description: language === 'ar' ? 'حافظ على نشاطك 3 أيام متتالية' : '3 days streak', target: 3, current: 0, points: 14, icon: 'flame', completed: false, claimed: false, can_claim: false },
  ];

  // Default login rewards
  const defaultLoginRewards = [
    { day: 1, points: 5, claimed: false, can_claim: false, unlocked: false },
    { day: 2, points: 5, claimed: false, can_claim: false, unlocked: false },
    { day: 3, points: 8, claimed: false, can_claim: false, unlocked: false },
    { day: 4, points: 8, claimed: false, can_claim: false, unlocked: false },
    { day: 5, points: 10, claimed: false, can_claim: false, unlocked: false },
    { day: 6, points: 10, claimed: false, can_claim: false, unlocked: false },
    { day: 7, points: 15, claimed: false, can_claim: false, unlocked: false },
    { day: 8, points: 10, claimed: false, can_claim: false, unlocked: false },
    { day: 9, points: 10, claimed: false, can_claim: false, unlocked: false },
    { day: 10, points: 12, claimed: false, can_claim: false, unlocked: false },
    { day: 11, points: 12, claimed: false, can_claim: false, unlocked: false },
    { day: 12, points: 15, claimed: false, can_claim: false, unlocked: false },
    { day: 13, points: 15, claimed: false, can_claim: false, unlocked: false },
    { day: 14, points: 15, claimed: false, can_claim: false, unlocked: false },
  ];

  const fetchData = useCallback(async () => {
    // Skip API calls for guest users
    if (user?.isGuest) {
      setChallenges(defaultChallenges);
      setLoginRewards(defaultLoginRewards);
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('user_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
      const [challengesRes, rewardsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/challenges/daily`, { headers, credentials: 'include' }),
        fetch(`${API_URL}/api/challenges/login-rewards`, { headers, credentials: 'include' }),
        fetch(`${API_URL}/api/challenges/stats`, { headers, credentials: 'include' }),
      ]);

      if (challengesRes.ok) {
        const data = await challengesRes.json();
        setChallenges(data.challenges || defaultChallenges);
      } else {
        setChallenges(defaultChallenges);
      }

      if (rewardsRes.ok) {
        const data = await rewardsRes.json();
        setLoginRewards(data.rewards || defaultLoginRewards);
        setStats(prev => ({ ...prev, loginDays: data.login_days, claimedRewardPoints: data.claimed_points }));
      } else {
        setLoginRewards(defaultLoginRewards);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
      setChallenges(defaultChallenges);
      setLoginRewards(defaultLoginRewards);
    } finally {
      setLoading(false);
    }
  }, [user?.isGuest, language]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const claimChallenge = async (challengeId) => {
    if (user?.isGuest) {
      toast({
        title: language === 'ar' ? 'سجّل الدخول أولاً' : 'Login Required',
        description: language === 'ar' ? 'سجل دخولك للحصول على المكافآت' : 'Please login to claim rewards',
        variant: 'destructive'
      });
      return;
    }

    setClaimingId(challengeId);
    const token = localStorage.getItem('user_token');
    try {
      const response = await fetch(`${API_URL}/api/challenges/daily/claim`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ challenge_id: challengeId }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: language === 'ar' ? 'مبروك!' : 'Congratulations!',
          description: data.message,
        });
        if (onPointsEarned) onPointsEarned(data.points_earned);
        fetchData();
      } else {
        const error = await response.json();
        toast({
          title: language === 'ar' ? 'خطأ' : 'Error',
          description: error.detail || 'Failed to claim reward',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'حدث خطأ في الاتصال' : 'Connection error',
        variant: 'destructive'
      });
    } finally {
      setClaimingId(null);
    }
  };

  const claimLoginReward = async (day) => {
    if (user?.isGuest) {
      toast({
        title: language === 'ar' ? 'سجّل الدخول أولاً' : 'Login Required',
        description: language === 'ar' ? 'سجل دخولك للحصول على المكافآت' : 'Please login to claim rewards',
        variant: 'destructive'
      });
      return;
    }

    setClaimingId(`day-${day}`);
    const token = localStorage.getItem('user_token');
    try {
      const response = await fetch(`${API_URL}/api/challenges/login-rewards/claim`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ day }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: language === 'ar' ? 'مبروك!' : 'Congratulations!',
          description: data.message,
        });
        if (onPointsEarned) onPointsEarned(data.points_earned);
        fetchData();
      } else {
        const error = await response.json();
        toast({
          title: language === 'ar' ? 'خطأ' : 'Error',
          description: error.detail || 'Failed to claim reward',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'حدث خطأ في الاتصال' : 'Connection error',
        variant: 'destructive'
      });
    } finally {
      setClaimingId(null);
    }
  };

  const getIconComponent = (iconName) => {
    const icons = {
      'play-circle': PlayCircle,
      'film': Film,
      'log-in': LogIn,
      'rocket': Rocket,
      'flame': Flame,
    };
    return icons[iconName] || Target;
  };

  const todayPoints = stats?.today?.challenge_points || 0;
  const monthRewardPoints = stats?.this_month?.login_reward_points || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-24" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-lg mx-auto px-4 pt-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-[#fbbf24]/15 flex items-center justify-center">
            <Trophy className="w-7 h-7 text-[#fbbf24]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              {language === 'ar' ? 'التحديات والمكافآت' : 'Challenges & Rewards'}
            </h1>
            <p className="text-white/50 text-sm">
              {language === 'ar' ? 'اكسب نقاط إضافية يومياً' : 'Earn extra points daily'}
            </p>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-center">
            <Target className="w-5 h-5 text-[#22c55e] mx-auto mb-2" />
            <p className="text-white font-bold text-lg">{todayPoints}/69</p>
            <p className="text-white/50 text-xs">{language === 'ar' ? 'نقاط اليوم' : 'Today'}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-center">
            <Calendar className="w-5 h-5 text-[#60a5fa] mx-auto mb-2" />
            <p className="text-white font-bold text-lg">{monthRewardPoints}/150</p>
            <p className="text-white/50 text-xs">{language === 'ar' ? 'مكافآت الشهر' : 'Monthly'}</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 text-center">
            <Flame className="w-5 h-5 text-[#f97316] mx-auto mb-2" />
            <p className="text-white font-bold text-lg">{stats?.streak_days || 0}</p>
            <p className="text-white/50 text-xs">{language === 'ar' ? 'أيام متتالية' : 'Streak'}</p>
          </div>
        </div>

        {/* Daily Challenges Section */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#fbbf24]/15 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#fbbf24]" />
            </div>
            <div>
              <h2 className="text-white font-bold">
                {language === 'ar' ? 'التحديات اليومية' : 'Daily Challenges'}
              </h2>
              <p className="text-white/50 text-xs">
                {language === 'ar' ? 'الحد الأقصى: 69 نقطة يومياً' : 'Max: 69 points daily'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {challenges.map((challenge) => {
              const Icon = getIconComponent(challenge.icon);
              const progress = (challenge.current / challenge.target) * 100;
              const isClaiming = claimingId === challenge.id;

              return (
                <div key={challenge.id} className="bg-black/30 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center ${
                      challenge.completed ? 'bg-[#22c55e]/15' : 'bg-white/5'
                    }`}>
                      <Icon className={`w-5 h-5 ${challenge.completed ? 'text-[#22c55e]' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">{challenge.title}</p>
                      <p className="text-white/50 text-xs">{challenge.description}</p>
                    </div>
                    <div className="bg-[#fbbf24]/15 px-3 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 text-[#fbbf24]" />
                      <span className="text-[#fbbf24] text-sm font-bold">{challenge.points}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#3b82f6] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <span className="text-white/50 text-xs min-w-[40px]">
                      {challenge.current}/{challenge.target}
                    </span>
                  </div>

                  {challenge.claimed ? (
                    <div className="bg-[#22c55e]/10 rounded-lg py-2 flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#22c55e]" />
                      <span className="text-[#22c55e] text-sm font-medium">
                        {language === 'ar' ? 'تم الاستلام' : 'Claimed'}
                      </span>
                    </div>
                  ) : challenge.can_claim ? (
                    <button
                      onClick={() => claimChallenge(challenge.id)}
                      disabled={isClaiming}
                      className="w-full bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 rounded-lg py-2.5 flex items-center justify-center gap-2 transition-colors"
                    >
                      {isClaiming ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Gift className="w-4 h-4 text-white" />
                          <span className="text-white text-sm font-bold">
                            {language === 'ar' ? 'استلم المكافأة' : 'Claim Reward'}
                          </span>
                        </>
                      )}
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* 14-Day Login Rewards Section */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#ec4899]/15 flex items-center justify-center">
              <Gift className="w-5 h-5 text-[#ec4899]" />
            </div>
            <div>
              <h2 className="text-white font-bold">
                {language === 'ar' ? 'مكافآت تسجيل الدخول' : 'Login Rewards'}
              </h2>
              <p className="text-white/50 text-xs">
                {language === 'ar' ? '14 يوم = 150 نقطة شهرياً' : '14 days = 150 points monthly'}
              </p>
            </div>
          </div>

          <div className="bg-[#3b82f6]/10 rounded-lg py-2 px-3 mb-4 flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4 text-[#60a5fa]" />
            <span className="text-[#60a5fa] text-sm">
              {language === 'ar' 
                ? `أيام التسجيل هذا الشهر: ${stats?.loginDays || 0} يوم`
                : `Login days this month: ${stats?.loginDays || 0}`}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {loginRewards.map((reward) => {
              const isClaiming = claimingId === `day-${reward.day}`;
              const isSpecialDay = reward.day === 7 || reward.day === 14;

              return (
                <button
                  key={reward.day}
                  onClick={() => reward.can_claim && claimLoginReward(reward.day)}
                  disabled={!reward.can_claim || isClaiming}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center border transition-all ${
                    reward.claimed 
                      ? 'bg-[#22c55e]/15 border-[#22c55e]/30' 
                      : reward.can_claim 
                        ? 'bg-[#3b82f6]/15 border-[#3b82f6] border-2 cursor-pointer hover:bg-[#3b82f6]/25' 
                        : !reward.unlocked 
                          ? 'bg-white/5 border-white/10 opacity-50' 
                          : 'bg-white/5 border-white/10'
                  } ${isSpecialDay ? 'border-[#ec4899] border-2' : ''}`}
                >
                  {isClaiming ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className={`font-bold text-sm ${
                        reward.claimed ? 'text-[#22c55e]' : isSpecialDay ? 'text-[#ec4899]' : 'text-white'
                      }`}>
                        {reward.day}
                      </span>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {reward.claimed ? (
                          <CheckCircle className="w-3 h-3 text-[#22c55e]" />
                        ) : reward.unlocked ? (
                          <Star className="w-3 h-3 text-[#fbbf24]" />
                        ) : (
                          <Lock className="w-3 h-3 text-gray-500" />
                        )}
                        <span className={`text-[10px] font-medium ${
                          reward.claimed ? 'text-[#22c55e]' : !reward.unlocked ? 'text-gray-500' : 'text-[#fbbf24]'
                        }`}>
                          {reward.points}
                        </span>
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex justify-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
              <span className="text-white/50 text-xs">{language === 'ar' ? 'تم الاستلام' : 'Claimed'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#3b82f6]" />
              <span className="text-white/50 text-xs">{language === 'ar' ? 'جاهز للاستلام' : 'Ready'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-500" />
              <span className="text-white/50 text-xs">{language === 'ar' ? 'مقفل' : 'Locked'}</span>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-[#fbbf24]/[0.08] border border-[#fbbf24]/20 rounded-xl p-4 flex items-center justify-center gap-3">
          <Star className="w-5 h-5 text-[#fbbf24]" />
          <p className="text-white/70 text-sm">
            {language === 'ar' 
              ? 'سجل دخولك يومياً واحصل على مكافآت متزايدة!'
              : 'Login daily and get increasing rewards!'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChallengesPage;
