// طير — Professional Bottom Navigation (lucide icons, subtle depth)
import React from "react";
import { Home, Truck, Package, User } from "lucide-react";
import { T } from "./tairTheme";

const TABS = [
  { id: "home", label: "السوق", Icon: Home },
  { id: "trips", label: "الرحلات", Icon: Truck },
  { id: "orders", label: "طلباتي", Icon: Package },
  { id: "profile", label: "حسابي", Icon: User },
];

export default function TairBottomNav({ current, onChange, unread = 0 }) {
  return (
    <nav style={styles.wrap} data-testid="tair-bottom-nav">
      <div style={styles.inner}>
        {TABS.map(({ id, label, Icon }) => {
          const active = current === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              style={styles.tab}
              data-testid={`nav-tab-${id}`}
              aria-label={label}
            >
              <div style={{
                ...styles.iconWrap,
                ...(active ? styles.iconWrapActive : {}),
              }}>
                <Icon
                  size={22}
                  strokeWidth={active ? 2.4 : 1.8}
                  color={active ? T.primary : T.textFaint}
                />
                {id === "orders" && unread > 0 && (
                  <span style={styles.badge}>{unread > 9 ? "9+" : unread}</span>
                )}
              </div>
              <span style={{
                ...styles.label,
                ...(active ? styles.labelActive : {}),
              }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
      <div style={styles.homeIndicator} />
    </nav>
  );
}

const styles = {
  wrap: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: "rgba(255, 255, 255, 0.98)",
    backdropFilter: "blur(12px)",
    borderTop: `1px solid ${T.border}`,
    zIndex: 50,
    direction: "rtl",
    fontFamily: "'Tajawal', 'IBM Plex Sans Arabic', system-ui, sans-serif",
    boxShadow: "0 -4px 20px rgba(15, 23, 42, 0.06)",
  },
  inner: {
    maxWidth: 640,
    margin: "0 auto",
    display: "flex",
    flexDirection: "row-reverse",
    padding: "8px 6px 4px",
  },
  tab: {
    position: "relative",
    flex: 1,
    background: "transparent",
    border: "none",
    padding: "6px 0 6px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
    fontFamily: "inherit",
  },
  iconWrap: {
    position: "relative",
    width: 46,
    height: 30,
    borderRadius: 15,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.18s",
  },
  iconWrapActive: {
    background: "#f0fdfa",
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    color: T.textFaint,
    letterSpacing: "0.01em",
    transition: "color 0.15s",
  },
  labelActive: {
    color: T.primary,
    fontWeight: 800,
  },
  badge: {
    position: "absolute",
    top: 0,
    insetInlineStart: 6,
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
  homeIndicator: {
    width: 120,
    height: 4,
    background: T.textStrong,
    borderRadius: 2,
    opacity: 0.08,
    margin: "0 auto 6px",
  },
};
