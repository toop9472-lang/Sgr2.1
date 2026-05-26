import React, { useCallback, useEffect, useState } from 'react';
import { ChevronRight, DollarSign, Send, X } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const GiftStorePage = ({ onBack, onSendToFriend }) => {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [picked, setPicked] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/gifts/catalog`, { credentials: 'include' });
      const d = await r.json().catch(() => ({}));
      setGifts(Array.isArray(d?.gifts) ? d.gifts : []);
    } catch (_) {
      setGifts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0410] via-[#15102a] to-[#1c0f30] text-white pb-16" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            data-testid="gift-store-back"
            className="w-9 h-9 rounded-xl bg-white/8 hover:bg-white/12 flex items-center justify-center transition"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <h1 className="text-lg font-extrabold">متجر الهدايا</h1>
          <div className="w-9" />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-20 text-slate-400">جاري التحميل...</div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {gifts.map((g) => (
              <button
                key={g.gift_id}
                onClick={() => setPicked(g)}
                data-testid="gift-store-tile"
                className="relative aspect-[0.78] rounded-2xl p-3 bg-slate-900/70 border overflow-hidden flex flex-col items-center transition hover:scale-105"
                style={{ borderColor: g.accent_color + '55' }}
              >
                <div
                  className="absolute -top-6 w-24 h-24 rounded-full opacity-90 blur-md"
                  style={{ backgroundColor: g.accent_color + '33' }}
                />
                <img src={g.icon_url} alt={g.name_ar} className="relative z-10 w-16 h-16 object-contain mt-1" />
                <span className="relative z-10 text-white text-[11px] font-extrabold mt-1 text-center truncate w-full">{g.name_ar}</span>
                <div className="relative z-10 flex items-center gap-1 mt-1">
                  <DollarSign className="w-3 h-3 text-amber-400" />
                  <span className="text-amber-400 text-[11px] font-extrabold">{g.price_sar} ر.س</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {picked ? (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-6"
          onClick={() => setPicked(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl p-6 overflow-hidden border border-white/8 text-center"
            style={{ background: `linear-gradient(180deg, ${picked.accent_color}33, #0b1020 60%)` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="absolute -top-16 left-1/2 -translate-x-1/2 w-60 h-60 rounded-full blur-3xl opacity-55"
              style={{ backgroundColor: picked.accent_color + '88' }}
            />
            <button
              onClick={() => setPicked(null)}
              className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <img src={picked.icon_url} alt={picked.name_ar} className="relative z-10 w-28 h-28 mx-auto object-contain" />
            <h2 className="relative z-10 text-2xl font-black text-white mt-3">{picked.name_ar}</h2>
            <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/40 border border-white/10 text-amber-400 text-xs font-bold">
                <DollarSign className="w-3 h-3" /> {picked.price_sar} ر.س
              </span>
            </div>
            <p className="relative z-10 text-slate-300 text-sm mt-4 leading-relaxed">
              هدية فاخرة مع تأثير حركي فوق الشاشة. عند الإرسال يحصل المستلم على إشعار وأنيميشن سينمائي.
            </p>
            <button
              onClick={() => { setPicked(null); onSendToFriend && onSendToFriend(picked); }}
              data-testid="gift-store-send"
              className="relative z-10 mt-5 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white font-black text-sm"
              style={{ backgroundColor: picked.accent_color }}
            >
              <Send className="w-4 h-4" />
              اختر مستلم وأرسل
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default GiftStorePage;
