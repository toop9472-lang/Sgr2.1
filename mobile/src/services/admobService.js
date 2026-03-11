// AdMob Service - خدمة إعلانات قوقل
import mobileAds, { 
  RewardedAd, 
  RewardedAdEventType, 
  TestIds,
  AdEventType 
} from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';
import { getTrackingPermissionsAsync, requestTrackingPermissionsAsync } from 'expo-tracking-transparency';

// معرفات الإعلانات
const AD_UNIT_IDS = {
  ios: {
    rewarded: __DEV__ 
      ? TestIds.REWARDED 
      : 'ca-app-pub-5132559433385403/2999033852',
  },
  android: {
    rewarded: __DEV__ 
      ? TestIds.REWARDED 
      : 'ca-app-pub-5132559433385403/3389052725',
  },
};

class AdMobService {
  constructor() {
    this.rewardedAd = null;
    this.isInitialized = false;
    this.isAdLoaded = false;
    this.listeners = [];
    this.loadRetryCount = 0;
    this.maxRetries = 3;
    this.useTestAdUnitsFallback = false;
    this.unsubscribers = [];
  }

  // تهيئة SDK
  async initialize() {
    if (this.isInitialized) return true;
    
    try {
      console.log('Initializing AdMob SDK...');

      // Apple requirement: request ATT before ad SDK initialization on iOS.
      if (Platform.OS === 'ios') {
        try {
          const tracking = await getTrackingPermissionsAsync();
          if (tracking?.status === 'undetermined') {
            await requestTrackingPermissionsAsync();
          }
        } catch (e) {
          console.log('ATT check in AdMob init skipped:', e?.message);
        }
      }
      
      // إعداد التكوين
      await mobileAds().setRequestConfiguration({
        maxAdContentRating: 'G',
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
        testDeviceIdentifiers: __DEV__ ? ['EMULATOR'] : [],
      });
      
      // تهيئة SDK
      await mobileAds().initialize();
      
      this.isInitialized = true;
      console.log('✅ تم تهيئة AdMob SDK بنجاح');
      
      // تحميل أول إعلان
      this.loadRewardedAd();
      
      return true;
    } catch (error) {
      console.error('فشل تهيئة AdMob:', error);
      return false;
    }
  }

  // الحصول على معرف الإعلان حسب النظام
  getRewardedAdUnitId() {
    if (__DEV__ || this.useTestAdUnitsFallback) {
      return TestIds.REWARDED;
    }
    return Platform.OS === 'ios'
      ? AD_UNIT_IDS.ios.rewarded
      : AD_UNIT_IDS.android.rewarded;
  }

