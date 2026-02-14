import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Volume2, VolumeX, X, ArrowRight, Star } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const FullScreenAdsViewer = ({ user, onClose, onPointsEarned, onNavigateToProfile }) => {
  const [ads, setAds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  
  // نظام النقاط
  const [currentAdTime, setCurrentAdTime] = useState(0);
  const [totalValidTime, setTotalValidTime] = useState(0);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [pointsAnimationValue, setPointsAnimationValue] = useState(0);
  
  // التحكم في اللمس
  const [touchStartY, setTouchStartY] = useState(null);
  
  // إظهار/إخفاء العناصر
  const [showInfo, setShowInfo] = useState(true);
  const [showHint, setShowHint] = useState(true);
  const [isTouching, setIsTouching] = useState(false);
  
  const videoRef = useRef(null);
  const watchTimerRef = useRef(null);
  const adDurationRef = useRef(30);
  const loadedPagesRef = useRef(1);
  const isLoadingMoreRef = useRef(false);
  const hideInfoTimeoutRef = useRef(null);
  const hideHintTimeoutRef = useRef(null);

  const SECONDS_PER_POINT = 60;
  const MIN_SWIPE_DISTANCE = 50;

  // إخفاء المعلومات والرسالة بعد ثانيتين
  useEffect(() => {
    // إخفاء الرسالة التوضيحية
    hideHintTimeoutRef.current = setTimeout(() => {
      setShowHint(false);
    }, 2000);
    
    // إخفاء معلومات الإعلان
    hideInfoTimeoutRef.current = setTimeout(() => {
      if (!isTouching) {
        setShowInfo(false);
      }
    }, 2000);
    
    return () => {
      if (hideInfoTimeoutRef.current) clearTimeout(hideInfoTimeoutRef.current);
      if (hideHintTimeoutRef.current) clearTimeout(hideHintTimeoutRef.current);
    };
  }, []);

  // إعادة إظهار المعلومات عند تغيير الإعلان
  useEffect(() => {
    if (ads.length > 0) {
      setShowInfo(true);
      setShowHint(true);
      
      // إخفاء بعد ثانيتين
      if (hideInfoTimeoutRef.current) clearTimeout(hideInfoTimeoutRef.current);
      if (hideHintTimeoutRef.current) clearTimeout(hideHintTimeoutRef.current);
      
      hideHintTimeoutRef.current = setTimeout(() => {
        setShowHint(false);
      }, 2000);
      
      hideInfoTimeoutRef.current = setTimeout(() => {
        if (!isTouching) {
          setShowInfo(false);
        }
      }, 2000);
    }
  }, [currentIndex]);

  // تحميل الإعلانات
  useEffect(() => {
    loadAds();
    return () => {
      if (watchTimerRef.current) clearInterval(watchTimerRef.current);
    };
  }, []);

  // بدء العد عند تغيير الإعلان
  useEffect(() => {
    if (ads.length > 0) {
      startAdTimer();
      
      if (currentIndex >= ads.length - 5 && !isLoadingMoreRef.current) {
        loadMoreAds();
      }
    }
  }, [currentIndex, ads.length]);

  const loadAds = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/ads`);
      const data = await response.json();
      if (data && data.length > 0) {
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setAds(shuffled);
      }
    } catch (error) {
      console.error('Failed to load ads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreAds = async () => {
    if (isLoadingMoreRef.current) return;
    isLoadingMoreRef.current = true;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/ads`);
      const data = await response.json();
      if (data && data.length > 0) {
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setAds(prev => [...prev, ...shuffled]);
        loadedPagesRef.current += 1;
      }
    } catch (error) {
      console.error('Failed to load more ads:', error);
    } finally {
      isLoadingMoreRef.current = false;
    }
  };

  const startAdTimer = () => {
    setCurrentAdTime(0);
    if (watchTimerRef.current) clearInterval(watchTimerRef.current);
    
    const currentAd = ads[currentIndex];
    adDurationRef.current = currentAd?.duration || 30;
    
    watchTimerRef.current = setInterval(() => {
      setCurrentAdTime(prev => {
        const newTime = prev + 1;
        if (newTime >= adDurationRef.current) {
          handleAdCompleted(newTime);
        }
        return newTime;
      });
    }, 1000);
  };

  const handleAdCompleted = async (watchedTime) => {
    if (watchTimerRef.current) {
      clearInterval(watchTimerRef.current);
      watchTimerRef.current = null;
    }
    
    const completedAdId = ads[currentIndex]?.id;
    const completedAdDuration = adDurationRef.current;
    
    const newTotalTime = totalValidTime + watchedTime;
    setTotalValidTime(newTotalTime);
    
    const previousPoints = Math.floor(totalValidTime / SECONDS_PER_POINT);
    const newPoints = Math.floor(newTotalTime / SECONDS_PER_POINT);
    
    if (newPoints > previousPoints) {
      const pointsEarned = newPoints - previousPoints;
      setEarnedPoints(prev => prev + pointsEarned);
      setPointsAnimationValue(pointsEarned);
      setShowPointsAnimation(true);
      setTimeout(() => setShowPointsAnimation(false), 2000);
      
      if (onPointsEarned) onPointsEarned(pointsEarned);
      await recordPointsToServer(pointsEarned, completedAdId, completedAdDuration);
    }
    
    setTimeout(() => {
      if (currentIndex < ads.length - 1) {
        setTransitioning(true);
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
          setTransitioning(false);
        }, 200);
      }
    }, 1000);
  };

  const recordPointsToServer = async (points, adId, duration) => {
    const token = localStorage.getItem('user_token') || localStorage.getItem('token');
    if (!token) return;
    
    try {
      await fetch(`${BACKEND_URL}/api/rewarded-ads/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ad_type: 'video',
          ad_id: adId,
          completed: true,
          watch_duration: duration,
          points_earned: points
        })
      });
    } catch (e) {
      console.log('Failed to record points');
    }
  };

  const goToNext = useCallback(() => {
    if (transitioning || currentIndex >= ads.length - 1) return;
    
    setTransitioning(true);
    if (watchTimerRef.current) clearInterval(watchTimerRef.current);
    
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setTransitioning(false);
    }, 200);
  }, [transitioning, currentIndex, ads.length]);

  const goToPrevious = useCallback(() => {
    if (transitioning || currentIndex <= 0) return;
    
    setTransitioning(true);
    if (watchTimerRef.current) clearInterval(watchTimerRef.current);
    
    setTimeout(() => {
      setCurrentIndex(prev => prev - 1);
      setTransitioning(false);
    }, 200);
  }, [transitioning, currentIndex]);

  // Touch handlers - إظهار المعلومات عند اللمس
  const handleTouchStart = (e) => {
    if (!e.targetTouches?.[0]) return;
    setTouchStartY(e.targetTouches[0].clientY);
    setIsTouching(true);
    setShowInfo(true);
    
    // إلغاء أي timeout للإخفاء
    if (hideInfoTimeoutRef.current) {
      clearTimeout(hideInfoTimeoutRef.current);
    }
  };

  const handleTouchEnd = (e) => {
    setIsTouching(false);
    
    // إخفاء المعلومات بعد رفع الإصبع
    setShowInfo(false);
    
    if (!touchStartY) return;
    const touchEndY = e.changedTouches?.[0]?.clientY || touchStartY;
    const distance = touchStartY - touchEndY;
    
    if (distance > MIN_SWIPE_DISTANCE) goToNext();
    else if (distance < -MIN_SWIPE_DISTANCE) goToPrevious();
    
    setTouchStartY(null);
  };

  // Mouse handlers للديسكتوب
  const handleMouseDown = () => {
    setIsTouching(true);
    setShowInfo(true);
    if (hideInfoTimeoutRef.current) {
      clearTimeout(hideInfoTimeoutRef.current);
    }
  };

  const handleMouseUp = () => {
    setIsTouching(false);
    setShowInfo(false);
  };

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowUp' || e.key === 'k') goToPrevious();
    else if (e.key === 'ArrowDown' || e.key === 'j') goToNext();
    else if (e.key === 'Escape') onClose();
    else if (e.key === 'm') setIsMuted(prev => !prev);
  }, [goToNext, goToPrevious, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleWheel = useCallback((e) => {
    if (e.deltaY > 50) goToNext();
    else if (e.deltaY < -50) goToPrevious();
  }, [goToNext, goToPrevious]);

  const handleGoToProfile = (e) => {
    e.stopPropagation();
    if (onNavigateToProfile) {
      onNavigateToProfile();
    } else {
      onClose();
    }
  };

  const adDuration = adDurationRef.current;
  const adProgress = Math.min((currentAdTime / adDuration) * 100, 100);
  const timeToNextPoint = SECONDS_PER_POINT - (totalValidTime % SECONDS_PER_POINT);
  const isAdComplete = currentAdTime >= adDuration;

  const currentAd = useMemo(() => ads[currentIndex] || {}, [ads, currentIndex]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
        <div className="w-16 h-16 rounded-full bg-[#0a0a0f] border border-white/10 flex items-center justify-center overflow-hidden mb-4 animate-pulse">
          <img src="/logo_saqr.png" alt="صقر" className="w-12 h-12 object-contain" />
        </div>
        <div className="text-white/60 text-sm">جاري التحميل...</div>
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center text-white">
          <p className="text-white/60 mb-4">لا توجد إعلانات متاحة</p>
          <button onClick={onClose} className="px-6 py-2 bg-white/10 rounded-full text-sm">العودة</button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black z-50 select-none overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* محتوى الإعلان */}
      <div className={`absolute inset-0 transition-opacity duration-200 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
        {currentAd.video_url ? (
          <video
            ref={videoRef}
            src={currentAd.video_url}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted={isMuted}
            playsInline
            preload="auto"
          />
        ) : (
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{ 
              backgroundImage: currentAd.thumbnail_url 
                ? `url(${currentAd.thumbnail_url})` 
                : 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)'
            }}
          />
        )}
      </div>

      {/* شريط تقدم رفيع في الأعلى */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/5 z-30">
        <div 
          className={`h-full transition-all duration-1000 ease-linear ${isAdComplete ? 'bg-emerald-400' : 'bg-white/40'}`}
          style={{ width: `${adProgress}%` }}
        />
      </div>

      {/* الأزرار العلوية */}
      <div className="absolute top-4 left-0 right-0 z-40 px-4 flex items-center justify-between">
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center transition-all hover:bg-black/50"
          data-testid="close-ads-btn"
        >
          <X className="w-5 h-5 text-white/80" />
        </button>
        
        <button
          onClick={handleGoToProfile}
          className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center transition-all hover:bg-black/50"
          data-testid="back-to-profile-btn"
        >
          <ArrowRight className="w-5 h-5 text-white/80" />
        </button>
      </div>

      {/* العداد المختصر */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30">
        <div className="flex items-center gap-3 bg-black/20 backdrop-blur-sm rounded-full px-4 py-1.5">
          <span className={`text-xs font-light tracking-wider ${isAdComplete ? 'text-emerald-400' : 'text-white/50'}`}>
            {Math.floor(currentAdTime / 60)}:{(currentAdTime % 60).toString().padStart(2, '0')}
          </span>
          <span className="text-white/20">·</span>
          <span className="text-xs font-light text-white/40">{timeToNextPoint}s</span>
          <span className="text-white/20">·</span>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-400/70 fill-amber-400/70" />
            <span className="text-xs font-light text-amber-400/80">{earnedPoints}</span>
          </div>
        </div>
      </div>

      {/* رسالة توضيحية - نص فقط - تختفي بعد ثانيتين */}
      <div 
        className={`absolute top-28 left-1/2 -translate-x-1/2 z-30 transition-opacity duration-500 ${
          showHint ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <p className="text-white/40 text-xs font-light">أكمل المشاهدة لكسب النقاط</p>
      </div>

      {/* زر كتم الصوت */}
      <button 
        onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
        className="absolute bottom-32 right-4 z-30 w-9 h-9 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center transition-all hover:bg-black/40"
        data-testid="mute-btn"
      >
        {isMuted ? 
          <VolumeX className="w-4 h-4 text-white/60" /> : 
          <Volume2 className="w-4 h-4 text-white/60" />
        }
      </button>

      {/* معلومات الإعلان - تظهر لثانيتين ثم تختفي - تظهر عند اللمس */}
      <div 
        className={`absolute bottom-0 left-0 right-0 z-20 transition-all duration-300 ${
          showInfo ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-16 pb-6 px-4">
          <div className="text-right" dir="rtl">
            <p className="text-white/40 text-xs font-light mb-1">
              {currentAd.advertiser || 'معلن'}
            </p>
            <h3 className="text-white/90 text-sm font-normal mb-1.5 line-clamp-1">
              {currentAd.title}
            </h3>
            <p className="text-white/30 text-xs font-light line-clamp-1 mb-3">
              {currentAd.description}
            </p>
            {currentAd.website_url && (
              <a
                href={currentAd.website_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-block text-white/50 text-xs font-light hover:text-white/70 transition-colors"
              >
                {currentAd.website_url.replace(/^https?:\/\//, '').split('/')[0]}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* مؤشر التقدم الجانبي */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
        <div className="w-px h-16 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="w-full bg-white/30 rounded-full transition-all duration-300"
            style={{ height: `${((currentIndex + 1) / ads.length) * 100}%` }}
          />
        </div>
      </div>

      {/* نقاط مكتسبة - Animation */}
      {showPointsAnimation && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="animate-fade-in-up">
            <div className="bg-black/60 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/10">
              <div className="flex items-center gap-2">
                <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                <span className="text-white text-2xl font-light">+{pointsAnimationValue}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.9);
          }
          50% {
            opacity: 1;
            transform: translateY(-10px) scale(1.05);
          }
          100% {
            opacity: 0;
            transform: translateY(-30px) scale(1);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default FullScreenAdsViewer;
