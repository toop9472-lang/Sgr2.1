import React, { useState, useEffect } from 'react';
import { ArrowRight, Timer, Eye, Calendar, Plus, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import AdCountdownTimer from './AdCountdownTimer';
import { toast } from '../hooks/use-toast';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const MyAdsPage = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ads, setAds] = useState([]);
  const [showEmailInput, setShowEmailInput] = useState(true);

  const loadMyAds = async (advertiserEmail) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/ads/advertiser/my-ads?email=${encodeURIComponent(advertiserEmail)}`);
      const data = await response.json();
      setAds(data.ads || []);
      setShowEmailInput(false);
      localStorage.setItem('advertiser_email', advertiserEmail);
    } catch (error) {
      console.error('Failed to load ads:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحميل الإعلانات',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedEmail = localStorage.getItem('advertiser_email');
    if (savedEmail) {
      setEmail(savedEmail);
      loadMyAds(savedEmail);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      loadMyAds(email);
    }
  };

  const handleRefresh = () => {
    if (email) {
      loadMyAds(email);
    }
  };

  const getStatusBadge = (status, paymentStatus) => {
    if (status === 'active' && paymentStatus === 'paid') {
      return <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">نشط</span>;
    }
    if (status === 'expired') {
      return <span className="px-2 py-1 rounded-full text-xs bg-gray-500/20 text-gray-400">منتهي</span>;
    }
    if (paymentStatus === 'pending') {
      return <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">بانتظار الدفع</span>;
    }
    return <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">{status}</span>;
  };

  const formatDuration = (hours) => {
    if (!hours) return '-';
    if (hours < 24) return `${hours} ساعة`;
    if (hours === 24) return 'يوم';
    if (hours === 48) return 'يومين';
    if (hours === 168) return 'أسبوع';
    return `${hours} ساعة`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-20 relative overflow-hidden">
      <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full bg-[#3b82f6]/20 blur-3xl"></div>
      <div className="absolute bottom-[-150px] right-[-150px] w-[400px] h-[400px] rounded-full bg-[#3b82f6]/15 blur-3xl"></div>
      
      <div className="relative px-4 pt-8 pb-6">
        <button
          onClick={() => onNavigate('home')}
          className="text-gray-400 hover:text-white mb-4 flex items-center gap-2 transition-colors"
          data-testid="back-btn"
        >
          <ArrowRight className="rotate-180" size={20} />
          عودة
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">إعلاناتي</h1>
            <p className="text-gray-400 mt-1">تتبع حالة إعلاناتك</p>
          </div>
          {!showEmailInput && (
            <Button
              onClick={() => onNavigate('advertiser')}
              size="sm"
              className="bg-[#3b82f6] hover:bg-[#2563eb]"
            >
              <Plus className="w-4 h-4 mr-1" />
              إعلان جديد
            </Button>
          )}
        </div>
      </div>

      <div className="px-4 space-y-4">
        {showEmailInput ? (
          <Card className="shadow-xl border border-white/10 bg-[#111118]/80 backdrop-blur-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-white text-lg">أدخل بريدك الإلكتروني</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-gray-300">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    data-testid="email-input"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#3b82f6] hover:bg-[#2563eb]"
                  data-testid="load-ads-btn"
                >
                  {isLoading ? 'جاري التحميل...' : 'عرض إعلاناتي'}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Refresh and Email Info */}
            <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">البريد:</span>
                <span className="text-white text-sm">{email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleRefresh}
                  size="sm"
                  variant="ghost"
                  className="text-gray-400 hover:text-white"
                  data-testid="refresh-btn"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  onClick={() => {
                    setShowEmailInput(true);
                    setAds([]);
                    localStorage.removeItem('advertiser_email');
                  }}
                  size="sm"
                  variant="ghost"
                  className="text-gray-400 hover:text-white text-xs"
                >
                  تغيير
                </Button>
              </div>
            </div>

            {/* Ads List */}
            {ads.length === 0 ? (
              <Card className="shadow-xl border border-white/10 bg-[#111118]/80 backdrop-blur-xl rounded-2xl">
                <CardContent className="pt-8 pb-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                    <Eye className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-white font-medium mb-2">لا توجد إعلانات</h3>
                  <p className="text-gray-400 text-sm mb-4">لم يتم العثور على إعلانات لهذا البريد الإلكتروني</p>
                  <Button
                    onClick={() => onNavigate('advertiser')}
                    className="bg-[#3b82f6] hover:bg-[#2563eb]"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    إنشاء إعلان
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {ads.map((ad) => (
                  <Card 
                    key={ad.id} 
                    className={`shadow-xl border bg-[#111118]/80 backdrop-blur-xl rounded-2xl ${
                      ad.is_active ? 'border-green-500/30' : 'border-white/10'
                    }`}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-white font-medium">{ad.title}</h3>
                          <p className="text-gray-500 text-xs mt-1">#{ad.id?.slice(0, 8)}</p>
                        </div>
                        {getStatusBadge(ad.status, ad.payment_status)}
                      </div>

                      {/* Active Ad with Countdown */}
                      {ad.is_active && ad.expires_at && (
                        <div className="mb-3">
                          <AdCountdownTimer 
                            expiresAt={ad.expires_at} 
                            isActive={ad.is_active}
                            size="lg"
                          />
                        </div>
                      )}

                      {/* Ad Info */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-white/5 rounded-lg p-2">
                          <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
                            <Timer className="w-3 h-3" />
                            <span>المدة</span>
                          </div>
                          <p className="text-white font-medium">{formatDuration(ad.duration_hours)}</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2">
                          <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
                            <Calendar className="w-3 h-3" />
                            <span>تاريخ الإنشاء</span>
                          </div>
                          <p className="text-white font-medium">
                            {ad.created_at ? new Date(ad.created_at).toLocaleDateString('ar-SA') : '-'}
                          </p>
                        </div>
                      </div>

                      {/* Type Badge */}
                      <div className="mt-3 flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          ad.ad_type === 'global' 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {ad.ad_type === 'global' ? 'عالمي' : 'محلي'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyAdsPage;
