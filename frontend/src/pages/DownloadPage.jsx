import React, { useEffect, useState } from 'react';
import { Apple, Smartphone, ExternalLink, Star, Download, Shield, Zap } from 'lucide-react';

const DownloadPage = () => {
  const [deviceType, setDeviceType] = useState('unknown');
  const [isRedirecting, setIsRedirecting] = useState(false);

  // App Store Links
  const APP_STORE_URL = 'https://apps.apple.com/app/id6758868843';
  const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.saqr.rewards';

  useEffect(() => {
    // Detect device type
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      setDeviceType('ios');
    } else if (/android/i.test(userAgent)) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }
  }, []);

  const handleDownload = (store) => {
    setIsRedirecting(true);
    if (store === 'ios') {
      window.location.href = APP_STORE_URL;
    } else {
      window.location.href = PLAY_STORE_URL;
    }
  };

  const handleAutoRedirect = () => {
    setIsRedirecting(true);
    if (deviceType === 'ios') {
      window.location.href = APP_STORE_URL;
    } else if (deviceType === 'android') {
      window.location.href = PLAY_STORE_URL;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white" dir="rtl">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center shadow-2xl">
            <img src="/logo_saqr.png" alt="صقر" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            حمّل تطبيق صقر
          </h1>
          <p className="text-xl text-gray-400 max-w-xl mx-auto">
            شاهد الإعلانات واكسب المال مع تطبيق صقر
          </p>
        </div>

        {/* Auto Redirect Button (Mobile Only) */}
        {deviceType !== 'desktop' && (
          <div className="mb-8">
            <button
              onClick={handleAutoRedirect}
              disabled={isRedirecting}
              className="w-full py-5 px-8 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-2xl font-bold text-xl transition-all duration-300 transform hover:scale-[1.02] shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isRedirecting ? (
                <>
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>جاري التحويل...</span>
                </>
              ) : (
                <>
                  <Download className="w-6 h-6" />
                  <span>تحميل الآن</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Store Buttons */}
        <div className="grid md:grid-cols-2 gap-4 mb-12">
          {/* App Store */}
          <button
            onClick={() => handleDownload('ios')}
            className={`group relative overflow-hidden p-6 rounded-2xl border transition-all duration-300 ${
              deviceType === 'ios' 
                ? 'bg-white/10 border-white/20' 
                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-black flex items-center justify-center">
                <Apple className="w-8 h-8" />
              </div>
              <div className="text-right flex-1">
                <p className="text-sm text-gray-400">متوفر على</p>
                <p className="text-xl font-bold">App Store</p>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
            </div>
            {deviceType === 'ios' && (
              <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500 rounded-full text-xs">
                جهازك
              </div>
            )}
          </button>

          {/* Play Store */}
          <button
            onClick={() => handleDownload('android')}
            className={`group relative overflow-hidden p-6 rounded-2xl border transition-all duration-300 ${
              deviceType === 'android' 
                ? 'bg-white/10 border-white/20' 
                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
                <Smartphone className="w-8 h-8" />
              </div>
              <div className="text-right flex-1">
                <p className="text-sm text-gray-400">متوفر على</p>
                <p className="text-xl font-bold">Google Play</p>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
            </div>
            {deviceType === 'android' && (
              <div className="absolute top-2 left-2 px-2 py-1 bg-green-500 rounded-full text-xs">
                جهازك
              </div>
            )}
          </button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-500" />
            </div>
            <h3 className="font-bold mb-2">اكسب نقاط</h3>
            <p className="text-sm text-gray-400">شاهد الإعلانات واكسب نقاط قابلة للسحب</p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="font-bold mb-2">آمن وموثوق</h3>
            <p className="text-sm text-gray-400">حماية كاملة لبياناتك ومكافآتك</p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="font-bold mb-2">سحب سريع</h3>
            <p className="text-sm text-gray-400">اسحب أرباحك بسرعة وسهولة</p>
          </div>
        </div>

        {/* QR Code Section (Desktop Only) */}
        {deviceType === 'desktop' && (
          <div className="text-center p-8 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="text-xl font-bold mb-4">امسح الرمز بجوالك</h3>
            <div className="w-48 h-48 mx-auto bg-white rounded-2xl p-4 mb-4">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent('https://invites-challenges.preview.emergentagent.com/download')}`}
                alt="QR Code"
                className="w-full h-full"
              />
            </div>
            <p className="text-gray-400">أو افتح الرابط من جوالك</p>
            <p className="text-blue-400 font-mono mt-2">app-store-revival.preview.emergentagent.com/download</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>© 2024 صقر. جميع الحقوق محفوظة.</p>
          <div className="mt-4 flex justify-center gap-6">
            <a href="/privacy" className="hover:text-white transition-colors">سياسة الخصوصية</a>
            <a href="/terms" className="hover:text-white transition-colors">الشروط والأحكام</a>
            <a href="/support" className="hover:text-white transition-colors">الدعم</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadPage;
