// طير — Trips list + create modal (carrier network)
import React, { useEffect, useState } from "react";
import { T, S } from "./tairTheme";
import { tairApi, SAUDI_CITIES, TRIP_STATUS_LABEL } from "./tairApi";
import { EmptyState } from "./HomeScreen";

export default function TripsScreen({ user, onOpenTrip }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromCity, setFromCity] = useState(null);
  const [toCity, setToCity] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = () => {
    setLoading(true);
    const params = { status: "active", limit: 60 };
    if (fromCity) params.from_city = fromCity;
    if (toCity) params.to_city = toCity;
    tairApi
      .listTrips(params)
      .then((d) => setTrips(d.items || []))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [fromCity, toCity]);

  return (
    <div style={S.screen} data-testid="trips-screen">
      <header style={styles.hero}>
        <div style={styles.heroInner}>
          <h1 style={styles.title}>الرحلات</h1>
          <p style={styles.subtitle}>شبكة الموصّلين — نقل الطيور بأمان بين المدن</p>
          <button
            onClick={() => setShowCreate(true)}
            style={styles.createBtn}
            data-testid="create-trip-btn"
          >
            + سجّل رحلتك
          </button>
        </div>
      </header>

      <div style={styles.filters}>
        <div style={styles.filterCol}>
          <label style={styles.filterLabel}>من</label>
          <select
            style={styles.filterSelect}
            value={fromCity || ""}
            onChange={(e) => setFromCity(e.target.value || null)}
            data-testid="filter-from-city"
          >
            <option value="">الكل</option>
            {SAUDI_CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div style={styles.filterArrow}>←</div>
        <div style={styles.filterCol}>
          <label style={styles.filterLabel}>إلى</label>
          <select
            style={styles.filterSelect}
            value={toCity || ""}
            onChange={(e) => setToCity(e.target.value || null)}
            data-testid="filter-to-city"
          >
            <option value="">الكل</option>
            {SAUDI_CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={S.container}>
        {loading ? (
          <div style={S.loadingText}>جاري التحميل…</div>
        ) : trips.length === 0 ? (
          <EmptyState
            emoji="🚗"
            title="لا توجد رحلات مطابقة"
            desc="كن أول موصّل بين هاتين المدينتين"
            actionLabel="سجّل رحلة"
            onAction={() => setShowCreate(true)}
          />
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {trips.map((t) => (
              <TripCard key={t.trip_id} trip={t} onClick={() => onOpenTrip(t.trip_id)} />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateTripModal
          user={user}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function TripCard({ trip, onClick }) {
  const dt = trip.depart_at ? new Date(trip.depart_at) : null;
  return (
    <div
      onClick={onClick}
      style={styles.tripCard}
      data-testid={`trip-card-${trip.trip_id}`}
    >
      <div style={styles.tripTop}>
        <span style={styles.statusPill}>{TRIP_STATUS_LABEL[trip.status] || trip.status}</span>
        <span style={styles.cageBadge}>
          📦 {trip.available_cages}/{trip.total_cages} أقفاص
        </span>
      </div>

      <div style={styles.route}>
        <div style={styles.cityBox}>
          <div style={styles.cityLabel}>من</div>
          <div style={styles.cityName}>{trip.from_city}</div>
        </div>
        <div style={styles.routeArrow}>←</div>
        <div style={styles.cityBox}>
          <div style={styles.cityLabel}>إلى</div>
          <div style={styles.cityName}>{trip.to_city}</div>
        </div>
      </div>

      <div style={styles.tripMeta}>
        <span>📅 {dt ? dt.toLocaleDateString("ar-SA") : "-"}</span>
        <span>🚗 {trip.vehicle_type}</span>
        {trip.has_ac && <span style={{ color: T.accent }}>❄ مكيّف</span>}
        {trip.price_hint_sar && <span>💰 {trip.price_hint_sar} ر.س</span>}
      </div>

      {trip.notes && <p style={styles.tripNotes}>{trip.notes}</p>}
    </div>
  );
}

function CreateTripModal({ user, onClose, onCreated }) {
  const [form, setForm] = useState({
    from_city: SAUDI_CITIES[0],
    to_city: SAUDI_CITIES[1],
    depart_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16),
    vehicle_type: "سيدان",
    has_ac: true,
    total_cages: 4,
    accepts_sensitive: true,
    notes: "",
    price_hint_sar: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setError("");
    if (form.from_city === form.to_city) {
      return setError("المدينة الأصلية والوجهة يجب أن تكونا مختلفتين");
    }
    setSaving(true);
    try {
      const payload = {
        from_city: form.from_city,
        to_city: form.to_city,
        depart_at: new Date(form.depart_at).toISOString(),
        vehicle_type: form.vehicle_type,
        has_ac: form.has_ac,
        total_cages: Number(form.total_cages) || 4,
        accepts_sensitive: form.accepts_sensitive,
        notes: form.notes || null,
        price_hint_sar: form.price_hint_sar ? Number(form.price_hint_sar) : null,
      };
      await tairApi.createTrip(payload, user.id || user.user_id);
      onCreated?.();
    } catch (err) {
      setError(err.response?.data?.detail || "فشل إنشاء الرحلة");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div
        style={modalStyles.modal}
        onClick={(e) => e.stopPropagation()}
        data-testid="create-trip-modal"
      >
        <div style={modalStyles.header}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>رحلة جديدة</h2>
          <button onClick={onClose} style={modalStyles.close} data-testid="close-create-trip">✕</button>
        </div>

        <div style={modalStyles.body}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={S.label}>من *</label>
              <select
                style={S.input}
                value={form.from_city}
                onChange={(e) => set("from_city", e.target.value)}
                data-testid="trip-from-city"
              >
                {SAUDI_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={S.label}>إلى *</label>
              <select
                style={S.input}
                value={form.to_city}
                onChange={(e) => set("to_city", e.target.value)}
                data-testid="trip-to-city"
              >
                {SAUDI_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <label style={{ ...S.label, marginTop: 12 }}>موعد الانطلاق *</label>
          <input
            type="datetime-local"
            style={S.input}
            value={form.depart_at}
            onChange={(e) => set("depart_at", e.target.value)}
            data-testid="trip-depart-at"
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
            <div>
              <label style={S.label}>نوع المركبة</label>
              <input
                style={S.input}
                value={form.vehicle_type}
                onChange={(e) => set("vehicle_type", e.target.value)}
                placeholder="سيدان / بيك أب / GMC"
                data-testid="trip-vehicle"
              />
            </div>
            <div>
              <label style={S.label}>عدد الأقفاص</label>
              <input
                type="number"
                min="1"
                style={S.input}
                value={form.total_cages}
                onChange={(e) => set("total_cages", e.target.value)}
                data-testid="trip-cages"
              />
            </div>
          </div>

          <label style={{ ...S.label, marginTop: 12 }}>سعر إرشادي (ر.س)</label>
          <input
            type="number"
            style={S.input}
            value={form.price_hint_sar}
            onChange={(e) => set("price_hint_sar", e.target.value)}
            placeholder="اختياري"
            data-testid="trip-price"
          />

          <div style={{ display: "flex", flexDirection: "row-reverse", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
            <label style={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={form.has_ac}
                onChange={(e) => set("has_ac", e.target.checked)}
                data-testid="trip-has-ac"
              />
              <span>مكيّف ❄</span>
            </label>
            <label style={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={form.accepts_sensitive}
                onChange={(e) => set("accepts_sensitive", e.target.checked)}
                data-testid="trip-sensitive"
              />
              <span>يقبل الطيور الحساسة</span>
            </label>
          </div>

          <label style={{ ...S.label, marginTop: 12 }}>ملاحظات</label>
          <textarea
            style={{ ...S.input, minHeight: 80, resize: "vertical" }}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="أي تفاصيل مهمة…"
            data-testid="trip-notes"
          />

          {error && <div style={S.errorBox} data-testid="trip-error">{error}</div>}

          <button
            onClick={submit}
            disabled={saving}
            style={{ ...S.primaryBtn, width: "100%", marginTop: 14, opacity: saving ? 0.7 : 1 }}
            data-testid="submit-trip"
          >
            {saving ? "جاري النشر…" : "انشر الرحلة"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  hero: {
    background: `linear-gradient(135deg, ${T.mint} 0%, ${T.sky} 100%)`,
    padding: "22px 20px 24px",
  },
  heroInner: { maxWidth: 900, margin: "0 auto" },
  title: {
    margin: 0,
    fontSize: 26,
    fontWeight: 900,
    color: T.primary,
    textAlign: "right",
  },
  subtitle: {
    margin: "4px 0 14px",
    fontSize: 13,
    color: "#0f766e",
    fontWeight: 600,
    textAlign: "right",
  },
  createBtn: {
    background: T.primary,
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "10px 18px",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: T.shadowMd,
  },
  filters: {
    background: "#fff",
    borderBottom: `1px solid ${T.border}`,
    padding: "10px 16px",
    display: "flex",
    flexDirection: "row-reverse",
    gap: 8,
    alignItems: "flex-end",
    maxWidth: 900,
    margin: "0 auto",
  },
  filterCol: { flex: 1 },
  filterLabel: { fontSize: 11, color: T.textMuted, fontWeight: 700, display: "block", marginBottom: 4, textAlign: "right" },
  filterSelect: {
    width: "100%",
    padding: "8px 12px",
    border: `1px solid ${T.border}`,
    borderRadius: 10,
    fontSize: 13,
    background: "#fff",
    fontFamily: "inherit",
    textAlign: "right",
  },
  filterArrow: {
    fontSize: 22,
    color: T.primary,
    paddingBottom: 8,
  },
  tripCard: {
    background: "#fff",
    borderRadius: 16,
    padding: 16,
    cursor: "pointer",
    boxShadow: T.shadowSm,
    transition: "transform 0.15s",
  },
  tripTop: {
    display: "flex",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusPill: {
    padding: "4px 12px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
    background: "#ecfeff",
    color: "#0891b2",
  },
  cageBadge: {
    background: "#ecfdf5",
    color: T.primary,
    padding: "4px 12px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
  },
  route: {
    display: "flex",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
    padding: "6px 0",
  },
  cityBox: { flex: 1, textAlign: "center" },
  cityLabel: { fontSize: 10, color: T.textFaint, fontWeight: 700 },
  cityName: { fontSize: 18, fontWeight: 900, color: T.text, marginTop: 2 },
  routeArrow: { fontSize: 22, color: T.success },
  tripMeta: {
    display: "flex",
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
    fontSize: 12,
    color: T.textMuted,
    fontWeight: 700,
  },
  tripNotes: { color: T.textMuted, fontSize: 12, marginTop: 8, textAlign: "right" },
  checkboxRow: {
    display: "flex",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    color: T.text,
    fontWeight: 600,
    cursor: "pointer",
  },
};

const modalStyles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.55)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: 16,
  },
  modal: {
    background: "#fff",
    borderRadius: 20,
    maxWidth: 520,
    width: "100%",
    maxHeight: "90vh",
    overflow: "auto",
  },
  header: {
    position: "sticky",
    top: 0,
    background: "#fff",
    padding: "14px 18px",
    borderBottom: `1px solid ${T.border}`,
    display: "flex",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  close: {
    background: T.divider,
    border: "none",
    width: 30,
    height: 30,
    borderRadius: 15,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 800,
  },
  body: { padding: 18 },
};
