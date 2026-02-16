// API Service - Lightweight API handler with enhanced security
// Production URL - يتم تعيينه من خلال متغيرات البيئة في Expo
const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Token storage
let accessToken = null;
let refreshToken = null;

export const api = {
  baseUrl: API_URL,
  BASE_URL: API_URL,
  
  // Set tokens
  setTokens(access, refresh = null) {
    accessToken = access;
    if (refresh) refreshToken = refresh;
  },
  
  // Clear tokens (logout)
  clearTokens() {
    accessToken = null;
    refreshToken = null;
  },
  
  // Refresh access token
  async refreshAccessToken() {
    if (!refreshToken) return null;
    
    try {
      const response = await fetch(`${API_URL}/api/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      
      if (response.ok) {
        const data = await response.json();
        accessToken = data.token;
        return accessToken;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    return null;
  },
  
  // Generic fetch with error handling and auto token refresh
  async fetch(endpoint, options = {}) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };
      
      // Add access token if available
      if (accessToken && !headers.Authorization) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
      
      let response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });
      
      // If token expired, try refresh
      if (response.status === 401 && refreshToken) {
        const newToken = await this.refreshAccessToken();
        if (newToken) {
          headers.Authorization = `Bearer ${newToken}`;
          response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
          });
        }
      }
      
      return response;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Auth
  async login(email, password) {
    const response = await this.fetch('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.ok) {
      const data = await response.json();
      this.setTokens(data.token, data.refresh_token);
    }
    
    return response;
  },

  async register(email, password, name) {
    const response = await this.fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    
    if (response.ok) {
      const data = await response.json();
      this.setTokens(data.token, data.refresh_token);
    }
    
    return response;
  },
  
  async logout() {
    this.clearTokens();
  },

  // Ads
  async getAds() {
    return this.fetch('/api/ads');
  },

  // Settings
  async getRewardsSettings() {
    return this.fetch('/api/settings/public/rewards');
  },

  // AI Chat
  async sendChatMessage(message, token = null) {
    const endpoint = token || accessToken ? '/api/claude-ai/chat' : '/api/claude-ai/chat/guest';
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return this.fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        messages: [{ role: 'user', content: message }],
        system_message: 'أنت مساعد ذكي في تطبيق صقر. ساعد المستخدم باللغة العربية.'
      }),
    });
  },

  // Record ad view
  async recordAdView(adId, watchDuration, token, pointsEarned = 0) {
    return this.fetch('/api/rewarded-ads/complete', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({
        ad_type: 'video',
        ad_id: adId,
        completed: true,
        watch_duration: watchDuration,
        points_earned: pointsEarned,
      }),
    });
  },

  // Submit advertiser ad
  async submitAdvertiserAd(adData, token = null) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return this.fetch('/api/advertiser/create-ad', {
      method: 'POST',
      headers,
      body: JSON.stringify(adData),
    });
  },
  
  // Get packages from server
  async getPackages() {
    return this.fetch('/api/payments/packages');
  },
  
  // Check password strength
  async checkPasswordStrength(password) {
    return this.fetch('/api/auth/check-password-strength', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },

  // Change password
  async changePassword(data, token) {
    return this.fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  // Request withdrawal
  async requestWithdrawal(data, token) {
    return this.fetch('/api/withdrawals/request', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  },

  // Send chat message to AI
  async sendChatMessage(message, token) {
    return this.fetch('/api/claude/chat', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ message }),
    });
  },

  // Comments API
  async getComments(adId) {
    return this.fetch(`/api/comments/ad/${adId}`);
  },

  async createComment(adId, content, token) {
    return this.fetch('/api/comments/', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ad_id: adId, content }),
    });
  },

  async likeComment(commentId, token) {
    return this.fetch('/api/comments/like', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ comment_id: commentId }),
    });
  },

  // ==================== Phone Authentication ====================
  
  // Send OTP for registration
  async sendOTP(phone) {
    return this.fetch('/api/phone/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },

  // Verify OTP
  async verifyOTP(phone, otp) {
    return this.fetch('/api/phone/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
  },

  // Register with phone
  async registerWithPhone(phone, otp, name, password) {
    const response = await this.fetch('/api/phone/register', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, name, password }),
    });
    
    if (response.ok) {
      const data = await response.json();
      this.setTokens(data.token, data.refresh_token);
    }
    
    return response;
  },

  // Login with phone (Step 1 - sends OTP)
  async loginWithPhone(phone, password) {
    return this.fetch('/api/phone/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });
  },

  // Verify login OTP (Step 2 - complete login)
  async verifyLoginOTP(phone, otp, sessionToken) {
    const response = await this.fetch('/api/phone/verify-login', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, session_token: sessionToken }),
    });
    
    if (response.ok) {
      const data = await response.json();
      this.setTokens(data.token, data.refresh_token);
    }
    
    return response;
  },

  // Forgot password
  async forgotPassword(phone) {
    return this.fetch('/api/phone/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },

  // Reset password
  async resetPassword(phone, otp, newPassword) {
    return this.fetch('/api/phone/reset-password', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, new_password: newPassword }),
    });
  },

  // Check if phone exists
  async checkPhone(phone) {
    return this.fetch(`/api/phone/check/${encodeURIComponent(phone)}`);
  },
};

export default api;
