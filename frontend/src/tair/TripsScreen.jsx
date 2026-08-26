// طير — Trips list + create modal (professional)
import React, { useEffect, useState } from "react";
import {
  Truck, Plus, MapPin, Calendar, Package, Snowflake, ArrowLeftRight,
  X, Car, Wallet,
} from "lucide-react";
import { T, S } from "./tairTheme";
import { tairApi, SAUDI_CITIES, TRIP_STATUS_LABEL } from "./tairApi";
import { BottomSheet, SelectorItem, FilterChipButton, EmptyState, StatusPill } from "./TairUI";

export default function TripsScreen({ user, onOpenTrip }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromCity, setFromCity] = useState(null);
  const [toCity, setToCity] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [sheet, setSheet] = useState(null); // 'from' | 'to'

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
          <div style={styles.headTop}>
            <div>
              <h1 style={styles.title}>الرحلات</h1>
              <p style={styles.subtitle}>شبكة الموصّلين لنقل الطيور بين المدن</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              style={styles.createBtn}
              data-testid="create-trip-btn"
            >
              <Plus size={16} strokeWidth={2.6} />
              <span>رحلة جديدة</span>
            </button>
          </div>
        </div>
      </header>

      <div style={styles.filterBar}>
        <div style={styles.filterInner}>
          <FilterChipButton
            icon={<MapPin size={15} strokeWidth={2.2} />}
            label="من"
            value={fromCity}
            onClick={() => setSheet("from")}
            testId="filter-from-btn"
          />
          <ArrowLeftRight size={16} color={T.textFaint} />
          <FilterChipButton
            icon={<MapPin size={15} strokeWidth={2.2} />}
            label="إلى"
            value={toCity}
            onClick={() => setSheet("to")}
            testId="filter-to-btn"
          />
          {(fromCity || toCity) && (
            <button
              onClick={() => { setFromCity(null); setToCity(null); }}
              style={styles.clearBtn}
              data-testid="clear-trip-filters"
            >
              مسح
            </button>
          )}
        </div>
      </div>

      <div style={S.container}>
        {loading ? (
          <div style={S.loadingText}>جاري التحميل…</div>
        ) : trips.length === 0 ? (
          <EmptyState
            icon={<Truck size={36} strokeWidth={1.5} />}
            title="لا توجد رحلات مطابقة"
            desc="كن أول موصّل بين هاتين المدينتين واحصل على طلبات نقل"
            action={
              <button onClick={() => setShowCreate(true)} style={S.primaryBtn} data-testid="empty-create-trip">
                <Plus size={16} strokeWidth={2.6} />
                <span>سجّل رحلتك</span>
              </button>
            }
          />
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {trips.map((t) => (
              <TripCard key={t.trip_id} trip={t} onClick={() => onOpenTrip(t.trip_id)} />
            ))}
          </div>
        )}
      </div>

      <BottomSheet open={sheet === "from"} onClose={() => setSheet(null)} title="مدينة الانطلاق">
        <SelectorItem
          icon={<MapPin size={16} strokeWidth={2.2} />}
          label="الكل"
          active={!fromCity}
          onClick={() => { setFromCity(null); setSheet(null); }}
          testId="from-city-all"
        />
        {SAUDI_CITIES.map((c) => (
          <SelectorItem
            key={c}
            icon={<MapPin size={16} strokeWidth={2.2} />}
            label={c}
            active={fromCity === c}
            onClick={() => { setFromCity(c); setSheet(null); }}
            testId={`from-city-${c}`}
          />
        ))}
      </BottomSheet>

      <BottomSheet open={sheet === "to"} onClose={() => setSheet(null)} title="مدينة الوصول">
        <SelectorItem
          icon={<MapPin size={16} strokeWidth={2.2} />}
          label="الكل"
          active={!toCity}
          onClick={() => { setToCity(null); setSheet(null); }}
          testId="to-city-all"
        />
        {SAUDI_CITIES.map((c) => (
          <SelectorItem
            key={c}
            icon={<MapPin size={16} strokeWidth={2.2} />}
            label={c}
            active={toCity === c}
            onClick={() => { setToCity(c); setSheet(null); }}
            testId={`to-city-${c}`}
          />
        ))}
      </BottomSheet>

      {showCreate && (
        <CreateTripModal
          user={user}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(); }}
        />
      )}
    </div>
  );
}

