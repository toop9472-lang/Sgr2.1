// Auth Screen - Login / Register with Email & Social
// Professional Design with Ionicons
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import api from '../services/api';
import storage from '../services/storage';
import colors from '../styles/colors';

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
  const [countdown, setCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  
  // OTP input refs
  const otpRefs = useRef([]);
  
  // Handle connection errors
  const handleConnectionError = (error) => {
    console.log('Connection Error:', error.message);
    if (error.message === 'CONNECTION_TIMEOUT') {
      Alert.alert('خطأ في الاتصال', 'انتهت مهلة الاتصال بالسيرفر. يرجى المحاولة مرة أخرى.');
    } else if (error.message === 'NO_CONNECTION') {
      Alert.alert('لا يوجد اتصال', 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى.');
    } else {
      Alert.alert('خطأ في الاتصال', 'حدث خطأ غير متوقع. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.');
    }
  };
  
  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

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
      const guestUser = {
        user_id: 'guest_' + Date.now(),
        email: 'guest@saqr.app',
        name: 'زائر',
        points: 0,
        total_earned: 0,
        is_guest: true
      };
      await storage.setUserData(guestUser);
      await storage.setToken('guest_token');
      onLogin(guestUser);
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
      const data = await response.json();
      
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
        Alert.alert('خطأ', data.detail || 'فشل إرسال رمز التحقق');
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
      const data = await response.json();
      
      if (response.ok && data.success) {
        await storage.setToken(data.token);
        await storage.setUserData(data.user);
        Alert.alert('مرحباً', 'تم إنشاء حسابك بنجاح!');
        onLogin(data.user);
      } else {
        Alert.alert('خطأ', data.detail || 'فشل إنشاء الحساب');
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
      const data = await response.json();
      
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
        Alert.alert('خطأ', data.detail || 'رقم الجوال أو كلمة المرور غير صحيحة');
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
      const data = await response.json();
      
      if (response.ok && data.success) {
        await storage.setToken(data.token);
        await storage.setUserData(data.user);
        onLogin(data.user);
      } else {
        Alert.alert('خطأ', data.detail || 'رمز التحقق غير صحيح');
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
      const data = await response.json();
      
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
      const data = await response.json();
      
      if (response.ok && data.success) {
        Alert.alert('تم', 'تم تغيير كلمة المرور بنجاح');
        setMode('phone_login');
        setPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert('خطأ', data.detail || 'فشل تغيير كلمة المرور');
      }
    } catch (error) {
      handleConnectionError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Email auth (existing)
  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
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

      if (mode === 'email_register') {
        response = await api.register(email, password, name);
        data = await response.json();
        
        if (response.ok && data.success) {
          const loginResponse = await api.login(email, password);
          const loginData = await loginResponse.json();
          if (loginResponse.ok) {
            await storage.setToken(loginData.token);
            await storage.setUserData(loginData.user);
            onLogin(loginData.user);
          }
        } else {
          Alert.alert('خطأ', data.detail || 'فشل إنشاء الحساب');
        }
      } else {
        response = await api.login(email, password);
        data = await response.json();
        
        if (response.ok) {
          await storage.setToken(data.token);
          await storage.setUserData(data.user);
          onLogin(data.user);
        } else {
          Alert.alert('خطأ', data.detail || 'فشل تسجيل الدخول');
        }
      }
    } catch (error) {
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
      
      const data = await response.json();
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
      Alert.alert('خطأ', 'فشل إعادة الإرسال');
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

  // Google Sign In using WebBrowser
  const handleGoogleSignIn = async () => {
    if (isAppleLoading || isGoogleLoading) return; // Prevent multiple clicks
    setIsGoogleLoading(true);
    try {
      const authUrl = `${api.BASE_URL}/api/auth/google?redirect_uri=saqr://auth/callback`;
      
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'saqr://auth/callback'
      );
      
      if (result.type === 'success' && result.url) {
        // Extract session_id from URL
        const url = result.url;
        const sessionMatch = url.match(/session_id=([^&]+)/);
        
        if (sessionMatch) {
          const sessionId = sessionMatch[1];
          // Get user data from session
          const response = await fetch(`${api.BASE_URL}/api/auth/session/${sessionId}`);
          const data = await response.json();
          
          if (response.ok && data.user) {
            await storage.setToken(data.token);
            await storage.setUserData(data.user);
            onLogin(data.user);
          } else {
            Alert.alert('خطأ', 'فشل تسجيل الدخول');
          }
        }
      } else if (result.type === 'cancel') {
        // User cancelled, do nothing
      }
    } catch (error) {
      console.log('Google Sign In Error:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تسجيل الدخول بـ Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Apple Sign In using WebBrowser
  const handleAppleSignIn = async () => {
    if (isAppleLoading || isGoogleLoading) return; // Prevent multiple clicks
    setIsAppleLoading(true);
    try {
      const authUrl = `${api.BASE_URL}/api/auth/apple?redirect_uri=saqr://auth/callback`;
      
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'saqr://auth/callback'
      );
      
      if (result.type === 'success' && result.url) {
        const url = result.url;
        const sessionMatch = url.match(/session_id=([^&]+)/);
        
        if (sessionMatch) {
          const sessionId = sessionMatch[1];
          const response = await fetch(`${api.BASE_URL}/api/auth/session/${sessionId}`);
          const data = await response.json();
          
          if (response.ok && data.user) {
            await storage.setToken(data.token);
            await storage.setUserData(data.user);
            onLogin(data.user);
          } else {
            Alert.alert('خطأ', 'فشل تسجيل الدخول');
          }
        }
      } else if (result.type === 'cancel') {
        // User cancelled
      }
    } catch (error) {
      console.log('Apple Sign In Error:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تسجيل الدخول بـ Apple');
    } finally {
      setIsAppleLoading(false);
    }
  };

  // ==================== MAIN SCREEN ====================
  if (mode === 'main') {
    return (
      <LinearGradient colors={['#0a0a0f', '#111118', '#0a0a0f']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/logo_saqr.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
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

            {/* Terms */}
            <Text style={styles.terms}>
              بالتسجيل، أنت توافق على{' '}
              <Text style={styles.termsLink} onPress={() => Linking.openURL('https://saqr-live.emergent.host/terms')}>
                الشروط والأحكام
              </Text>
              {' '}و{' '}
              <Text style={styles.termsLink} onPress={() => Linking.openURL('https://saqr-live.emergent.host/privacy')}>
                سياسة الخصوصية
              </Text>
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  // ==================== PHONE LOGIN ====================
  if (mode === 'phone_login') {
    return (
      <LinearGradient colors={['#0a0a0f', '#111118', '#0a0a0f']} style={styles.container}>
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
      <LinearGradient colors={['#0a0a0f', '#111118', '#0a0a0f']} style={styles.container}>
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
      <LinearGradient colors={['#0a0a0f', '#111118', '#0a0a0f']} style={styles.container}>
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
      <LinearGradient colors={['#0a0a0f', '#111118', '#0a0a0f']} style={styles.container}>
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
      <LinearGradient colors={['#0a0a0f', '#111118', '#0a0a0f']} style={styles.container}>
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
      <LinearGradient colors={['#0a0a0f', '#111118', '#0a0a0f']} style={styles.container}>
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
      <LinearGradient colors={['#0a0a0f', '#111118', '#0a0a0f']} style={styles.container}>
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
  scroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: 40 },
  content: { paddingHorizontal: 24 },
  
  // Logo
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 25,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 32,
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
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },

  // Apple Button
  appleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#000',
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  appleBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Google Button
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#4285F4',
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  googleBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 12,
  },
  emailText: {
    color: '#60a5fa',
    fontSize: 15,
  },

  // Phone Button
  phoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 12,
  },
  phoneBtnText: {
    color: '#888',
    fontSize: 15,
  },

  // Guest Button
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 20,
  },
  guestBtnText: {
    color: '#888',
    fontSize: 15,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#666',
    paddingHorizontal: 16,
    fontSize: 14,
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a24',
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a3a',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
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
    backgroundColor: '#1a1a24',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a3a',
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
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 20,
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
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
  switchBold: {
    color: '#60a5fa',
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
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
  termsLink: {
    color: '#60a5fa',
  },
});

export default AuthScreen;
