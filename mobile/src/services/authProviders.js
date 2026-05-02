/**
 * Auth Providers - Google & Apple Sign In
 * Handles social authentication with proper error handling
 */
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import api from './api';

// Complete any pending auth sessions
WebBrowser.maybeCompleteAuthSession();

// Google OAuth Discovery
const googleDiscovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

const getApiBase = () => (api.baseUrl || api.BASE_URL || 'https://saqr-ui-sync.emergent.host').replace(/\/+$/, '');
const OAUTH_PROBE_ENDPOINTS = ['/api/auth/providers-status', '/api/settings/public/oauth', '/api/health', '/health'];
const EMERGENT_AUTH_BASE = 'https://auth.emergentagent.com';

const withTimeout = async (promise, timeoutMs = 9000) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('timeout')), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

const resolveOAuthBase = async () => {
  try {
    await api.resolveApiBase?.();
  } catch (_) {
    // Use known candidates even when connection probing fails.
  }

  const candidates = Array.from(new Set([
    api.getActiveBaseUrl?.(),
    ...(api.getBaseCandidates?.() || []),
    getApiBase(),
  ].filter(Boolean)));

  for (const base of candidates) {
    for (const endpoint of OAUTH_PROBE_ENDPOINTS) {
      try {
        const response = await withTimeout(fetch(`${base}${endpoint}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        }));
        if ([404, 405].includes(response.status)) continue;
        return base.replace(/\/+$/, '');
      } catch (_) {
        // Try next endpoint/base.
      }
    }
  }

  return getApiBase();
};

const normalizeErrorMessage = (value, fallback = 'خطأ غير معروف') => {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (value instanceof Error) return normalizeErrorMessage(value.message, fallback);

  if (value && typeof value === 'object') {
    const candidates = [
      value.detail,
      value.message,
      value.error,
      value.description,
      value.reason,
      value?.data?.detail,
      value?.data?.message,
    ];
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
      if (candidate && typeof candidate === 'object') {
        const nested = normalizeErrorMessage(candidate, '');
        if (nested) return nested;
      }
    }
    try {
      const serialized = JSON.stringify(value);
      if (serialized && serialized !== '{}' && serialized !== '[]') return serialized;
    } catch (_) {
      // Ignore serialization failures.
    }
  }

  return fallback;
};

const extractUrlParam = (url, key) => {
  if (!url || !key) return null;
  const fallbackMatch = String(url).match(new RegExp(`[?#&]${key}=([^&#]+)`));
  let rawValue = fallbackMatch ? fallbackMatch[1] : null;

  try {
    const parsedUrl = new URL(url);
    rawValue = parsedUrl.searchParams.get(key) || rawValue;
    if (!rawValue && parsedUrl.hash) {
      const hash = parsedUrl.hash.startsWith('#') ? parsedUrl.hash.slice(1) : parsedUrl.hash;
      rawValue = new URLSearchParams(hash).get(key) || rawValue;
    }
  } catch (_) {
    // URL parsing can fail for malformed callback URLs. Regex fallback above is enough.
  }

  if (!rawValue) return null;
  try {
    return decodeURIComponent(String(rawValue).replace(/\+/g, '%20'));
  } catch (_) {
    return String(rawValue);
  }
};

const buildOAuthError = (provider, code) => {
  const normalizedCode = String(code || '').toLowerCase();
  const map = {
    google_not_configured: 'إعداد تسجيل Google غير مكتمل على الخادم',
    apple_not_configured: 'إعداد تسجيل Apple غير مكتمل على الخادم',
    token_exchange_failed: 'فشل التحقق من Google. حاول مرة أخرى',
    userinfo_failed: 'تعذر الحصول على بيانات الحساب من المزود',
    invalid_session_id: 'جلسة تسجيل الدخول غير صالحة',
    access_denied: 'تم إلغاء عملية تسجيل الدخول',
    auth_failed: `فشل تسجيل الدخول عبر ${provider}`,
  };
  const message = map[normalizedCode] || `فشل تسجيل الدخول عبر ${provider}`;
  const error = new Error(message);
  error.oauthCode = normalizedCode;
  return error;
};

const getOAuthProvidersStatus = async (oauthBase) => {
  try {
    const response = await withTimeout(fetch(`${oauthBase}/api/auth/providers-status`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    }));
    if (!response.ok) return null;
    const data = await response.json().catch(() => ({}));
    return data && typeof data === 'object' ? data : null;
  } catch (_) {
    return null;
  }
};

const exchangeSessionIdForUser = async (oauthBase, sessionId) => {
  const failures = [];

  try {
    const getResponse = await fetch(`${oauthBase}/api/auth/session/${encodeURIComponent(sessionId)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const getData = await getResponse.json().catch(() => ({}));
    if (getResponse.ok) {
      const token = getData?.token || getData?.session_token || null;
      const user = getData?.user || null;
      if (!token || !user) {
        throw new Error('بيانات جلسة الدخول غير مكتملة');
      }
      return {
        token,
        refreshToken: getData?.refresh_token || null,
        user,
      };
    }
    failures.push(normalizeErrorMessage(getData, 'فشل استلام بيانات المستخدم'));
  } catch (error) {
    failures.push(normalizeErrorMessage(error, 'فشل استلام بيانات المستخدم'));
  }

  const postResponse = await fetch(`${oauthBase}/api/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ session_id: sessionId }),
  });
  const postData = await postResponse.json().catch(() => ({}));
  if (!postResponse.ok) {
    failures.push(normalizeErrorMessage(postData, 'فشل التحقق من جلسة تسجيل الدخول'));
    throw new Error(failures.find(Boolean) || 'فشل تسجيل الدخول');
  }

  const token = postData?.token || postData?.session_token || null;
  const user = postData?.user || null;
  if (!token || !user) {
    throw new Error('الخادم لم يرجع بيانات دخول مكتملة');
  }

  return {
    token,
    refreshToken: postData?.refresh_token || null,
    user,
  };
};

const performOAuthWebSession = async ({ authUrl, redirectUri, oauthBase, providerName }) => {
  const result = await WebBrowser.openAuthSessionAsync(
    authUrl,
    redirectUri,
    {
      preferEphemeralSession: true,
      showInRecents: true,
    },
  );

  if (result.type === 'cancel') {
    return { success: false, cancelled: true };
  }
  if (result.type !== 'success' || !result.url) {
    throw new Error('فشل فتح صفحة تسجيل الدخول');
  }

  const sessionId = extractUrlParam(result.url, 'session_id');
  if (!sessionId) {
    const oauthErrorCode = extractUrlParam(result.url, 'error');
    if (oauthErrorCode) {
      throw buildOAuthError(providerName, oauthErrorCode);
    }
    throw new Error('لم نتمكن من استلام بيانات الجلسة');
  }

  const sessionData = await exchangeSessionIdForUser(oauthBase, sessionId);
  return {
    success: true,
    token: sessionData.token,
    refreshToken: sessionData.refreshToken,
    user: sessionData.user,
  };
};

/**
 * Sign in with Google using Web Browser OAuth
 * Works on both iOS and Android without native SDK
 */
export const signInWithGoogle = async () => {
  try {
    const oauthBase = await resolveOAuthBase();
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'saqr',
      path: 'auth/callback',
    });
    const emergentGoogleAuthUrl = `${EMERGENT_AUTH_BASE}/?redirect=${encodeURIComponent(redirectUri)}`;

    const providers = await getOAuthProvidersStatus(oauthBase);
    const shouldUseEmergentDirectly = providers?.google_enabled === false;

    if (shouldUseEmergentDirectly) {
      return await performOAuthWebSession({
        authUrl: emergentGoogleAuthUrl,
        redirectUri,
        oauthBase,
        providerName: 'Google',
      });
    }

    try {
      return await performOAuthWebSession({
        authUrl: `${oauthBase}/api/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}`,
        redirectUri,
        oauthBase,
        providerName: 'Google',
      });
    } catch (primaryError) {
      const shouldRetryWithEmergent =
        primaryError?.oauthCode === 'google_not_configured' ||
        primaryError?.oauthCode === 'token_exchange_failed' ||
        primaryError?.oauthCode === 'userinfo_failed';

      if (shouldRetryWithEmergent) {
        return await performOAuthWebSession({
          authUrl: emergentGoogleAuthUrl,
          redirectUri,
          oauthBase,
          providerName: 'Google',
        });
      }
      throw primaryError;
    }
  } catch (error) {
    console.error('Google SignIn Error:', error);
    throw new Error(`فشل تسجيل الدخول بجوجل: ${normalizeErrorMessage(error)}`);
  }
};

/**
 * Sign in with Apple
 * Uses native Apple Authentication on iOS
 */
export const signInWithApple = async () => {
  let oauthBase = null;
  try {
    oauthBase = await resolveOAuthBase();
    // Check if Apple Sign In is available
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    
    if (!isAvailable) {
      // Fallback to web-based Apple Sign In
      return await signInWithAppleWeb(oauthBase);
    }

    // Request native Apple Sign In
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    // Build name from credential
    let name = 'مستخدم Apple';
    if (credential.fullName) {
      const firstName = credential.fullName.givenName || '';
      const lastName = credential.fullName.familyName || '';
      if (firstName || lastName) {
        name = `${firstName} ${lastName}`.trim();
      }
    }

    // Send to backend
    const response = await fetch(`${oauthBase}/api/auth/apple/native`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: credential.user,
        email: credential.email,
        name: name,
        identity_token: credential.identityToken,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        token: data.token,
        refreshToken: data.refresh_token,
        user: data.user
      };
    } else {
      const error = await response.json().catch(() => ({}));
      throw new Error(normalizeErrorMessage(error, 'فشل تسجيل الدخول'));
    }
  } catch (error) {
    // Handle different error types
    if (error.code === 'ERR_CANCELED' || error.code === 'ERR_REQUEST_CANCELED') {
      return { success: false, cancelled: true };
    }
    
    // ERR_REQUEST_UNKNOWN usually means Apple Sign In is not properly configured
    if (error.code === 'ERR_REQUEST_UNKNOWN') {
      return await signInWithAppleWeb(oauthBase);
    }
    
    console.error('Apple SignIn Error:', error);
    throw new Error(`فشل تسجيل الدخول بأبل: ${normalizeErrorMessage(error)}`);
  }
};

