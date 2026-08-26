// طير — Professional design tokens (v2 — cleaner, refined)
export const T = {
  // Brand — deep emerald + accent teal, minimal use of neon
  primary: "#0f766e",        // teal-700
  primaryDark: "#134e4a",    // teal-900
  primaryLight: "#14b8a6",   // teal-500
  accent: "#f59e0b",         // warm amber for CTAs (contrast with teal)

  // Neutral surface (light, warm)
  bg: "#f9fafb",             // page bg
  bgAlt: "#f3f4f6",
  surface: "#ffffff",
  surfaceAlt: "#fafafa",
  border: "#e5e7eb",
  borderStrong: "#d1d5db",
  divider: "#f3f4f6",

  // Text
  text: "#111827",           // gray-900
  textStrong: "#030712",
  textMuted: "#6b7280",      // gray-500
  textFaint: "#9ca3af",      // gray-400
  textInverse: "#ffffff",

  // Semantic
  success: "#059669",
  warning: "#d97706",
  danger: "#dc2626",
  info: "#2563eb",

  // Elevation
  shadowXs: "0 1px 2px rgba(15, 23, 42, 0.04)",
  shadowSm: "0 2px 8px rgba(15, 23, 42, 0.06)",
  shadowMd: "0 8px 24px rgba(15, 23, 42, 0.08)",
  shadowLg: "0 20px 48px rgba(15, 23, 42, 0.14)",

  // Radius
  radiusSm: 8,
  radius: 12,
  radiusMd: 16,
  radiusLg: 20,
  radiusPill: 999,

  // Spacing scale (px)
  s1: 4, s2: 8, s3: 12, s4: 16, s5: 20, s6: 24, s8: 32, s10: 40, s12: 48,
};

export const S = {
  screen: {
    minHeight: "100vh",
    background: T.bg,
    direction: "rtl",
    fontFamily: "'Tajawal', 'IBM Plex Sans Arabic', 'SF Arabic', system-ui, sans-serif",
    color: T.text,
    paddingBottom: 88,
    WebkitFontSmoothing: "antialiased",
  },
  header: {
    background: T.surface,
    borderBottom: `1px solid ${T.border}`,
    padding: "16px 20px",
    position: "sticky",
    top: 0,
    zIndex: 20,
  },
  headerHero: {
    background: T.surface,
    padding: "20px 20px 22px",
    borderBottom: `1px solid ${T.border}`,
  },
  h1: {
    fontSize: 22,
    fontWeight: 800,
    color: T.textStrong,
    margin: 0,
    letterSpacing: "-0.01em",
  },
  h2: {
    fontSize: 16,
    fontWeight: 800,
    color: T.textStrong,
    margin: "14px 0 10px",
    textAlign: "right",
    letterSpacing: "-0.005em",
  },
  h3: {
    fontSize: 13,
    fontWeight: 700,
    color: T.textMuted,
    margin: "14px 0 8px",
    textAlign: "right",
    textTransform: "none",
    letterSpacing: "0.02em",
  },
  container: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "16px 16px",
  },
  card: {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radiusMd,
    padding: 16,
    boxShadow: T.shadowXs,
    marginBottom: 12,
  },
  cardFlat: {
    background: T.surface,
    borderRadius: T.radiusMd,
    padding: 16,
    marginBottom: 12,
  },
  input: {
    width: "100%",
    padding: "13px 14px",
    border: `1.5px solid ${T.border}`,
    borderRadius: T.radius,
    fontSize: 15,
    outline: "none",
    background: T.surface,
    color: T.text,
    fontFamily: "inherit",
    textAlign: "right",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: T.textMuted,
    marginBottom: 6,
    display: "block",
    textAlign: "right",
    letterSpacing: "0.01em",
  },
  primaryBtn: {
    background: T.primary,
    color: T.textInverse,
    border: "none",
    borderRadius: T.radius,
    padding: "14px 22px",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: T.shadowSm,
    transition: "all 0.15s",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    letterSpacing: "0.01em",
  },
  secondaryBtn: {
    background: T.surface,
    color: T.primary,
    border: `1.5px solid ${T.primary}`,
    borderRadius: T.radius,
    padding: "11px 18px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  ghostBtn: {
    background: "transparent",
    color: T.textMuted,
    border: "none",
    padding: "8px 12px",
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },
  iconBtn: {
    background: T.bgAlt,
    border: "none",
    width: 40,
    height: 40,
    borderRadius: 20,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: T.text,
    transition: "background 0.15s",
  },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "4px 10px",
    borderRadius: T.radiusPill,
    fontSize: 11,
    fontWeight: 700,
    background: T.bgAlt,
    color: T.textMuted,
  },
  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: T.radius,
    padding: 12,
    color: "#991b1b",
    fontSize: 13,
    textAlign: "right",
    marginTop: 10,
  },
  loadingText: {
    padding: 48,
    textAlign: "center",
    color: T.textMuted,
    fontSize: 14,
  },
  sectionDivider: {
    height: 1,
    background: T.divider,
    margin: "8px 0",
    border: "none",
  },
};
