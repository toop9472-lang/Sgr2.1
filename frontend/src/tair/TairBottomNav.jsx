// طير — Floating Pill Bottom Nav (semi-transparent, pill-shaped active tab)
import React from "react";
import { Home, Truck, MessageCircle, MessageSquare, User } from "lucide-react";
import { T } from "./tairTheme";

// Order in RTL renders right-to-left; array order is visual reading order
const TABS = [
  { id: "profile", label: "حسابي", Icon: User },
  { id: "forum", label: "المنتدى", Icon: MessageSquare },
  { id: "messages", label: "رسائل", Icon: MessageCircle },
  { id: "trips", label: "الرحلات", Icon: Truck },
  { id: "home", label: "السوق", Icon: Home },
];

export default function TairBottomNav({ current, onChange, unread = 0 }) {
  return (
    <div style={styles.wrap} data-testid="tair-bottom-nav">
      <nav style={styles.pill}>
        {TABS.map(({ id, label, Icon }) => {
          const active = current === id;
          const showBadge = id === "messages" && unread > 0;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              style={{
                ...styles.tab,
                ...(active ? styles.tabActive : {}),
              }}
              data-testid={`nav-tab-${id}`}
              aria-label={label}
            >
              <div style={styles.iconRow}>
                <Icon
                  size={active ? 20 : 19}
                  strokeWidth={active ? 2.4 : 1.9}
                  color={active ? T.primary : "#94a3b8"}
                />
                {showBadge && (
                  <span style={styles.badge}>{unread > 99 ? "99+" : unread}</span>
                )}
              </div>
              <span style={{
                ...styles.label,
                color: active ? T.primary : "#94a3b8",
                fontWeight: active ? 800 : 600,
              }}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

const styles = {
  wrap: {
    position: "fixed",
    bottom: 12,
    left: 0,
    right: 0,
    zIndex: 50,
    display: "flex",
    justifyContent: "center",
    padding: "0 12px",
    pointerEvents: "none",
    direction: "rtl",
    fontFamily: "'Tajawal', 'IBM Plex Sans Arabic', system-ui, sans-serif",
  },
  pill: {
    pointerEvents: "auto",
    display: "flex",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 2,
    padding: "6px 8px",
    background: "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    borderRadius: 999,
    border: "1px solid rgba(255, 255, 255, 0.9)",
    boxShadow: "0 10px 32px rgba(15, 23, 42, 0.12), 0 2px 8px rgba(15, 23, 42, 0.05)",
    maxWidth: 460,
    width: "100%",
  },
  tab: {
    position: "relative",
    flex: 1,
    background: "transparent",
    border: "none",
    borderRadius: 999,
    padding: "8px 6px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    fontFamily: "inherit",
    transition: "background 0.2s",
    minWidth: 0,
  },
  tabActive: {
    background: "#e0f2fe",  // soft sky-blue pill (matches reference)
  },
  iconRow: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 10.5,
    letterSpacing: "0.01em",
    transition: "color 0.15s",
    whiteSpace: "nowrap",
  },
  badge: {
    position: "absolute",
    top: -6,
    insetInlineStart: 8,
    background: T.danger,
    color: "#fff",
    fontSize: 9,
    fontWeight: 800,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    padding: "0 4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1.5px solid #fff",
  },
};
