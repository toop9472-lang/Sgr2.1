// طير — Listing Details with Buy/Contact/Report
import React, { useEffect, useState } from "react";
import { T, S } from "./tairTheme";
import { tairApi } from "./tairApi";
import { TopBar } from "./CreateListingScreen";

const GENDER_LABEL = { male: "ذكر", female: "أنثى", pair: "زوج", unknown: "غير محدد" };
const HEALTH_LABEL = {
  excellent: "ممتازة",
  good: "جيدة",
  needs_care: "تحتاج رعاية",
  special_needs: "احتياجات خاصة",
};

export default function ListingDetailsScreen({ user, listingId, onBack, onCheckout }) {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    setLoading(true);
    tairApi
      .getListing(listingId, user.id || user.user_id)
      .then(setListing)
      .catch((e) => setError(e.response?.data?.detail || "فشل تحميل الإعلان"))
      .finally(() => setLoading(false));
  }, [listingId, user]);

  const toggleFav = async () => {
    if (!listing) return;
    try {
      const res = await tairApi.toggleFavorite(listing.listing_id, user.id || user.user_id);
      setListing({
        ...listing,
        favorite_count: (listing.favorite_count || 0) + (res.favorited ? 1 : -1),
      });
    } catch (e) {
      // silent
    }
  };

  if (loading) {
    return (
      <div style={S.screen}>
        <TopBar title="تفاصيل الإعلان" onBack={onBack} />
        <div style={S.loadingText}>جاري التحميل…</div>
      </div>
    );
  }
  if (!listing || error) {
    return (
      <div style={S.screen}>
        <TopBar title="تفاصيل الإعلان" onBack={onBack} />
        <div style={{ ...S.container, textAlign: "center", padding: 40 }}>
          {error || "الإعلان غير موجود"}
        </div>
      </div>
    );
  }

  const isOwn = listing.seller_id === (user.id || user.user_id);

  return (
    <div style={S.screen} data-testid="listing-details-screen">
      <TopBar title={listing.title} onBack={onBack} />

      <div style={S.container}>
        <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
          <div style={styles.gallery}>
            {listing.cover_image ? (
              <img
                src={listing.cover_image}
                alt={listing.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={styles.imgPlaceholder}>🐦</div>
            )}
          </div>
          {listing.images && listing.images.length > 1 && (
            <div style={styles.thumbs}>
              {listing.images.slice(0, 6).map((url, i) => (
                <img key={i} src={url} alt={`thumb-${i}`} style={styles.thumb} />
              ))}
            </div>
          )}

          <div style={{ padding: 16 }}>
            <div style={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" }}>
              <div style={styles.price}>{listing.price_sar} ر.س</div>
              {listing.price_negotiable && <span style={styles.negBadge}>قابل للتفاوض</span>}
            </div>
            <h2 style={{ margin: "10px 0 6px", fontSize: 20, fontWeight: 900, textAlign: "right" }}>
              {listing.title}
            </h2>
            <div style={styles.location}>
              📍 {listing.city}
              {listing.district ? ` · ${listing.district}` : ""}
            </div>
          </div>
        </div>

        <div style={S.card}>
          <h3 style={S.h3}>المواصفات</h3>
          <div style={styles.specGrid}>
            {listing.gender && <Spec icon="⚥" label="الجنس" value={GENDER_LABEL[listing.gender]} />}
            {listing.age_months && <Spec icon="📅" label="العمر" value={`${listing.age_months} شهر`} />}
            {listing.breed && <Spec icon="🏷" label="السلالة" value={listing.breed} />}
            {listing.color && <Spec icon="🎨" label="اللون" value={listing.color} />}
          </div>

          <h3 style={S.h3}>الوصف</h3>
          <p style={styles.desc}>{listing.description}</p>

          {listing.health && (
            <>
              <h3 style={S.h3}>الحالة الصحية</h3>
              <div style={styles.healthBox}>
                <Spec icon="💗" label="الحالة" value={HEALTH_LABEL[listing.health.status] || "-"} />
                <Spec icon="💉" label="محصّن" value={listing.health.vaccinated ? "نعم" : "لا"} />
                {listing.health.ring_number && (
                  <Spec icon="🔖" label="رقم الخاتم" value={listing.health.ring_number} />
                )}
              </div>
              {listing.health.notes && (
                <p style={{ ...styles.desc, marginTop: 8 }}>{listing.health.notes}</p>
              )}
            </>
          )}
        </div>

        <div style={styles.actions}>
          <button
            onClick={toggleFav}
            style={styles.favBtn}
            data-testid="fav-btn"
          >
            ❤ {listing.favorite_count || 0}
          </button>
          {!isOwn && (
            <button
              onClick={() => onCheckout(listing)}
              style={{ ...S.primaryBtn, flex: 1 }}
              data-testid="checkout-btn"
            >
              اطلب الآن
            </button>
          )}
          {isOwn && (
            <div style={{ ...S.primaryBtn, flex: 1, textAlign: "center", opacity: 0.6 }}>
              إعلانك
            </div>
          )}
        </div>

        <button
          onClick={() => setShowReport(true)}
          style={styles.reportBtn}
          data-testid="report-btn"
        >
          🚩 الإبلاغ عن هذا الإعلان
        </button>
      </div>

      {showReport && (
        <ReportModal
          user={user}
          listingId={listing.listing_id}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}

function Spec({ icon, label, value }) {
  return (
    <div style={styles.spec}>
      <span style={styles.specLeft}>
        <span>{icon}</span>
        <span style={styles.specLabel}>{label}</span>
      </span>
      <span style={styles.specValue}>{value}</span>
    </div>
  );
}

function ReportModal({ user, listingId, onClose }) {
  const [reason, setReason] = useState("prohibited_species");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setSending(true);
    try {
      await tairApi.reportListing(listingId, reason, note || null, user.id || user.user_id);
      setDone(true);
      setTimeout(onClose, 1500);
    } catch {
      setSending(false);
    }
  };

  return (
    <div style={reportStyles.overlay} onClick={onClose}>
      <div style={reportStyles.modal} onClick={(e) => e.stopPropagation()} data-testid="report-modal">
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>الإبلاغ عن الإعلان</h3>
        {done ? (
          <div style={{ padding: 20, textAlign: "center", color: T.success, fontWeight: 700 }}>
            ✅ تم استلام بلاغك، شكراً!
          </div>
        ) : (
          <>
            <label style={{ ...S.label, marginTop: 12 }}>سبب البلاغ</label>
            <select
              style={S.input}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              data-testid="report-reason"
            >
              <option value="prohibited_species">نوع محظور (سايتس)</option>
              <option value="scam">احتيال</option>
              <option value="animal_abuse">إساءة للحيوان</option>
              <option value="wrong_info">معلومات خاطئة</option>
              <option value="other">أخرى</option>
            </select>
            <label style={{ ...S.label, marginTop: 10 }}>ملاحظات</label>
            <textarea
              style={{ ...S.input, minHeight: 70 }}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="اختياري…"
              data-testid="report-note"
            />
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button onClick={onClose} style={{ ...S.secondaryBtn, flex: 1 }}>إلغاء</button>
              <button
                onClick={submit}
                disabled={sending}
                style={{ ...S.primaryBtn, flex: 1, background: T.danger, opacity: sending ? 0.7 : 1 }}
                data-testid="submit-report"
              >
                {sending ? "جارٍ الإرسال…" : "إرسال البلاغ"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  gallery: { aspectRatio: "16/12", background: T.divider, overflow: "hidden" },
  imgPlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 84,
    color: T.textFaint,
  },
  thumbs: {
    display: "flex",
    flexDirection: "row-reverse",
    gap: 6,
    padding: 8,
    overflowX: "auto",
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    objectFit: "cover",
    border: `1px solid ${T.border}`,
  },
  price: { fontSize: 26, fontWeight: 900, color: T.primary },
  negBadge: {
    background: "#ecfeff",
    color: "#0891b2",
    fontSize: 11,
    fontWeight: 800,
    padding: "3px 10px",
    borderRadius: 8,
  },
  location: { color: T.primary, fontSize: 13, fontWeight: 700, textAlign: "right" },
  specGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 6,
    marginBottom: 8,
  },
  spec: {
    display: "flex",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 10px",
    background: "#f8fafc",
    borderRadius: 10,
  },
  specLeft: { display: "flex", flexDirection: "row-reverse", gap: 6, alignItems: "center" },
  specLabel: { fontSize: 11, color: T.textMuted, fontWeight: 700 },
  specValue: { fontSize: 12, color: T.text, fontWeight: 800 },
  desc: { color: T.textMuted, fontSize: 14, lineHeight: 1.7, textAlign: "right", margin: 0 },
  healthBox: {
    background: "#ecfdf5",
    borderRadius: 12,
    padding: 8,
    display: "grid",
    gap: 4,
  },
  actions: {
    display: "flex",
    flexDirection: "row-reverse",
    gap: 10,
    marginBottom: 10,
  },
  favBtn: {
    background: "#fff",
    border: `1.5px solid ${T.danger}`,
    color: T.danger,
    padding: "12px 18px",
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  reportBtn: {
    display: "block",
    width: "100%",
    background: "transparent",
    border: `1px solid ${T.border}`,
    color: T.textMuted,
    padding: "10px",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
};

const reportStyles = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16,
  },
  modal: {
    background: "#fff", borderRadius: 18, padding: 20, maxWidth: 460, width: "100%",
    direction: "rtl", fontFamily: "'Tajawal', 'IBM Plex Sans Arabic', system-ui, sans-serif",
  },
};