/**
 * Fallback: Sign in with Apple using Web Browser
 * Used when native Apple Sign In is not available
 */
export const signInWithAppleWeb = async (preResolvedBase = null) => {
  try {
    const oauthBase = preResolvedBase || await resolveOAuthBase();
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'saqr',
      path: 'auth/callback',
    });
    const emergentAppleAuthUrl = `${EMERGENT_AUTH_BASE}/apple?redirect=${encodeURIComponent(redirectUri)}`;
    const providers = await getOAuthProvidersStatus(oauthBase);
    const shouldUseEmergentDirectly = providers?.apple_enabled === false;

    if (shouldUseEmergentDirectly) {
      return await performOAuthWebSession({
        authUrl: emergentAppleAuthUrl,
        redirectUri,
        oauthBase,
        providerName: 'Apple',
      });
    }

    try {
      return await performOAuthWebSession({
        authUrl: `${oauthBase}/api/auth/apple?redirect_uri=${encodeURIComponent(redirectUri)}`,
        redirectUri,
        oauthBase,
        providerName: 'Apple',
      });
    } catch (primaryError) {
      if (primaryError?.oauthCode === 'apple_not_configured') {
        return await performOAuthWebSession({
          authUrl: emergentAppleAuthUrl,
          redirectUri,
          oauthBase,
          providerName: 'Apple',
        });
      }
      throw primaryError;
    }
  } catch (error) {
    console.error('Apple Web SignIn Error:', error);
    throw new Error(`فشل تسجيل الدخول بأبل: ${normalizeErrorMessage(error)}`);
  }
};

/**
 * Check if Apple Sign In is available on this device
 */
export const isAppleSignInAvailable = async () => {
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
};

export default {
  signInWithGoogle,
  signInWithApple,
  signInWithAppleWeb,
  isAppleSignInAvailable,
};
