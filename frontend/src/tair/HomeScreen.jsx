// طير — Home / Listings Feed (Haraj-style rows, mint gradient background)
import React, { useEffect, useMemo, useState } from "react";
import {
  MapPin, Bird, Plus, Eye, Heart, Clock, User,
  Music2, Feather, Wind, Egg, Music, Cat, Rabbit, Shell, Fish,
} from "lucide-react";
import { T, S } from "./tairTheme";
import { tairApi, SAUDI_CITIES } from "./tairApi";
import { BottomSheet, SelectorItem, FilterChipButton, SearchField, EmptyState } from "./TairUI";

const FAMILY_ICONS = {
  canaries: Music2, finches: Feather, parrots: Bird, falcons: Wind,
  pigeons: Egg, songbirds: Music, cats_dogs: Cat, small_mammals: Rabbit,
  reptiles: Shell, fish: Fish,
};

function timeAgo(iso) {
  if (!iso) return "الآن";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then) / 1000;
  if (diff < 60) return "الآن";
  if (diff < 3600) return `قبل ${Math.floor(diff / 60)} د`;
  if (diff < 86400) return `قبل ${Math.floor(diff / 3600)} س`;
  return `قبل ${Math.floor(diff / 86400)} يوم`;
}

export default function HomeScreen({ user, onOpenListing, onCreateListing }) {
  const [families, setFamilies] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [city, setCity] = useState(null);
  const [familyId, setFamilyId] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(null);

  useEffect(() => {
    tairApi.listFamilies().then(setFamilies).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { limit: 40 };
    if (city) params.city = city;
    if (familyId) params.family = familyId;
    if (q.trim()) params.q = q.trim();
    tairApi
      .feedListings(params)
      .then((d) => setListings(d.items || []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [city, familyId, q]);

  const currentFamily = useMemo(
    () => families.find((f) => f.family_id === familyId),
    [families, familyId],
  );

  return (
    <div style={styles.screen} data-testid="home-screen">
      {/* Fixed gradient background wash */}
      <div style={styles.bgWash} aria-hidden="true" />

      {/* Logo Hero — logo fills a rounded square */}
      <header style={styles.hero}>
        <div style={styles.logoBox}>
          <img src="/tair_logo.png" alt="طير" style={styles.logoImg} />
        </div>
      </header>

      {/* Search + Filters (white pills over gradient) */}
      <div style={styles.controls}>
        <SearchField
          value={q}
          onChange={setQ}
          placeholder="ابحث عن كناري، ببغاء، صقر…"
          testId="home-search-input"
        />
        <div style={styles.filterRow}>
          <FilterChipButton
            icon={<MapPin size={15} strokeWidth={2.2} />}
            label="المدينة"
            value={city}
            onClick={() => setSheetOpen("city")}
            testId="filter-city-btn"
          />
          <FilterChipButton
            icon={<Bird size={15} strokeWidth={2.2} />}
            label="النوع"
            value={currentFamily?.name_ar}
            onClick={() => setSheetOpen("family")}
            testId="filter-family-btn"
          />
          {(city || familyId) && (
            <button
              onClick={() => { setCity(null); setFamilyId(null); }}
              style={styles.clearBtn}
              data-testid="clear-filters"
            >
              مسح
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={styles.contentWrap}>
        <div style={styles.resultBar}>
          <span style={styles.count}>
            {loading ? "جاري التحميل…" : `${listings.length} إعلان`}
          </span>
          <button
            onClick={onCreateListing}
            style={styles.newListingBtn}
            data-testid="create-listing-btn"
          >
            <Plus size={15} strokeWidth={2.6} />
            <span>إعلان جديد</span>
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: T.textMuted }}>جاري التحميل…</div>
        ) : listings.length === 0 ? (
          <EmptyState
            icon={<Bird size={36} strokeWidth={1.5} />}
            title="لا توجد إعلانات مطابقة"
            desc="جرّب تغيير المرشحات أو انشر أول إعلان في هذه الفئة"
            action={
              <button onClick={onCreateListing} style={S.primaryBtn} data-testid="empty-state-action">
                <Plus size={16} strokeWidth={2.6} />
                <span>انشر إعلان</span>
              </button>
            }
          />
        ) : (
          <div style={styles.list}>
            {listings.map((l) => (
              <ListingRow key={l.listing_id} item={l} onClick={() => onOpenListing(l.listing_id)} />
            ))}
          </div>
        )}
      </div>

      {/* City Sheet */}
      <BottomSheet
        open={sheetOpen === "city"}
        onClose={() => setSheetOpen(null)}
        title="اختر المدينة"
      >
        <SelectorItem
          icon={<MapPin size={16} strokeWidth={2.2} />}
          label="جميع المدن"
          active={!city}
          onClick={() => { setCity(null); setSheetOpen(null); }}
          testId="city-item-all"
        />
        {SAUDI_CITIES.map((c) => (
          <SelectorItem
            key={c}
            icon={<MapPin size={16} strokeWidth={2.2} />}
            label={c}
            active={city === c}
            onClick={() => { setCity(c); setSheetOpen(null); }}
            testId={`city-item-${c}`}
          />
        ))}
      </BottomSheet>

      {/* Family Sheet */}
      <BottomSheet
        open={sheetOpen === "family"}
        onClose={() => setSheetOpen(null)}
        title="اختر عائلة الطائر / الحيوان"
      >
        <SelectorItem
          icon={<Bird size={16} strokeWidth={2.2} />}
          label="كل العائلات"
          active={!familyId}
          onClick={() => { setFamilyId(null); setSheetOpen(null); }}
          testId="family-item-all"
        />
        {families.map((f) => {
          const Icon = FAMILY_ICONS[f.family_id] || Bird;
          return (
            <SelectorItem
              key={f.family_id}
              icon={<Icon size={16} strokeWidth={2.2} />}
              label={f.name_ar}
              active={familyId === f.family_id}
              onClick={() => { setFamilyId(f.family_id); setSheetOpen(null); }}
              testId={`family-item-${f.family_id}`}
            />
          );
        })}
      </BottomSheet>
    </div>
  );
}

function ListingRow({ item, onClick }) {
  const sellerInitial = (item.seller_id || "?").replace(/^user_?/, "").charAt(0).toUpperCase() || "؟";
  return (
    <div
      onClick={onClick}
      style={styles.rowCard}
      data-testid={`listing-card-${item.listing_id}`}
    >
      <div style={styles.rowImg}>
        {item.cover_image ? (
          <img
            src={item.cover_image}
            alt={item.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <Bird size={38} strokeWidth={1.2} color={T.textFaint} />
        )}
      </div>

      <div style={styles.rowBody}>
        <div style={styles.rowTitle}>{item.title}</div>

        <div style={styles.rowPrice}>
          <span style={styles.priceValue}>{item.price_sar?.toLocaleString?.("ar-SA") || item.price_sar}</span>
          <SarSymbol />
        </div>

        <div style={styles.rowMetaRow}>
          <span style={styles.metaChip}>
            <Clock size={12} strokeWidth={2.2} color={T.textMuted} />
            <span>{timeAgo(item.posted_at)}</span>
          </span>
          <span style={styles.metaChip}>
            <MapPin size={12} strokeWidth={2.2} color={T.textMuted} />
            <span>{item.city}</span>
          </span>
        </div>

        <div style={styles.rowSellerRow}>
          <span style={styles.sellerName}>
            {item.district || `مُعلن #${(item.seller_id || "").slice(-4)}`}
          </span>
          <div style={styles.avatar}>{sellerInitial}</div>
        </div>
      </div>
    </div>
  );
}

function SarSymbol() {
  return (
    <span
      aria-label="ر.س"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 18,
        height: 18,
        borderRadius: 4,
        background: T.text,
        color: "#fff",
        fontSize: 10,
        fontWeight: 800,
        lineHeight: 1,
      }}
    >
      ﷼
    </span>
  );
}