  // تحميل إعلان مكافئ
  loadRewardedAd() {
    // تنظيف الاشتراكات القديمة قبل إنشاء إعلان جديد
    this.cleanupAdListeners();

    const adUnitId = this.getRewardedAdUnitId();
    
    console.log('جاري تحميل الإعلان المكافئ...', adUnitId);
    
    // إنشاء إعلان جديد
    this.rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
      keywords: ['game', 'entertainment', 'rewards'],
    });

    // الاستماع لأحداث الإعلان
    this.setupAdListeners();
    
    // تحميل الإعلان
    this.rewardedAd.load();
  }

  // إعداد مستمعي الأحداث
  setupAdListeners() {
    if (!this.rewardedAd) return;

    // عند تحميل الإعلان
    const unsubscribeLoaded = this.rewardedAd.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        console.log('تم تحميل الإعلان المكافئ');
        this.isAdLoaded = true;
        this.loadRetryCount = 0;
        this.notifyListeners('loaded');
      }
    );

    // عند فشل التحميل
    const unsubscribeError = this.rewardedAd.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        console.error('خطأ في تحميل الإعلان:', error);
        this.isAdLoaded = false;
        this.notifyListeners('error', error);
        
        // إعادة المحاولة
        if (this.loadRetryCount < this.maxRetries) {
          this.loadRetryCount++;
          console.log(`إعادة المحاولة ${this.loadRetryCount}/${this.maxRetries}...`);
          setTimeout(() => this.loadRewardedAd(), 3000);
        } else if (!this.useTestAdUnitsFallback) {
          // Fallback to test unit to keep watch page functional when production ad serving is blocked.
          this.useTestAdUnitsFallback = true;
          this.loadRetryCount = 0;
          console.log('⚠️ التحويل إلى وحدة اختبار AdMob مؤقتاً لضمان ظهور الإعلان');
          this.notifyListeners('fallback_test_unit');
          setTimeout(() => this.loadRewardedAd(), 1500);
        }
      }
    );

    // عند إغلاق الإعلان
    const unsubscribeClosed = this.rewardedAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        console.log('تم إغلاق الإعلان');
        this.isAdLoaded = false;
        this.notifyListeners('closed');
        
        // تحميل إعلان جديد
        setTimeout(() => this.loadRewardedAd(), 1000);
      }
    );

    // عند الحصول على المكافأة
    const unsubscribeEarned = this.rewardedAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward) => {
        console.log('Reward earned:', reward);
        this.notifyListeners('reward', {
          amount: reward.amount,
          type: reward.type,
        });
      }
    );

    // حفظ دوال إلغاء الاشتراك
    this.unsubscribers = [
      unsubscribeLoaded,
      unsubscribeError,
      unsubscribeClosed,
      unsubscribeEarned,
    ];
  }

  // عرض الإعلان
  async showRewardedAd() {
    if (!this.isAdLoaded || !this.rewardedAd) {
      console.warn('⚠️ الإعلان غير جاهز للعرض');
      return { success: false, rewarded: false, error: 'الإعلان غير جاهز' };
    }

    return new Promise(async (resolve) => {
      let settled = false;
      let rewardPayload = null;
      const showUnsubscribers = [];

      const finalize = (payload) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        showUnsubscribers.forEach((unsub) => {
          try {
            unsub();
          } catch (e) {
            // no-op
          }
        });
        resolve(payload);
      };

      const timeoutId = setTimeout(() => {
        finalize({
          success: false,
          rewarded: false,
          error: 'انتهت مهلة تحميل نتيجة الإعلان',
        });
      }, 45000);

      try {
        // مستمع مؤقت للمكافأة الخاصة بهذا العرض
        showUnsubscribers.push(
          this.rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
            rewardPayload = reward;
          })
        );

        // مستمع مؤقت للإغلاق: عندها نُرجع النتيجة النهائية للمكالمة
        showUnsubscribers.push(
          this.rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
            finalize({
              success: true,
              rewarded: Boolean(rewardPayload),
              amount: rewardPayload?.amount || 0,
              type: rewardPayload?.type || null,
            });
          })
        );

        // مستمع مؤقت للأخطاء أثناء العرض
        showUnsubscribers.push(
          this.rewardedAd.addAdEventListener(AdEventType.ERROR, (error) => {
            finalize({
              success: false,
              rewarded: false,
              error: error?.message || 'فشل عرض الإعلان',
            });
          })
        );

        console.log('▶️ جاري عرض الإعلان...');
        await this.rewardedAd.show();
      } catch (error) {
        console.error('❌ فشل عرض الإعلان:', error);
        finalize({
          success: false,
          rewarded: false,
          error: error?.message || 'فشل عرض الإعلان',
        });
      }
    });
  }

  // التحقق من جاهزية الإعلان
  isReady() {
    return this.isAdLoaded && this.rewardedAd !== null;
  }

  // الاشتراك في الأحداث
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  // إشعار المستمعين
  notifyListeners(eventType, data = null) {
    this.listeners.forEach(callback => {
      try {
        callback({ eventType, data });
      } catch (e) {
        console.error('خطأ في المستمع:', e);
      }
    });
  }

  cleanupAdListeners() {
    if (this.unsubscribers?.length) {
      this.unsubscribers.forEach((unsub) => {
        try {
          unsub();
        } catch (e) {
          // no-op
        }
      });
      this.unsubscribers = [];
    }
  }

  // تنظيف الموارد
  cleanup() {
    this.cleanupAdListeners();
    this.listeners = [];
    this.rewardedAd = null;
    this.isAdLoaded = false;
  }
}

// تصدير نسخة واحدة من الخدمة
export default new AdMobService();
