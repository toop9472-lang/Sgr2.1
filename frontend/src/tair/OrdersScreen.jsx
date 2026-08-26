// طير — My Orders (professional design)
import React, { useEffect, useState } from "react";
import { Package, ShoppingBag, Store, Truck, Calendar, ChevronLeft } from "lucide-react";
import { T, S } from "./tairTheme";
import { tairApi, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "./tairApi";
import { EmptyState, StatusPill } from "./TairUI";

const ROLE_TABS = [
  { id: "buyer", label: "كمشتري", Icon: ShoppingBag },
  { id: "seller", label: "كبائع", Icon: Store },
  { id: "carrier", label: "كموصّل", Icon: Truck },
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
            {ROLE_TABS.map(({ id, label, Icon }) => {
              const active = role === id;
              return (
                <button
                  key={id}
                  onClick={() => setRole(id)}
                  style={{ ...styles.tab, ...(active ? styles.tabActive : {}) }}
                  data-testid={`orders-role-${id}`}
                >
                  <Icon size={16} strokeWidth={active ? 2.4 : 2} />
                  <span>{label}</span>
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
            icon={<Package size={36} strokeWidth={1.5} />}
            title="لا توجد طلبات هنا"
            desc={
              role === "buyer"
                ? "ابدأ بتصفّح الإعلانات وقدّم طلبك"
                : role === "seller"
                ? "لم يقم أحد بطلب أي من إعلاناتك بعد"
                : "لم تحصل على طلب نقل بعد — سجّل رحلاتك أولاً"
            }
          />
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
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
        <StatusPill label={ORDER_STATUS_LABEL[order.status] || order.status} color={statusColor} />
        <ChevronLeft size={18} strokeWidth={2.2} color={T.textFaint} />
      </div>
      <div style={styles.cardBody}>
        <div style={styles.orderTitle}>طلب #{order.order_id.slice(-6)}</div>
        <div style={styles.orderMeta}>
          <span style={styles.metaItem}>
            <Calendar size={12} strokeWidth={2.2} />
            {new Date(order.created_at).toLocaleDateString("ar-SA")}
          </span>
          {order.trip_id && (
            <span style={{ ...styles.metaItem, color: T.info }}>
              <Truck size={12} strokeWidth={2.2} />
              موصّل
            </span>
          )}
        </div>
      </div>
      <div style={styles.priceBox}>
        <div style={styles.priceLabel}>السعر</div>
        <div style={styles.priceValue}>{order.agreed_price_sar} <span style={styles.currency}>ر.س</span></div>
      </div>
    </div>
  );
}

const styles = {
  hero: {
    background: T.surface,
    padding: "20px 20px 18px",
    borderBottom: `1px solid ${T.divider}`,
  },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 900,
    color: T.textStrong,
    textAlign: "right",
    marginBottom: 14,
    letterSpacing: "-0.01em",
  },
  tabs: {
    display: "flex",
    flexDirection: "row-reverse",
    gap: 4,
    background: T.bgAlt,
    padding: 4,
    borderRadius: T.radius,
  },
  tab: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    flex: 1,
    padding: "9px 12px",
    border: "none",
    borderRadius: T.radiusSm,
    background: "transparent",
    color: T.textMuted,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.15s",
  },
  tabActive: {
    background: T.surface,
    color: T.text,
    boxShadow: T.shadowXs,
  },
  card: {
    display: "flex",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radiusMd,
    padding: 14,
    cursor: "pointer",
    boxShadow: T.shadowXs,
  },
  cardTop: {
    display: "flex",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
    textAlign: "right",
    marginRight: -8,
  },
  orderTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: T.text,
    marginBottom: 4,
    letterSpacing: "-0.005em",
  },
  orderMeta: {
    display: "flex",
    flexDirection: "row-reverse",
    gap: 10,
    fontSize: 11,
    color: T.textMuted,
    fontWeight: 600,
    flexWrap: "wrap",
  },
  metaItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
  },
  priceBox: {
    textAlign: "left",
    minWidth: 80,
  },
  priceLabel: {
    fontSize: 10,
    color: T.textFaint,
    fontWeight: 700,
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 17,
    fontWeight: 900,
    color: T.primary,
    letterSpacing: "-0.01em",
  },
  currency: { fontSize: 11, fontWeight: 700, color: T.textMuted },
};