const styles = {
  screen: {
    minHeight: "100vh",
    direction: "rtl",
    fontFamily: "'Tajawal', 'IBM Plex Sans Arabic', system-ui, sans-serif",
    color: T.text,
    paddingBottom: 88,
    position: "relative",
    background: "transparent",
  },
  bgWash: {
    position: "fixed",
    inset: 0,
    background: "linear-gradient(180deg, #c8fce6 0%, #a7f3d0 25%, #7dd3fc 55%, #f0f9ff 100%)",
    zIndex: -1,
  },
  hero: {
    padding: "20px 20px 6px",
    maxWidth: 900,
    margin: "0 auto",
    display: "flex",
    justifyContent: "center",
  },
  logoBox: {
    width: 200,
    height: 200,
    borderRadius: 28,
    background: "rgba(255,255,255,0.35)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    boxShadow: "0 12px 40px rgba(6, 95, 70, 0.20)",
    border: "3px solid rgba(255,255,255,0.55)",
  },
  logoImg: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  controls: {
    padding: "12px 16px 8px",
    maxWidth: 900,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  filterRow: {
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
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
    padding: "9px 8px",
    whiteSpace: "nowrap",
  },
  contentWrap: {
    maxWidth: 900,
    margin: "12px auto 0",
    padding: "0 8px 16px",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    background: T.surface,
    boxShadow: "0 -8px 24px rgba(15, 23, 42, 0.08)",
    minHeight: "60vh",
  },
  resultBar: {
    display: "flex",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 12px 10px",
  },
  count: { color: T.textMuted, fontSize: 13, fontWeight: 700 },
  newListingBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: T.primary,
    color: T.textInverse,
    border: "none",
    borderRadius: T.radiusPill,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: T.shadowSm,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: "0 6px",
  },

  // ---- Row Card ----
  rowCard: {
    display: "flex",
    flexDirection: "row-reverse",
    gap: 14,
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radiusMd,
    padding: 12,
    cursor: "pointer",
    boxShadow: T.shadowXs,
    transition: "transform 0.12s, box-shadow 0.15s, border-color 0.15s",
  },
  rowImg: {
    width: 118,
    height: 118,
    minWidth: 118,
    borderRadius: T.radiusSm,
    overflow: "hidden",
    background: T.bgAlt,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    textAlign: "right",
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: T.primary,
    lineHeight: 1.45,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    letterSpacing: "-0.005em",
  },
  rowPrice: {
    display: "flex",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  priceValue: {
    fontSize: 17,
    fontWeight: 900,
    color: T.text,
    letterSpacing: "-0.01em",
  },
  rowMetaRow: {
    display: "flex",
    flexDirection: "row-reverse",
    gap: 12,
    flexWrap: "wrap",
    color: T.textMuted,
    fontSize: 12,
    fontWeight: 600,
  },
  metaChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
  },
  rowSellerRow: {
    display: "flex",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    marginTop: "auto",
    paddingTop: 6,
    borderTop: `1px solid ${T.divider}`,
    color: T.textMuted,
    fontSize: 12,
    fontWeight: 700,
  },
  sellerName: {
    flex: 1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    textAlign: "right",
    color: T.textMuted,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    background: T.bgAlt,
    color: T.textMuted,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 800,
    flexShrink: 0,
  },
};
