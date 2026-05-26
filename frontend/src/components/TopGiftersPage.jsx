import React, { useCallback, useEffect, useState } from 'react';
import { ChevronRight, Trophy, Heart, Medal, DollarSign, Diamond, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const SCOPES = [
  { id: 'received', icon: Trophy, label_ar: 'الأكثر استلاماً', label_en: 'Top Received' },
  { id: 'sent', icon: Heart, label_ar: 'أكبر داعمين', label_en: 'Top Supporters' },
];

const PERIODS = [
  { id: 'all', label_ar: 'الكل', label_en: 'All' },
  { id: 'month', label_ar: 'الشهر', label_en: 'Month' },
  { id: 'week', label_ar: 'الأسبوع', label_en: 'Week' },
  { id: 'day', label_ar: 'اليوم', label_en: 'Day' },
];

const TopGiftersPage = ({ user, onBack, onOpenUserProfile }) => {
  const { isRTL } = useLanguage();
  const viewerId = user?.id || user?._id;
  const [scope, setScope] = useState('received');
  const [period, setPeriod] = useState('all');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(
        `${API_URL}/api/gifts/leaderboard?scope=${scope}&period=${period}&limit=50`,
        { credentials: 'include' },
      );
      const d = await r.json().catch(() => ({}));
      setRows(Array.isArray(d?.leaderboard) ? d.leaderboard : []);
    } catch (_) {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [scope, period]);

  useEffect(() => { load(); }, [load]);

  const rankColor = (rank) => {
    if (rank === 1) return 'bg-amber-400 border-amber-200 text-amber-900';
    if (rank === 2) return 'bg-slate-400 border-slate-200 text-slate-900';
    if (rank === 3) return 'bg-orange-500 border-orange-300 text-orange-900';
    return 'bg-white/[0.06] border-white/10 text-slate-300';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#05070d] via-[#0b1020] to-[#0e172d] text-white" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            data-testid="top-gifters-back"
            className="w-9 h-9 rounded-xl bg-white/8 hover:bg-white/12 flex items-center justify-center transition"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <h1 className="text-lg font-extrabold">{isRTL ? 'لوحة الداعمين' : 'Top Gifters'}</h1>
          <div className="w-9" />
        </div>

        {/* Scope toggle */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {SCOPES.map((s) => {
            const Icon = s.icon;
            const active = scope === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setScope(s.id)}
                data-testid={`top-gifters-scope-${s.id}`}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition ${
                  active
                    ? 'bg-amber-400/15 border-amber-400/50 text-amber-200'
                    : 'bg-white/[0.04] border-white/8 text-slate-300 hover:bg-white/[0.08]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {isRTL ? s.label_ar : s.label_en}
              </button>
            );
          })}
        </div>

        {/* Period selector */}
        <div className="flex gap-1.5 mb-4 flex-wrap">
          {PERIODS.map((p) => {
            const active = period === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                data-testid={`top-gifters-period-${p.id}`}
                className={`px-3 py-1.5 rounded-full border text-[11px] font-bold transition ${
                  active
                    ? 'bg-blue-400/18 border-blue-400/45 text-blue-200'
                    : 'bg-white/[0.04] border-white/8 text-slate-400 hover:bg-white/[0.08]'
                }`}
              >
                {isRTL ? p.label_ar : p.label_en}
              </button>
            );
          })}
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-20 text-slate-400">{isRTL ? 'جاري التحميل...' : 'Loading...'}</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="w-16 h-16 mx-auto text-white/15 mb-3" />
            <p className="text-white font-bold">{isRTL ? 'لا توجد بيانات بعد' : 'No data yet'}</p>
            <p className="text-slate-400 text-xs mt-1">{isRTL ? 'كن أول من يرسل هدية!' : 'Be the first to send a gift!'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((item) => {
              const isViewer = item.user_id === viewerId;
              return (
                <button
                  key={item.user_id}
                  onClick={() => onOpenUserProfile && onOpenUserProfile(item.user_id)}
                  data-testid="top-gifters-row"
                  className={`w-full flex items-center gap-3 p-2.5 rounded-2xl bg-slate-900/60 border transition ${
                    isViewer ? 'border-blue-400/55 bg-blue-400/8' : 'border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-extrabold text-xs ${rankColor(item.rank)}`}>
                    {item.rank <= 3 ? <Medal className="w-4 h-4" /> : item.rank}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/5 overflow-hidden flex items-center justify-center border border-white/8 shrink-0">
                    {item.avatar ? (
                      <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-white">{(item.name || 'م')[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold truncate text-sm">{item.name}</span>
                      {item.is_verified ? <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> : null}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.total_gifts} {isRTL ? 'هدية' : 'gifts'} · {item.total_gems} {isRTL ? 'جوهرة' : 'gems'}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/12 border border-amber-400/35 text-amber-300 text-xs font-extrabold whitespace-nowrap">
                    <DollarSign className="w-3 h-3" /> {item.total_sar}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopGiftersPage;
