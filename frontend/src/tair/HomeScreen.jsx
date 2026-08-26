// طير — Home / Marketplace (polished, modern design)
import React, { useEffect, useMemo, useState } from "react";
import {
  MapPin, Bird, Plus, Heart, Clock, MessageCircle, Bell,
  Music2, Feather, Fish, Rabbit, Shell, Bug, Cat, Dog,
  Wheat, Package, ShoppingBag, Trees, Wrench, Milk, Drumstick,
} from "lucide-react";
import { T, S } from "./tairTheme";
import { tairApi, ALL_LOCATIONS } from "./tairApi";
import { BottomSheet, SelectorItem, SearchField, EmptyState } from "./TairUI";
const FAMILY_ICONS = {
  livestock: Milk, songbirds: Music2, poultry: Drumstick, pigeons: Feather,
  parrots: Bird, fish: Fish, small_mammals: Rabbit, pets: Heart,
  reptiles: Shell, insects: Bug, cats: Cat, dogs: Dog, feed: Wheat,
  bird_supplies: Package, animal_supplies: ShoppingBag, reserves: Trees, services: Wrench,
};

function timeAgo(iso) {
  if (!iso) return "الآن";
  const diff = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "الآن";
  if (diff < 3600) return `قبل ${Math.floor(diff / 60)} د`;
  if (diff < 86400) return `قبل ${Math.floor(diff / 3600)} س`;
  if (diff < 86400 * 30) return `قبل ${Math.floor(diff / 86400)} يوم`;
  return new Date(iso).toLocaleDateString("ar-SA");
}

export default function HomeScreen({ user, onOpenListing, onCreateListing, onOpenMessages, onOpenNotifications, unreadMessages = 0, unreadNotifs = 0 }) {
  const [families, setFamilies] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [city, setCity] = useState(null);
  const [familyId, setFamilyId] = useState(null);
  const [citySheet, setCitySheet] = useState(false);

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

  return (
    <div style={S.screen} data-testid="home-screen">
      {/* Top Bar: Logo + city + notifications + messages */}
      <header style={styles.topBar}>
        <div style={styles.topBarInner}>
          <img src="/tair_logo.png" alt="طير" style={styles.logoSm} />

          <button
            onClick={() => setCitySheet(true)}
            style={styles.cityBtn}
            data-testid="home-city-btn"
          >
            <MapPin size={15} strokeWidth={2.2} color={T.primary} />
            <div style={{ textAlign: "right", flex: 1, minWidth: 0 }}>
              <div style={styles.cityLabel}>الموقع</div>
              <div style={styles.cityValue}>{city || "جميع المدن"}</div>
            </div>
          </button>

          <button
            onClick={onOpenMessages}
            style={styles.iconRoundBtn}
            data-testid="home-messages-btn"
            aria-label="الرسائل"
          >
            <MessageCircle size={20} strokeWidth={2} color={T.text} />
            {unreadMessages > 0 && (
              <span style={styles.iconBadge}>{unreadMessages > 9 ? "9+" : unreadMessages}</span>
            )}
          </button>

          <button
            onClick={onOpenNotifications}
            style={styles.iconRoundBtn}
            data-testid="home-notifications-btn"
            aria-label="الإشعارات"
          >
            <Bell size={20} strokeWidth={2} color={T.text} />
            {unreadNotifs > 0 && (
              <span style={styles.iconBadge}>{unreadNotifs > 9 ? "9+" : unreadNotifs}</span>
            )}
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: "10px 16px 12px" }}>
          <SearchField
            value={q}
            onChange={setQ}
            placeholder="ابحث عن كناري، ببغاء، صقر، أعلاف…"
            testId="home-search-input"
          />
        </div>
      </header>

      {/* Categories horizontal scroll */}
      <div style={styles.categoriesBar}>
        <div style={styles.categoriesScroll}>
          <CategoryButton
            Icon={Bird}
            label="الكل"
            active={!familyId}
            onClick={() => setFamilyId(null)}
            testId="cat-all"
          />
          {families.map((f) => {
            const Icon = FAMILY_ICONS[f.family_id] || Bird;
            return (
              <CategoryButton
                key={f.family_id}
                Icon={Icon}
                label={f.name_ar}
                active={familyId === f.family_id}
                onClick={() => setFamilyId(f.family_id)}
                testId={`cat-${f.family_id}`}
              />
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={S.container}>
        <div style={styles.resultBar}>
          <span style={styles.count}>
            {loading ? "جاري التحميل…" : `${listings.length} إعلان`}
          </span>
          <button
            onClick={onCreateListing}
            style={styles.newListingBtn}
            data-testid="create-listing-btn"
          >
            <Plus size={16} strokeWidth={2.6} />
            <span>إعلان جديد</span>
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: T.textMuted }}>جاري التحميل…</div>
        ) : listings.length === 0 ? (
          <EmptyState
            icon={<Bird size={36} strokeWidth={1.5} />}
            title="لا توجد إعلانات مطابقة"
            desc="جرّب تغيير الفئة أو المدينة، أو انشر أول إعلان"
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
              <ListingRow
                key={l.listing_id}
                item={l}
                onClick={() => onOpenListing(l.listing_id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* City sheet */}
      <BottomSheet
        open={citySheet}
        onClose={() => setCitySheet(false)}
        title="اختر المدينة أو الدولة"
      >
        <SelectorItem
          icon={<MapPin size={16} strokeWidth={2.2} />}
          label="جميع المدن والدول"
          active={!city}
          onClick={() => { setCity(null); setCitySheet(false); }}
          testId="city-item-all"
        />
        {ALL_LOCATIONS.map((c) => (
          <SelectorItem
            key={c}
            icon={<MapPin size={16} strokeWidth={2.2} />}
            label={c}
            active={city === c}
            onClick={() => { setCity(c); setCitySheet(false); }}
            testId={`city-item-${c}`}
          />
        ))}
      </BottomSheet>
    </div>
  );
}

function CategoryButton({ Icon, label, active, onClick, testId }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...catStyles.btn,
        background: active ? T.primary : T.surface,
        borderColor: active ? T.primary : T.border,
      }}
      data-testid={testId}
    >
      <div style={{
        ...catStyles.iconWrap,
        background: active ? "rgba(255,255,255,0.18)" : T.bgAlt,
      }}>
        <Icon
          size={20}
          strokeWidth={active ? 2.4 : 1.9}
          color={active ? "#fff" : T.primary}
        />
      </div>
      <span style={{
        ...catStyles.label,
        color: active ? "#fff" : T.text,
        fontWeight: active ? 800 : 700,
      }}>
        {label}
      </span>
    </button>
  );
}