function TripCard({ trip, onClick }) {
  const dt = trip.depart_at ? new Date(trip.depart_at) : null;
  const statusColor = { scheduled: T.info, departed: T.warning, in_transit: T.warning, arrived: T.success }[trip.status] || T.textMuted;
  return (
    <div
      onClick={onClick}
      style={styles.tripCard}
      data-testid={`trip-card-${trip.trip_id}`}
    >
      <div style={styles.tripTop}>
        <StatusPill label={TRIP_STATUS_LABEL[trip.status] || trip.status} color={statusColor} />
        <span style={styles.cageBadge}>
          <Package size={12} strokeWidth={2.4} />
          {trip.available_cages}/{trip.total_cages} أقفاص
        </span>
      </div>

      <div style={styles.route}>
        <div style={styles.cityBox}>
          <div style={styles.cityLabel}>من</div>
          <div style={styles.cityName}>{trip.from_city}</div>
        </div>
        <div style={styles.routeArrow}>
          <ArrowLeftRight size={22} strokeWidth={1.8} color={T.primary} />
        </div>
        <div style={styles.cityBox}>
          <div style={styles.cityLabel}>إلى</div>
          <div style={styles.cityName}>{trip.to_city}</div>
        </div>
      </div>

      <div style={styles.tripMeta}>
        <span style={styles.metaItem}>
          <Calendar size={13} strokeWidth={2.2} />
          {dt ? dt.toLocaleDateString("ar-SA") : "-"}
        </span>
        <span style={styles.metaItem}>
          <Car size={13} strokeWidth={2.2} />
          {trip.vehicle_type}
        </span>
        {trip.has_ac && (
          <span style={{ ...styles.metaItem, color: T.info }}>
            <Snowflake size={13} strokeWidth={2.2} />
            مكيّف
          </span>
        )}
        {trip.price_hint_sar && (
          <span style={styles.metaItem}>
            <Wallet size={13} strokeWidth={2.2} />
            {trip.price_hint_sar} ر.س
          </span>
        )}
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
          <button onClick={onClose} style={S.iconBtn} data-testid="close-create-trip" aria-label="إغلاق">
            <X size={18} strokeWidth={2.2} />
          </button>
          <h2 style={modalStyles.title}>رحلة جديدة</h2>
          <div style={{ width: 40 }} />
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

          <label style={{ ...S.label, marginTop: 14 }}>موعد الانطلاق *</label>
          <input
            type="datetime-local"
            style={S.input}
            value={form.depart_at}
            onChange={(e) => set("depart_at", e.target.value)}
            data-testid="trip-depart-at"
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
            <div>
              <label style={S.label}>نوع المركبة</label>
              <input
                style={S.input}
                value={form.vehicle_type}
                onChange={(e) => set("vehicle_type", e.target.value)}
                placeholder="سيدان / GMC"
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

          <label style={{ ...S.label, marginTop: 14 }}>سعر إرشادي (ر.س)</label>
          <input
            type="number"
            style={S.input}
            value={form.price_hint_sar}
            onChange={(e) => set("price_hint_sar", e.target.value)}
            placeholder="اختياري"
            data-testid="trip-price"
          />

          <div style={styles.checkRow}>
            <CheckOption
              label="مكيّف"
              icon={<Snowflake size={16} strokeWidth={2.2} />}
              checked={form.has_ac}
              onChange={(v) => set("has_ac", v)}
              testId="trip-has-ac"
            />
            <CheckOption
              label="طيور حساسة"
              icon={<Truck size={16} strokeWidth={2.2} />}
              checked={form.accepts_sensitive}
              onChange={(v) => set("accepts_sensitive", v)}
              testId="trip-sensitive"
            />
          </div>

          <label style={{ ...S.label, marginTop: 14 }}>ملاحظات</label>
          <textarea
            style={{ ...S.input, minHeight: 80, resize: "vertical" }}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="تفاصيل إضافية…"
            data-testid="trip-notes"
          />

          {error && <div style={S.errorBox} data-testid="trip-error">{error}</div>}

          <button
            onClick={submit}
            disabled={saving}
            style={{ ...S.primaryBtn, width: "100%", marginTop: 18, opacity: saving ? 0.7 : 1 }}
            data-testid="submit-trip"
          >
            {saving ? "جاري النشر…" : "انشر الرحلة"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CheckOption({ label, icon, checked, onChange, testId }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      type="button"
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "row-reverse",
        alignItems: "center",
        gap: 8,
        padding: "10px 12px",
        borderRadius: T.radius,
        border: `1.5px solid ${checked ? T.primary : T.border}`,
        background: checked ? "#f0fdfa" : T.surface,
        color: checked ? T.primary : T.text,
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
      data-testid={testId}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

const styles = {
  hero: {
    background: T.surface,
    padding: "20px 20px 16px",
    borderBottom: `1px solid ${T.divider}`,
  },
  heroInner: { maxWidth: 900, margin: "0 auto" },
  headTop: {
    display: "flex",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 900,
    color: T.textStrong,
    textAlign: "right",
    letterSpacing: "-0.01em",
  },
  subtitle: {
    margin: "3px 0 0",
    fontSize: 12,
    color: T.textMuted,
    fontWeight: 600,
    textAlign: "right",
  },
  createBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: T.primary,
    color: T.textInverse,
    border: "none",
    borderRadius: T.radiusPill,
    padding: "9px 14px",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: T.shadowSm,
    whiteSpace: "nowrap",
  },

  filterBar: {
    background: T.surface,
    borderBottom: `1px solid ${T.border}`,
    padding: "12px 0",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  filterInner: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "0 16px",
    display: "flex",
    flexDirection: "row-reverse",
    gap: 8,
    alignItems: "center",
    overflowX: "auto",
    scrollbarWidth: "none",
  },
  clearBtn: {
    background: "transparent",
    border: "none",
    color: T.danger,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    padding: "6px 4px",
  },

  tripCard: {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radiusMd,
    padding: 16,
    cursor: "pointer",
    boxShadow: T.shadowXs,
  },
  tripTop: {
    display: "flex",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cageBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    background: T.bgAlt,
    color: T.text,
    padding: "4px 10px",
    borderRadius: T.radiusPill,
    fontSize: 11,
    fontWeight: 700,
  },
  route: {
    display: "flex",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
    padding: "8px 0",
  },
  cityBox: { flex: 1, textAlign: "center" },
  cityLabel: { fontSize: 10, color: T.textFaint, fontWeight: 700, letterSpacing: "0.05em" },
  cityName: { fontSize: 18, fontWeight: 900, color: T.textStrong, marginTop: 3, letterSpacing: "-0.01em" },
  routeArrow: { display: "flex", alignItems: "center", justifyContent: "center" },
  tripMeta: {
    display: "flex",
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTop: `1px solid ${T.divider}`,
    fontSize: 12,
    color: T.textMuted,
    fontWeight: 600,
  },
  metaItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },
  tripNotes: { color: T.textMuted, fontSize: 12, marginTop: 10, textAlign: "right", margin: "10px 0 0" },
  checkRow: {
    display: "flex",
    flexDirection: "row-reverse",
    gap: 8,
    marginTop: 14,
  },
};

const modalStyles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(3, 7, 18, 0.55)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: 16,
  },
  modal: {
    background: T.surface,
    borderRadius: T.radiusLg,
    maxWidth: 520,
    width: "100%",
    maxHeight: "90vh",
    overflow: "auto",
    fontFamily: "'Tajawal', 'IBM Plex Sans Arabic', system-ui, sans-serif",
    direction: "rtl",
  },
  header: {
    position: "sticky",
    top: 0,
    background: T.surface,
    padding: "14px 18px",
    borderBottom: `1px solid ${T.border}`,
    display: "flex",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    margin: 0,
    fontSize: 17,
    fontWeight: 800,
    color: T.text,
    flex: 1,
    textAlign: "center",
  },
  body: { padding: 18 },
};
