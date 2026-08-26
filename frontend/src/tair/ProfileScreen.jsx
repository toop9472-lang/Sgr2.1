// طير — Profile: shows user info, my listings, my trips, ratings
import React, { useEffect, useState } from "react";
import { T, S } from "./tairTheme";
import { tairApi } from "./tairApi";

export default function ProfileScreen({ user, onOpenListing, onOpenTrip, onLogout }) {
  const uid = user.id || user.user_id;
  const [tab, setTab] = useState("listings");
  const [myListings, setMyListings] = useState([]);
  const [myTrips, setMyTrips] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [avg, setAvg] = useState({ seller: 0, carrier: 0 });

  useEffect(() => {
    tairApi.listingsBySeller(uid, true).then(setMyListings).catch(() => {});
    tairApi.tripsByCarrier(uid, true).then(setMyTrips).catch(() => {});
    tairApi
      .ratingsForUser(uid)
      .then((rs) => {
        setRatings(rs);
        const bySeller = rs.filter((r) => r.rated_role === "seller");
        const byCarrier = rs.filter((r) => r.rated_role === "carrier");
        const avgOf = (arr) => arr.length ? Math.round((arr.reduce((s, r) => s + r.stars, 0) / arr.length) * 10) / 10 : 0;
        setAvg({ seller: avgOf(bySeller), carrier: avgOf(byCarrier) });
      })
      .catch(() => {});
  }, [uid]);

  return (
    <div style={S.screen} data-testid="profile-screen">
      <header style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.avatar}>
            {user.name?.charAt(0)?.toUpperCase() || "🧑"}
          </div>
          <h1 style={styles.name}>{user.name || "مستخدم طير"}</h1>
          <p style={styles.email}>{user.email || uid}</p>

          <div style={styles.stats}>
            <div style={styles.stat}>
              <div style={styles.statVal}>{myListings.length}</div>
              <div style={styles.statLabel}>إعلان</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statVal}>{myTrips.length}</div>
              <div style={styles.statLabel}>رحلة</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statVal}>
                {avg.seller > 0 ? avg.seller : "—"}
              </div>
              <div style={styles.statLabel}>⭐ كبائع</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statVal}>
                {avg.carrier > 0 ? avg.carrier : "—"}
              </div>
              <div style={styles.statLabel}>⭐ كموصّل</div>
            </div>
          </div>
        </div>
      </header>

      <div style={S.container}>
        <div style={styles.tabs}>
          {[
            { id: "listings", label: `إعلاناتي (${myListings.length})` },
            { id: "trips", label: `رحلاتي (${myTrips.length})` },
            { id: "ratings", label: `تقييماتي (${ratings.length})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{ ...styles.tab, ...(tab === t.id ? styles.tabActive : {}) }}
              data-testid={`profile-tab-${t.id}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "listings" && (
          <div style={{ display: "grid", gap: 8 }}>
            {myListings.length === 0 ? (
              <div style={S.card}>لم تنشر إعلانات بعد.</div>
            ) : (
              myListings.map((l) => (
                <button
                  key={l.listing_id}
                  onClick={() => onOpenListing(l.listing_id)}
                  style={styles.row}
                  data-testid={`my-listing-${l.listing_id}`}
                >
                  <div style={styles.rowThumb}>
                    {l.cover_image ? (
                      <img src={l.cover_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : "🐦"}
                  </div>
                  <div style={{ flex: 1, textAlign: "right" }}>
                    <div style={{ fontWeight: 800 }}>{l.title}</div>
                    <div style={{ fontSize: 12, color: T.textMuted }}>
                      {l.price_sar} ر.س · {l.status}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {tab === "trips" && (
          <div style={{ display: "grid", gap: 8 }}>
            {myTrips.length === 0 ? (
              <div style={S.card}>لم تسجّل رحلات بعد.</div>
            ) : (
              myTrips.map((t) => (
                <button
                  key={t.trip_id}
                  onClick={() => onOpenTrip(t.trip_id)}
                  style={styles.row}
                  data-testid={`my-trip-${t.trip_id}`}
                >
                  <div style={{ fontSize: 26 }}>🚗</div>
                  <div style={{ flex: 1, textAlign: "right" }}>
                    <div style={{ fontWeight: 800 }}>
                      {t.from_city} ← {t.to_city}
                    </div>
                    <div style={{ fontSize: 12, color: T.textMuted }}>
                      {new Date(t.depart_at).toLocaleDateString("ar-SA")} · {t.status}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {tab === "ratings" && (
          <div style={{ display: "grid", gap: 8 }}>
            {ratings.length === 0 ? (
              <div style={S.card}>لا توجد تقييمات بعد.</div>
            ) : (
              ratings.map((r) => (
                <div key={r.rating_id} style={{ ...S.card, marginBottom: 0 }}>
                  <div style={{ display: "flex", flexDirection: "row-reverse", justifyContent: "space-between" }}>
                    <span style={{ color: T.yellow, fontSize: 18 }}>{"★".repeat(r.stars)}</span>
                    <span style={{ ...S.pill, background: "#ecfdf5", color: T.primary }}>
                      كـ{r.rated_role === "seller" ? "بائع" : r.rated_role === "carrier" ? "موصّل" : "مشتري"}
                    </span>
                  </div>
                  {r.comment && (
                    <p style={{ color: T.textMuted, fontSize: 14, textAlign: "right", marginTop: 6 }}>
                      &ldquo;{r.comment}&rdquo;
                    </p>
                  )}
                  {r.tags?.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "row-reverse", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                      {r.tags.map((t, i) => (
                        <span key={i} style={{ ...S.pill, fontSize: 10 }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <button
            onClick={onLogout}
            style={{ ...S.secondaryBtn, width: "100%", borderColor: T.danger, color: T.danger }}
            data-testid="logout-btn"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  hero: {
    background: `linear-gradient(135deg, ${T.mint} 0%, ${T.sky} 100%)`,
    padding: "26px 20px 24px",
    textAlign: "center",
  },
  heroInner: { maxWidth: 500, margin: "0 auto" },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 36,
    fontWeight: 900,
    color: T.primary,
    margin: "0 auto 12px",
    boxShadow: T.shadowMd,
  },
  name: { margin: 0, fontSize: 22, fontWeight: 900, color: T.primary },
  email: { margin: "3px 0 0", fontSize: 12, color: "#0f766e" },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 8,
    marginTop: 18,
    background: "rgba(255,255,255,0.7)",
    borderRadius: 16,
    padding: 12,
  },
  stat: { textAlign: "center" },
  statVal: { fontSize: 18, fontWeight: 900, color: T.primary },
  statLabel: { fontSize: 10, color: T.textMuted, marginTop: 2, fontWeight: 700 },
  tabs: {
    display: "flex",
    flexDirection: "row-reverse",
    gap: 6,
    background: "#fff",
    padding: 4,
    borderRadius: 999,
    marginBottom: 12,
    boxShadow: T.shadowSm,
  },
  tab: {
    flex: 1,
    padding: "9px 4px",
    border: "none",
    borderRadius: 999,
    background: "transparent",
    color: T.textMuted,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  tabActive: {
    background: T.primary,
    color: "#fff",
  },
  row: {
    display: "flex",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    background: "#fff",
    border: `1px solid ${T.border}`,
    borderRadius: 12,
    padding: "10px 12px",
    cursor: "pointer",
    fontFamily: "inherit",
    textAlign: "right",
  },
  rowThumb: {
    width: 50,
    height: 50,
    borderRadius: 10,
    background: T.divider,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
  },
};
