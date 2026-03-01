// صفحة ثروات صقر للويب - Saqr Fortunes Web Page
// نظام مشاهدة الإعلانات الممتع مع عجلة الحظ وصناديق الكنز
// 500 ألماسة = 1 دولار

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Diamond, Play, Gift, Flame, Trophy, Star, Zap, Clock, TrendingUp, ChevronRight, Sparkles } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ==================== ثوابت النظام ====================
const GEMS_PER_RIYAL = 500;
const AD_DURATION_SECONDS = 30;
const MAX_DAILY_ADS = 50;

// مكافآت Streak
const STREAK_BONUSES = {
  3: 5,
  5: 10,
  10: 25,
  20: 60,
  30: 100,
};

// جوائز عجلة الحظ
const WHEEL_PRIZES = [
  { id: 1, diamonds: 1, probability: 0.30, color: '#3b82f6', label: '1' },
  { id: 2, diamonds: 2, probability: 0.25, color: '#22c55e', label: '2' },
  { id: 3, diamonds: 3, probability: 0.20, color: '#f59e0b', label: '3' },
  { id: 4, diamonds: 5, probability: 0.12, color: '#ec4899', label: '5' },
  { id: 5, diamonds: 10, probability: 0.08, color: '#8b5cf6', label: '10' },
  { id: 6, diamonds: 25, probability: 0.04, color: '#ef4444', label: '25' },
  { id: 7, diamonds: 50, probability: 0.009, color: '#fbbf24', label: '50' },
  { id: 8, diamonds: 100, probability: 0.001, color: '#14b8a6', label: '100' },
];

// صناديق الكنز
const CHEST_TYPES = [
  { id: 'bronze', name: 'برونزي', adsRequired: 5, minReward: 5, maxReward: 15, color: '#cd7f32', gradient: 'from-amber-700 to-amber-900' },
  { id: 'silver', name: 'فضي', adsRequired: 15, minReward: 20, maxReward: 50, color: '#c0c0c0', gradient: 'from-gray-400 to-gray-600' },
  { id: 'gold', name: 'ذهبي', adsRequired: 30, minReward: 60, maxReward: 150, color: '#ffd700', gradient: 'from-yellow-400 to-yellow-600' },
  { id: 'platinum', name: 'بلاتيني', adsRequired: 50, minReward: 150, maxReward: 300, color: '#e5e4e2', gradient: 'from-slate-300 to-slate-500' },
  { id: 'legendary', name: 'أسطوري', adsRequired: 100, minReward: 350, maxReward: 750, color: '#9933ff', gradient: 'from-purple-500 to-purple-800' },
];

// التحديات اليومية
const DAILY_CHALLENGES = [
  { id: 'first_ad', title: 'أول إعلان', desc: 'شاهد إعلانك الأول اليوم', target: 1, reward: 3, icon: Play },
  { id: 'watch_5', title: 'مشاهد نشط', desc: 'شاهد 5 إعلانات', target: 5, reward: 10, icon: Star },
  { id: 'watch_10', title: 'مشاهد محترف', desc: 'شاهد 10 إعلانات', target: 10, reward: 25, icon: Trophy },
  { id: 'streak_3', title: 'المثابر', desc: 'شاهد 3 إعلانات متتالية', target: 3, reward: 15, icon: Flame },
];

