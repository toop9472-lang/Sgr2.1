// طير — shared theme tokens (matches design_guidelines.md)
export const T = {
  // Brand
  primary: "#065f46",         // deep emerald
  primaryLight: "#10b981",    // emerald
  accent: "#06b6d4",          // turquoise/cyan
  mint: "#c8fce6",
  mintDeep: "#a7f3d0",
  sky: "#7dd3fc",
  yellow: "#fde047",
  lime: "#84cc16",

  // Surface
  bg: "#f8fafc",
  surface: "#ffffff",
  border: "#e2e8f0",
  divider: "#f1f5f9",

  // Text
  text: "#0f172a",
  textMuted: "#64748b",
  textFaint: "#94a3b8",

  // Status
  success: "#10b981",
  danger: "#dc2626",
  warning: "#f59e0b",

  // Shadow
  shadowSm: "0 4px 12px rgba(15, 23, 42, 0.06)",
  shadowMd: "0 10px 30px rgba(15, 23, 42, 0.08)",
  shadowLg: "0 20px 50px rgba(6, 95, 70, 0.20)",
};

// Common inline styles reused across screens
export const S = {
  screen: {
    minHeight: "100vh",
    background: T.bg,
    direction: "rtl",
    fontFamily: "'Tajawal', 'IBM Plex Sans Arabic', system-ui, sans-serif",
    color: T.text,
    paddingBottom: 80,
  },
  header: {
    background: `linear-gradient(135deg, ${T.mint} 0%, ${T.mintDeep} 40%, ${T.sky} 100%)`,
    padding: "18px 20px",
    boxShadow: T.shadowSm,
  },
  headerRow: {
    display: "flex",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: 1200,
    margin: "0 auto",
  },
  h1: {
    fontSize: 26,
    fontWeight: 900,
    color: T.primary,
    margin: 0,
  },
  h2: {
    fontSize: 18,
    fontWeight: 800,
    color: T.text,
    margin: "12px 0 8px",
    textAlign: "right",
  },
  h3: {
    fontSize: 15,
    fontWeight: 700,
    color: T.textMuted,
    margin: "12px 0 6px",
    textAlign: "right",
  },
  container: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "18px 16px",
  },
  card: {
    background: T.surface,
    borderRadius: 16,
    padding: 16,
    boxShadow: T.shadowSm,
    marginBottom: 12,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    border: `1px solid ${T.border}`,
    borderRadius: 12,
    fontSize: 15,
    outline: "none",
    background: "#fff",
    color: T.text,
    fontFamily: "inherit",
    textAlign: "right",
    boxSizing: "border-box",
  },
  label: {
    fontSize: 13,
    fontWeight: 700,
    color: T.textMuted,
    marginBottom: 6,
    display: "block",
    textAlign: "right",
  },
  primaryBtn: {
    background: `linear-gradient(135deg, ${T.primaryLight}, ${T.accent})`,
    color: "#fff",
    border: "none",
    borderRadius: 14,
    padding: "14px 22px",
    fontSize: 16,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: T.shadowMd,
    transition: "transform 0.15s",
  },
  secondaryBtn: {
    background: "#fff",
    color: T.primary,
    border: `1.5px solid ${T.primary}`,
    borderRadius: 12,
    padding: "10px 18px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  ghostBtn: {
    background: "transparent",
    color: T.textMuted,
    border: "none",
    padding: "8px 12px",
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  pill: {
    display: "inline-block",
    padding: "5px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    background: T.divider,
    color: T.textMuted,
  },
  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 10,
    padding: 10,
    color: "#991b1b",
    fontSize: 13,
    textAlign: "right",
    marginTop: 8,
  },
  loadingText: {
    padding: 40,
    textAlign: "center",
    color: T.textMuted,
    fontSize: 15,
  },
};
