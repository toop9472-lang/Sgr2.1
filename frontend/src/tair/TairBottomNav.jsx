// طير — Bottom Navigation
import React from "react";
import { T } from "./tairTheme";

const TABS = [
  { id: "home", label: "السوق", icon: "🏠" },
  { id: "trips", label: "الرحلات", icon: "🚗" },
  { id: "orders", label: "طلباتي", icon: "📦" },
  { id: "profile", label: "حسابي", icon: "👤" },
];

export default function TairBottomNav({ current, onChange, unread = 0 }) {
  return (
    <nav style={styles.wrap} data-testid="tair-bottom-nav">
      <div style={styles.inner}>
        {TABS.map((tab) => {
          const active = current === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              style={{ ...styles.tab, ...(active ? styles.tabActive : {}) }}
              data-testid={`nav-tab-${tab.id}`}
            >
              <span style={styles.icon}>{tab.icon}</span>
              <span style={{ ...styles.label, ...(active ? styles.labelActive : {}) }}>
                {tab.label}
              </span>
              {tab.id === "orders" && unread > 0 && (
                <span style={styles.badge}>{unread}</span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

const styles = {
  wrap: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: "#fff",
    borderTop: `1px solid ${T.border}`,
    boxShadow: "0 -8px 24px rgba(15, 23, 42, 0.06)",
    zIndex: 50,
    direction: "rtl",
  },
  inner: {
    maxWidth: 900,
    margin: "0 auto",
    display: "flex",
    flexDirection: "row-reverse",
    justifyContent: "space-around",
    padding: "8px 6px 10px",
  },
  tab: {
    position: "relative",
    flex: 1,
    background: "transparent",
    border: "none",
    padding: "6px 4px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
    fontFamily: "inherit",
    transition: "transform 0.15s",
  },
  tabActive: {
    transform: "translateY(-2px)",
  },
  icon: {
    fontSize: 22,
    lineHeight: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: 700,
    color: T.textMuted,
  },
  labelActive: {
    color: T.primary,
  },
  badge: {
    position: "absolute",
    top: 2,
    left: "calc(50% + 6px)",
    background: T.danger,
    color: "#fff",
    fontSize: 10,
    fontWeight: 800,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    padding: "0 4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
