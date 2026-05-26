import React, { useCallback, useEffect, useState } from 'react';
import { ChevronRight, Gift, Trophy, Flame, Diamond, Download, Send, ShoppingBag, Sparkles } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const HUB_ICONS = {
  store: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Wrapped%20gift/3D/wrapped_gift_3d.png',
  inbox: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Ribbon/3D/ribbon_3d.png',
  leaderboard: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Trophy/3D/trophy_3d.png',
  trending: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Fire/3D/fire_3d.png',
  sparkles: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Sparkles/3D/sparkles_3d.png',
};
const HERO_BG = 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=1400&q=80';

const HubTile = ({ image, title, subtitle, badge, accent, onClick, testId }) => (
  <button
    onClick={onClick}
    data-testid={testId}
    className="group relative h-44 sm:h-48 rounded-3xl overflow-hidden border border-white/8 hover:border-white/20 transition-all hover:scale-[1.02] shadow-xl"
    style={{
      background: `linear-gradient(135deg, ${accent}28, rgba(15,23,42,0.85))`,
    }}
  >
    {/* Glow */}
    <div
      className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-2xl opacity-60"
      style={{ backgroundColor: accent + '55' }}
    />
    {/* 3D icon */}
    <div
      className="absolute top-4 right-4 w-20 h-20 rounded-2xl flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}
    >
      <img src={image} alt={title} className="w-16 h-16 object-contain" />
    </div>
    {badge && (
      <span
        className="absolute top-3 left-3 px-2 py-0.5 rounded-full border text-[10px] font-extrabold"
        style={{ color: accent, borderColor: accent, backgroundColor: accent + '20' }}
      >
        {badge}
      </span>
    )}
    <div className="absolute left-4 right-4 bottom-4 text-right">
      <h3 className="text-white font-black text-base">{title}</h3>
      <p className="text-slate-300 text-xs mt-1 leading-snug">{subtitle}</p>
      <div className="mt-2 flex items-center justify-end gap-1">
        <span className="text-xs font-extrabold" style={{ color: accent }}>افتح</span>
        <ChevronRight className="w-3.5 h-3.5 rotate-180" style={{ color: accent }} />
      </div>
    </div>
  </button>
);

