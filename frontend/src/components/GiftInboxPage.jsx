import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronRight, Download, Send, Gift, Diamond, DollarSign } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (_) {
    return '';
  }
};

const GiftInboxPage = ({ user, onBack }) => {
  const { isRTL } = useLanguage();
  const userId = user?.id || user?._id;
  const [tab, setTab] = useState('received');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) { setItems([]); setLoading(false); return; }
    setLoading(true);
    try {
      const url = tab === 'received'
        ? `${API_URL}/api/gifts/inbox/${encodeURIComponent(userId)}`
        : `${API_URL}/api/gifts/sent/${encodeURIComponent(userId)}`;
      const r = await fetch(url, { credentials: 'include' });
      const d = await r.json().catch(() => ({}));
      setItems(Array.isArray(d?.gifts) ? d.gifts : []);
    } catch (_) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [tab, userId]);

  useEffect(() => { load(); }, [load]);

  const totals = useMemo(() => {
    let sar = 0, gems = 0;
    for (const it of items) {
      sar += Number(it?.price_sar || 0);
      gems += Number(it?.gems_awarded || 0);
    }
    return { sar: Math.round(sar * 100) / 100, gems };
  }, [items]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#05070d] via-[#0b1020] to-[#0e172d] text-white" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            data-testid="gift-inbox-back"
            className="w-9 h-9 rounded-xl bg-white/8 hover:bg-white/12 flex items-center justify-center transition"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <h1 className="text-lg font-extrabold">{isRTL ? 'هداياي' : 'My Gifts'}</h1>
          <div className="w-9" />
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => setTab('received')}
            data-testid="gift-inbox-tab-received"
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-bold transition ${
              tab === 'received'
                ? 'bg-blue-400/15 border-blue-400/45 text-blue-200'
                : 'bg-white/[0.04] border-white/8 text-slate-300 hover:bg-white/[0.08]'
            }`}
          >
            <Download className="w-4 h-4" /> {isRTL ? 'استقبلت' : 'Received'}
          </button>
          <button
            onClick={() => setTab('sent')}
            data-testid="gift-inbox-tab-sent"
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-bold transition ${
              tab === 'sent'
                ? 'bg-blue-400/15 border-blue-400/45 text-blue-200'
                : 'bg-white/[0.04] border-white/8 text-slate-300 hover:bg-white/[0.08]'
            }`}
          >
            <Send className="w-4 h-4" /> {isRTL ? 'أرسلت' : 'Sent'}
          </button>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-900/60 border border-white/6">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] text-slate-400 font-semibold">{isRTL ? 'الإجمالي' : 'Total'}</span>
            <span className="ml-auto text-sm font-extrabold">{totals.sar} ر.س</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-900/60 border border-white/6">
            <Diamond className="w-4 h-4 text-cyan-400" />
            <span className="text-[11px] text-slate-400 font-semibold">{isRTL ? 'الجواهر' : 'Gems'}</span>
            <span className="ml-auto text-sm font-extrabold">{totals.gems}</span>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-20 text-slate-400">{isRTL ? 'جاري التحميل...' : 'Loading...'}</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <Gift className="w-16 h-16 mx-auto text-white/15 mb-3" />
            <p className="text-white font-bold">
              {tab === 'received' ? (isRTL ? 'لم تستقبل هدايا بعد' : 'No gifts received') : (isRTL ? 'لم ترسل هدايا بعد' : 'No gifts sent')}
            </p>
            <p className="text-slate-400 text-xs mt-1">
              {tab === 'received' ? (isRTL ? 'الهدايا التي يرسلها لك أصدقاؤك ستظهر هنا.' : 'Friends\u2019 gifts will appear here.') : (isRTL ? 'أرسل هدية من صفحة أي مستخدم.' : 'Send a gift from any user profile.')}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((it) => (
              <div
                key={it.tx_id || `${it.gift_id}-${it.created_at}`}
                data-testid="gift-inbox-row"
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/60 border border-white/5"
              >
                <div className="w-13 h-13 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                  {it.gift_icon_url ? (
                    <img src={it.gift_icon_url} alt={it.gift_name_ar} className="w-10 h-10 object-contain" />
                  ) : (
                    <Gift className="w-6 h-6 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold truncate">{it.gift_name_ar || 'هدية'}</span>
                    <span className="text-amber-400 text-xs font-extrabold whitespace-nowrap">{it.price_sar} ر.س</span>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5 truncate">
                    {tab === 'received' ? `من ${it.sender_name || 'مستخدم'}` : `إلى ${it.receiver_name || 'مستخدم'}`}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">{formatDate(it.created_at)}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 text-[11px] font-bold">
                      <Diamond className="w-3 h-3" /> {tab === 'received' ? '+' : ''}{it.gems_awarded || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GiftInboxPage;
