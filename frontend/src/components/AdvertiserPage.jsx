import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, AlertCircle, CreditCard, Building2, Smartphone, Clock, Timer, Globe, MapPin, Rocket } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { toast } from '../hooks/use-toast';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdvertiserPage = ({ onNavigate }) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adData, setAdData] = useState({
    advertiser_name: '',
    advertiser_email: '',
    advertiser_phone: '',
    website_url: '',
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    duration: 60,
    duration_hours: 1,
    ad_type: 'local'
  });
  const [createdAd, setCreatedAd] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentProof, setPaymentProof] = useState('');
  const [packages, setPackages] = useState([]);
  const [enabledGateways, setEnabledGateways] = useState({
    stripe: true,
    tap: false,
    tabby: false,
    tamara: false,
    stcpay: false,
    paypal: false
  });
  const [selectedPackage, setSelectedPackage] = useState('ad_1_hour');

  useEffect(() => {
    const loadPackages = async () => {
      try {
        const response = await fetch(`${API_URL}/api/payments/packages`);
        const data = await response.json();
        setPackages(data.packages);
      } catch (error) {
        console.error('Failed to load packages:', error);
      }
    };
    
    const loadEnabledGateways = async () => {
      try {
        const response = await fetch(`${API_URL}/api/settings/public/payment-gateways`);
        const data = await response.json();
        setEnabledGateways(data);
      } catch (error) {
        console.error('Failed to load payment gateways:', error);
      }
    };
    
    loadPackages();
    loadEnabledGateways();
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const chargeId = urlParams.get('charge_id');
    const provider = urlParams.get('provider');
    
    if (sessionId) {
      pollPaymentStatus(sessionId);
    } else if (chargeId && provider === 'tap') {
      pollTapPaymentStatus(chargeId);
    }
  }, []);

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 10;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      toast({
        title: 'انتهت المهلة',
        description: 'يرجى التحقق من بريدك الإلكتروني للتأكيد',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/payments/status/${sessionId}`);
      const data = await response.json();

      if (data.payment_status === 'paid') {
        setStep(4);
        setCreatedAd({ ad: { id: data.ad_id } });
        toast({
          title: 'تم الدفع بنجاح!',
          description: 'إعلانك نشط الآن! المؤقت بدأ.',
        });
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      } else if (data.status === 'expired') {
        toast({
          title: 'انتهت صلاحية جلسة الدفع',
          description: 'يرجى المحاولة مرة أخرى',
          variant: 'destructive'
        });
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      setStep(3);
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  const pollTapPaymentStatus = async (chargeId, attempts = 0) => {
    const maxAttempts = 10;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      toast({
        title: 'انتهت المهلة',
        description: 'يرجى التحقق من بريدك الإلكتروني للتأكيد',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/tap/status/${chargeId}`);
      const data = await response.json();

      if (data.payment_status === 'paid') {
        setStep(4);
        setCreatedAd({ ad: { id: data.ad_id } });
        toast({
          title: 'تم الدفع بنجاح!',
          description: 'إعلانك نشط الآن!',
        });
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      } else if (data.payment_status === 'failed') {
        toast({
          title: 'فشل الدفع',
          description: 'يرجى المحاولة مرة أخرى',
          variant: 'destructive'
        });
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      setStep(3);
      setTimeout(() => pollTapPaymentStatus(chargeId, attempts + 1), pollInterval);
    } catch (error) {
      console.error('Error checking Tap payment status:', error);
    }
  };

  const handleInputChange = (e) => {
    setAdData({
      ...adData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmitAd = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const pkg = getCurrentPackage();
      const response = await fetch(`${API_URL}/api/advertiser/ads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...adData,
          duration_hours: pkg?.duration_hours || 1
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create ad');
      }

      const data = await response.json();
      setCreatedAd(data);
      setStep(2);
      
      toast({
        title: 'تم إنشاء الإعلان',
        description: 'الآن اختر طريقة الدفع',
      });
    } catch (error) {
      console.error('Failed to create ad:', error);
      toast({
        title: 'خطأ',
        description: 'فشل إنشاء الإعلان. يرجى المحاولة مرة أخرى',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStripePayment = async () => {
    if (!createdAd?.ad?.id) {
      toast({
        title: 'خطأ',
        description: 'يرجى إنشاء الإعلان أولاً',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/payments/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_id: selectedPackage,
          ad_id: createdAd.ad.id,
          origin_url: window.location.origin,
          advertiser_email: adData.advertiser_email
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      window.location.href = data.checkout_url;
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'خطأ في الدفع',
        description: 'فشل إنشاء جلسة الدفع',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTapPayment = async () => {
    if (!createdAd?.ad?.id) {
      toast({
        title: 'خطأ',
        description: 'يرجى إنشاء الإعلان أولاً',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/tap/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_id: selectedPackage,
          ad_id: createdAd.ad.id,
          origin_url: window.location.origin,
          advertiser_email: adData.advertiser_email,
          advertiser_name: adData.advertiser_name,
          advertiser_phone: adData.advertiser_phone
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create Tap checkout');
      }

      const data = await response.json();
      window.location.href = data.checkout_url;
    } catch (error) {
      console.error('Tap payment error:', error);
      toast({
        title: 'خطأ في الدفع',
        description: error.message || 'فشل إنشاء جلسة الدفع',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualPayment = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await fetch(`${API_URL}/api/advertiser/ads/${createdAd.ad.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_method: paymentMethod,
          payment_proof: paymentProof
        })
      });
      
      setStep(4);
      
      toast({
        title: 'تم إرسال إثبات الدفع',
        description: 'سيتم مراجعة إعلانك والموافقة عليه قريباً',
      });
    } catch (error) {
      console.error('Failed to submit payment:', error);
      toast({
        title: 'خطأ',
        description: 'فشل إرسال إثبات الدفع',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentPackage = () => {
    return packages.find(p => p.id === selectedPackage) || packages[0];
  };

  const formatDuration = (hours) => {
    if (hours < 24) return `${hours} ساعة`;
    if (hours === 24) return 'يوم كامل';
    if (hours === 48) return 'يومين';
    if (hours === 168) return 'أسبوع كامل';
    return `${hours} ساعة`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-20 relative overflow-hidden">
      <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-[#3b82f6]/20 blur-3xl"></div>
      <div className="absolute bottom-[-150px] right-[-150px] w-[400px] h-[400px] rounded-full bg-[#3b82f6]/15 blur-3xl"></div>
      
      <div className="relative px-4 pt-8 pb-12">
        <button
          onClick={() => onNavigate('home')}
          className="text-gray-400 hover:text-white mb-4 flex items-center gap-2 transition-colors"
          data-testid="back-btn"
        >
          <ArrowRight className="rotate-180" size={20} />
          عودة
        </button>
        <h1 className="text-white text-3xl font-bold">أضف إعلانك</h1>
        <p className="text-gray-400 mt-2">وصّل إعلانك لآلاف المستخدمين النشطين</p>
      </div>

      <div className="px-4 space-y-6">
        {/* New Hourly Pricing Packages */}
        {packages.length > 0 && step === 1 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-2 text-center">اختر مدة الإعلان</h3>
            <p className="text-gray-400 text-sm text-center mb-6">الإعلان يبدأ فوراً بعد الدفع مع مؤقت عد تنازلي</p>

            {/* Boost upsell - independent rocket offer */}
            <div className="mb-6 flex items-center gap-3 bg-yellow-400/10 border border-yellow-400/40 rounded-2xl p-3" data-testid="boost-upsell-card">
              <div className="w-11 h-11 rounded-xl bg-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-400/30 flex-shrink-0">
                <Rocket className="w-5 h-5 text-[#0a0a0f]" />
              </div>
              <div className="text-right flex-1">
                <p className="text-yellow-200 font-extrabold text-sm">ارفع إعلانك للأعلى</p>
                <p className="text-yellow-200/75 text-xs leading-relaxed mt-0.5">
                  بعد نشر إعلانك، يمكنك ترقيته للأعلى بـ 5 ﷼ لمرة واحدة من «إعلاناتي» — دون تجديد المدة.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {packages.map((pkg, index) => (
                <div
                  key={pkg.id}
                  onClick={() => {
                    setSelectedPackage(pkg.id);
                    setAdData({ ...adData, duration_hours: pkg.duration_hours });
                  }}
                  className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                    selectedPackage === pkg.id
                      ? 'border-[#3b82f6] bg-[#3b82f6]/10 shadow-lg shadow-[#3b82f6]/20 scale-105'
                      : 'border-white/10 bg-[#111118]/80 hover:border-white/30'
                  }`}
                >
                  {/* Best Value Badge */}
                  {pkg.duration_hours === 24 && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded-full">
                      الأفضل قيمة
                    </div>
                  )}
                  
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-[#3b82f6]/20 flex items-center justify-center">
                      <Timer className="w-5 h-5 text-[#60a5fa]" />
                    </div>
                    <p className="text-white font-bold text-lg">{formatDuration(pkg.duration_hours)}</p>
                    <p className="text-2xl font-bold text-[#3b82f6] mt-1">{pkg.amount} ﷼</p>
                  </div>
                  
                  {selectedPackage === pkg.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#3b82f6] flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Ad Form */}
        {step === 1 && (
          <Card className="shadow-xl border border-white/10 bg-[#111118]/80 backdrop-blur-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-white">تفاصيل الإعلان</CardTitle>
              <CardDescription className="text-gray-400">أدخل معلومات إعلانك</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitAd} className="space-y-4">
                <div>
                  <Label htmlFor="advertiser_name" className="text-gray-300">اسم المعلن *</Label>
                  <Input
                    id="advertiser_name"
                    name="advertiser_name"
                    value={adData.advertiser_name}
                    onChange={handleInputChange}
                    required
                    placeholder="اسم شركتك أو علامتك التجارية"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#3b82f6]"
                    data-testid="advertiser-name-input"
                  />
                </div>

                <div>
                  <Label htmlFor="advertiser_email" className="text-gray-300">البريد الإلكتروني *</Label>
                  <Input
                    id="advertiser_email"
                    name="advertiser_email"
                    type="email"
                    value={adData.advertiser_email}
                    onChange={handleInputChange}
                    required
                    placeholder="your@email.com"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#3b82f6]"
                    data-testid="advertiser-email-input"
                  />
                </div>

                <div>
                  <Label htmlFor="advertiser_phone" className="text-gray-300">رقم الجوال</Label>
                  <Input
                    id="advertiser_phone"
                    name="advertiser_phone"
                    type="tel"
                    value={adData.advertiser_phone}
                    onChange={handleInputChange}
                    placeholder="05xxxxxxxx"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#3b82f6]"
                    data-testid="advertiser-phone-input"
                  />
                </div>

                <div>
                  <Label htmlFor="website_url" className="text-gray-300">رابط موقعك (اختياري)</Label>
                  <Input
                    id="website_url"
                    name="website_url"
                    type="url"
                    value={adData.website_url}
                    onChange={handleInputChange}
                    placeholder="https://www.yourwebsite.com"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#3b82f6]"
                    data-testid="website-url-input"
                  />
                </div>

                <div>
                  <Label htmlFor="title" className="text-gray-300">عنوان الإعلان *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={adData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="عنوان جذاب لإعلانك"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#3b82f6]"
                    data-testid="ad-title-input"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-gray-300">وصف الإعلان *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={adData.description}
                    onChange={handleInputChange}
                    required
                    placeholder="اكتب وصفاً مختصراً لإعلانك"
                    rows={3}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#3b82f6]"
                    data-testid="ad-description-input"
                  />
                </div>

                <div>
                  <Label htmlFor="video_url" className="text-gray-300">رابط الفيديو *</Label>
                  <Input
                    id="video_url"
                    name="video_url"
                    type="url"
                    value={adData.video_url}
                    onChange={handleInputChange}
                    required
                    placeholder="https://example.com/video.mp4"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#3b82f6]"
                    data-testid="video-url-input"
                  />
                </div>

                <div>
                  <Label htmlFor="thumbnail_url" className="text-gray-300">رابط الصورة المصغرة</Label>
                  <Input
                    id="thumbnail_url"
                    name="thumbnail_url"
                    type="url"
                    value={adData.thumbnail_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/thumbnail.jpg"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#3b82f6]"
                    data-testid="thumbnail-url-input"
                  />
                </div>

                {/* Summary */}
                <div className="bg-gradient-to-r from-[#3b82f6]/20 to-[#6366f1]/20 border border-[#3b82f6]/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Timer className="w-5 h-5 text-[#60a5fa]" />
                    <span className="text-white font-medium">ملخص الطلب</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">المدة:</span>
                      <span className="text-white font-medium">{formatDuration(getCurrentPackage()?.duration_hours || 1)}</span>
                    </div>
                    <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
                      <span className="text-gray-400">المبلغ الإجمالي:</span>
                      <span className="text-[#60a5fa] font-bold text-lg">{getCurrentPackage()?.amount || 79} ﷼</span>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white h-12 rounded-full font-medium"
                  data-testid="submit-ad-btn"
                >
                  {isSubmitting ? 'جاري الإرسال...' : 'متابعة للدفع'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Payment Method Selection */}
        {step === 2 && createdAd && (
          <Card className="shadow-xl border border-white/10 bg-[#111118]/80 backdrop-blur-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-white">اختر طريقة الدفع</CardTitle>
              <CardDescription className="text-gray-400">
                المبلغ المطلوب: <strong className="text-[#3b82f6]">{getCurrentPackage()?.amount || createdAd.payment.amount} ﷼</strong>
                <span className="text-gray-500 text-sm mr-2">({formatDuration(getCurrentPackage()?.duration_hours || 1)})</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Important Notice */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-start gap-2">
                <Clock className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-300">
                  بعد الدفع، سيبدأ إعلانك فوراً مع مؤقت عد تنازلي على صورة ملفك الشخصي!
                </p>
              </div>

              {/* Stripe Payment Option */}
              <div 
                className="p-4 rounded-lg border-2 border-[#3b82f6]/30 bg-[#3b82f6]/5 cursor-pointer hover:border-[#3b82f6] transition-all"
                onClick={handleStripePayment}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#3b82f6] flex items-center justify-center">
                    <CreditCard className="text-white" size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white">الدفع ببطاقة الائتمان</h4>
                    <p className="text-sm text-gray-400">Visa, Mastercard, Apple Pay, Google Pay</p>
                  </div>
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">فوري</span>
                </div>
                <Button
                  onClick={handleStripePayment}
                  disabled={isSubmitting}
                  className="w-full mt-3 bg-[#3b82f6] hover:bg-[#2563eb] text-white"
                  data-testid="stripe-pay-btn"
                >
                  {isSubmitting ? 'جاري التحويل...' : 'ادفع الآن عبر Stripe'}
                </Button>
              </div>

              {/* Tap Payment Option */}
              {enabledGateways.tap && (
                <div 
                  className="p-4 rounded-lg border-2 border-green-500/30 bg-green-500/5 cursor-pointer hover:border-green-500 transition-all"
                  onClick={handleTapPayment}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
                      <Smartphone className="text-white" size={24} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white">الدفع المحلي (السعودية)</h4>
                      <p className="text-sm text-gray-400">mada, Apple Pay, STC Pay</p>
                    </div>
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">محلي</span>
                  </div>
                  <Button
                    onClick={handleTapPayment}
                    disabled={isSubmitting}
                    className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white"
                    data-testid="tap-pay-btn"
                  >
                    {isSubmitting ? 'جاري التحويل...' : 'ادفع الآن عبر Tap'}
                  </Button>
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[#111118] text-gray-500">أو</span>
                </div>
              </div>

              {/* Manual Payment Options */}
              <form onSubmit={handleManualPayment} className="space-y-4">
                <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                  <div className="flex items-center gap-3 mb-4">
                    <Building2 className="text-gray-400" size={24} />
                    <h4 className="font-bold text-white">التحويل البنكي أو STC Pay</h4>
                  </div>
                  
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="space-y-3">
                      {[
                        { id: 'bank', name: 'تحويل بنكي' },
                        { id: 'stcpay', name: 'STC Pay' }
                      ].map((method) => (
                        <div
                          key={method.id}
                          className={`flex items-center space-x-reverse space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
                            paymentMethod === method.id
                              ? 'border-[#3b82f6] bg-[#3b82f6]/10'
                              : 'border-white/10 hover:border-white/30'
                          }`}
                          onClick={() => setPaymentMethod(method.id)}
                        >
                          <RadioGroupItem value={method.id} id={method.id} />
                          <Label
                            htmlFor={method.id}
                            className="flex-1 cursor-pointer text-white"
                          >
                            {method.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>

                  {paymentMethod && (
                    <>
                      <div className="mt-4">
                        <Label htmlFor="payment_proof" className="text-gray-300">رقم التحويل أو إثبات الدفع</Label>
                        <Input
                          id="payment_proof"
                          value={paymentProof}
                          onChange={(e) => setPaymentProof(e.target.value)}
                          required
                          placeholder="أدخل رقم التحويل أو رابط إثبات الدفع"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                          data-testid="payment-proof-input"
                        />
                      </div>

                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mt-4 flex items-start gap-3">
                        <AlertCircle className="text-yellow-400 flex-shrink-0 mt-0.5" size={18} />
                        <div className="text-xs text-yellow-300">
                          <p className="font-semibold mb-1">معلومات التحويل:</p>
                          <p>البنك: الراجحي</p>
                          <p>رقم الحساب: SA1234567890</p>
                          <p>اسم المستفيد: شركة صقر</p>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting || !paymentProof}
                        className="w-full mt-4 bg-gray-700 hover:bg-gray-600 text-white"
                        data-testid="manual-pay-btn"
                      >
                        {isSubmitting ? 'جاري الإرسال...' : 'إرسال إثبات الدفع'}
                      </Button>
                    </>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Processing */}
        {step === 3 && (
          <Card className="shadow-xl border border-white/10 bg-[#111118]/80 backdrop-blur-xl rounded-2xl">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#3b82f6]/20 flex items-center justify-center animate-pulse">
                <CreditCard className="text-[#60a5fa]" size={32} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">جاري معالجة الدفع...</h2>
              <p className="text-gray-400">يرجى الانتظار</p>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <Card className="shadow-xl border border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl">
            <CardContent className="pt-6 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="text-green-400" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">تم بنجاح!</h2>
              <p className="text-gray-400 mb-6">
                إعلانك نشط الآن مع مؤقت عد تنازلي!
              </p>
              <div className="space-y-2 text-sm text-right bg-black/20 rounded-lg p-4 mb-6">
                <p className="flex justify-between"><span className="text-gray-400">رقم الطلب:</span> <span className="text-white">{createdAd?.ad?.id}</span></p>
                <p className="flex justify-between"><span className="text-gray-400">العنوان:</span> <span className="text-white">{adData.title}</span></p>
                <p className="flex justify-between"><span className="text-gray-400">المدة:</span> <span className="text-white">{formatDuration(getCurrentPackage()?.duration_hours || 1)}</span></p>
                <p className="flex justify-between"><span className="text-gray-400">المبلغ:</span> <span className="text-[#60a5fa]">{createdAd?.payment?.amount || getCurrentPackage()?.amount} ﷼</span></p>
                <p className="flex justify-between"><span className="text-gray-400">الحالة:</span> <span className="text-green-400">نشط</span></p>
              </div>
              <Button
                onClick={() => onNavigate('home')}
                className="w-full bg-gradient-to-r from-[#3b82f6] to-[#6366f1] hover:from-[#2563eb] hover:to-[#4f46e5] text-white h-12 rounded-full"
                data-testid="go-home-btn"
              >
                العودة للرئيسية
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdvertiserPage;