const catStyles = {
  btn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    minWidth: 72,
    padding: "8px 10px 10px",
    borderRadius: T.radiusMd,
    borderWidth: 1.5,
    borderStyle: "solid",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.15s",
    flexShrink: 0,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s",
  },
  label: {
    fontSize: 11,
    letterSpacing: "-0.005em",
    whiteSpace: "nowrap",
  },
};

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
          <img src={item.cover_image} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Bird size={40} strokeWidth={1.2} color={T.textFaint} />
        )}
        {item.price_negotiable && <div style={styles.negBadge}>تفاوض</div>}
      </div>

      <div style={styles.rowBody}>
        <div style={styles.rowTitle}>{item.title}</div>

        <div style={styles.rowPrice}>
          <span style={styles.priceValue}>{item.price_sar}</span>
          <span style={styles.priceCurr}>ر.س</span>
        </div>

        <div style={styles.rowMetaRow}>
          <span style={styles.metaChip}>
            <Clock size={11} strokeWidth={2.2} color={T.textMuted} />
            <span>{timeAgo(item.posted_at)}</span>
          </span>
          <span style={styles.metaChip}>
            <MapPin size={11} strokeWidth={2.2} color={T.textMuted} />
            <span>{item.city}</span>
          </span>
        </div>

        <div style={styles.rowFooter}>
          <div style={styles.sellerRow}>
            <div style={styles.avatar}>{sellerInitial}</div>
            <span style={styles.sellerName}>
              {item.seller_name || `مُعلن #${(item.seller_id || "").slice(-4)}`}
            </span>
          </div>
          <div style={styles.rowStats}>
            <span style={styles.statItem}>
              <Heart size={11} strokeWidth={2.2} />
              {item.favorite_count || 0}
            </span>
            <span style={styles.statItem}>
              <MessageCircle size={11} strokeWidth={2.2} />
              {item.comments_count || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  topBar: {
    background: T.surface,
    position: "sticky",
    top: 0,
    zIndex: 20,
    borderBottom: `1px solid ${T.border}`,
  },
  topBarInner: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "12px 16px 0",
    display: "flex",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  logoSm: {
    width: 40,
    height: 40,
    borderRadius: 10,
    flexShrink: 0,
  },
  cityBtn: {
    flex: 1,
    display: "flex",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    background: T.bgAlt,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius,
    cursor: "pointer",
    fontFamily: "inherit",
    minWidth: 0,
  },
  cityLabel: { fontSize: 10, color: T.textFaint, fontWeight: 700, textAlign: "right" },
  cityValue: {
    fontSize: 13, fontWeight: 800, color: T.text, textAlign: "right",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  iconRoundBtn: {
    position: "relative",
    width: 40, height: 40, borderRadius: 20,
    background: T.bgAlt, border: "none",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", flexShrink: 0,
  },
  iconBadge: {
    position: "absolute", top: -2, insetInlineStart: 0,
    background: T.danger, color: "#fff",
    fontSize: 9, fontWeight: 800,
    minWidth: 16, height: 16, borderRadius: 8, padding: "0 4px",
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "1.5px solid #fff",
  },

  // Categories bar
  categoriesBar: {
    background: T.surface,
    borderBottom: `1px solid ${T.border}`,
    padding: "10px 0 12px",
  },
  categoriesScroll: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "0 12px",
    display: "flex",
    flexDirection: "row-reverse",
    gap: 8,
    overflowX: "auto",
    scrollbarWidth: "none",
  },

  resultBar: {
    display: "flex", flexDirection: "row-reverse",
    justifyContent: "space-between", alignItems: "center",
    marginBottom: 14, padding: "0 2px",
  },
  count: { color: T.textMuted, fontSize: 13, fontWeight: 700 },
  newListingBtn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    background: T.primary, color: T.textInverse, border: "none",
    borderRadius: T.radiusPill, padding: "8px 14px",
    fontSize: 13, fontWeight: 800, cursor: "pointer",
    fontFamily: "inherit", boxShadow: T.shadowSm,
  },

  list: { display: "flex", flexDirection: "column", gap: 22 },

  rowCard: {
    display: "flex", flexDirection: "row-reverse", gap: 14,
    background: "transparent", border: "none",
    padding: "4px 0 22px",
    cursor: "pointer",
    borderBottom: `1px solid ${T.divider}`,
    transition: "opacity 0.15s",
  },
  rowImg: {
    position: "relative",
    width: 130, height: 130, minWidth: 130,
    borderRadius: 12, overflow: "hidden",
    background: T.bgAlt,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 1px 4px rgba(15,23,42,0.06)",
  },
  negBadge: {
    position: "absolute", top: 6, insetInlineStart: 6,
    background: "rgba(15, 23, 42, 0.75)", color: "#fff",
    fontSize: 9, fontWeight: 800, padding: "2px 8px",
    borderRadius: T.radiusPill, backdropFilter: "blur(4px)",
  },
  rowBody: {
    flex: 1, minWidth: 0,
    display: "flex", flexDirection: "column", gap: 5,
    textAlign: "right",
  },
  rowTitle: {
    fontSize: 15, fontWeight: 800, color: T.primary,
    lineHeight: 1.4,
    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
    overflow: "hidden", letterSpacing: "-0.005em",
  },
  rowPrice: {
    display: "flex", flexDirection: "row-reverse", alignItems: "baseline", gap: 3,
  },
  priceValue: {
    fontSize: 18, fontWeight: 900, color: T.text, letterSpacing: "-0.01em",
  },
  priceCurr: {
    fontSize: 12, fontWeight: 700, color: T.textMuted,
  },
  rowMetaRow: {
    display: "flex", flexDirection: "row-reverse", gap: 10,
    color: T.textMuted, fontSize: 11, fontWeight: 600,
  },
  metaChip: {
    display: "inline-flex", alignItems: "center", gap: 3,
  },
  rowFooter: {
    display: "flex", flexDirection: "row-reverse", alignItems: "center",
    justifyContent: "space-between", gap: 8,
    marginTop: "auto", paddingTop: 8,
  },
  sellerRow: {
    display: "flex", flexDirection: "row-reverse", alignItems: "center",
    gap: 6, color: T.textMuted, fontSize: 12, fontWeight: 700,
    minWidth: 0,
  },
  avatar: {
    width: 22, height: 22, borderRadius: 11,
    background: T.bgAlt, color: T.textMuted,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 10, fontWeight: 800, flexShrink: 0,
  },
  sellerName: {
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
    color: T.textMuted, minWidth: 0,
  },
  rowStats: {
    display: "flex", flexDirection: "row-reverse", gap: 8,
    fontSize: 11, color: T.textFaint, fontWeight: 700, flexShrink: 0,
  },
  statItem: {
    display: "inline-flex", alignItems: "center", gap: 3,
  },
};