// ==================== مكون عجلة الحظ ====================
const LuckyWheel = ({ onSpin, spinning, prize, onSpinComplete }) => {
  const canvasRef = useRef(null);
  const [rotation, setRotation] = useState(0);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw wheel
    const segmentAngle = (2 * Math.PI) / WHEEL_PRIZES.length;
    
    WHEEL_PRIZES.forEach((prize, index) => {
      const startAngle = index * segmentAngle + (rotation * Math.PI / 180);
      const endAngle = startAngle + segmentAngle;
      
      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = prize.color;
      ctx.fill();
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + segmentAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(`💎 ${prize.label}`, radius - 15, 5);
      ctx.restore();
    });
    
    // Draw center
    ctx.beginPath();
    ctx.arc(centerX, centerY, 35, 0, 2 * Math.PI);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw center text
    ctx.fillStyle = '#000';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('دوّر', centerX, centerY + 5);
  }, [rotation]);

  useEffect(() => {
    if (spinning && prize) {
      const prizeIndex = WHEEL_PRIZES.findIndex(p => p.id === prize.id);
      const segmentAngle = 360 / WHEEL_PRIZES.length;
      const targetRotation = 360 * 5 + (360 - prizeIndex * segmentAngle - segmentAngle / 2);
      
      let currentRotation = 0;
      const duration = 4000;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOut = 1 - Math.pow(1 - progress, 3);
        currentRotation = easeOut * targetRotation;
        setRotation(currentRotation);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          if (onSpinComplete) onSpinComplete();
        }
      };
      
      animate();
    }
  }, [spinning, prize, onSpinComplete]);

  return (
    <div className="relative flex flex-col items-center">
      {/* Pointer */}
      <div className="absolute -top-2 z-10 text-yellow-400 text-3xl">▼</div>
      
      {/* Wheel Canvas */}
      <canvas 
        ref={canvasRef} 
        width={280} 
        height={280} 
        className="cursor-pointer"
        onClick={!spinning ? onSpin : undefined}
      />
      
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full bg-yellow-400/20 blur-xl -z-10" />
    </div>
  );
};

