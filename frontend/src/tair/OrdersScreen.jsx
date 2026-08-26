// طير — My Orders (buyer / seller / carrier view)
import React, { useEffect, useState } from "react";
import { T, S } from "./tairTheme";
import { tairApi, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "./tairApi";
import { EmptyState } from "./HomeScreen";

const ROLE_TABS = [
  { id: "buyer", label: "كمشتري" },
  { id: "seller", label: "كبائع" },
  { id: "carrier", label: "كموصّل" },
];

export default function OrdersScreen({ user, onOpenOrder }) {
  const [role, setRole] = useState("buyer");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    tairApi
      .ordersByUser(user.id || user.user_id, role)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [role, user]);

  return (
    <div style={S.screen} data-testid="orders-screen">
      <header style={styles.hero}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h1 style={styles.title}>طلباتي</h1>
          <div style={styles.tabs}>
            {ROLE_TABS.map((t) => {
              const active = role === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setRole(t.id)}
                  style={{ ...styles.tab, ...(active ? styles.tabActive : {}) }}
                  data-testid={`orders-role-${t.id}`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div style={S.container}>
        {loading ? (
          <div style={S.loadingText}>جاري التحميل…</div>
        ) : orders.length === 0 ? (
          <EmptyState
            emoji="📦"
            title="لا توجد طلبات هنا"
            desc={
              role === "buyer"
                ? "ابدأ بتصفح الإعلانات وقدّم طلبك"
                : role === "seller"
                ? "لم يقم أحد بطلب أي من إعلاناتك بعد"
                : "لم تحصل على طلب نقل بعد — سجّل رحلاتك أولاً"
            }
          />
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {orders.map((o) => (
              <OrderCard
                key={o.order_id}
                order={o}
                onClick={() => onOpenOrder(o.order_id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order, onClick }) {
  const statusColor = ORDER_STATUS_COLOR[order.status] || T.textMuted;
  return (
    <div
      onClick={onClick}
      style={styles.card}
      data-testid={`order-card-${order.order_id}`}
    >
      <div style={styles.cardTop}>
        <span
          style={{
            ...styles.statusPill,
            background: statusColor + "22",
            color: statusColor,
          }}
        >
          {ORDER_STATUS_LABEL[order.status] || order.status}
        </span>
        <span style={styles.price}>{order.agreed_price_sar} ر.س</span>
      </div>
      <div style={styles.orderTitle}>طلب #{order.order_id.slice(-6)}</div>
      <div style={styles.orderMeta}>
        📅 {new Date(order.created_at).toLocaleDateString("ar-SA")}
        {order.trip_id && <span style={{ color: T.accent }}> · 🚗 موصّل</span>}
      </div>
    </div>
  );
}

const styles = {
  hero: {
    background: `linear-gradient(135deg, ${T.mint} 0%, ${T.sky} 100%)`,
    padding: "22px 20px 20px",
  },
  title: {
    margin: 0,
    fontSize: 26,
    fontWeight: 900,
    color: T.primary,
    textAlign: "right",
    marginBottom: 14,
  },
  tabs: {
    display: "flex",
    flexDirection: "row-reverse",
    gap: 6,
    background: "rgba(255,255,255,0.6)",
    padding: 4,
    borderRadius: 999,
  },
  tab: {
    flex: 1,
    padding: "9px 12px",
    border: "none",
    borderRadius: 999,
    background: "transparent",
    color: T.primary,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.2s",
  },
  tabActive: {
    background: T.primary,
    color: "#fff",
    boxShadow: T.shadowSm,
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: 14,
    cursor: "pointer",
    boxShadow: T.shadowSm,
  },
  cardTop: {
    display: "flex",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusPill: {
    padding: "4px 12px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
  },
  price: { fontSize: 17, fontWeight: 900, color: T.primary },
  orderTitle: { fontSize: 14, fontWeight: 800, color: T.text, textAlign: "right", marginBottom: 4 },
  orderMeta: { fontSize: 12, color: T.textMuted, textAlign: "right", fontWeight: 600 },
};
