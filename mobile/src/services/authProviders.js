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

/**
 * Sign in with Google using Web Browser OAuth
 * Works on both iOS and Android without native SDK
 */
export const signInWithGoogle = async () => {
  try {
    // Use web-based OAuth for better compatibility
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'saqr',
      path: 'auth/callback'
    });

    // Request authorization
    const authUrl = `${api.BASE_URL}/api/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    const result = await WebBrowser.openAuthSessionAsync(
      authUrl,
      redirectUri,
      {
        preferEphemeralSession: true,
        showInRecents: true,
      }
    );

    if (result.type === 'success' && result.url) {
      // Extract session_id from callback URL
      const sessionMatch = result.url.match(/session_id=([^&]+)/);
      
      if (sessionMatch) {
        const sessionId = sessionMatch[1];
        
        // Get user data from session
        const response = await fetch(`${api.BASE_URL}/api/auth/session/${sessionId}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
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
          const error = await response.json();
          throw new Error(error.detail || 'فشل استلام بيانات المستخدم');
        }
      } else {
        // Check for error in URL
        const errorMatch = result.url.match(/error=([^&]+)/);
        if (errorMatch) {
          throw new Error(decodeURIComponent(errorMatch[1]));
        }
        throw new Error('لم نتمكن من استلام بيانات الجلسة');
      }
    } else if (result.type === 'cancel') {
      return { success: false, cancelled: true };
    } else {
      throw new Error('فشل فتح صفحة تسجيل الدخول');
    }
  } catch (error) {
    console.error('Google SignIn Error:', error);
    throw new Error('فشل تسجيل الدخول بجوجل: ' + (error.message || 'خطأ غير معروف'));
  }
};

/**
 * Sign in with Apple
 * Uses native Apple Authentication on iOS
 */
export const signInWithApple = async () => {
  try {
    // Check if Apple Sign In is available
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    
    if (!isAvailable) {
      // Fallback to web-based Apple Sign In
      return await signInWithAppleWeb();
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
    const response = await fetch(`${api.BASE_URL}/api/auth/apple/native`, {
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
      const error = await response.json();
      throw new Error(error.detail || 'فشل تسجيل الدخول');
    }
  } catch (error) {
    if (error.code === 'ERR_CANCELED' || error.code === 'ERR_REQUEST_CANCELED') {
      return { success: false, cancelled: true };
    }
    console.error('Apple SignIn Error:', error);
    throw new Error('فشل تسجيل الدخول بأبل: ' + (error.message || 'خطأ غير معروف'));
  }
};

/**
 * Fallback: Sign in with Apple using Web Browser
 * Used when native Apple Sign In is not available
 */
export const signInWithAppleWeb = async () => {
  try {
    const redirectUri = 'saqr://auth/callback';
    const authUrl = `${api.BASE_URL}/api/auth/apple?redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    const result = await WebBrowser.openAuthSessionAsync(
      authUrl,
      redirectUri,
      {
        preferEphemeralSession: true,
        showInRecents: true,
      }
    );

    if (result.type === 'success' && result.url) {
      const sessionMatch = result.url.match(/session_id=([^&]+)/);
      
      if (sessionMatch) {
        const sessionId = sessionMatch[1];
        
        const response = await fetch(`${api.BASE_URL}/api/auth/session/${sessionId}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
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
          const error = await response.json();
          throw new Error(error.detail || 'فشل استلام بيانات المستخدم');
        }
      } else {
        throw new Error('لم نتمكن من استلام بيانات الجلسة');
      }
    } else if (result.type === 'cancel') {
      return { success: false, cancelled: true };
    } else {
      throw new Error('فشل فتح صفحة تسجيل الدخول');
    }
  } catch (error) {
    console.error('Apple Web SignIn Error:', error);
    throw new Error('فشل تسجيل الدخول بأبل: ' + (error.message || 'خطأ غير معروف'));
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