const GiftsHubPage = ({ user, onBack, onOpenStore, onOpenInbox, onOpenLeaderboard, onOpenTrending, onOpenFriends }) => {
  const { isRTL } = useLanguage();
  const userId = user?.id || user?._id;
  const [stats, setStats] = useState({ received: 0, gems: 0, catalog: 12 });

  const loadStats = useCallback(async () => {
    try {
      const [catRes, inboxRes] = await Promise.all([
        fetch(`${API_URL}/api/gifts/catalog`, { credentials: 'include' }),
        userId ? fetch(`${API_URL}/api/gifts/inbox/${encodeURIComponent(userId)}?limit=100`, { credentials: 'include' }) : Promise.resolve(null),
      ]);
      const catData = catRes ? await catRes.json().catch(() => null) : null;
      const inboxData = inboxRes ? await inboxRes.json().catch(() => null) : null;
      const list = inboxData?.gifts || [];
      const gemsSum = list.reduce((s, g) => s + Number(g?.gems_awarded || 0), 0);
      setStats({
        received: list.length,
        gems: gemsSum,
        catalog: catData?.gifts?.length || 12,
      });
    } catch (_) {
      // ignore
    }
  }, [userId]);

  useEffect(() => { loadStats(); }, [loadStats]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0410] via-[#15102a] to-[#1c0f30] text-white pb-16" dir="rtl">
      <div className="max-w-2xl mx-auto">
        {/* Hero */}
        <div className="relative h-52 overflow-hidden">
          <img src={HERO_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(10,4,16,0.35)] to-[rgba(28,15,48,0.95)]" />
          <div className="absolute top-4 right-4 left-4 flex items-center justify-between">
            <button
              onClick={onBack}
              data-testid="gifts-hub-back"
              className="w-9 h-9 rounded-xl bg-black/40 hover:bg-black/60 flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5 rotate-180 text-white" />
            </button>
          </div>
          <div className="absolute right-5 bottom-4 text-right">
            <img src={HUB_ICONS.sparkles} alt="" className="w-9 h-9 mb-1 ml-auto" />
            <h1 className="text-2xl font-black text-white">مركز الهدايا</h1>
            <p className="text-pink-300 text-xs font-bold mt-0.5">كل ما يتعلق بالهدايا — في مكان واحد</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 px-4 -mt-5 relative z-10">
          <div className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-slate-900/90 border border-white/8">
            <Gift className="w-4 h-4 text-pink-400" />
            <span className="text-lg font-black text-white">{stats.catalog}</span>
            <span className="text-[10px] text-slate-400 font-semibold text-center">هدية في المتجر</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-slate-900/90 border border-white/8">
            <Download className="w-4 h-4 text-blue-400" />
            <span className="text-lg font-black text-white">{stats.received}</span>
            <span className="text-[10px] text-slate-400 font-semibold text-center">هدية استلمتها</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-slate-900/90 border border-white/8">
            <Diamond className="w-4 h-4 text-cyan-400" />
            <span className="text-lg font-black text-white">{stats.gems}</span>
            <span className="text-[10px] text-slate-400 font-semibold text-center">جوهرة كسبتها</span>
          </div>
        </div>

        {/* Section label */}
        <p className="text-[11px] font-extrabold tracking-widest text-pink-400/85 px-5 mt-6 mb-3 text-right">
          أقسام الهدايا
        </p>

        {/* 4 hub tiles */}
        <div className="grid grid-cols-2 gap-3 px-4">
          <HubTile
            image={HUB_ICONS.store}
            title="متجر الهدايا"
            subtitle="تصفّح 12 هدية من 3 إلى 299 ر.س"
            badge="جديد"
            accent="#f472b6"
            onClick={onOpenStore}
            testId="hub-store"
          />
          <HubTile
            image={HUB_ICONS.inbox}
            title="هداياي"
            subtitle="الهدايا المستلمة والمرسلة"
            accent="#60a5fa"
            onClick={onOpenInbox}
            testId="hub-inbox"
          />
          <HubTile
            image={HUB_ICONS.leaderboard}
            title="لوحة الداعمين"
            subtitle="الأكثر استلاماً وأكبر داعمين"
            accent="#fbbf24"
            onClick={onOpenLeaderboard}
            testId="hub-leaderboard"
          />
          <HubTile
            image={HUB_ICONS.trending}
            title="ترند اليوم"
            subtitle="الريلز الأكثر استلاماً للهدايا"
            badge="🔥"
            accent="#fb923c"
            onClick={onOpenTrending}
            testId="hub-trending"
          />
        </div>

        {/* How it works */}
        <p className="text-[11px] font-extrabold tracking-widest text-pink-400/85 px-5 mt-6 mb-3 text-right">
          كيف تعمل الهدايا؟
        </p>
        <div className="mx-4 p-4 rounded-2xl bg-slate-900/60 border border-white/6 space-y-3">
          <div className="flex items-start gap-3 flex-row-reverse text-right">
            <span className="w-7 h-7 rounded-full bg-pink-400/15 border border-pink-400/45 flex items-center justify-center text-pink-300 font-black text-xs shrink-0">1</span>
            <p className="text-slate-200 text-sm leading-relaxed flex-1">
              ادخل إلى ملف أي مستخدم أو ريل واضغط زر <span className="font-black text-white">"هدية"</span>.
            </p>
          </div>
          <div className="flex items-start gap-3 flex-row-reverse text-right">
            <span className="w-7 h-7 rounded-full bg-blue-400/15 border border-blue-400/45 flex items-center justify-center text-blue-200 font-black text-xs shrink-0">2</span>
            <p className="text-slate-200 text-sm leading-relaxed flex-1">
              اختر هدية من 12 خياراً وأتمم الشراء عبر <span className="font-black text-white">Apple Pay</span>.
            </p>
          </div>
          <div className="flex items-start gap-3 flex-row-reverse text-right">
            <span className="w-7 h-7 rounded-full bg-cyan-400/15 border border-cyan-400/45 flex items-center justify-center text-cyan-200 font-black text-xs shrink-0">3</span>
            <p className="text-slate-200 text-sm leading-relaxed flex-1">
              المستلم يحصل على <span className="font-black text-white">20%</span> من قيمة الهدية كجواهر قابلة للسحب.
            </p>
          </div>
        </div>

        {/* CTA */}
        {onOpenFriends ? (
          <button
            onClick={onOpenFriends}
            data-testid="hub-send-friend"
            className="mx-4 mt-5 w-[calc(100%-2rem)] h-12 rounded-2xl flex items-center justify-center gap-2 font-black text-white text-sm"
            style={{ background: 'linear-gradient(135deg, #ec4899, #a855f7)' }}
          >
            <Send className="w-4 h-4" />
            أرسل هدية لصديق الآن
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default GiftsHubPage;
