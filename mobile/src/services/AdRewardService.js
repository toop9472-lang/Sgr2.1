// Ad Reward Service - نظام مكافآت الإعلانات المحسن
// يتضمن التحقق من الخادم + مكافحة الغش
import api from './api';

class AdRewardService {
  constructor() {
    this.pendingRewards = [];
    this.lastAdTime = null;
    this.dailyAdsWatched = 0;
    this.maxDailyAds = 50; // حد يومي
    this.cooldownTime = 30000; // 30 ثانية بين الإعلانات
    this.sessionId = null;
  }

  // بدء جلسة إعلان جديدة
  async startAdSession(userId, adType = 'rewarded') {
    try {
      // التحقق من الحد اليومي
      if (this.dailyAdsWatched >= this.maxDailyAds) {
        return {
          success: false,
          error: 'daily_limit',
          message: 'وصلت للحد اليومي من الإعلانات. عد غداً!',
        };
      }

      // التحقق من فترة الانتظار
      if (this.lastAdTime && Date.now() - this.lastAdTime < this.cooldownTime) {
        const remainingTime = Math.ceil((this.cooldownTime - (Date.now() - this.lastAdTime)) / 1000);
        return {
          success: false,
          error: 'cooldown',
          message: `انتظر ${remainingTime} ثانية`,
          remainingTime,
        };
      }

      // إنشاء جلسة على الخادم
      const response = await api.post('/api/ads/start-session', {
        user_id: userId,
        ad_type: adType,
        timestamp: Date.now(),
        device_info: {
          platform: require('react-native').Platform.OS,
          version: require('react-native').Platform.Version,
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.sessionId = data.session_id;
        return {
          success: true,
          sessionId: data.session_id,
          expectedReward: data.expected_reward,
        };
      }

      return {
        success: false,
        error: 'server_error',
        message: 'حدث خطأ. حاول مرة أخرى.',
      };
    } catch (error) {
      console.error('Start ad session error:', error);
      return {
        success: false,
        error: 'network',
        message: 'تحقق من اتصالك بالإنترنت',
      };
    }
  }

  // إكمال مشاهدة الإعلان والحصول على المكافأة
  async completeAd(userId, sessionId, adDuration, wasFullyWatched = true) {
    try {
      // التحقق من أن الإعلان شوهد بالكامل
      if (!wasFullyWatched) {
        return {
          success: false,
          error: 'incomplete',
          message: 'يجب مشاهدة الإعلان بالكامل للحصول على المكافأة',
        };
      }

      // التحقق من مدة المشاهدة (الحد الأدنى 15 ثانية)
      if (adDuration < 15000) {
        return {
          success: false,
          error: 'too_short',
          message: 'مدة المشاهدة قصيرة جداً',
        };
      }

      // إرسال للخادم للتحقق
      const response = await api.post('/api/ads/complete', {
        user_id: userId,
        session_id: sessionId || this.sessionId,
        duration: adDuration,
        completed_at: Date.now(),
        verification_hash: this.generateVerificationHash(userId, sessionId, adDuration),
      });

      if (response.ok) {
        const data = await response.json();
        
        // تحديث الحالة المحلية
        this.lastAdTime = Date.now();
        this.dailyAdsWatched++;
        this.sessionId = null;

        return {
          success: true,
          reward: data.reward,
          newBalance: data.new_balance,
          bonusApplied: data.bonus_applied,
          message: `حصلت على ${data.reward} جوهرة صقر!`,
        };
      }

      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || 'server_error',
        message: errorData.message || 'حدث خطأ في التحقق',
      };
    } catch (error) {
      console.error('Complete ad error:', error);
      
      // حفظ المكافأة محلياً للتزامن لاحقاً
      this.pendingRewards.push({
        userId,
        sessionId,
        adDuration,
        timestamp: Date.now(),
      });

      return {
        success: false,
        error: 'network',
        message: 'سيتم إضافة المكافأة عند عودة الاتصال',
        pendingSave: true,
      };
    }
  }

  // مزامنة المكافآت المعلقة
  async syncPendingRewards() {
    if (this.pendingRewards.length === 0) return;

    const toSync = [...this.pendingRewards];
    this.pendingRewards = [];

    for (const reward of toSync) {
      try {
        await api.post('/api/ads/sync-pending', reward);
      } catch (error) {
        // إعادة للقائمة إذا فشل
        this.pendingRewards.push(reward);
      }
    }
  }

  // التحقق من إمكانية مشاهدة إعلان
  canWatchAd() {
    if (this.dailyAdsWatched >= this.maxDailyAds) {
      return { canWatch: false, reason: 'daily_limit' };
    }
    
    if (this.lastAdTime && Date.now() - this.lastAdTime < this.cooldownTime) {
      const remainingTime = Math.ceil((this.cooldownTime - (Date.now() - this.lastAdTime)) / 1000);
      return { canWatch: false, reason: 'cooldown', remainingTime };
    }

    return { canWatch: true };
  }

  // الحصول على عدد الإعلانات المتبقية
  getRemainingAds() {
    return Math.max(0, this.maxDailyAds - this.dailyAdsWatched);
  }

  // إعادة تعيين العداد اليومي (يُستدعى عند بداية يوم جديد)
  resetDailyCounter() {
    const today = new Date().toDateString();
    const lastReset = this.lastResetDate;
    
    if (lastReset !== today) {
      this.dailyAdsWatched = 0;
      this.lastResetDate = today;
    }
  }

  // توليد hash للتحقق (مكافحة الغش)
  generateVerificationHash(userId, sessionId, duration) {
    // Hash بسيط - في الإنتاج استخدم crypto أقوى
    const data = `${userId}-${sessionId}-${duration}-${Date.now()}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  // الحصول على إحصائيات الإعلانات
  getStats() {
    return {
      dailyWatched: this.dailyAdsWatched,
      dailyLimit: this.maxDailyAds,
      remaining: this.getRemainingAds(),
      canWatch: this.canWatchAd().canWatch,
      pendingRewards: this.pendingRewards.length,
    };
  }
}

const adRewardService = new AdRewardService();
export default adRewardService;
