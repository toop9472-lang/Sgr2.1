// طير — Onboarding: explains 3 roles (buyer / seller / carrier)
import React, { useState } from "react";
import { T, S } from "./tairTheme";

const STEPS = [
  {
    icon: "🛍️",
    title: "أنت مشتري؟",
    desc: "تصفّح آلاف الطيور والحيوانات الأليفة من بائعين موثوقين في كل مدن السعودية.",
    tag: "buyer",
  },
  {
    icon: "🐦",
    title: "لديك طيور للبيع؟",
    desc: "انشر إعلانك مجاناً بصور واضحة، سعر، وشهادة صحية. ابنِ تقييمك مع كل عملية بيع.",
    tag: "seller",
  },
  {
    icon: "🚗",
    title: "لديك سيارة وتسافر؟",
    desc: "كن مُوصِلاً! سجّل رحلاتك بين المدن واحصل على طلبات نقل الطيور بأمان.",
    tag: "carrier",
  },
];

export default function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useState(0);
  const s = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.skipRow}>
          <button
            onClick={onComplete}
            style={{ ...S.ghostBtn, color: "#fff" }}
            data-testid="onboarding-skip"
          >
            تخطّي
          </button>
        </div>
        <div style={styles.emoji}>{s.icon}</div>
        <h2 style={styles.title}>{s.title}</h2>
        <p style={styles.desc}>{s.desc}</p>

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
          {last ? "ابدأ الآن" : "التالي"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: "100vh",
    background: `linear-gradient(135deg, ${T.mint} 0%, ${T.sky} 100%)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    direction: "rtl",
    fontFamily: "'Tajawal', 'IBM Plex Sans Arabic', system-ui, sans-serif",
  },
  card: {
    background: "#fff",
    borderRadius: 24,
    padding: "32px 24px",
    maxWidth: 420,
    width: "100%",
    textAlign: "center",
    boxShadow: T.shadowLg,
  },
  skipRow: {
    display: "flex",
    justifyContent: "flex-start",
    marginBottom: -12,
  },
  emoji: { fontSize: 84, lineHeight: 1, marginBottom: 12 },
  title: {
    fontSize: 26,
    fontWeight: 900,
    color: T.primary,
    marginBottom: 10,
  },
  desc: {
    fontSize: 15,
    color: T.textMuted,
    lineHeight: 1.7,
    marginBottom: 20,
  },
  dots: {
    display: "flex",
    justifyContent: "center",
    gap: 8,
    marginBottom: 22,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    background: T.border,
  },
  dotActive: {
    width: 24,
    background: T.primary,
  },
  next: {
    background: `linear-gradient(135deg, ${T.primaryLight}, ${T.accent})`,
    color: "#fff",
    border: "none",
    borderRadius: 14,
    padding: "14px 40px",
    fontSize: 16,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: T.shadowMd,
  },
};
