import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '../hooks/use-toast';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Same background image as the mobile AuthScreen (APP_BACKGROUND_IMAGE)
const AUTH_BG_IMAGE =
  'https://static.prod-images.emergentagent.com/jobs/40eca190-5242-4463-8c95-bc5f66df29cb/images/e35d59ccd161791b6e9cbecdfa426302685267afa2c8e806fa233976816403de.png';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const checkPasswordStrength = (pass) => {
  const checks = {
    length: pass.length >= 8,
    uppercase: /[A-Z]/.test(pass),
    lowercase: /[a-z]/.test(pass),
    number: /[0-9]/.test(pass),
    symbol: /[!@#$%^&*(),.?":{}|<>]/.test(pass),
  };
  const strength = Object.values(checks).filter(Boolean).length;
  return { checks, strength };
};

const getStrengthColor = (s) => {
  if (s <= 2) return '#ef4444';
  if (s <= 3) return '#f59e0b';
  if (s <= 4) return '#22c55e';
  return '#10b981';
};

const getStrengthText = (s, isRTL) => {
  if (s <= 2) return isRTL ? 'ضعيفة' : 'Weak';
  if (s <= 3) return isRTL ? 'متوسطة' : 'Medium';
  if (s <= 4) return isRTL ? 'قوية' : 'Strong';
  return isRTL ? 'ممتازة' : 'Excellent';
};

/**
 * AuthPage Component — synced visually with mobile AuthScreen.
 * Supports Google OAuth, Apple OAuth, Email/Password, and Guest mode.
 * UNIFIED LOGIN: If admin credentials are entered, redirects to admin dashboard.
 * REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
 */
const AuthPage = ({ onLogin, onGuestMode, onAdminLogin }) => {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [oauthSettings, setOauthSettings] = useState({
    google_enabled: true,
    apple_enabled: false,
  });
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });

  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    const savedRemember = localStorage.getItem('remember_me') === 'true';
    if (savedEmail && savedRemember) {
      setFormData((p) => ({ ...p, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_URL}/api/settings/public/oauth`);
        if (r.ok) setOauthSettings(await r.json());
      } catch (e) {
        console.error('Failed to load OAuth settings:', e);
      }
    })();
  }, []);

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleAppleLogin = () => {
    const redirectUrl = window.location.origin + '/';
    window.location.href = `https://auth.emergentagent.com/apple?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleGuestMode = () => {
    onGuestMode({
      id: 'guest_' + Date.now(),
      name: isRTL ? 'زائر' : 'Guest',
      email: 'guest@tair.app',
      avatar: 'https://ui-avatars.com/api/?name=Guest&background=94A3B8&color=fff',
      provider: 'guest',
      isGuest: true,
    });
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    const email = formData.email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      toast({
        title: '❌ ' + (isRTL ? 'خطأ' : 'Error'),
        description: isRTL ? 'صيغة البريد الإلكتروني غير صحيحة' : 'Invalid email format',
        variant: 'destructive',
      });
      return;
    }
    if (isRegister) {
      const { strength } = checkPasswordStrength(formData.password);
      if (strength < 3) {
        toast({
          title: '⚠️ ' + (isRTL ? 'كلمة مرور ضعيفة' : 'Weak password'),
          description: isRTL
            ? 'يجب أن تحتوي على حرف كبير ورقم ورمز'
            : 'Must contain uppercase, number and symbol',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/signin';
      const body = isRegister
        ? { email, password: formData.password, name: formData.name }
        : { email, password: formData.password };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Authentication failed');

      if (rememberMe && !isRegister) {
        localStorage.setItem('remembered_email', email);
        localStorage.setItem('remember_me', 'true');
      } else {
        localStorage.removeItem('remembered_email');
        localStorage.removeItem('remember_me');
      }

      if (data.role === 'admin') {
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_data', JSON.stringify(data.user));
        toast({
          title: '✅ ' + (isRTL ? 'مرحباً بك' : 'Welcome'),
          description: `${isRTL ? 'مرحباً' : 'Hello'} ${data.user.name}!`,
        });
        if (onAdminLogin) onAdminLogin(data.user);
        navigate('/admin/dashboard');
        return;
      }

      if (data.token) localStorage.setItem('user_token', data.token);
      toast({
        title: '✅ ' + (isRTL ? (isRegister ? 'تم إنشاء الحساب' : 'تسجيل الدخول') : isRegister ? 'Account created' : 'Logged in'),
        description: `${isRTL ? 'مرحباً' : 'Welcome'} ${data.user.name}!`,
      });
      onLogin(data.user);
    } catch (error) {
      toast({
        title: '❌ ' + (isRTL ? 'خطأ' : 'Error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength bar (mobile-style)
  const renderStrengthBar = () => {
    if (!formData.password) return null;
    const { checks, strength } = checkPasswordStrength(formData.password);
    const color = getStrengthColor(strength);
    return (
      <div className="-mt-2 mb-3" data-testid="password-strength-meter">
        <div className="flex gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded-full"
              style={{ backgroundColor: i <= strength ? color : 'rgba(255,255,255,0.12)' }}
            />
          ))}
        </div>
        <div className="text-xs text-right mb-2" style={{ color }}>
          {getStrengthText(strength, isRTL)}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 justify-end text-[11px]">
          {[
            { ok: checks.length, label: isRTL ? '8 أحرف' : '8 chars' },
            { ok: checks.uppercase, label: isRTL ? 'حرف كبير' : 'Uppercase' },
            { ok: checks.number, label: isRTL ? 'رقم' : 'Number' },
            { ok: checks.symbol, label: isRTL ? 'رمز' : 'Symbol' },
          ].map((c, idx) => (
            <span key={idx} style={{ color: c.ok ? '#22c55e' : 'rgba(255,255,255,0.4)' }}>
              {c.ok ? '✓' : '○'} {c.label}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // ==================== EMAIL FORM ====================
  if (showEmailForm) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
        style={{ backgroundImage: `url(${AUTH_BG_IMAGE})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(15,23,42,0.28) 0%, rgba(30,41,59,0.66) 50%, rgba(30,27,75,0.84) 100%)',
          }}
        />
        <div className="fixed top-4 left-4 z-50">
          <LanguageSwitcher className="!bg-black/50 hover:!bg-black/70 !border-white/10 backdrop-blur-sm" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          <button
            type="button"
            onClick={() => setShowEmailForm(false)}
            className={`absolute -top-2 ${isRTL ? 'left-0' : 'right-0'} p-2 text-white/90`}
            data-testid="auth-back-btn"
          >
            <svg
              className={`w-6 h-6 ${isRTL ? '' : 'rotate-180'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="flex flex-col items-center mb-4 mt-2">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(96,165,250,0.12)' }}
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white text-center mb-2">
            {isRegister ? (isRTL ? 'حساب جديد' : 'New Account') : isRTL ? 'تسجيل الدخول' : 'Sign In'}
          </h1>
          <p className="text-sm text-center mb-5" style={{ color: 'rgba(226,232,240,0.78)' }}>
            {isRegister
              ? isRTL
                ? 'أنشئ حسابك بالبريد الإلكتروني'
                : 'Create your email account'
              : isRTL
              ? 'أدخل بريدك الإلكتروني'
              : 'Enter your email'}
          </p>

          <form onSubmit={handleEmailAuth} className="space-y-3.5">
            {isRegister && (
              <div
                className="flex items-center px-4 rounded-2xl border"
                style={{ backgroundColor: 'rgba(15,23,42,0.78)', borderColor: 'rgba(148,163,184,0.22)' }}
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={isRTL ? 'الاسم' : 'Name'}
                  required
                  dir={isRTL ? 'rtl' : 'ltr'}
                  className="flex-1 bg-transparent py-4 text-white text-base outline-none placeholder:text-[#666]"
                  data-testid="auth-name-input"
                />
              </div>
            )}

            <div
              className="flex items-center px-4 rounded-2xl border"
              style={{ backgroundColor: 'rgba(15,23,42,0.78)', borderColor: 'rgba(148,163,184,0.22)' }}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={isRTL ? 'البريد الإلكتروني' : 'Email'}
                required
                dir="ltr"
                className="flex-1 bg-transparent py-4 text-white text-base outline-none placeholder:text-[#666]"
                data-testid="auth-email-input"
              />
            </div>

            <div
              className="flex items-center px-4 rounded-2xl border"
              style={{ backgroundColor: 'rgba(15,23,42,0.78)', borderColor: 'rgba(148,163,184,0.22)' }}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c1.66 0 3-1.34 3-3V6a3 3 0 10-6 0v2c0 1.66 1.34 3 3 3zM5 11h14v10H5z" />
              </svg>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={isRTL ? 'كلمة المرور' : 'Password'}
                required
                minLength={6}
                className="flex-1 bg-transparent py-4 text-white text-base outline-none placeholder:text-[#666]"
                data-testid="auth-password-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-[#888]"
                data-testid="toggle-password-visibility"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {isRegister && renderStrengthBar()}

            {!isRegister && (
              <div className="flex items-center justify-between py-1">
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className="flex items-center gap-2"
                  data-testid="remember-me-checkbox"
                >
                  <span
                    className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
                    style={{
                      backgroundColor: rememberMe ? '#3b82f6' : 'transparent',
                      borderColor: rememberMe ? '#3b82f6' : 'rgba(255,255,255,0.3)',
                    }}
                  >
                    {rememberMe && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className="text-sm" style={{ color: 'rgba(226,232,240,0.78)' }}>
                    {isRTL ? 'تذكرني' : 'Remember me'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm"
                  style={{ color: '#60a5fa' }}
                  data-testid="forgot-password-link"
                >
                  {isRTL ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-2xl text-white font-semibold text-base transition disabled:opacity-60"
              style={{
                backgroundColor: '#4f46e5',
                boxShadow: '0 6px 18px rgba(99,102,241,0.45)',
              }}
              data-testid="auth-submit-btn"
            >
              {isLoading
                ? isRTL
                  ? 'جاري...'
                  : 'Loading...'
                : isRegister
                ? isRTL
                  ? 'إنشاء الحساب'
                  : 'Create account'
                : isRTL
                ? 'تسجيل الدخول'
                : 'Sign in'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="block w-full text-center mt-4 text-sm"
            style={{ color: 'rgba(203,213,225,0.86)' }}
            data-testid="toggle-auth-mode"
          >
            {isRegister
              ? isRTL
                ? 'لديك حساب؟ '
                : 'Have an account? '
              : isRTL
              ? 'ليس لديك حساب؟ '
              : "Don't have an account? "}
            <span style={{ color: '#c7d2fe', fontWeight: 600 }}>
              {isRegister
                ? isRTL
                  ? 'سجل دخول'
                  : 'Sign in'
                : isRTL
                ? 'سجل الآن'
                : 'Sign up'}
            </span>
          </button>
        </div>
      </div>
    );
  }

  // ==================== MAIN AUTH SCREEN (mobile-mirrored) ====================
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundImage: `url(${AUTH_BG_IMAGE})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(15,23,42,0.28) 0%, rgba(30,41,59,0.66) 50%, rgba(30,27,75,0.84) 100%)',
        }}
      />

      <div className="fixed top-4 left-4 z-50">
        <LanguageSwitcher className="!bg-black/50 hover:!bg-black/70 !border-white/10 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 w-full max-w-md text-center px-2">
        {/* Logo with blue glow (mirrors mobile logoGlow) */}
        <div className="flex justify-center mb-4">
          <div
            className="rounded-[28px] p-1"
            style={{ boxShadow: '0 0 30px rgba(96,165,250,0.5)' }}
          >
            <img
              src="/tair_logo.png"
              alt="طير"
              className="object-contain rounded-[24px]"
              style={{ width: 110, height: 110 }}
              data-testid="auth-logo"
            />
          </div>
        </div>

        <h1
          className="font-bold text-white"
          style={{
            fontSize: 42,
            textShadow: '0 2px 10px rgba(99,102,241,0.45)',
          }}
          data-testid="auth-app-name"
        >
          طير
        </h1>
        <p
          className="text-center mb-9"
          style={{ fontSize: 16, color: 'rgba(241,245,249,0.86)', letterSpacing: '0.5px' }}
        >
          {isRTL ? 'سوق الطيور والحيوانات الأليفة الموثوق' : 'Trusted bird & pet marketplace'}
        </p>

        <div className="space-y-3">
          {/* Apple — first to mirror mobile iOS order */}
          {oauthSettings.apple_enabled && (
            <button
              type="button"
              onClick={handleAppleLogin}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-white font-semibold text-base border transition active:opacity-80"
              style={{
                backgroundColor: 'rgba(15,23,42,0.72)',
                borderColor: 'rgba(226,232,240,0.28)',
                letterSpacing: '0.3px',
              }}
              data-testid="apple-login-btn"
            >
              <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              <span>{isRTL ? 'الدخول بحساب Apple' : 'Sign in with Apple'}</span>
            </button>
          )}

          {/* Google — solid blue, mirrors mobile googleBtn */}
          {oauthSettings.google_enabled && (
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-white font-semibold text-base transition active:opacity-90"
              style={{
                backgroundColor: '#4f7cf7',
                boxShadow: '0 4px 12px rgba(79,124,247,0.35)',
                letterSpacing: '0.3px',
              }}
              data-testid="google-login-btn"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#fff">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>{isRTL ? 'الدخول بحساب Google' : 'Sign in with Google'}</span>
            </button>
          )}

          {/* Divider — mirrors mobile divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <span className="px-4 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {isRTL ? 'أو' : 'OR'}
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
          </div>

          {/* Email — violet glass, mirrors mobile emailBtn */}
          <button
            type="button"
            onClick={() => setShowEmailForm(true)}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl border transition"
            style={{
              backgroundColor: 'rgba(129,140,248,0.16)',
              borderColor: 'rgba(129,140,248,0.38)',
              color: '#c7d2fe',
              fontWeight: 500,
            }}
            data-testid="email-login-btn"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>{isRTL ? 'الدخول بالبريد الإلكتروني' : 'Sign in with Email'}</span>
          </button>

          {/* Guest — neutral glass, mirrors mobile guestBtn */}
          <button
            type="button"
            onClick={handleGuestMode}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl border transition"
            style={{
              backgroundColor: 'rgba(255,255,255,0.07)',
              borderColor: 'rgba(226,232,240,0.2)',
              color: 'rgba(226,232,240,0.78)',
            }}
            data-testid="guest-mode-btn"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>{isRTL ? 'الدخول كزائر' : 'Continue as guest'}</span>
          </button>
        </div>

        {/* Terms — mirrors mobile terms styling */}
        <p className="mt-4 text-xs leading-relaxed" style={{ color: 'rgba(203,213,225,0.7)' }}>
          {isRTL ? 'بالتسجيل، أنت توافق على ' : 'By continuing, you agree to '}
          <a href="/terms" target="_blank" rel="noreferrer" style={{ color: '#c7d2fe' }}>
            {isRTL ? 'الشروط والأحكام' : 'Terms'}
          </a>{' '}
          {isRTL ? 'و' : 'and'}{' '}
          <a href="/privacy-policy.html" target="_blank" rel="noreferrer" style={{ color: '#c7d2fe' }}>
            {isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}
          </a>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
