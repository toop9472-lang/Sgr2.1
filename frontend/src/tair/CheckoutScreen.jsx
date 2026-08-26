// طير — Checkout: pick a trip (carrier) + create order
import React, { useEffect, useState } from "react";
import { MapPin, Bird, Calendar, Package, Wallet, Check } from "lucide-react";
import { T, S } from "./tairTheme";
import { tairApi, TRIP_STATUS_LABEL } from "./tairApi";
import { TopBar } from "./TairUI";

export default function CheckoutScreen({ user, listing, onBack, onCreated }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [agreedPrice, setAgreedPrice] = useState(String(listing.price_sar));
  const [dropoff, setDropoff] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    tairApi
      .listTrips({ status: "active", from_city: listing.city, limit: 30 })
      .then((d) => setTrips(d.items || []))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  }, [listing]);

  const submit = async () => {
    setError("");
    if (!agreedPrice || isNaN(Number(agreedPrice))) {
      return setError("السعر المتفق عليه مطلوب");
    }
    setSaving(true);
    try {
      const payload = {
        listing_id: listing.listing_id,
        seller_id: listing.seller_id,
        trip_id: selectedTrip?.trip_id || null,
        carrier_id: selectedTrip?.carrier_id || null,
        quantity: 1,
        agreed_price_sar: Number(agreedPrice),
        delivery_fee_hint_sar: selectedTrip?.price_hint_sar || null,
        pickup_address_hint: `${listing.city}${listing.district ? ` - ${listing.district}` : ""}`,
        dropoff_address_hint: dropoff || null,
      };
      const order = await tairApi.createOrder(payload, user.id || user.user_id);
      onCreated?.(order);
    } catch (err) {
      setError(err.response?.data?.detail || "فشل إنشاء الطلب");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={S.screen} data-testid="checkout-screen">
      <TopBar title="إتمام الطلب" onBack={onBack} />

      <div style={S.container}>
        <div style={S.card}>
          <h2 style={S.h2}>الإعلان</h2>
          <div style={{ display: "flex", flexDirection: "row-reverse", gap: 12, alignItems: "center" }}>
            <div style={styles.thumbBox}>
              {listing.cover_image ? (
                <img src={listing.cover_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <Bird size={28} strokeWidth={1.5} color={T.textFaint} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15, textAlign: "right" }}>{listing.title}</div>
              <div style={{
                color: T.textMuted, fontSize: 12, textAlign: "right",
                display: "inline-flex", alignItems: "center", gap: 4, marginTop: 2,
              }}>
                <MapPin size={12} strokeWidth={2.2} />
                <span>{listing.city}</span>
              </div>
              <div style={{ color: T.primary, fontWeight: 900, fontSize: 18, textAlign: "right", marginTop: 4 }}>
                {listing.price_sar} ر.س
              </div>
            </div>
          </div>
        </div>

        <div style={S.card}>
          <h2 style={S.h2}>اختر موصّلاً (اختياري)</h2>
          <p style={{ ...S.label, marginBottom: 8 }}>
            الرحلات المتاحة من {listing.city}
          </p>
          {loading ? (
            <div style={S.loadingText}>جاري التحميل…</div>
          ) : trips.length === 0 ? (
            <div style={styles.emptyMini}>
              لا يوجد موصّلون حالياً — يمكنك إنشاء الطلب بدون موصّل
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              <button
                onClick={() => setSelectedTrip(null)}
                style={{
                  ...styles.tripOption,
                  ...(selectedTrip === null ? styles.tripOptionActive : {}),
                }}
                data-testid="trip-option-none"
              >
                <div style={{ textAlign: "right", flex: 1 }}>
                  <div style={{ fontWeight: 800 }}>بدون موصّل</div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>سأنسق مع البائع بنفسي</div>
                </div>
                {selectedTrip === null && (
                  <span style={styles.check}>
                    <Check size={14} strokeWidth={3} />
                  </span>
                )}
              </button>
              {trips.map((t) => {
                const active = selectedTrip?.trip_id === t.trip_id;
                const dt = t.depart_at ? new Date(t.depart_at) : null;
                return (
                  <button
                    key={t.trip_id}
                    onClick={() => setSelectedTrip(t)}
                    style={{ ...styles.tripOption, ...(active ? styles.tripOptionActive : {}) }}
                    data-testid={`trip-option-${t.trip_id}`}
                  >
                    <div style={{ textAlign: "right", flex: 1 }}>
                      <div style={{ fontWeight: 800 }}>
                        {t.from_city} ← {t.to_city}
                      </div>
                      <div style={styles.tripMeta}>
                        <span style={styles.tripMetaItem}>
                          <Calendar size={11} strokeWidth={2.2} />
                          {dt ? dt.toLocaleDateString("ar-SA") : "-"}
                        </span>
                        <span style={styles.tripMetaItem}>
                          <Package size={11} strokeWidth={2.2} />
                          {t.available_cages} أقفاص
                        </span>
                        {t.price_hint_sar && (
                          <span style={styles.tripMetaItem}>
                            <Wallet size={11} strokeWidth={2.2} />
                            {t.price_hint_sar} ر.س
                          </span>
                        )}
                      </div>
                    </div>
                    {active && (
                      <span style={styles.check}>
                        <Check size={14} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={S.card}>
          <h2 style={S.h2}>تفاصيل الطلب</h2>
          <label style={S.label}>السعر المتفق عليه (ر.س) *</label>
          <input
            type="number"
            style={S.input}
            value={agreedPrice}
            onChange={(e) => setAgreedPrice(e.target.value)}
            data-testid="input-agreed-price"
          />

          <label style={{ ...S.label, marginTop: 12 }}>عنوان التسليم</label>
          <input
            style={S.input}
            value={dropoff}
            onChange={(e) => setDropoff(e.target.value)}
            placeholder="مثال: الرياض - حي الملقا"
            data-testid="input-dropoff"
          />
        </div>

        {error && <div style={S.errorBox} data-testid="checkout-error">{error}</div>}

        <button
          onClick={submit}
          disabled={saving}
          style={{ ...S.primaryBtn, width: "100%", marginTop: 8, opacity: saving ? 0.7 : 1 }}
          data-testid="submit-order"
        >
          {saving ? "جاري إنشاء الطلب…" : "أرسل الطلب"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  thumbBox: {
    width: 74,
    height: 74,
    borderRadius: 12,
    background: T.divider,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 32,
  },
  tripOption: {
    display: "flex",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    background: T.surface,
    borderWidth: 1.5,
    borderStyle: "solid",
    borderColor: T.border,
    borderRadius: T.radius,
    padding: "12px 14px",
    cursor: "pointer",
    fontFamily: "inherit",
    textAlign: "right",
  },
  tripOptionActive: {
    background: "#f0fdfa",
    borderColor: T.primary,
  },
  tripMeta: {
    display: "flex",
    flexDirection: "row-reverse",
    gap: 8,
    marginTop: 4,
    fontSize: 11,
    color: T.textMuted,
    flexWrap: "wrap",
  },
  tripMetaItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
  },
  check: {
    background: T.primary,
    color: T.textInverse,
    width: 24,
    height: 24,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  emptyMini: {
    padding: 14,
    background: "#f8fafc",
    borderRadius: 10,
    color: T.textMuted,
    fontSize: 13,
    textAlign: "center",
  },
};
