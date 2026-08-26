// طير — Home / Listings Feed (main marketplace)
import React, { useEffect, useMemo, useState } from "react";
import { T, S } from "./tairTheme";
import { tairApi, SAUDI_CITIES } from "./tairApi";

export default function HomeScreen({ user, onOpenListing, onCreateListing }) {
  const [species, setSpecies] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [city, setCity] = useState(null);
  const [speciesId, setSpeciesId] = useState(null);

  useEffect(() => {
    tairApi.listSpecies().then(setSpecies).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { limit: 40 };
    if (city) params.city = city;
    if (speciesId) params.species = speciesId;
    if (q.trim()) params.q = q.trim();
    tairApi
      .feedListings(params)
      .then((d) => setListings(d.items || []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [city, speciesId, q]);

  return (
    <div style={S.screen} data-testid="home-screen">
      <header style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.brandRow}>
            <img src="/tair_logo.png" alt="طير" style={styles.logo} />
            <div>
              <h1 style={styles.brand}>طير</h1>
              <p style={styles.tag}>مرحباً {user?.name || "بك"} 👋</p>
            </div>
          </div>

          <div style={styles.searchBox} data-testid="home-search-box">
            <span style={{ fontSize: 18 }}>🔍</span>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث عن كناري، كوكتيل، ببغاء…"
              style={styles.searchInput}
              data-testid="home-search-input"
            />
            {q && (
              <button onClick={() => setQ("")} style={styles.clearBtn}>
                ✕
              </button>
            )}
          </div>
        </div>
      </header>

      <div style={styles.filters}>
        <Chips
          label="المدينة"
          items={[
            { id: null, label: "الكل" },
            ...SAUDI_CITIES.map((c) => ({ id: c, label: c })),
          ]}
          value={city}
          onChange={setCity}
          testPrefix="city"
        />
        <Chips
          label="النوع"
          items={[
            { id: null, label: "الكل" },
            ...species.map((s) => ({ id: s.species_id, label: s.name_ar })),
          ]}
          value={speciesId}
          onChange={setSpeciesId}
          testPrefix="species"
        />
      </div>

      <div style={S.container}>
        <div style={styles.resultBar}>
          <span style={styles.count}>
            {loading ? "جاري التحميل…" : `${listings.length} إعلان`}
          </span>
          <button
            onClick={onCreateListing}
            style={styles.fabBtn}
            data-testid="create-listing-btn"
          >
            + إعلان جديد
          </button>
        </div>

        {loading ? (
          <div style={S.loadingText}>جاري تحميل الإعلانات…</div>
        ) : listings.length === 0 ? (
          <EmptyState
            emoji="🥚"
            title="لا توجد إعلانات مطابقة"
            desc="جرّب تغيير المدينة أو النوع، أو انشر أول إعلان"
            actionLabel="انشر إعلان"
            onAction={onCreateListing}
          />
        ) : (
          <div style={styles.grid}>
            {listings.map((l) => (
              <ListingCard key={l.listing_id} item={l} onClick={() => onOpenListing(l.listing_id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Chips({ label, items, value, onChange, testPrefix }) {
  return (
    <div style={styles.chipsRow}>
      <span style={styles.chipsLabel}>{label}:</span>
      <div style={styles.chipsScroll}>
        {items.map((it, i) => {
          const active = value === it.id;
          return (
            <button
              key={`${testPrefix}-${i}`}
              onClick={() => onChange(it.id)}
              style={{ ...styles.chip, ...(active ? styles.chipActive : {}) }}
              data-testid={`filter-${testPrefix}-${it.id || "all"}`}
            >
              {it.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ListingCard({ item, onClick }) {
  return (
    <div
      onClick={onClick}
      style={styles.card}
      data-testid={`listing-card-${item.listing_id}`}
    >
      <div style={styles.imageBox}>
        {item.cover_image ? (
          <img
            src={item.cover_image}
            alt={item.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={styles.imagePlaceholder}>🐦</div>
        )}
        {item.price_negotiable && (
          <div style={styles.pill}>قابل للتفاوض</div>
        )}
      </div>
      <div style={{ padding: 12 }}>
        <div style={styles.cardTitle}>{item.title}</div>
        <div style={styles.cardMeta}>
          📍 {item.city}
          {item.district ? ` · ${item.district}` : ""}
        </div>
        <div style={styles.cardBottom}>
          <span style={styles.price}>{item.price_sar} ر.س</span>
          <div style={styles.stats}>
            <span>👁 {item.view_count || 0}</span>
            <span>❤ {item.favorite_count || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ emoji, title, desc, actionLabel, onAction }) {
  return (
    <div style={styles.empty} data-testid="empty-state">
      <div style={{ fontSize: 64 }}>{emoji}</div>
      <h3 style={{ fontSize: 18, fontWeight: 800, margin: "10px 0 6px", color: T.text }}>
        {title}
      </h3>
      <p style={{ color: T.textMuted, marginBottom: 18 }}>{desc}</p>
      {onAction && (
        <button
          onClick={onAction}
          style={{ ...S.primaryBtn, padding: "10px 22px", fontSize: 14 }}
          data-testid="empty-state-action"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

const styles = {
  hero: {
    background: `linear-gradient(135deg, ${T.mint} 0%, ${T.mintDeep} 50%, ${T.sky} 100%)`,
    padding: "22px 20px 24px",
  },
  heroInner: { maxWidth: 900, margin: "0 auto" },
  brandRow: {
    display: "flex",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 16,
    boxShadow: T.shadowMd,
  },
  brand: {
    margin: 0,
    fontSize: 30,
    fontWeight: 900,
    color: T.primary,
    lineHeight: 1,
    textAlign: "right",
  },
  tag: {
    margin: "3px 0 0",
    fontSize: 13,
    color: "#0f766e",
    fontWeight: 700,
    textAlign: "right",
  },
  searchBox: {
    display: "flex",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    background: "#fff",
    borderRadius: 16,
    padding: "12px 16px",
    boxShadow: T.shadowSm,
  },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: 15,
    background: "transparent",
    textAlign: "right",
    fontFamily: "inherit",
    color: T.text,
  },
  clearBtn: {
    background: "#f1f5f9",
    border: "none",
    width: 24,
    height: 24,
    borderRadius: 12,
    cursor: "pointer",
    color: T.textMuted,
  },
  filters: {
    background: "#fff",
    borderBottom: `1px solid ${T.border}`,
    paddingBottom: 4,
  },
  chipsRow: {
    display: "flex",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    padding: "8px 16px",
    maxWidth: 900,
    margin: "0 auto",
  },
  chipsLabel: { fontSize: 11, color: T.textMuted, fontWeight: 700, minWidth: 38 },
  chipsScroll: {
    display: "flex",
    flexDirection: "row-reverse",
    gap: 6,
    overflowX: "auto",
    scrollbarWidth: "none",
    flex: 1,
  },
  chip: {
    padding: "6px 12px",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: T.mintDeep,
    borderRadius: 999,
    background: "#ecfeff",
    color: "#0e7490",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
    fontFamily: "inherit",
  },
  chipActive: {
    background: T.accent,
    color: "#fff",
    borderColor: T.accent,
  },
  resultBar: {
    display: "flex",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  count: { color: T.textMuted, fontSize: 13, fontWeight: 700 },
  fabBtn: {
    background: `linear-gradient(135deg, ${T.primaryLight}, ${T.accent})`,
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "9px 16px",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: T.shadowSm,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: 12,
  },
  card: {
    background: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    cursor: "pointer",
    boxShadow: T.shadowSm,
    transition: "transform 0.15s",
  },
  imageBox: {
    position: "relative",
    aspectRatio: "1/1",
    background: T.divider,
    overflow: "hidden",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 42,
    color: T.textFaint,
  },
  pill: {
    position: "absolute",
    top: 8,
    insetInlineStart: 8,
    background: "rgba(6, 95, 70, 0.92)",
    color: "#fff",
    fontSize: 10,
    fontWeight: 800,
    padding: "3px 8px",
    borderRadius: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: T.text,
    textAlign: "right",
    marginBottom: 4,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  cardMeta: {
    fontSize: 11,
    color: T.textMuted,
    fontWeight: 600,
    textAlign: "right",
    marginBottom: 6,
  },
  cardBottom: {
    display: "flex",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: { fontSize: 16, fontWeight: 900, color: T.primary },
  stats: {
    display: "flex",
    flexDirection: "row-reverse",
    gap: 6,
    fontSize: 11,
    color: T.textFaint,
    fontWeight: 700,
  },
  empty: {
    padding: 50,
    textAlign: "center",
    background: "#fff",
    borderRadius: 18,
    boxShadow: T.shadowSm,
  },
};
