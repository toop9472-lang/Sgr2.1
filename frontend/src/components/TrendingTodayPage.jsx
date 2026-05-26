import React, { useCallback, useEffect, useState } from 'react';
import { ChevronRight, Flame, Play, Gift, Heart, Eye, DollarSign } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const PERIODS = [
  { id: 'day', label_ar: 'اليوم', label_en: 'Today' },
  { id: 'week', label_ar: 'الأسبوع', label_en: 'Week' },
  { id: 'month', label_ar: 'الشهر', label_en: 'Month' },
  { id: 'all', label_ar: 'الكل', label_en: 'All' },
];

const TrendingTodayPage = ({ user, onBack, onOpenUserProfile, onOpenClip }) => {
  const { isRTL } = useLanguage();
  const [period, setPeriod] = useState('day');
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(
        `${API_URL}/api/gifts/trending-reels?period=${period}&limit=30`,
        { credentials: 'include' },
      );
      const d = await r.json().catch(() => ({}));
      setReels(Array.isArray(d?.reels) ? d.reels : []);
    } catch (_) {
      setReels([]);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0410] via-[#1a0a1f] to-[#2a0a1f] text-white" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            data-testid="trending-back"
            className="w-9 h-9 rounded-xl bg-white/8 hover:bg-white/12 flex items-center justify-center transition"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
            <h1 className="text-lg font-extrabold">{isRTL ? 'ترند اليوم' : 'Trending Today'}</h1>
          </div>
          <div className="w-9" />
        </div>

        {/* Hero */}
        <div className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-orange-500/15 via-pink-500/10 to-purple-500/15 border border-orange-400/25">
          <p className="text-sm text-orange-100 font-semibold">
            {isRTL ? '🔥 الريلز التي تستلم أكثر هدايا — مرتبة حسب القيمة' : '🔥 Reels receiving the most gifts — ranked by value'}
          </p>
        </div>

        {/* Period toggle */}
        <div className="flex gap-1.5 mb-5 flex-wrap">
          {PERIODS.map((p) => {
            const active = period === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                data-testid={`trending-period-${p.id}`}
                className={`px-3.5 py-1.5 rounded-full border text-xs font-bold transition ${
                  active
                    ? 'bg-orange-400/20 border-orange-400/50 text-orange-200'
                    : 'bg-white/[0.04] border-white/8 text-slate-400 hover:bg-white/[0.08]'
                }`}
              >
                {isRTL ? p.label_ar : p.label_en}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-20 text-slate-400">{isRTL ? 'جاري التحميل...' : 'Loading...'}</div>
        ) : reels.length === 0 ? (
          <div className="text-center py-20">
            <Flame className="w-16 h-16 mx-auto text-white/15 mb-3" />
            <p className="text-white font-bold">{isRTL ? 'لا توجد ريلز في الترند بعد' : 'No trending reels yet'}</p>
            <p className="text-slate-400 text-xs mt-1">
              {isRTL ? 'أرسل هدية لريل لتساعده على الوصول إلى الترند!' : 'Send a gift to a reel to help it trend!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {reels.map((r) => (
              <button
                key={r.clip_id}
                onClick={() => onOpenClip && onOpenClip(r.clip_id)}
                data-testid="trending-reel-card"
                className="group relative aspect-[9/14] rounded-2xl overflow-hidden border border-white/8 hover:border-orange-400/45 transition shadow-lg"
              >
                {/* Thumbnail */}
                {r.thumbnail_url ? (
                  <img src={r.thumbnail_url} alt={r.title} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                    <Play className="w-10 h-10 text-white/40" />
                  </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />

                {/* Rank badge */}
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur border border-orange-400/45">
                  <Flame className="w-3 h-3 text-orange-400" />
                  <span className="text-xs font-extrabold text-orange-200">#{r.rank}</span>
                </div>

                {/* SAR badge */}
                <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-400/95 text-amber-950">
                  <DollarSign className="w-3 h-3" />
                  <span className="text-[11px] font-extrabold">{r.total_sar}</span>
                </div>

                {/* Content footer */}
                <div className="absolute bottom-0 left-0 right-0 p-2.5 text-right">
                  <div className="flex items-center gap-1 justify-end mb-1">
                    {r.user_avatar ? (
                      <img src={r.user_avatar} alt={r.user_name} className="w-5 h-5 rounded-full border border-white/30" />
                    ) : null}
                    <span className="text-xs font-bold truncate text-white">{r.user_name}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-1">{r.title}</p>
                  <div className="mt-1.5 flex items-center justify-end gap-2 text-[10px] text-slate-300">
                    <span className="inline-flex items-center gap-0.5">
                      <Gift className="w-3 h-3 text-pink-300" /> {r.total_gifts}
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <Heart className="w-3 h-3 text-rose-300" /> {r.likes_count}
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <Eye className="w-3 h-3 text-slate-300" /> {r.views_count}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendingTodayPage;
