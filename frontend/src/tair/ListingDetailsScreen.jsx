// طير — Listing Details (professional)
import React, { useEffect, useState } from "react";
import {
  MapPin, Heart, Flag, User, Calendar, Palette, Tag, Fingerprint,
  Syringe, HeartPulse, ShoppingCart, Bird, X,
} from "lucide-react";
import { T, S } from "./tairTheme";
import { tairApi } from "./tairApi";
import { TopBar, StatusPill } from "./TairUI";

const GENDER_LABEL = { male: "ذكر", female: "أنثى", pair: "زوج", unknown: "غير محدد" };
const HEALTH_LABEL = {
  excellent: "ممتازة",
  good: "جيدة",
  needs_care: "تحتاج رعاية",
  special_needs: "احتياجات خاصة",
};
const HEALTH_COLOR = {
  excellent: T.success,
  good: T.info,
  needs_care: T.warning,
  special_needs: T.danger,
};

export default function ListingDetailsScreen({ user, listingId, onBack, onCheckout }) {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    setLoading(true);
    tairApi
      .getListing(listingId, user.id || user.user_id)
      .then((l) => { setListing(l); setImgIdx(0); })
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
        <div style={{ padding: 40, textAlign: "center", color: T.danger }}>
          {error || "الإعلان غير موجود"}
        </div>
      </div>
    );
  }

  const isOwn = listing.seller_id === (user.id || user.user_id);
  const gallery = listing.images?.length ? listing.images : (listing.cover_image ? [listing.cover_image] : []);
  const activeImg = gallery[imgIdx];

  return (
    <div style={S.screen} data-testid="listing-details-screen">
      <TopBar title={listing.title} onBack={onBack} />

      <div style={S.container}>
        <div style={styles.gallery}>
          {activeImg ? (
            <img src={activeImg} alt={listing.title} style={styles.mainImg} />
          ) : (
            <div style={styles.placeholder}>
              <Bird size={72} strokeWidth={1.2} color={T.textFaint} />
            </div>
          )}
          {listing.price_negotiable && (
            <div style={styles.negBadge}>قابل للتفاوض</div>
          )}
        </div>

        {gallery.length > 1 && (
          <div style={styles.thumbRow}>
            {gallery.slice(0, 6).map((url, i) => (
              <button
                key={i}
                onClick={() => setImgIdx(i)}
                style={{
                  ...styles.thumb,
                  borderColor: i === imgIdx ? T.primary : T.border,
                }}
                data-testid={`thumb-${i}`}
              >
                <img src={url} alt={`thumb-${i}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </button>
            ))}
          </div>
        )}

        <div style={S.card}>
          <div style={styles.priceRow}>
            <div>
              <div style={styles.price}>{listing.price_sar} <span style={styles.currency}>ر.س</span></div>
              <div style={styles.location}>
                <MapPin size={13} strokeWidth={2.2} color={T.textMuted} />
                <span>{listing.city}{listing.district ? ` · ${listing.district}` : ""}</span>
              </div>
            </div>
            <button
              onClick={toggleFav}
              style={styles.favBtn}
              data-testid="fav-btn"
              aria-label="المفضلة"
            >
              <Heart size={20} strokeWidth={2.2} color={T.danger} />
              <span>{listing.favorite_count || 0}</span>
            </button>
          </div>
          <h1 style={styles.title}>{listing.title}</h1>
        </div>

        <div style={S.card}>
          <h2 style={S.h2}>المواصفات</h2>
          <div style={styles.specGrid}>
            {listing.gender && (
              <Spec Icon={User} label="الجنس" value={GENDER_LABEL[listing.gender]} />
            )}
            {listing.age_months && (
              <Spec Icon={Calendar} label="العمر" value={`${listing.age_months} شهر`} />
            )}
            {listing.breed && <Spec Icon={Tag} label="السلالة" value={listing.breed} />}
            {listing.color && <Spec Icon={Palette} label="اللون" value={listing.color} />}
          </div>
        </div>

        <div style={S.card}>
          <h2 style={S.h2}>الوصف</h2>
          <p style={styles.desc}>{listing.description}</p>
        </div>

        {listing.health && (
          <div style={S.card}>
            <h2 style={S.h2}>الحالة الصحية</h2>
            <div style={styles.healthGrid}>
              <Spec
                Icon={HeartPulse}
                label="الحالة"
                value={
                  <StatusPill
                    label={HEALTH_LABEL[listing.health.status] || "-"}
                    color={HEALTH_COLOR[listing.health.status] || T.textMuted}
                  />
                }
              />
              <Spec
                Icon={Syringe}
                label="محصّن"
                value={listing.health.vaccinated ? "نعم" : "لا"}
              />
              {listing.health.ring_number && (
                <Spec Icon={Fingerprint} label="رقم الخاتم" value={listing.health.ring_number} />
              )}
            </div>
            {listing.health.notes && (
              <p style={{ ...styles.desc, marginTop: 10 }}>{listing.health.notes}</p>
            )}
          </div>
        )}

        {!isOwn && (
          <button
            onClick={() => onCheckout(listing)}
            style={{ ...S.primaryBtn, width: "100%", padding: "15px 22px", marginTop: 8 }}
            data-testid="checkout-btn"
          >
            <ShoppingCart size={18} strokeWidth={2.4} />
            <span>اطلب الآن</span>
          </button>
        )}
        {isOwn && (
          <div style={styles.ownBadge}>هذا إعلانك</div>
        )}

        <button
          onClick={() => setShowReport(true)}
          style={styles.reportBtn}
          data-testid="report-btn"
        >
          <Flag size={14} strokeWidth={2.2} />
          <span>الإبلاغ عن هذا الإعلان</span>
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

function Spec({ Icon, label, value }) {
  return (
    <div style={styles.spec}>
      <div style={styles.specIcon}>
        <Icon size={16} strokeWidth={2} color={T.textMuted} />
      </div>
      <div style={{ flex: 1, textAlign: "right" }}>
        <div style={styles.specLabel}>{label}</div>
        <div style={styles.specValue}>{value}</div>
      </div>
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
    } catch (e) {
      setSending(false);
    }
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()} data-testid="report-modal">
        <div style={modalStyles.header}>
          <button onClick={onClose} style={S.iconBtn} aria-label="إغلاق">
            <X size={18} strokeWidth={2.2} />
          </button>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, flex: 1, textAlign: "center" }}>
            الإبلاغ عن الإعلان
          </h3>
          <div style={{ width: 40 }} />
        </div>
        <div style={{ padding: 18 }}>
          {done ? (
            <div style={{ padding: 20, textAlign: "center", color: T.success, fontWeight: 700 }}>
              تم استلام بلاغك، شكراً لك.
            </div>
          ) : (
            <>
              <label style={S.label}>سبب البلاغ</label>
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
              <label style={{ ...S.label, marginTop: 12 }}>ملاحظات</label>
              <textarea
                style={{ ...S.input, minHeight: 70 }}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="اختياري…"
                data-testid="report-note"
              />
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
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
    </div>
  );
}

const styles = {
  gallery: {
    position: "relative",
    aspectRatio: "16/11",
    background: T.bgAlt,
    borderRadius: T.radiusMd,
    overflow: "hidden",
    marginBottom: 10,
    border: `1px solid ${T.border}`,
  },
  mainImg: { width: "100%", height: "100%", objectFit: "cover" },
  placeholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  negBadge: {
    position: "absolute",
    top: 12,
    insetInlineStart: 12,
    background: "rgba(15, 23, 42, 0.8)",
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    padding: "5px 12px",
    borderRadius: T.radiusPill,
    backdropFilter: "blur(4px)",
  },
  thumbRow: {
    display: "flex",
    flexDirection: "row-reverse",
    gap: 8,
    marginBottom: 14,
    overflowX: "auto",
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: T.radiusSm,
    overflow: "hidden",
    borderWidth: 2,
    borderStyle: "solid",
    padding: 0,
    background: T.bgAlt,
    cursor: "pointer",
    flexShrink: 0,
  },
  priceRow: {
    display: "flex",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  price: {
    fontSize: 28,
    fontWeight: 900,
    color: T.primary,
    letterSpacing: "-0.02em",
    textAlign: "right",
  },
  currency: { fontSize: 14, fontWeight: 700, color: T.textMuted },
  location: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    color: T.textMuted,
    fontSize: 13,
    fontWeight: 600,
    marginTop: 4,
  },
  favBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: T.surface,
    border: `1.5px solid ${T.border}`,
    color: T.text,
    borderRadius: T.radiusPill,
    padding: "9px 14px",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  title: {
    margin: "12px 0 0",
    fontSize: 19,
    fontWeight: 800,
    color: T.textStrong,
    textAlign: "right",
    letterSpacing: "-0.01em",
  },
  specGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
  },
  healthGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
  },
  spec: {
    display: "flex",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    padding: 10,
    background: T.bgAlt,
    borderRadius: T.radius,
  },
  specIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: T.surface,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  specLabel: { fontSize: 11, color: T.textMuted, fontWeight: 700 },
  specValue: { fontSize: 13, color: T.text, fontWeight: 700, marginTop: 2 },
  desc: {
    color: T.text,
    fontSize: 14,
    lineHeight: 1.75,
    textAlign: "right",
    margin: 0,
  },
  ownBadge: {
    background: T.bgAlt,
    color: T.textMuted,
    borderRadius: T.radius,
    padding: "14px 22px",
    fontSize: 14,
    fontWeight: 700,
    textAlign: "center",
    marginTop: 8,
  },
  reportBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    width: "100%",
    background: "transparent",
    border: `1px solid ${T.border}`,
    color: T.textMuted,
    padding: "11px",
    borderRadius: T.radius,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    marginTop: 12,
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
    maxWidth: 480,
    width: "100%",
    fontFamily: "'Tajawal', 'IBM Plex Sans Arabic', system-ui, sans-serif",
    direction: "rtl",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 18px",
    borderBottom: `1px solid ${T.divider}`,
  },
};
