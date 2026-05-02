import React, { useState, useEffect } from 'react';
import { Timer, Clock } from 'lucide-react';

const AdCountdownTimer = ({ expiresAt, isActive, size = 'md' }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt || !isActive) {
      setIsExpired(true);
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date();
      let expiry;
      
      if (typeof expiresAt === 'string') {
        expiry = new Date(expiresAt.replace('Z', '+00:00'));
      } else {
        expiry = new Date(expiresAt);
      }
      
      const diff = expiry - now;
      
      if (diff <= 0) {
        setIsExpired(true);
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());
    
    const timer = setInterval(() => {
      const newTime = calculateTimeLeft();
      setTimeLeft(newTime);
      
      if (newTime.hours === 0 && newTime.minutes === 0 && newTime.seconds === 0) {
        setIsExpired(true);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, isActive]);

  const formatNumber = (num) => num.toString().padStart(2, '0');

  if (isExpired) {
    return (
      <div className={`flex items-center gap-1 text-gray-500 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
        <Clock className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
        <span>منتهي</span>
      </div>
    );
  }

  // Determine urgency color
  const totalMinutes = timeLeft.hours * 60 + timeLeft.minutes;
  const urgencyColor = totalMinutes <= 30 ? 'text-red-400' : totalMinutes <= 120 ? 'text-yellow-400' : 'text-green-400';
  const bgColor = totalMinutes <= 30 ? 'bg-red-500/20' : totalMinutes <= 120 ? 'bg-yellow-500/20' : 'bg-green-500/20';

  if (size === 'sm') {
    return (
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${bgColor} ${urgencyColor} text-xs font-medium`}>
        <Timer className="w-3 h-3" />
        <span>{formatNumber(timeLeft.hours)}:{formatNumber(timeLeft.minutes)}:{formatNumber(timeLeft.seconds)}</span>
      </div>
    );
  }

  if (size === 'lg') {
    return (
      <div className={`${bgColor} rounded-xl p-4`}>
        <div className="flex items-center gap-2 mb-2">
          <Timer className={`w-5 h-5 ${urgencyColor}`} />
          <span className="text-white font-medium">الوقت المتبقي</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <div className="bg-black/30 rounded-lg px-3 py-2 text-center min-w-[60px]">
            <span className={`text-2xl font-bold ${urgencyColor}`}>{formatNumber(timeLeft.hours)}</span>
            <p className="text-xs text-gray-400">ساعة</p>
          </div>
          <span className={`text-2xl font-bold ${urgencyColor}`}>:</span>
          <div className="bg-black/30 rounded-lg px-3 py-2 text-center min-w-[60px]">
            <span className={`text-2xl font-bold ${urgencyColor}`}>{formatNumber(timeLeft.minutes)}</span>
            <p className="text-xs text-gray-400">دقيقة</p>
          </div>
          <span className={`text-2xl font-bold ${urgencyColor}`}>:</span>
          <div className="bg-black/30 rounded-lg px-3 py-2 text-center min-w-[60px]">
            <span className={`text-2xl font-bold ${urgencyColor}`}>{formatNumber(timeLeft.seconds)}</span>
            <p className="text-xs text-gray-400">ثانية</p>
          </div>
        </div>
      </div>
    );
  }

  // Default medium size
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${bgColor}`}>
      <Timer className={`w-4 h-4 ${urgencyColor}`} />
      <span className={`font-bold ${urgencyColor}`}>
        {formatNumber(timeLeft.hours)}:{formatNumber(timeLeft.minutes)}:{formatNumber(timeLeft.seconds)}
      </span>
    </div>
  );
};

export default AdCountdownTimer;
