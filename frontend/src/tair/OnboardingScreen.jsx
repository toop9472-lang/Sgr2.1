// طير — Onboarding: 3 roles (buyer / seller / carrier) — professional design
import React, { useState } from "react";
import { ShoppingBag, Store, Truck, ArrowLeft } from "lucide-react";
import { T, S } from "./tairTheme";

const STEPS = [
  {
    Icon: ShoppingBag,
    title: "تشتري طيوراً؟",
    desc: "تصفّح آلاف الإعلانات من بائعين موثوقين في جميع مدن المملكة، مع صور واضحة وشهادات صحية.",
  },
  {
    Icon: Store,
    title: "تبيع طيوراً؟",
    desc: "انشر إعلانك مجاناً بصور وشهادة صحية وسعر واضح. ابنِ تقييمك مع كل عملية بيع ناجحة.",
  },
  {
    Icon: Truck,
    title: "تسافر بين المدن؟",
    desc: "كن مُوصّلاً معتمداً. سجّل رحلاتك واحصل على طلبات نقل الطيور بأمان وثقة.",
  },
];

export default function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useState(0);
  const s = STEPS[step];
  const last = step === STEPS.length - 1;
  const { Icon } = s;

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <img src="/tair_logo.png" alt="طير" style={styles.logo} />
        <button
          onClick={onComplete}
          style={styles.skip}
          data-testid="onboarding-skip"
        >
          تخطّي
        </button>
      </div>

      <div style={styles.body}>
        <div style={styles.iconWrap}>
          <Icon size={64} strokeWidth={1.5} color={T.primary} />
        </div>
        <h1 style={styles.title}>{s.title}</h1>
        <p style={styles.desc}>{s.desc}</p>
      </div>

      <div style={styles.footer}>
        <div style={styles.dots}>
          {STEPS.map((_, i) => (
            <span
              key={i}
              style={{ ...styles.dot, ...(i === step ? styles.dotActive : {}) }}
            />
          ))}
        </div>
        <button
          onClick={() => (last ? onComplete() : setStep(step + 1))}
          style={styles.next}
          data-testid="onboarding-next"
        >
          <span>{last ? "ابدأ الآن" : "التالي"}</span>
          <ArrowLeft size={18} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: "100vh",
    background: T.surface,
    direction: "rtl",
    fontFamily: "'Tajawal', 'IBM Plex Sans Arabic', system-ui, sans-serif",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    padding: "20px 20px 0",
    display: "flex",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: 640,
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
  },
  logo: { width: 44, height: 44, borderRadius: 12 },
  skip: {
    background: "transparent",
    border: "none",
    color: T.textMuted,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    padding: "8px 12px",
    fontFamily: "inherit",
  },
  body: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 32px",
    maxWidth: 500,
    margin: "0 auto",
    textAlign: "center",
    boxSizing: "border-box",
  },
  iconWrap: {
    width: 128,
    height: 128,
    borderRadius: 32,
    background: "#f0fdfa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: 900,
    color: T.textStrong,
    margin: "0 0 12px",
    letterSpacing: "-0.02em",
  },
  desc: {
    fontSize: 15,
    color: T.textMuted,
    lineHeight: 1.75,
    margin: 0,
    maxWidth: 380,
  },
  footer: {
    padding: "24px 24px 40px",
    maxWidth: 500,
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
  },
  dots: {
    display: "flex",
    flexDirection: "row-reverse",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    background: T.border,
    transition: "all 0.2s",
  },
  dotActive: {
    width: 28,
    background: T.primary,
  },
  next: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    background: T.primary,
    color: T.textInverse,
    border: "none",
    borderRadius: T.radius,
    padding: "15px 28px",
    fontSize: 16,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: T.shadowSm,
  },
};
