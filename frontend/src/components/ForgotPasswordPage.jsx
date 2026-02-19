// Forgot Password Page
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from '../hooks/use-toast';
import { useLanguage } from '../i18n/LanguageContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ForgotPasswordPage = () => {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to send OTP');
      }

      toast({
        title: '✅ ' + (isRTL ? 'تم الإرسال' : 'Sent'),
        description: isRTL ? 'تم إرسال رمز التحقق إلى بريدك الإلكتروني' : 'Verification code sent to your email',
      });

      setStep(2);
    } catch (error) {
      toast({
        title: '❌ ' + (isRTL ? 'خطأ' : 'Error'),
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/verify-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Invalid OTP');
      }

      setResetToken(data.reset_token);
      setStep(3);
    } catch (error) {
      toast({
        title: '❌ ' + (isRTL ? 'خطأ' : 'Error'),
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: '❌ ' + (isRTL ? 'خطأ' : 'Error'),
        description: isRTL ? 'كلمات المرور غير متطابقة' : 'Passwords do not match',
        variant: 'destructive'
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: '❌ ' + (isRTL ? 'خطأ' : 'Error'),
        description: isRTL ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          reset_token: resetToken, 
          new_password: newPassword 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to reset password');
      }

      toast({
        title: '✅ ' + (isRTL ? 'تم' : 'Success'),
        description: isRTL ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully',
      });

      navigate('/');
    } catch (error) {
      toast({
        title: '❌ ' + (isRTL ? 'خطأ' : 'Error'),
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-4 relative overflow-hidden">
      {/* Decorative Circles */}
      <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-[#3b82f6]/20 blur-3xl"></div>
      <div className="absolute bottom-[-150px] right-[-150px] w-[400px] h-[400px] rounded-full bg-[#3b82f6]/15 blur-3xl"></div>

      <Card className="w-full max-w-md shadow-2xl border border-white/10 bg-[#111118]/80 backdrop-blur-xl rounded-2xl">
        <CardHeader className="text-center pb-6 pt-8 relative">
          <button
            onClick={() => step === 1 ? navigate('/') : setStep(step - 1)}
            className={`absolute top-4 ${isRTL ? 'right-4' : 'left-4'} text-gray-400 hover:text-white text-xl`}
          >
            {isRTL ? '←' : '→'}
          </button>
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-[#3b82f6]/20 flex items-center justify-center">
            {step === 1 && (
              <svg className="w-8 h-8 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
            {step === 2 && (
              <svg className="w-8 h-8 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            )}
            {step === 3 && (
              <svg className="w-8 h-8 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            {step === 1 && (isRTL ? 'نسيت كلمة المرور؟' : 'Forgot Password?')}
            {step === 2 && (isRTL ? 'أدخل رمز التحقق' : 'Enter Verification Code')}
            {step === 3 && (isRTL ? 'كلمة مرور جديدة' : 'New Password')}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {step === 1 && (isRTL ? 'أدخل بريدك الإلكتروني لإرسال رمز التحقق' : 'Enter your email to receive a verification code')}
            {step === 2 && (isRTL ? 'أدخل الرمز المرسل إلى بريدك الإلكتروني' : 'Enter the code sent to your email')}
            {step === 3 && (isRTL ? 'أدخل كلمة المرور الجديدة' : 'Enter your new password')}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pb-8 px-8">
          {/* Step 1: Email */}
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-gray-300">
                  {isRTL ? 'البريد الإلكتروني' : 'Email'}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  dir="ltr"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-[#3b82f6] to-[#6366f1] hover:from-[#2563eb] hover:to-[#4f46e5] text-white rounded-full font-medium"
              >
                {isLoading ? (isRTL ? 'جاري الإرسال...' : 'Sending...') : (isRTL ? 'إرسال رمز التحقق' : 'Send Verification Code')}
              </Button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <Label htmlFor="otp" className="text-gray-300">
                  {isRTL ? 'رمز التحقق' : 'Verification Code'}
                </Label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  placeholder="123456"
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500 text-center text-2xl tracking-widest"
                  dir="ltr"
                  maxLength={6}
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-[#3b82f6] to-[#6366f1] hover:from-[#2563eb] hover:to-[#4f46e5] text-white rounded-full font-medium"
              >
                {isLoading ? (isRTL ? 'جاري التحقق...' : 'Verifying...') : (isRTL ? 'تحقق' : 'Verify')}
              </Button>
              <button
                type="button"
                onClick={handleSendOTP}
                className="w-full text-[#60a5fa] hover:underline text-sm"
              >
                {isRTL ? 'إعادة إرسال الرمز' : 'Resend Code'}
              </button>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <Label htmlFor="newPassword" className="text-gray-300">
                  {isRTL ? 'كلمة المرور الجديدة' : 'New Password'}
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  minLength={6}
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword" className="text-gray-300">
                  {isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  minLength={6}
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-[#3b82f6] to-[#6366f1] hover:from-[#2563eb] hover:to-[#4f46e5] text-white rounded-full font-medium"
              >
                {isLoading ? (isRTL ? 'جاري التغيير...' : 'Changing...') : (isRTL ? 'تغيير كلمة المرور' : 'Change Password')}
              </Button>
            </form>
          )}

          {/* Progress Indicator */}
          <div className="flex justify-center gap-2 pt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full transition-all ${
                  s === step ? 'bg-[#3b82f6] w-6' : s < step ? 'bg-[#3b82f6]/50' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