// ==================== مكون مشاهدة الإعلان ====================
const AdWatchingModal = ({ visible, onComplete, onClose }) => {
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(AD_DURATION_SECONDS);
  const [isWatching, setIsWatching] = useState(false);

  useEffect(() => {
    if (visible && isWatching) {
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            onComplete();
            return 0;
          }
          return prev - 1;
        });
        setProgress(prev => Math.min(100, prev + (100 / AD_DURATION_SECONDS)));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [visible, isWatching, onComplete]);

  const startWatching = () => {
    setIsWatching(true);
    setProgress(0);
    setTimeLeft(AD_DURATION_SECONDS);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-[#1a1a2e] to-[#16213e] rounded-3xl max-w-md w-full p-8 text-center">
        {!isWatching ? (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Play className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">شاهد إعلان واربح!</h3>
            <p className="text-gray-400 mb-6">
              شاهد الإعلان لمدة {AD_DURATION_SECONDS} ثانية واحصل على فرصة لدوران عجلة الحظ
            </p>
            
            <div className="flex items-center justify-center gap-2 bg-blue-500/20 px-4 py-2 rounded-full mb-6">
              <Diamond className="w-5 h-5 text-blue-400" />
              <span className="text-blue-400 font-semibold">من 1 إلى 100 ألماسة!</span>
            </div>

            <button 
              onClick={startWatching}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 hover:from-green-600 hover:to-green-700 transition-all"
            >
              <Play className="w-6 h-6" />
              ابدأ المشاهدة
            </button>

            <button 
              onClick={onClose}
              className="mt-4 text-gray-500 hover:text-gray-400 transition-colors"
            >
              إلغاء
            </button>
          </>
        ) : (
          <>
            <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-blue-500/20 flex items-center justify-center animate-pulse">
              <Play className="w-14 h-14 text-blue-400" />
            </div>
            <p className="text-gray-400 mb-6">إعلان قيد العرض</p>

            <div className="mb-4">
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full bg-green-500 transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-2xl font-bold text-white">{timeLeft} ثانية</span>
            </div>

            <div className="flex items-center justify-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-lg">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 text-sm">لا تغلق النافذة للحصول على المكافأة</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ==================== مكون نتيجة المكافأة ====================
const RewardResultModal = ({ visible, diamonds, onClose, bonusReason }) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-[#1a1a2e] to-[#16213e] rounded-3xl max-w-sm w-full p-8 text-center animate-scale-in">
        {/* Confetti effect placeholder */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 50}%`,
                backgroundColor: ['#fbbf24', '#22c55e', '#ec4899', '#60a5fa'][i % 4],
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            />
          ))}
        </div>

        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-blue-500/20 flex items-center justify-center border-4 border-blue-400 animate-bounce">
          <Diamond className="w-12 h-12 text-blue-400" />
        </div>

        <h3 className="text-2xl font-bold text-white mb-2">
          {bonusReason ? 'مكافأة إضافية!' : 'مبروك!'}
        </h3>
        
        <div className="text-6xl font-extrabold text-blue-400 mb-2">+{diamonds}</div>
        <p className="text-gray-400 mb-4">ألماسة</p>

        {bonusReason && (
          <div className="flex items-center justify-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full mb-4">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 text-sm">{bonusReason}</span>
          </div>
        )}

        <div className="text-green-400 text-sm mb-6">
          قيمتها: ${(diamonds / DIAMONDS_PER_DOLLAR).toFixed(3)}
        </div>

        <button 
          onClick={onClose}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all"
        >
          رائع!
        </button>
      </div>
    </div>
  );
};

// ==================== مكون صندوق الكنز ====================
const TreasureChestCard = ({ chest, progress, onOpen }) => {
  const canOpen = progress >= chest.adsRequired;
  const progressPercent = (progress / chest.adsRequired) * 100;

  return (
    <div 
      className={`relative p-4 rounded-xl border transition-all cursor-pointer ${
        canOpen 
          ? `bg-gradient-to-br ${chest.gradient} border-white/30 shadow-lg shadow-${chest.color}/30 animate-pulse` 
          : 'bg-gray-800/50 border-gray-700'
      }`}
      onClick={canOpen ? onOpen : undefined}
    >
      {canOpen && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          افتح!
        </div>
      )}

      <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
        canOpen ? 'bg-white/20' : 'bg-gray-700'
      }`}>
        <Gift className={`w-6 h-6 ${canOpen ? 'text-white' : 'text-gray-500'}`} />
      </div>

      <h4 className={`text-sm font-semibold text-center mb-1 ${canOpen ? 'text-white' : 'text-gray-400'}`}>
        {chest.name}
      </h4>

      <div className="flex items-center justify-center gap-1 mb-2">
        <Diamond className={`w-3 h-3 ${canOpen ? 'text-blue-300' : 'text-gray-500'}`} />
        <span className={`text-xs ${canOpen ? 'text-blue-300' : 'text-gray-500'}`}>
          {chest.minReward}-{chest.maxReward}
        </span>
      </div>

      <div className="h-1 bg-gray-700 rounded-full overflow-hidden mb-1">
        <div 
          className="h-full rounded-full transition-all"
          style={{ 
            width: `${Math.min(100, progressPercent)}%`,
            backgroundColor: canOpen ? '#22c55e' : chest.color 
          }}
        />
      </div>
      <p className="text-xs text-center text-gray-500">{progress}/{chest.adsRequired}</p>
    </div>
  );
};

// ==================== المكون الرئيسي ====================
const SaqrFortunesPage = ({ user, onBack, onBalanceUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [diamonds, setDiamonds] = useState(0);
  const [todayAds, setTodayAds] = useState(0);
  const [totalAds, setTotalAds] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showAdWatching, setShowAdWatching] = useState(false);
  const [showWheel, setShowWheel] = useState(false);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [currentPrize, setCurrentPrize] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [bonusInfo, setBonusInfo] = useState(null);
  const [chestProgress, setChestProgress] = useState({});
  const [claimedChallenges, setClaimedChallenges] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load from localStorage
      const savedData = localStorage.getItem(`saqr_fortunes_${user?.id}`);
      const today = new Date().toDateString();
      
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.lastDate !== today) {
          // Reset daily stats
          setTodayAds(0);
          setStreak(0);
          setClaimedChallenges([]);
        } else {
          setTodayAds(parsed.todayAds || 0);
          setStreak(parsed.streak || 0);
          setClaimedChallenges(parsed.claimedChallenges || []);
        }
        setTotalAds(parsed.totalAds || 0);
        setChestProgress(parsed.chestProgress || {});
      }

      // Load balance from API
      if (user?.id) {
        const response = await fetch(`${API_URL}/api/economy/balance/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setDiamonds(data.diamonds || 0);
        }
      }
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveData = (data) => {
    localStorage.setItem(`saqr_fortunes_${user?.id}`, JSON.stringify({
      ...data,
      lastDate: new Date().toDateString(),
    }));
  };

  const startWatchingAd = () => {
    if (todayAds >= MAX_DAILY_ADS) {
      alert(`لقد شاهدت ${MAX_DAILY_ADS} إعلان اليوم. عد غداً للمزيد!`);
      return;
    }
    setShowAdWatching(true);
  };

  const handleAdComplete = () => {
    setShowAdWatching(false);
    
    // Update stats
    const newStreak = streak + 1;
    const newTodayAds = todayAds + 1;
    const newTotalAds = totalAds + 1;
    
    setStreak(newStreak);
    setTodayAds(newTodayAds);
    setTotalAds(newTotalAds);

    // Update chest progress
    const newChestProgress = { ...chestProgress };
    CHEST_TYPES.forEach(chest => {
      newChestProgress[chest.id] = (newChestProgress[chest.id] || 0) + 1;
    });
    setChestProgress(newChestProgress);

    // Check for streak bonus
    if (STREAK_BONUSES[newStreak]) {
      setBonusInfo({
        diamonds: STREAK_BONUSES[newStreak],
        reason: `مكافأة ${newStreak} إعلان متتالي!`,
      });
    }

    // Save data
    saveData({
      todayAds: newTodayAds,
      totalAds: newTotalAds,
      streak: newStreak,
      chestProgress: newChestProgress,
      claimedChallenges,
    });

    // Show wheel
    setShowWheel(true);
  };

  const spinWheel = () => {
    setWheelSpinning(true);
    
    // Calculate prize
    const random = Math.random();
    let cumulativeProbability = 0;
    let selectedPrize = WHEEL_PRIZES[0];
    
    for (const prize of WHEEL_PRIZES) {
      cumulativeProbability += prize.probability;
      if (random <= cumulativeProbability) {
        selectedPrize = prize;
        break;
      }
    }
    
    setCurrentPrize(selectedPrize);
  };

  const handleSpinComplete = async () => {
    setWheelSpinning(false);
    setShowWheel(false);
    
    // Calculate total diamonds
    let totalDiamonds = currentPrize.diamonds;
    if (bonusInfo) {
      totalDiamonds += bonusInfo.diamonds;
    }

    // Add diamonds to user account
    try {
      const response = await fetch(`${API_URL}/api/economy/add-diamonds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          amount: totalDiamonds,
          source: 'ad_wheel_reward',
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setDiamonds(data.new_balance);
        if (onBalanceUpdate) onBalanceUpdate();
      }
    } catch (e) {
      console.error('Error adding diamonds:', e);
    }

    // Show result
    setShowResult(true);
  };

  const closeResult = () => {
    setShowResult(false);
    setCurrentPrize(null);
    setBonusInfo(null);
  };

  const openChest = async (chestId) => {
    const chest = CHEST_TYPES.find(c => c.id === chestId);
    if (!chest || (chestProgress[chestId] || 0) < chest.adsRequired) return;

    // Calculate reward
    const reward = Math.floor(Math.random() * (chest.maxReward - chest.minReward + 1)) + chest.minReward;

    // Reset chest progress
    const newChestProgress = { ...chestProgress, [chestId]: 0 };
    setChestProgress(newChestProgress);
    saveData({
      todayAds,
      totalAds,
      streak,
      chestProgress: newChestProgress,
      claimedChallenges,
    });

    // Add diamonds
    try {
      const response = await fetch(`${API_URL}/api/economy/add-diamonds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          amount: reward,
          source: `treasure_chest_${chestId}`,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setDiamonds(data.new_balance);
        if (onBalanceUpdate) onBalanceUpdate();
        
        // Show result
        setCurrentPrize({ diamonds: reward });
        setBonusInfo({ reason: `من صندوق ${chest.name}` });
        setShowResult(true);
      }
    } catch (e) {
      console.error('Error claiming chest:', e);
    }
  };

  const claimChallenge = async (challenge) => {
    if (claimedChallenges.includes(challenge.id)) return;

    try {
      const response = await fetch(`${API_URL}/api/economy/add-diamonds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          amount: challenge.reward,
          source: `daily_challenge_${challenge.id}`,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setDiamonds(data.new_balance);
        
        const newClaimed = [...claimedChallenges, challenge.id];
        setClaimedChallenges(newClaimed);
        saveData({
          todayAds,
          totalAds,
          streak,
          chestProgress,
          claimedChallenges: newClaimed,
        });
        
        alert(`حصلت على ${challenge.reward} ألماسة!`);
      }
    } catch (e) {
      console.error('Error claiming challenge:', e);
    }
  };

  const getChallengeProgress = (challengeId) => {
    switch (challengeId) {
      case 'first_ad':
      case 'watch_5':
      case 'watch_10':
        return todayAds;
      case 'streak_3':
        return streak;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-blue-400 animate-pulse">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#1a1a2e] to-[#0a0a0f] text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <h1 className="text-lg font-bold">ثروات صقر</h1>
            <p className="text-xs text-gray-500">شاهد واربح الجواهر</p>
          </div>

          <div className="flex items-center gap-2 bg-blue-500/20 px-3 py-2 rounded-full">
            <Diamond className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 font-bold">{diamonds.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Exchange Rate */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center justify-center gap-3">
          <TrendingUp className="w-5 h-5 text-green-400" />
          <span className="text-green-400 font-semibold">500 ألماسة = 1 دولار أمريكي</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Play className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-xl font-bold">{todayAds}</div>
            <div className="text-xs text-gray-500">إعلانات اليوم</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-pink-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-pink-400" />
            </div>
            <div className="text-xl font-bold">{streak}</div>
            <div className="text-xs text-gray-500">متتالي</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-xl font-bold">${(diamonds / DIAMONDS_PER_DOLLAR).toFixed(2)}</div>
            <div className="text-xs text-gray-500">القيمة</div>
          </div>
        </div>

        {/* Dollar Progress */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-xl font-bold text-green-400">$</span>
              </div>
              <div>
                <div className="text-sm text-gray-400">تقدمك نحو الدولار التالي</div>
                <div className="text-lg font-bold text-green-400">
                  ${Math.floor(diamonds / DIAMONDS_PER_DOLLAR).toFixed(2)} مكتسب
                </div>
              </div>
            </div>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all"
              style={{ width: `${(diamonds % DIAMONDS_PER_DOLLAR) / DIAMONDS_PER_DOLLAR * 100}%` }}
            />
          </div>
          <p className="text-center text-sm text-gray-400">
            {DIAMONDS_PER_DOLLAR - (diamonds % DIAMONDS_PER_DOLLAR)} ألماسة للدولار التالي
          </p>
        </div>

        {/* Main Watch Button */}
        <button
          onClick={startWatchingAd}
          className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-2xl p-6 flex items-center gap-4 hover:opacity-90 transition-all shadow-lg shadow-purple-500/30"
        >
          <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
            <Play className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1 text-right">
            <h3 className="text-lg font-bold">شاهد إعلان وأدر العجلة!</h3>
            <p className="text-white/70 text-sm">اربح من 1 إلى 100 ألماسة</p>
          </div>
          <div className="bg-black/30 px-3 py-2 rounded-lg flex items-center gap-1">
            <Diamond className="w-4 h-4" />
            <span className="text-sm font-semibold">حتى 100</span>
          </div>
        </button>

        {/* Treasure Chests */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-bold">صناديق الكنز</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {CHEST_TYPES.slice(0, 3).map(chest => (
              <TreasureChestCard
                key={chest.id}
                chest={chest}
                progress={chestProgress[chest.id] || 0}
                onOpen={() => openChest(chest.id)}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {CHEST_TYPES.slice(3).map(chest => (
              <TreasureChestCard
                key={chest.id}
                chest={chest}
                progress={chestProgress[chest.id] || 0}
                onOpen={() => openChest(chest.id)}
              />
            ))}
          </div>
        </div>

        {/* Daily Challenges */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-bold">التحديات اليومية</h2>
          </div>
          <div className="space-y-3">
            {DAILY_CHALLENGES.map(challenge => {
              const progress = getChallengeProgress(challenge.id);
              const isComplete = progress >= challenge.target;
              const isClaimed = claimedChallenges.includes(challenge.id);
              const canClaim = isComplete && !isClaimed;
              const Icon = challenge.icon;

              return (
                <div 
                  key={challenge.id}
                  className={`p-4 rounded-xl border flex items-center gap-3 ${
                    canClaim ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    canClaim ? 'bg-green-500/20' : 'bg-white/10'
                  }`}>
                    <Icon className={`w-5 h-5 ${canClaim ? 'text-green-400' : 'text-gray-400'}`} />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-semibold">{challenge.title}</h4>
                    <p className="text-xs text-gray-500">{challenge.desc}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${Math.min(100, (progress / challenge.target) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{progress}/{challenge.target}</span>
                    </div>
                  </div>

                  {isClaimed ? (
                    <div className="text-green-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  ) : canClaim ? (
                    <button 
                      onClick={() => claimChallenge(challenge)}
                      className="bg-green-500 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      استلم
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 bg-blue-500/20 px-3 py-1 rounded-lg">
                      <Diamond className="w-3 h-3 text-blue-400" />
                      <span className="text-sm text-blue-400 font-semibold">{challenge.reward}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Streak Bonuses */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-bold">مكافآت المتتالي</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(STREAK_BONUSES).map(([count, bonus]) => {
              const achieved = streak >= parseInt(count);
              return (
                <div 
                  key={count}
                  className={`px-3 py-2 rounded-lg border ${
                    achieved 
                      ? 'bg-yellow-500/20 border-yellow-500/30' 
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className={`text-lg font-bold ${achieved ? 'text-yellow-400' : 'text-gray-500'}`}>
                    {count}
                  </div>
                  <div className="flex items-center gap-1">
                    <Diamond className={`w-3 h-3 ${achieved ? 'text-yellow-400' : 'text-gray-600'}`} />
                    <span className={`text-xs ${achieved ? 'text-yellow-400' : 'text-gray-600'}`}>+{bonus}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-400 mb-1">نصيحة للربح الأقصى</h4>
            <p className="text-sm text-gray-400">
              شاهد الإعلانات بشكل متتالي للحصول على مكافآت إضافية. كل 5 إعلانات متتالية = مكافأة خاصة!
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AdWatchingModal
        visible={showAdWatching}
        onComplete={handleAdComplete}
        onClose={() => setShowAdWatching(false)}
      />

      {showWheel && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-[#1a1a2e] to-[#0a0a0f] rounded-3xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-6">أدر عجلة الحظ!</h3>
            <LuckyWheel
              onSpin={spinWheel}
              spinning={wheelSpinning}
              prize={currentPrize}
              onSpinComplete={handleSpinComplete}
            />
            <p className="mt-6 text-gray-500 text-sm">اضغط على العجلة للدوران</p>
          </div>
        </div>
      )}

      <RewardResultModal
        visible={showResult}
        diamonds={(currentPrize?.diamonds || 0) + (bonusInfo?.diamonds || 0)}
        onClose={closeResult}
        bonusReason={bonusInfo?.reason}
      />
    </div>
  );
};

export default SaqrFortunesPage;
