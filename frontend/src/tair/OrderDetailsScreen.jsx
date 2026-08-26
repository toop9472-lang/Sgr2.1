// طير — Order Details with status timeline + role-aware actions
import React, { useCallback, useEffect, useState } from "react";
import { T, S } from "./tairTheme";
import { tairApi, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "./tairApi";
import { TopBar } from "./CreateListingScreen";

const TIMELINE_STEPS = [
  { key: "pending", label: "بانتظار الموصّل" },
  { key: "accepted_by_carrier", label: "قبل الموصّل" },
  { key: "in_transit", label: "في الطريق" },
  { key: "delivered", label: "تم التسليم" },
  { key: "completed", label: "مكتمل" },
];

export default function OrderDetailsScreen({ user, orderId, onBack, onRate }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const uid = user.id || user.user_id;

  const load = useCallback(() => {
    setLoading(true);
    tairApi
      .getOrder(orderId, uid)
      .then(setOrder)
      .catch((e) => setError(e.response?.data?.detail || "فشل تحميل الطلب"))
      .finally(() => setLoading(false));
  }, [orderId, uid]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div style={S.screen}>
        <TopBar title="الطلب" onBack={onBack} />
        <div style={S.loadingText}>جاري التحميل…</div>
      </div>
    );
  }
  if (!order) {
    return (
      <div style={S.screen}>
        <TopBar title="الطلب" onBack={onBack} />
        <div style={{ padding: 40, textAlign: "center", color: T.danger }}>
          {error || "الطلب غير موجود"}
        </div>
      </div>
    );
  }

  const isBuyer = order.buyer_id === uid;
  const isSeller = order.seller_id === uid;
  const isCarrier = order.carrier_id === uid;

  const doAction = async (action, note) => {
    setBusy(true);
    setError("");
    try {
      const extra = note ? { note } : {};
      await tairApi.orderAction(order.order_id, action, uid, extra);
      load();
    } catch (e) {
      setError(e.response?.data?.detail || "فشل تنفيذ الإجراء");
    } finally {
      setBusy(false);
    }
  };

  // Action rules based on status + role
  const actions = [];
  if (order.status === "pending" && isCarrier) {
    actions.push({ id: "accept-carrier", label: "قبول الطلب", primary: true });
  }
  if (order.status === "accepted_by_carrier" && isCarrier) {
    actions.push({ id: "start-transit", label: "بدء النقل", primary: true });
  }
  if (order.status === "in_transit" && isCarrier) {
    actions.push({ id: "mark-delivered", label: "تم التسليم", primary: true });
  }
  if (order.status === "delivered" && isBuyer) {
    actions.push({ id: "complete", label: "تأكيد استلامي ✓", primary: true });
  }
  const canCancel = ["pending", "accepted_by_carrier", "in_transit"].includes(order.status) &&
    (isBuyer || isSeller || isCarrier);

  const canRate = order.status === "completed" && (
    (isBuyer && (!order.seller_rated || !order.carrier_rated)) ||
    (isSeller && !order.buyer_rated) ||
    (isCarrier && !order.buyer_rated)
  );

  const statusColor = ORDER_STATUS_COLOR[order.status] || T.textMuted;

  return (
    <div style={S.screen} data-testid="order-details-screen">
      <TopBar title={`طلب #${order.order_id.slice(-6)}`} onBack={onBack} />

      <div style={S.container}>
        <div style={S.card}>
          <div style={{ display: "flex", flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ ...S.pill, background: statusColor + "22", color: statusColor, fontSize: 13 }}>
              {ORDER_STATUS_LABEL[order.status]}
            </span>
            <span style={{ fontSize: 22, fontWeight: 900, color: T.primary }}>
              {order.agreed_price_sar} ر.س
            </span>
          </div>
          <div style={{ color: T.textMuted, fontSize: 12, textAlign: "right", marginTop: 6 }}>
            📅 {new Date(order.created_at).toLocaleString("ar-SA")}
          </div>
        </div>

        <div style={S.card}>
          <h2 style={S.h2}>تتبّع الطلب</h2>
          <Timeline order={order} />
        </div>

        <div style={S.card}>
          <h2 style={S.h2}>الأطراف</h2>
          <PartyRow icon="🛍️" label="المشتري" id={order.buyer_id} you={isBuyer} />
          <PartyRow icon="🐦" label="البائع" id={order.seller_id} you={isSeller} />
          <PartyRow icon="🚗" label="الموصّل" id={order.carrier_id || "لم يُعيَّن"} you={isCarrier} />
          {order.pickup_address_hint && (
            <div style={{ marginTop: 10, color: T.textMuted, fontSize: 13, textAlign: "right" }}>
              📍 استلام: {order.pickup_address_hint}
            </div>
          )}
          {order.dropoff_address_hint && (
            <div style={{ color: T.textMuted, fontSize: 13, textAlign: "right" }}>
              🏁 تسليم: {order.dropoff_address_hint}
            </div>
          )}
        </div>

        {error && <div style={S.errorBox}>{error}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {actions.map((a) => (
            <button
              key={a.id}
              onClick={() => doAction(a.id)}
              disabled={busy}
              style={{ ...S.primaryBtn, opacity: busy ? 0.7 : 1 }}
              data-testid={`action-${a.id}`}
            >
              {a.label}
            </button>
          ))}
          {canRate && (
            <button
              onClick={() => onRate(order)}
              style={{ ...S.primaryBtn, background: T.yellow, color: T.text }}
              data-testid="rate-order-btn"
            >
              ⭐ قيّم الأطراف
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => {
                if (window.confirm("هل أنت متأكد من إلغاء الطلب؟")) {
                  doAction("cancel");
                }
              }}
              disabled={busy}
              style={{ ...S.secondaryBtn, borderColor: T.danger, color: T.danger }}
              data-testid="cancel-order"
            >
              إلغاء الطلب
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Timeline({ order }) {
  const currentIdx = TIMELINE_STEPS.findIndex((s) => s.key === order.status);
  const isCancel = order.status === "cancelled";
  const isDispute = order.status === "disputed";

  if (isCancel || isDispute) {
    return (
      <div style={{
        padding: 14,
        borderRadius: 12,
        background: (isCancel ? "#fee2e2" : "#fef3c7"),
        color: (isCancel ? "#991b1b" : "#92400e"),
        fontWeight: 700,
        textAlign: "center",
      }}>
        {isCancel ? "❌ الطلب مُلغى" : "⚠️ الطلب في نزاع — قيد المراجعة"}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "row-reverse", gap: 4, overflowX: "auto" }}>
      {TIMELINE_STEPS.map((step, i) => {
        const done = i <= currentIdx;
        const active = i === currentIdx;
        return (
          <div key={step.key} style={{ flex: 1, minWidth: 90, textAlign: "center" }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                background: done ? T.primary : T.divider,
                color: done ? "#fff" : T.textFaint,
                margin: "0 auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 13,
                border: active ? `3px solid ${T.mintDeep}` : "none",
              }}
            >
              {done ? "✓" : i + 1}
            </div>
            <div style={{ fontSize: 10, marginTop: 4, color: done ? T.text : T.textFaint, fontWeight: 700 }}>
              {step.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PartyRow({ icon, label, id, you }) {
  return (
    <div style={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", gap: 10, padding: "8px 0" }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <div style={{ flex: 1, textAlign: "right" }}>
        <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: 13, color: T.text, fontWeight: 700 }}>{id}</div>
      </div>
      {you && <span style={{ ...S.pill, background: "#ecfdf5", color: T.primary }}>أنت</span>}
    </div>
  );
}
