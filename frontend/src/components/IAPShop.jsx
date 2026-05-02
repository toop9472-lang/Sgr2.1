// In-App Purchase Shop Component - متجر المشتريات داخل التطبيق
import React, { useState, useEffect } from 'react';
import { Diamond, Crown, Star, Zap, Gift, ShoppingCart, Check, X, Sparkles } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const IAPShop = ({ user, onClose, onPurchaseComplete }) => {
  const [activeTab, setActiveTab] = useState('diamonds');
  const [products, setProducts] = useState({
    diamond_packages: [],
    vip_subscriptions: [],
    special_offers: []
  });
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [vipStatus, setVipStatus] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchVipStatus();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/iap/products`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVipStatus = async () => {
    if (!user?.id) return;
    try {
      const token = localStorage.getItem('user_token');
      const response = await fetch(`${API_URL}/api/iap/vip-status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setVipStatus(data);
      }
    } catch (error) {
      console.error('Error fetching VIP status:', error);
    }
  };

  const handlePurchase = async (productId, type) => {
    setPurchasing(productId);
    try {
      const token = localStorage.getItem('user_token');
      const endpoint = type === 'vip' ? '/api/iap/subscribe' : '/api/iap/purchase';
      const body = type === 'vip' ? { plan_id: productId } : { product_id: productId };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        if (onPurchaseComplete) {
          onPurchaseComplete(data);
        }
        fetchVipStatus();
      }
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setPurchasing(null);
    }
  };

  const tabs = [
    { id: 'diamonds', label: 'الألماسات', icon: Diamond },
    { id: 'vip', label: 'VIP', icon: Crown },
    { id: 'offers', label: 'عروض', icon: Gift },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" data-testid="iap-shop">
      <div className="bg-[#1a1a2e] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart size={24} className="text-purple-400" />
            <h2 className="text-xl font-bold">المتجر</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 transition-colors ${
                activeTab === tab.id 
                  ? 'text-purple-400 border-b-2 border-purple-400' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin w-8 h-8 border-2 border-purple-400/30 border-t-purple-400 rounded-full"></div>
            </div>
          ) : (
            <>
              {/* Diamond Packages */}
              {activeTab === 'diamonds' && (
                <div className="grid grid-cols-2 gap-3">
                  {products.diamond_packages.map(pkg => (
                    <div
                      key={pkg.id}
                      className={`relative bg-white/5 rounded-xl p-4 border ${
                        pkg.popular ? 'border-purple-500' : pkg.best_value ? 'border-yellow-500' : 'border-white/10'
                      }`}
                    >
                      {pkg.popular && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-purple-500 text-xs px-2 py-0.5 rounded-full">
                          الأكثر شعبية
                        </div>
                      )}
                      {pkg.best_value && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full">
                          أفضل قيمة
                        </div>
                      )}
                      
                      <div className="text-center mb-3">
                        <div className="text-3xl mb-1">{pkg.icon}</div>
                        <div className="text-2xl font-bold text-purple-400">
                          {pkg.diamonds.toLocaleString()}
                        </div>
                        {pkg.bonus > 0 && (
                          <div className="text-xs text-green-400">+{pkg.bonus} بونص</div>
                        )}
                      </div>

                      <button
                        onClick={() => handlePurchase(pkg.id, 'diamonds')}
                        disabled={purchasing === pkg.id}
                        className={`w-full py-2 rounded-lg font-medium ${
                          purchasing === pkg.id
                            ? 'bg-gray-600'
                            : 'bg-purple-600 hover:bg-purple-700'
                        }`}
                      >
                        {purchasing === pkg.id ? '...' : `${pkg.price_sar} ر.س`}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* VIP Plans */}
              {activeTab === 'vip' && (
                <div className="space-y-3">
                  {vipStatus?.is_vip && (
                    <div className="bg-gradient-to-r from-yellow-600/30 to-orange-600/30 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Crown className="text-yellow-400" size={24} />
                        <span className="font-bold">أنت عضو VIP!</span>
                      </div>
                      <p className="text-sm text-gray-300">
                        ينتهي في: {vipStatus.days_remaining} يوم
                      </p>
                    </div>
                  )}

                  {products.vip_subscriptions.map(plan => (
                    <div
                      key={plan.id}
                      className={`bg-white/5 rounded-xl p-4 border ${
                        plan.popular ? 'border-yellow-500' : plan.best_value ? 'border-purple-500' : 'border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{plan.badge}</span>
                            <span className="font-bold text-lg">{plan.name}</span>
                          </div>
                          <div className="text-sm text-gray-400">
                            {plan.duration_days} يوم
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="text-xl font-bold" style={{ color: plan.color }}>
                            {plan.price_sar} ر.س
                          </div>
                        </div>
                      </div>

                      {/* Benefits */}
                      <div className="space-y-2 mb-4">
                        {Object.entries(plan.benefits).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2 text-sm">
                            <Check size={14} className="text-green-400" />
                            <span className="text-gray-300">
                              {key === 'daily_diamonds' && `${value} ألماسة يومياً`}
                              {key === 'ad_free' && value && 'بدون إعلانات'}
                              {key === 'exclusive_games' && value && 'ألعاب حصرية'}
                              {key === 'double_rewards' && value && 'مكافآت مضاعفة'}
                              {key === 'priority_support' && value && 'دعم فني أولوية'}
                              {key === 'exclusive_avatar' && value && 'صورة رمزية حصرية'}
                              {key === 'special_title' && value}
                            </span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => handlePurchase(plan.id, 'vip')}
                        disabled={purchasing === plan.id}
                        className="w-full py-3 rounded-xl font-medium"
                        style={{ backgroundColor: plan.color }}
                      >
                        {purchasing === plan.id ? 'جاري الاشتراك...' : 'اشترك الآن'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Special Offers */}
              {activeTab === 'offers' && (
                <div className="space-y-3">
                  {products.special_offers.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <Gift size={48} className="mx-auto mb-3 opacity-30" />
                      <p>لا توجد عروض متاحة حالياً</p>
                    </div>
                  ) : (
                    products.special_offers.map(offer => (
                      <div
                        key={offer.id}
                        className="bg-gradient-to-r from-red-600/20 to-orange-600/20 rounded-xl p-4 border border-red-500/30"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="text-yellow-400" size={20} />
                          <span className="font-bold">{offer.name}</span>
                          <span className="bg-red-500 text-xs px-2 py-0.5 rounded-full">
                            -{offer.discount_percent}%
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-400 mb-3">{offer.description}</p>

                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-gray-500 line-through text-sm">
                              {offer.original_price_sar} ر.س
                            </span>
                            <span className="text-xl font-bold text-green-400 mr-2">
                              {offer.price_sar} ر.س
                            </span>
                          </div>
                          <button
                            onClick={() => handlePurchase(offer.id, 'offer')}
                            disabled={purchasing === offer.id}
                            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium"
                          >
                            {purchasing === offer.id ? '...' : 'اشتري'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default IAPShop;
