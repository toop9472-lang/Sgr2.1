import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from '../hooks/use-toast';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Premium Background Image
const AUTH_BG_IMAGE = 'https://static.prod-images.emergentagent.com/jobs/40eca190-5242-4463-8c95-bc5f66df29cb/images/e35d59ccd161791b6e9cbecdfa426302685267afa2c8e806fa233976816403de.png';

/**
 * AuthPage Component
 * Supports Google OAuth, Apple OAuth, Email/Password, and Guest mode
 * UNIFIED LOGIN: If admin credentials are entered, redirects to admin dashboard
 * REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
 */
const AuthPage = ({ onLogin, onGuestMode, onAdminLogin }) => {
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [oauthSettings, setOauthSettings] = useState({
    google_enabled: true,
    apple_enabled: false
  });
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  // تحميل بيانات "تذكرني" عند بدء التشغيل
  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    const savedRemember = localStorage.getItem('remember_me') === 'true';
    if (savedEmail && savedRemember) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  // Load OAuth settings from backend
  useEffect(() => {
    const loadOAuthSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/api/settings/public/oauth`);
        if (response.ok) {
          const data = await response.json();
          setOauthSettings(data);
        }
      } catch (error) {
        console.error('Failed to load OAuth settings:', error);
      }
    };
    loadOAuthSettings();
  }, []);

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleAppleLogin = () => {
    // Apple Sign In via Emergent Auth - works on all platforms including iPad
    const redirectUrl = window.location.origin + '/';
    window.location.href = `https://auth.emergentagent.com/apple?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleGuestMode = () => {
    const guestUser = {
      id: 'guest_' + Date.now(),
      name: isRTL ? 'زائر' : 'Guest',
      email: 'guest@saqr.app',
      avatar: 'https://ui-avatars.com/api/?name=Guest&background=94A3B8&color=fff',
      provider: 'guest',
      isGuest: true
    };
    onGuestMode(guestUser);
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/signin';
      const body = isRegister 
        ? { email: formData.email, password: formData.password, name: formData.name }
        : { email: formData.email, password: formData.password };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      // حفظ بيانات "تذكرني"
      if (rememberMe && !isRegister) {
        localStorage.setItem('remembered_email', formData.email);
        localStorage.setItem('remember_me', 'true');
      } else {
        localStorage.removeItem('remembered_email');
        localStorage.removeItem('remember_me');
      }

      // Check if this is an admin login
      if (data.role === 'admin') {
        // Store admin data
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_data', JSON.stringify(data.user));
        
        toast({
          title: '✅ ' + (isRTL ? 'مرحباً بك' : 'Welcome'),
          description: `${isRTL ? 'مرحباً' : 'Hello'} ${data.user.name}!`,
        });

        // Call admin login handler and redirect to admin dashboard
        if (onAdminLogin) {
          onAdminLogin(data.user);
        }
        navigate('/admin/dashboard');
        return;
      }

      // Regular user login - store token for API calls
      if (data.token) {
        localStorage.setItem('user_token', data.token);
      }
      
      toast({
        title: isRegister ? '✅ ' + t('success') : '✅ ' + t('login'),
        description: `${t('welcome')} ${data.user.name}!`,
      });

      onLogin(data.user);
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: '❌ ' + t('error'),
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (showEmailForm) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
        style={{
          backgroundImage: `url(${AUTH_BG_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80"></div>
        
        {/* Language Switcher */}
        <div className="fixed top-4 left-4 z-50">
          <LanguageSwitcher className="!bg-black/50 hover:!bg-black/70 !border-white/10 backdrop-blur-sm" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          {/* Back Button */}
          <button
            onClick={() => setShowEmailForm(false)}
            className={`mb-6 text-white/80 hover:text-white flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <svg className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>{isRTL ? 'رجوع' : 'Back'}</span>
          </button>
          
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 w-20 h-20 rounded-2xl bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center overflow-hidden shadow-lg shadow-blue-500/20">
              <img 
                src="/logo_saqr.png" 
                alt="صقر" 
                className="w-16 h-16 object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">
              {isRegister ? t('register') : t('login')}
            </h1>
            <p className="text-white/60 mt-2">
              {isRegister 
                ? (isRTL ? 'أدخل بياناتك لإنشاء حساب' : 'Enter your details to create an account')
                : (isRTL ? 'أدخل بريدك الإلكتروني وكلمة المرور' : 'Enter your email and password')}
            </p>
          </div>
          
          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isRegister && (
              <div>
                <Label htmlFor="name" className="text-white/80">{t('name')}</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder={isRTL ? 'اسمك الكامل' : 'Your full name'}
                  className="mt-1 bg-black/40 border-white/20 text-white placeholder:text-white/40 backdrop-blur-sm h-12 rounded-xl"
                  dir={isRTL ? 'rtl' : 'ltr'}
                  data-testid="auth-name-input"
                />
              </div>
            )}
            <div>
              <Label htmlFor="email" className="text-white/80">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="your@email.com"
                className="mt-1 bg-black/40 border-white/20 text-white placeholder:text-white/40 backdrop-blur-sm h-12 rounded-xl"
                dir="ltr"
                data-testid="auth-email-input"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-white/80">{t('password')}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                placeholder="••••••••"
                className="mt-1 bg-black/40 border-white/20 text-white placeholder:text-white/40 backdrop-blur-sm h-12 rounded-xl"
                minLength={6}
                data-testid="auth-password-input"
              />
            </div>
            
            {/* Remember Me */}
            {!isRegister && (
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setRememberMe(!rememberMe)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      rememberMe 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'bg-transparent border-white/30 hover:border-white/50'
                    }`}
                    data-testid="remember-me-checkbox"
                  >
                    {rememberMe && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <label 
                    className="text-white/60 text-sm cursor-pointer select-none"
                    onClick={() => setRememberMe(!rememberMe)}
                  >
                    {isRTL ? 'تذكرني' : 'Remember me'}
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-blue-400 hover:underline text-sm"
                  data-testid="forgot-password-link"
                >
                  {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                </button>
              </div>
            )}
            
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30"
              data-testid="auth-submit-btn"
            >
              {isLoading ? t('loading') : (isRegister ? t('register') : t('login'))}
            </Button>
          </form>
          
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-blue-400 hover:underline text-sm"
            >
              {isRegister ? t('haveAccount') : t('noAccount')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: `url(${AUTH_BG_IMAGE})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70"></div>
      
      {/* Language Switcher */}
      <div className="fixed top-4 left-4 z-50">
        <LanguageSwitcher className="!bg-black/50 hover:!bg-black/70 !border-white/10 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 w-full max-w-md text-center">
        {/* Logo with Glow */}
        <div className="mb-6">
          <div className="mx-auto w-28 h-28 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center overflow-hidden shadow-2xl shadow-blue-500/30">
            <img 
              src="/logo_saqr.png" 
              alt="صقر" 
              className="w-24 h-24 object-contain"
            />
          </div>
        </div>
        
        <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-lg" style={{ textShadow: '0 0 30px rgba(96,165,250,0.5)' }}>
          {t('appName')}
        </h1>
        <p className="text-lg text-white/70 mb-10">
          {t('watchAdsEarnPoints')}
        </p>

        {/* Auth Buttons */}
        <div className="space-y-3">
          {oauthSettings.google_enabled && (
            <Button
              onClick={handleGoogleLogin}
              className="w-full h-14 bg-white hover:bg-gray-100 text-gray-800 flex items-center justify-center gap-3 rounded-xl font-medium shadow-lg"
              variant="outline"
              data-testid="google-login-btn"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>{t('loginWithGoogle')}</span>
            </Button>
          )}

          {oauthSettings.apple_enabled && (
            <Button
              onClick={handleAppleLogin}
              className="w-full h-14 bg-black hover:bg-gray-900 text-white flex items-center justify-center gap-3 rounded-xl border border-white/20 font-medium shadow-lg"
              data-testid="apple-login-btn"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              <span>{t('loginWithApple')}</span>
            </Button>
          )}

          {(oauthSettings.google_enabled || oauthSettings.apple_enabled) && (
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 text-white/50 bg-transparent">{t('or')}</span>
              </div>
            </div>
          )}

          <Button
            onClick={() => setShowEmailForm(true)}
            variant="outline"
            className="w-full h-14 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/50 text-blue-300 flex items-center justify-center gap-3 rounded-xl font-medium backdrop-blur-sm"
            data-testid="email-login-btn"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>{t('loginWithEmail')}</span>
          </Button>

          {/* Guest Mode */}
          <button
            onClick={handleGuestMode}
            className="w-full py-3 text-white/50 text-sm hover:text-white/70 underline transition-colors"
            data-testid="guest-mode-btn"
          >
            {isRTL ? 'دخول كزائر' : 'Continue as guest'}
          </button>
        </div>

        {/* Terms */}
        <p className="text-xs text-white/40 mt-8 leading-relaxed">
          {t('termsText')}{' '}
          <a href="/terms" target="_blank" className="text-blue-400 hover:underline">
            {t('termsLink')}
          </a>{' '}
          {t('and')}{' '}
          <a href="/privacy-policy.html" target="_blank" className="text-blue-400 hover:underline">
            {t('privacyLink')}
          </a>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
