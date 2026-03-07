// Referral Service - نظام الإحالة والدعوات
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { Share, Alert } from 'react-native';

const REFERRAL_REWARDS = {
  REFERRER_POINTS: 100,  // نقاط للداعي
  REFEREE_POINTS: 50,    // نقاط للمدعو
  REFERRER_DIAMONDS: 10, // ماس للداعي
  REFEREE_DIAMONDS: 5,   // ماس للمدعو
};

class ReferralService {
  constructor() {
    this.referralCode = null;
    this.referralStats = {
      totalReferrals: 0,
      pendingReferrals: 0,
      earnedPoints: 0,
      earnedDiamonds: 0,
    };
  }

  // توليد رابط الإحالة
  generateReferralLink(userId) {
    const code = this.generateReferralCode(userId);
    return `https://saqr.app/invite/${code}`;
  }

  // توليد كود الإحالة
  generateReferralCode(userId) {
    if (!userId) return null;
    // كود بسيط من آخر 6 أحرف من userId + random
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.referralCode = `${userId.slice(-4).toUpperCase()}${random}`;
    return this.referralCode;
  }

  // نسخ رابط الإحالة
  async copyReferralLink(userId) {
    const link = this.generateReferralLink(userId);
    await Clipboard.setStringAsync(link);
    return link;
  }

  // مشاركة رابط الإحالة
  async shareReferralLink(userId, userName = 'صديقك') {
    const link = this.generateReferralLink(userId);
    const message = `${userName} يدعوك لتجربة تطبيق صقر!\n\nاربح نقاط وماس من الإعلانات والألعاب.\nسجل الآن واحصل على ${REFERRAL_REWARDS.REFEREE_POINTS} نقطة مجاناً!\n\n${link}`;
    
    try {
      const result = await Share.share({
        message,
        title: 'دعوة لتطبيق صقر',
      });
      
      if (result.action === Share.sharedAction) {
        // Track share
        await this.trackShare(userId);
        return { success: true };
      }
      return { success: false, cancelled: true };
    } catch (error) {
      console.error('Share error:', error);
      return { success: false, error };
    }
  }

  // تتبع المشاركة
  async trackShare(userId) {
    try {
      await api.post('/api/referrals/track-share', { user_id: userId });
    } catch (error) {
      console.log('Track share error:', error);
    }
  }

  // تطبيق كود إحالة (للمستخدم الجديد)
  async applyReferralCode(code, newUserId) {
    try {
      const response = await api.post('/api/referrals/apply', {
        code,
        new_user_id: newUserId,
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          rewards: data.rewards,
          message: `تم تطبيق كود الإحالة! حصلت على ${REFERRAL_REWARDS.REFEREE_POINTS} نقطة و ${REFERRAL_REWARDS.REFEREE_DIAMONDS} ماسات`,
        };
      }
      
      return { success: false, error: 'كود الإحالة غير صالح' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // جلب إحصائيات الإحالة
  async getReferralStats(userId) {
    try {
      const response = await api.get(`/api/referrals/stats?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        this.referralStats = data;
        return data;
      }
      return this.referralStats;
    } catch (error) {
      console.error('Get referral stats error:', error);
      return this.referralStats;
    }
  }

  // جلب قائمة الإحالات
  async getReferralsList(userId) {
    try {
      const response = await api.get(`/api/referrals/list?user_id=${userId}`);
      if (response.ok) {
        return await response.json();
      }
      return { referrals: [] };
    } catch (error) {
      console.error('Get referrals list error:', error);
      return { referrals: [] };
    }
  }

  // التحقق من كود إحالة محفوظ (عند التسجيل)
  async checkSavedReferralCode() {
    try {
      const savedCode = await AsyncStorage.getItem('pending_referral_code');
      return savedCode;
    } catch (error) {
      return null;
    }
  }

  // حفظ كود إحالة (من الرابط)
  async saveReferralCode(code) {
    try {
      await AsyncStorage.setItem('pending_referral_code', code);
      return true;
    } catch (error) {
      return false;
    }
  }

  // مسح كود الإحالة المحفوظ
  async clearSavedReferralCode() {
    try {
      await AsyncStorage.removeItem('pending_referral_code');
    } catch (error) {
      console.log('Clear referral code error:', error);
    }
  }

  // الحصول على ثوابت المكافآت
  getRewardConstants() {
    return REFERRAL_REWARDS;
  }
}

const referralService = new ReferralService();
export default referralService;
