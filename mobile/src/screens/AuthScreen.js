// Auth Screen - Login / Register with Email & Social
// Professional Design with Premium Background
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
  StyleSheet,
  Image,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { getTrackingPermissionsAsync, requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { signInWithGoogle, signInWithApple } from '../services/authProviders';
import api from '../services/api';
import storage from '../services/storage';
import { APP_BACKGROUND_IMAGE } from '../constants/uiAssets';

// Premium Background Image
const AUTH_BG_IMAGE = APP_BACKGROUND_IMAGE;
const AUTH_FORM_GRADIENT = ['#131729', '#181f38', '#121b33'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Warm up browser for faster OAuth
WebBrowser.maybeCompleteAuthSession();

const AuthScreen = ({ onLogin }) => {
  // Modes: main, phone_login, phone_register, phone_otp, phone_login_otp, email_login, email_register, forgot_password, reset_password
  const [mode, setMode] = useState('main');
  
  // Form fields
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [sessionToken, setSessionToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [providersStatus, setProvidersStatus] = useState({
    google_enabled: true,
    apple_enabled: true,
  });
  const [countdown, setCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [attStatus, setAttStatus] = useState('unknown');
  
  // OTP input refs
  const otpRefs = useRef([]);
  const attAutoRequestedRef = useRef(false);
  
  // Handle connection errors - simplified version
  const handleConnectionError = (error) => {
    console.log('Connection Error:', error.message, error);
    
    if (error.message === 'CONNECTION_TIMEOUT') {
      Alert.alert('خطأ في الاتصال', 'انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى.');
    } else if (error.message === 'NO_CONNECTION') {
      Alert.alert('لا يوجد اتصال', 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى.');
    } else if (error.message?.includes('JSON')) {
      Alert.alert('خطأ', 'حدث خطأ في معالجة البيانات. يرجى المحاولة مرة أخرى.');
    } else {
      Alert.alert('خطأ', error.message || 'تعذّر إكمال العملية حالياً. حاول مرة أخرى.');
    }
  };

  const finalizeLogin = async (sessionUser, token, refresh = null) => {
    if (token) {
      api.setTokens(token, refresh || null);
      await storage.setToken(token);
    }
    await storage.setUserData(sessionUser);
    onLogin(sessionUser);
  };

  const statusFallbackMessage = (response, fallbackMessage) => {
    if (response?.status === 404) return 'تعذر الوصول لخدمة تسجيل الدخول. تحقق من إعدادات الخادم.';
    if (response?.status === 401) return 'بيانات تسجيل الدخول غير صحيحة';
    if (response?.status === 429) return 'تم تجاوز عدد المحاولات المسموح. حاول لاحقاً';
    if (response?.status >= 500) return 'الخادم مشغول حالياً. حاول بعد قليل';
    return fallbackMessage;
  };

  const parseErrorMessage = async (response, fallbackMessage, parsedData = undefined) => {
    if (parsedData !== undefined) {
      if (typeof parsedData === 'string' && parsedData.trim()) return parsedData;
      return parsedData?.detail || parsedData?.message || statusFallbackMessage(response, fallbackMessage);
    }
    try {
      const data = await response.json();
      if (typeof data === 'string' && data.trim()) return data;
      return data?.detail || data?.message || statusFallbackMessage(response, fallbackMessage);
    } catch (_) {
      return statusFallbackMessage(response, fallbackMessage);
    }
  };
  
  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    let mounted = true;
    const loadProviderStatus = async () => {
      try {
        let response = await api.getAuthProvidersStatus().catch(() => null);
        if (!response?.ok) {
          response = await api.fetch('/api/settings/public/oauth').catch(() => null);
        }
        if (!mounted || !response?.ok) return;
        const data = await response.json().catch(() => ({}));
        setProvidersStatus({
          google_enabled: data?.google_enabled !== false,
          apple_enabled: Platform.OS === 'ios' && data?.apple_enabled !== false,
        });
      } catch (_) {
        // Keep defaults to avoid blocking login when status endpoint is unavailable.
      }
    };
    loadProviderStatus();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'ios' || mode !== 'main') return;
    let mounted = true;
    const syncTrackingStatus = async () => {
      try {
        const current = await getTrackingPermissionsAsync();
        if (!mounted) return;
        setAttStatus(current?.status || 'unknown');

        // Fallback request from login screen so reviewers can reliably locate ATT.
        if (current?.status === 'undetermined' && !attAutoRequestedRef.current) {
          attAutoRequestedRef.current = true;
          const next = await requestTrackingPermissionsAsync();
          if (!mounted) return;
          setAttStatus(next?.status || current?.status || 'unknown');
        }
      } catch (_) {
        if (mounted) setAttStatus('unavailable');
      }
    };
    const timer = setTimeout(syncTrackingStatus, 350);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [mode]);

  const getAttStatusLabel = () => {
    if (attStatus === 'authorized') return 'مفعل';
    if (attStatus === 'denied') return 'مرفوض';
    if (attStatus === 'restricted') return 'مقيد';
    if (attStatus === 'undetermined') return 'غير محدد';
    return 'غير متاح';
  };

  const handleRequestTrackingPermission = async () => {
    if (Platform.OS !== 'ios') return;
    try {
      const current = await getTrackingPermissionsAsync();
      if (current?.status === 'undetermined') {
        const next = await requestTrackingPermissionsAsync();
        setAttStatus(next?.status || current?.status || 'unknown');
        return;
      }
      setAttStatus(current?.status || 'unknown');
      Alert.alert(
        'إذن التتبع',
        current?.status === 'denied'
          ? 'تم رفض الإذن سابقاً. يمكنك تغييره من إعدادات iOS > Privacy & Security > Tracking.'
          : `الحالة الحالية: ${getAttStatusLabel()}`,
      );
    } catch (_) {
      Alert.alert('تنبيه', 'تعذر عرض طلب إذن التتبع حالياً.');
    }
  };

  // Password strength checker
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

  const getStrengthColor = (strength) => {
    if (strength <= 2) return '#ef4444';
    if (strength <= 3) return '#f59e0b';
    if (strength <= 4) return '#22c55e';
    return '#10b981';
  };

  const getStrengthText = (strength) => {
    if (strength <= 2) return 'ضعيفة';
    if (strength <= 3) return 'متوسطة';
    if (strength <= 4) return 'قوية';
    return 'ممتازة';
  };

  // Guest login
  const handleGuestLogin = async () => {
    setIsLoading(true);
    try {
      const guestId = `guest_${Date.now()}`;
      const guestUser = {
        user_id: guestId,
        id: guestId,
        email: 'guest@saqr.app',
        name: 'زائر',
        points: 0,
        saqr_gems: 0,
        total_earned: 0,
        is_guest: true,
        isGuest: true,
      };
      await finalizeLogin(guestUser, 'guest_token');
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ، حاول مرة أخرى');
    } finally {
      setIsLoading(false);
    }
  };

  // Format phone number
  const formatPhoneDisplay = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
  };

  // Handle OTP input
  const handleOtpChange = (value, index) => {
    if (value.length > 1) {
      // Handle paste
      const pastedOtp = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      pastedOtp.forEach((digit, i) => {
        if (i < 6) newOtp[i] = digit;
      });
      setOtp(newOtp);
      if (pastedOtp.length === 6) {
        otpRefs.current[5]?.focus();
      }
      return;
    }
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Send OTP for registration
  const handleSendOTP = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      Alert.alert('خطأ', 'يرجى إدخال رقم جوال صحيح');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.sendOTP(cleanPhone);
      const data = await response.json().catch(() => ({}));
      
      if (response.ok && data.success) {
        setCountdown(60);
        setMode('phone_otp');
        Alert.alert('تم الإرسال', data.message);
        
        // For development - auto-fill OTP
        if (data.otp_debug) {
          const otpDigits = data.otp_debug.split('');
          setOtp(otpDigits);
        }
      } else {
        const message = data.detail || data.message || 'فشل إرسال رمز التحقق';
        Alert.alert('خطأ', message);
      }
    } catch (error) {
      if (error.message === 'CONNECTION_TIMEOUT') {
        Alert.alert('خطأ في الاتصال', 'انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى.');
      } else if (error.message === 'NO_CONNECTION') {
        Alert.alert('لا يوجد اتصال', 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى.');
      } else {
        handleConnectionError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP and register
  const handleVerifyAndRegister = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('خطأ', 'يرجى إدخال رمز التحقق كاملاً');
      return;
    }
    if (!name.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسمك');
      return;
    }
    if (password.length < 8) {
      Alert.alert('خطأ', 'كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('خطأ', 'كلمات المرور غير متطابقة');
      return;
    }

    const { strength } = checkPasswordStrength(password);
    if (strength < 3) {
      Alert.alert('كلمة المرور ضعيفة', 'يجب أن تحتوي على حرف كبير ورقم ورمز');
      return;
    }

    setIsLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const response = await api.registerWithPhone(cleanPhone, otpCode, name, password);
      const data = await response.json().catch(() => ({}));
      
      if (response.ok && data.success) {
        await finalizeLogin(data.user, data.token, data.refresh_token);
        Alert.alert('مرحباً', 'تم إنشاء حسابك بنجاح!');
      } else {
        const message = data.detail || data.message || 'فشل إنشاء الحساب';
        Alert.alert('خطأ', message);
      }
    } catch (error) {
      handleConnectionError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Phone login (Step 1)
  const handlePhoneLogin = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      Alert.alert('خطأ', 'يرجى إدخال رقم جوال صحيح');
      return;
    }
    if (!password) {
      Alert.alert('خطأ', 'يرجى إدخال كلمة المرور');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.loginWithPhone(cleanPhone, password);
      const data = await response.json().catch(() => ({}));
      
      if (response.ok && data.success && data.requires_otp) {
        setSessionToken(data.session_token);
        setCountdown(60);
        setOtp(['', '', '', '', '', '']);
        setMode('phone_login_otp');
        
        // For development
        if (data.otp_debug) {
          const otpDigits = data.otp_debug.split('');
          setOtp(otpDigits);
        }
      } else {
        const message = data.detail || data.message || 'رقم الجوال أو كلمة المرور غير صحيحة';
        Alert.alert('خطأ', message);
      }
    } catch (error) {
      handleConnectionError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify login OTP (Step 2)
  const handleVerifyLoginOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('خطأ', 'يرجى إدخال رمز التحقق كاملاً');
      return;
    }

    setIsLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const response = await api.verifyLoginOTP(cleanPhone, otpCode, sessionToken);
      const data = await response.json().catch(() => ({}));
      
      if (response.ok && data.success) {
        await finalizeLogin(data.user, data.token, data.refresh_token);
      } else {
        const message = data.detail || data.message || 'رمز التحقق غير صحيح';
        Alert.alert('خطأ', message);
      }
    } catch (error) {
      handleConnectionError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password
  const handleForgotPassword = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      Alert.alert('خطأ', 'يرجى إدخال رقم جوال صحيح');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.forgotPassword(cleanPhone);
      const data = await response.json().catch(() => ({}));
      
      if (response.ok) {
        setCountdown(60);
        setOtp(['', '', '', '', '', '']);
        setMode('reset_password');
        
        if (data.otp_debug) {
          const otpDigits = data.otp_debug.split('');
          setOtp(otpDigits);
        }
      }
      Alert.alert('تم', 'إذا كان الرقم مسجلاً، سيتم إرسال رمز التحقق');
    } catch (error) {
      handleConnectionError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password
  const handleResetPassword = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('خطأ', 'يرجى إدخال رمز التحقق كاملاً');
      return;
    }
    if (password.length < 8) {
      Alert.alert('خطأ', 'كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('خطأ', 'كلمات المرور غير متطابقة');
      return;
    }

    setIsLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const response = await api.resetPassword(cleanPhone, otpCode, password);
      const data = await response.json().catch(() => ({}));
      
      if (response.ok && data.success) {
        Alert.alert('تم', 'تم تغيير كلمة المرور بنجاح');
        setMode('phone_login');
        setPassword('');
        setConfirmPassword('');
      } else {
        const message = data.detail || data.message || 'فشل تغيير كلمة المرور';
        Alert.alert('خطأ', message);
      }
    } catch (error) {
      handleConnectionError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Email auth (existing)
  const handleEmailAuth = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password;

    if (!normalizedEmail || !normalizedPassword) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
      return;
    }
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      Alert.alert('خطأ', 'صيغة البريد الإلكتروني غير صحيحة');
      return;
    }
    if (mode === 'email_register' && !name.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسمك');
      return;
    }

    setIsLoading(true);
    try {
      let response;
      let data;

      if (__DEV__) console.log('Auth started:', mode);

      if (mode === 'email_register') {
        response = await api.register(normalizedEmail, normalizedPassword, name.trim());
        data = await response.json().catch(() => ({}));
        
        if (response.ok && (data.token || data.success)) {
          if (data.token) {
            await finalizeLogin(data.user, data.token, data.refresh_token);
          } else {
            const loginResponse = await api.login(normalizedEmail, normalizedPassword);
            const loginData = await loginResponse.json().catch(() => ({}));
            if (loginResponse.ok) {
              await finalizeLogin(loginData.user, loginData.token, loginData.refresh_token);
            }
          }
        } else {
          if (__DEV__) console.log('Registration failed:', data);
          const message = await parseErrorMessage(response, 'فشل إنشاء الحساب', data);
          Alert.alert('خطأ', message);
        }
      } else {
        response = await api.login(normalizedEmail, normalizedPassword);
        data = await response.json().catch(() => ({}));
        
        if (__DEV__) console.log('Login response:', response.ok, data?.token ? 'has token' : 'no token');
        
        if (response.ok && data.token) {
          await finalizeLogin(data.user, data.token, data.refresh_token);
        } else {
          if (__DEV__) console.log('Login failed:', data);
          const message = await parseErrorMessage(response, 'البريد الإلكتروني أو كلمة المرور غير صحيحة', data);
          Alert.alert('خطأ', message);
        }
      }
    } catch (error) {
      if (__DEV__) console.log('Auth Error:', error.message);
      handleConnectionError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    const cleanPhone = phone.replace(/\D/g, '');
    setIsLoading(true);
    try {
      let response;
      if (mode === 'phone_otp') {
        response = await api.sendOTP(cleanPhone);
      } else if (mode === 'phone_login_otp') {
        response = await api.loginWithPhone(cleanPhone, password);
      } else if (mode === 'reset_password') {
        response = await api.forgotPassword(cleanPhone);
      }
      
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setCountdown(60);
        if (data.otp_debug) {
          setOtp(data.otp_debug.split(''));
        }
        if (data.session_token) {
          setSessionToken(data.session_token);
        }
        Alert.alert('تم', 'تم إعادة إرسال رمز التحقق');
      }
    } catch (error) {
      handleConnectionError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Render OTP inputs
  const renderOTPInputs = () => (
    <View style={styles.otpContainer}>
      {otp.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => (otpRefs.current[index] = ref)}
          style={styles.otpInput}
          value={digit}
          onChangeText={(value) => handleOtpChange(value, index)}
          onKeyPress={(e) => handleOtpKeyPress(e, index)}
          keyboardType="numeric"
          maxLength={1}
          selectTextOnFocus
          placeholderTextColor="#666"
        />
      ))}
    </View>
  );

  // Render password strength indicator
  const renderPasswordStrength = () => {
    if (!password) return null;
    const { checks, strength } = checkPasswordStrength(password);
    
    return (
      <View style={styles.strengthContainer}>
        <View style={styles.strengthBar}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              style={[
                styles.strengthSegment,
                { backgroundColor: i <= strength ? getStrengthColor(strength) : '#333' }
              ]}
            />
          ))}
        </View>
        <Text style={[styles.strengthText, { color: getStrengthColor(strength) }]}>
          {getStrengthText(strength)}
        </Text>
        <View style={styles.checksContainer}>
          <Text style={[styles.checkItem, checks.length && styles.checkPassed]}>
            {checks.length ? '✓' : '○'} 8 أحرف
          </Text>
          <Text style={[styles.checkItem, checks.uppercase && styles.checkPassed]}>
            {checks.uppercase ? '✓' : '○'} حرف كبير
          </Text>
          <Text style={[styles.checkItem, checks.number && styles.checkPassed]}>
            {checks.number ? '✓' : '○'} رقم
          </Text>
          <Text style={[styles.checkItem, checks.symbol && styles.checkPassed]}>
            {checks.symbol ? '✓' : '○'} رمز
          </Text>
        </View>
      </View>
    );
  };

  // Google Sign In using authProviders
  const handleGoogleSignIn = async () => {
    if (isAppleLoading || isGoogleLoading) return;
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      
      if (result.success) {
        await finalizeLogin(result.user, result.token, result.refreshToken);
      } else if (result.cancelled) {
        // User cancelled - do nothing
      }
    } catch (error) {
      console.log('Google Sign In Error:', error);
      Alert.alert(
        'خطأ في تسجيل الدخول', 
        error.message || 'فشل تسجيل الدخول بجوجل. تأكد من اتصالك بالإنترنت.',
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'إعادة المحاولة', onPress: handleGoogleSignIn }
        ]
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Apple Sign In using authProviders
  const handleAppleSignIn = async () => {
    if (isAppleLoading || isGoogleLoading) return;
    setIsAppleLoading(true);
    try {
      const result = await signInWithApple();
      
      if (result.success) {
        await finalizeLogin(result.user, result.token, result.refreshToken);
      } else if (result.cancelled) {
        // User cancelled - do nothing
      }
    } catch (error) {
      console.log('Apple Sign In Error:', error);
      Alert.alert(
        'خطأ في تسجيل الدخول', 
        error.message || 'فشل تسجيل الدخول بـ Apple. تأكد من اتصالك بالإنترنت.',
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'إعادة المحاولة', onPress: handleAppleSignIn }
        ]
      );
    } finally {
      setIsAppleLoading(false);
    }
  };

  // ==================== MAIN SCREEN ====================
  if (mode === 'main') {
    return (
      <ImageBackground 
        source={{ uri: AUTH_BG_IMAGE }} 
        style={styles.container}
        resizeMode="cover"
      >
        <LinearGradient 
          colors={['rgba(15,23,42,0.28)', 'rgba(30,41,59,0.66)', 'rgba(30,27,75,0.84)']}
          style={styles.container}
        >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Logo with Glow Effect */}
            <View style={styles.logoContainer}>
              <View style={styles.logoGlow}>
                <Image 
                  source={require('../../assets/logo_saqr.png')} 
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>
            <Text style={styles.appName}>صقر</Text>
            <Text style={styles.tagline}>أكمل التحديات واكسب المكافآت</Text>

            {/* Apple Sign In */}
            {Platform.OS === 'ios' && (
              <TouchableOpacity 
                style={[styles.appleBtn, (isAppleLoading || isGoogleLoading) && styles.disabledBtn]} 
                onPress={handleAppleSignIn}
                activeOpacity={0.8}
                disabled={isAppleLoading || isGoogleLoading}
              >
                {isAppleLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="logo-apple" size={22} color="#FFF" />
                    <Text style={styles.appleBtnText}>الدخول بحساب Apple</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Google Sign In */}
            <TouchableOpacity 
              style={[styles.googleBtn, (isAppleLoading || isGoogleLoading) && styles.disabledBtn]} 
              onPress={handleGoogleSignIn}
              activeOpacity={0.8}
              disabled={isAppleLoading || isGoogleLoading}
            >
              {isGoogleLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="#FFF" />
                  <Text style={styles.googleBtnText}>الدخول بحساب Google</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>أو</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email Login */}
            <TouchableOpacity 
              style={styles.emailBtn} 
              onPress={() => setMode('email_login')}
              activeOpacity={0.8}
            >
              <Ionicons name="mail-outline" size={20} color="#60a5fa" />
              <Text style={styles.emailText}>الدخول بالبريد الإلكتروني</Text>
            </TouchableOpacity>

            {/* Guest Login */}
            <TouchableOpacity 
              style={styles.guestBtn} 
              onPress={handleGuestLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Ionicons name="person-outline" size={20} color="#888" />
              <Text style={styles.guestBtnText}>الدخول كزائر</Text>
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <View style={styles.attCard}>
                <View style={styles.attHead}>
                  <Ionicons name="eye-outline" size={18} color="#7dd3fc" />
                  <Text style={styles.attTitle}>شفافية تتبع التطبيقات (ATT)</Text>
                </View>
                <Text style={styles.attSubtitle}>
                  يظهر طلب الإذن عند أول تشغيل. الحالة الحالية: {getAttStatusLabel()}
                </Text>
                <TouchableOpacity style={styles.attBtn} onPress={handleRequestTrackingPermission}>
                  <Text style={styles.attBtnText}>
                    {attStatus === 'undetermined' ? 'طلب الإذن الآن' : 'فحص حالة الإذن'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Terms */}
            <Text style={styles.terms}>
              بالتسجيل، أنت توافق على{' '}
              <Text style={styles.termsLink} onPress={() => Linking.openURL(`${api.baseUrl}/terms`)}>
                الشروط والأحكام
              </Text>
              {' '}و{' '}
              <Text style={styles.termsLink} onPress={() => Linking.openURL(`${api.baseUrl}/privacy`)}>
                سياسة الخصوصية
              </Text>
            </Text>
          </View>
        </ScrollView>
        </LinearGradient>
      </ImageBackground>
    );
  }

  // ==================== PHONE LOGIN ====================
  if (mode === 'phone_login') {
    return (
      <LinearGradient colors={AUTH_FORM_GRADIENT} style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              {/* Back Button */}
              <TouchableOpacity style={styles.backBtn} onPress={() => setMode('main')}>
                <Ionicons name="arrow-forward" size={24} color="#FFF" />
              </TouchableOpacity>

              <View style={styles.headerIcon}>
                <Ionicons name="phone-portrait" size={40} color="#60a5fa" />
              </View>
              <Text style={styles.title}>تسجيل الدخول</Text>
              <Text style={styles.subtitle}>أدخل رقم الجوال وكلمة المرور</Text>

              {/* Phone Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Ionicons name="call-outline" size={20} color="#60a5fa" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="05X XXX XXXX"
                  placeholderTextColor="#666"
                  value={formatPhoneDisplay(phone)}
                  onChangeText={(text) => setPhone(text.replace(/\D/g, ''))}
                  keyboardType="phone-pad"
                  maxLength={13}
                />
                <Text style={styles.countryCode}>+966</Text>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Ionicons name="lock-closed-outline" size={20} color="#60a5fa" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="كلمة المرور"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity onPress={() => setMode('forgot_password')}>
                <Text style={styles.forgotText}>نسيت كلمة المرور؟</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity 
                style={styles.submitBtn} 
                onPress={handlePhoneLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitText}>تسجيل الدخول</Text>
                )}
              </TouchableOpacity>

              {/* Register Link */}
              <TouchableOpacity onPress={() => setMode('phone_register')}>
                <Text style={styles.switchText}>
                  ليس لديك حساب؟ <Text style={styles.switchBold}>سجل الآن</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    );
  }

  // ==================== PHONE REGISTER ====================
  if (mode === 'phone_register') {
    return (
      <LinearGradient colors={AUTH_FORM_GRADIENT} style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setMode('main')}>
                <Ionicons name="arrow-forward" size={24} color="#FFF" />
              </TouchableOpacity>

              <View style={styles.headerIcon}>
                <Ionicons name="person-add" size={40} color="#22c55e" />
              </View>
              <Text style={styles.title}>حساب جديد</Text>
              <Text style={styles.subtitle}>أدخل رقم جوالك للتسجيل</Text>

              {/* Phone Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Ionicons name="call-outline" size={20} color="#60a5fa" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="05X XXX XXXX"
                  placeholderTextColor="#666"
                  value={formatPhoneDisplay(phone)}
                  onChangeText={(text) => setPhone(text.replace(/\D/g, ''))}
                  keyboardType="phone-pad"
                  maxLength={13}
                />
                <Text style={styles.countryCode}>+966</Text>
              </View>

              {/* Send OTP Button */}
              <TouchableOpacity 
                style={styles.submitBtn} 
                onPress={handleSendOTP}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitText}>إرسال رمز التحقق</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setMode('phone_login')}>
                <Text style={styles.switchText}>
                  لديك حساب؟ <Text style={styles.switchBold}>سجل دخول</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    );
  }

  // ==================== PHONE OTP (Registration) ====================
  if (mode === 'phone_otp') {
    return (
      <LinearGradient colors={AUTH_FORM_GRADIENT} style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setMode('phone_register')}>
                <Ionicons name="arrow-forward" size={24} color="#FFF" />
              </TouchableOpacity>

              <View style={styles.headerIcon}>
                <Ionicons name="shield-checkmark" size={40} color="#22c55e" />
              </View>
              <Text style={styles.title}>التحقق من الرقم</Text>
              <Text style={styles.subtitle}>أدخل الرمز المرسل إلى {formatPhoneDisplay(phone)}</Text>

              {/* OTP Inputs */}
              {renderOTPInputs()}

              {/* Resend */}
              <TouchableOpacity 
                onPress={handleResendOTP} 
                disabled={countdown > 0}
                style={styles.resendBtn}
              >
                <Text style={[styles.resendText, countdown > 0 && styles.resendDisabled]}>
                  {countdown > 0 ? `إعادة الإرسال بعد ${countdown}s` : 'إعادة إرسال الرمز'}
                </Text>
              </TouchableOpacity>

              {/* Name Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Ionicons name="person-outline" size={20} color="#60a5fa" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="الاسم"
                  placeholderTextColor="#666"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Ionicons name="lock-closed-outline" size={20} color="#60a5fa" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="كلمة المرور"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Password Strength */}
              {renderPasswordStrength()}

              {/* Confirm Password */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Ionicons name="lock-closed-outline" size={20} color="#60a5fa" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="تأكيد كلمة المرور"
                  placeholderTextColor="#666"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
              </View>

              {/* Register Button */}
              <TouchableOpacity 
                style={styles.submitBtn} 
                onPress={handleVerifyAndRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitText}>إنشاء الحساب</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    );
  }

  // ==================== PHONE LOGIN OTP (2FA) ====================
  if (mode === 'phone_login_otp') {
    return (
      <LinearGradient colors={AUTH_FORM_GRADIENT} style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setMode('phone_login')}>
                <Ionicons name="arrow-forward" size={24} color="#FFF" />
              </TouchableOpacity>

              <View style={styles.headerIcon}>
                <Ionicons name="key" size={40} color="#f59e0b" />
              </View>
              <Text style={styles.title}>رمز التحقق</Text>
              <Text style={styles.subtitle}>أدخل الرمز المرسل لإتمام تسجيل الدخول</Text>

              {renderOTPInputs()}

              <TouchableOpacity 
                onPress={handleResendOTP} 
                disabled={countdown > 0}
                style={styles.resendBtn}
              >
                <Text style={[styles.resendText, countdown > 0 && styles.resendDisabled]}>
                  {countdown > 0 ? `إعادة الإرسال بعد ${countdown}s` : 'إعادة إرسال الرمز'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.submitBtn} 
                onPress={handleVerifyLoginOTP}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitText}>تأكيد</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    );
  }

  // ==================== FORGOT PASSWORD ====================
  if (mode === 'forgot_password') {
    return (
      <LinearGradient colors={AUTH_FORM_GRADIENT} style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setMode('phone_login')}>
                <Ionicons name="arrow-forward" size={24} color="#FFF" />
              </TouchableOpacity>

              <View style={styles.headerIcon}>
                <Ionicons name="help-circle" size={40} color="#f59e0b" />
              </View>
              <Text style={styles.title}>استعادة كلمة المرور</Text>
              <Text style={styles.subtitle}>أدخل رقم جوالك لإرسال رمز الاستعادة</Text>

              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Ionicons name="call-outline" size={20} color="#60a5fa" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="05X XXX XXXX"
                  placeholderTextColor="#666"
                  value={formatPhoneDisplay(phone)}
                  onChangeText={(text) => setPhone(text.replace(/\D/g, ''))}
                  keyboardType="phone-pad"
                  maxLength={13}
                />
                <Text style={styles.countryCode}>+966</Text>
              </View>

              <TouchableOpacity 
                style={styles.submitBtn} 
                onPress={handleForgotPassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitText}>إرسال رمز الاستعادة</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    );
  }

  // ==================== RESET PASSWORD ====================
  if (mode === 'reset_password') {
    return (
      <LinearGradient colors={AUTH_FORM_GRADIENT} style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setMode('forgot_password')}>
                <Ionicons name="arrow-forward" size={24} color="#FFF" />
              </TouchableOpacity>

              <View style={styles.headerIcon}>
                <Ionicons name="lock-open" size={40} color="#22c55e" />
              </View>
              <Text style={styles.title}>كلمة مرور جديدة</Text>
              <Text style={styles.subtitle}>أدخل الرمز وكلمة المرور الجديدة</Text>

              {renderOTPInputs()}

              <TouchableOpacity 
                onPress={handleResendOTP} 
                disabled={countdown > 0}
                style={styles.resendBtn}
              >
                <Text style={[styles.resendText, countdown > 0 && styles.resendDisabled]}>
                  {countdown > 0 ? `إعادة الإرسال بعد ${countdown}s` : 'إعادة إرسال الرمز'}
                </Text>
              </TouchableOpacity>

              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Ionicons name="lock-closed-outline" size={20} color="#60a5fa" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="كلمة المرور الجديدة"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#666" />
                </TouchableOpacity>
              </View>

              {renderPasswordStrength()}

              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Ionicons name="lock-closed-outline" size={20} color="#60a5fa" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="تأكيد كلمة المرور"
                  placeholderTextColor="#666"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
              </View>

              <TouchableOpacity 
                style={styles.submitBtn} 
                onPress={handleResetPassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitText}>تغيير كلمة المرور</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    );
  }

  // ==================== EMAIL LOGIN/REGISTER ====================
  if (mode === 'email_login' || mode === 'email_register') {
    return (
      <LinearGradient colors={AUTH_FORM_GRADIENT} style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setMode('main')}>
                <Ionicons name="arrow-forward" size={24} color="#FFF" />
              </TouchableOpacity>

              <View style={styles.headerIcon}>
                <Ionicons name="mail" size={40} color="#60a5fa" />
              </View>
              <Text style={styles.title}>
                {mode === 'email_register' ? 'حساب جديد' : 'تسجيل الدخول'}
              </Text>
              <Text style={styles.subtitle}>
                {mode === 'email_register' ? 'أنشئ حسابك بالبريد الإلكتروني' : 'أدخل بريدك الإلكتروني'}
              </Text>

              {mode === 'email_register' && (
                <View style={styles.inputContainer}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="person-outline" size={20} color="#60a5fa" />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="الاسم"
                    placeholderTextColor="#666"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              )}

              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Ionicons name="mail-outline" size={20} color="#60a5fa" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="البريد الإلكتروني"
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Ionicons name="lock-closed-outline" size={20} color="#60a5fa" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="كلمة المرور"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.submitBtn} 
                onPress={handleEmailAuth}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitText}>
                    {mode === 'email_register' ? 'إنشاء الحساب' : 'تسجيل الدخول'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => setMode(mode === 'email_register' ? 'email_login' : 'email_register')}
              >
                <Text style={styles.switchText}>
                  {mode === 'email_register' ? 'لديك حساب؟ ' : 'ليس لديك حساب؟ '}
                  <Text style={styles.switchBold}>
                    {mode === 'email_register' ? 'سجل دخول' : 'سجل الآن'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: 34 },
  content: { paddingHorizontal: 18, width: '100%', alignSelf: 'center' },
  
  // Logo with Glow
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoGlow: {
    shadowColor: '#60a5fa',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    borderRadius: 30,
    padding: 4,
  },
  logoImage: {
    width: 110,
    height: 110,
    borderRadius: 28,
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    textShadowColor: 'rgba(99, 102, 241, 0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(241,245,249,0.86)',
    textAlign: 'center',
    marginBottom: 36,
    letterSpacing: 0.5,
  },

  // Header
  backBtn: {
    position: 'absolute',
    top: -20,
    right: 0,
    padding: 8,
  },
  headerIcon: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(226,232,240,0.78)',
    textAlign: 'center',
    marginBottom: 20,
  },

  // Apple Button - Glass Effect
  appleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(15,23,42,0.72)',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.28)',
  },
  appleBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Google Button - Premium Style
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#4f7cf7',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#4f7cf7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  googleBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  
  // Disabled Button State
  disabledBtn: {
    opacity: 0.6,
  },

  // Buttons
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    marginBottom: 20,
  },
  secondaryBtnText: {
    color: '#60a5fa',
    fontSize: 16,
    fontWeight: '500',
  },
  emailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(129, 140, 248, 0.16)',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.38)',
    marginBottom: 12,
  },
  emailText: {
    color: '#c7d2fe',
    fontSize: 15,
    fontWeight: '500',
  },

  // Phone Button
  phoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
  },
  phoneBtnText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
  },

  // Guest Button
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.2)',
    marginBottom: 20,
  },
  guestBtnText: {
    color: 'rgba(226,232,240,0.78)',
    fontSize: 15,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.4)',
    paddingHorizontal: 16,
    fontSize: 14,
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.78)',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.22)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#FFF',
    textAlign: 'right',
  },
  countryCode: {
    color: '#60a5fa',
    fontSize: 14,
    marginLeft: 8,
  },

  // OTP
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  otpInput: {
    width: 48,
    height: 56,
    backgroundColor: 'rgba(15,23,42,0.75)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.24)',
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resendBtn: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resendText: {
    color: '#60a5fa',
    fontSize: 14,
  },
  resendDisabled: {
    color: '#666',
  },

  // Password Strength
  strengthContainer: {
    marginBottom: 16,
    marginTop: -8,
  },
  strengthBar: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 8,
  },
  checksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-end',
  },
  checkItem: {
    fontSize: 11,
    color: '#666',
  },
  checkPassed: {
    color: '#22c55e',
  },

  // Submit
  submitBtn: {
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 5,
  },
  submitText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Links
  forgotText: {
    color: '#60a5fa',
    fontSize: 14,
    textAlign: 'left',
    marginBottom: 20,
    marginTop: -8,
  },
  switchText: {
    color: 'rgba(203,213,225,0.86)',
    fontSize: 14,
    textAlign: 'center',
  },
  switchBold: {
    color: '#c7d2fe',
    fontWeight: '600',
  },
  guestLink: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 20,
  },
  guestText: {
    color: '#666',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  terms: {
    color: 'rgba(203,213,225,0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
  termsLink: {
    color: '#c7d2fe',
  },
  attCard: {
    backgroundColor: 'rgba(14,116,144,0.18)',
    borderColor: 'rgba(125,211,252,0.35)',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  attHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  attTitle: {
    color: '#bae6fd',
    fontSize: 13,
    fontWeight: '700',
  },
  attSubtitle: {
    color: 'rgba(186,230,253,0.9)',
    fontSize: 12,
    marginBottom: 8,
  },
  attBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56,189,248,0.24)',
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.42)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  attBtnText: {
    color: '#e0f2fe',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default AuthScreen;
