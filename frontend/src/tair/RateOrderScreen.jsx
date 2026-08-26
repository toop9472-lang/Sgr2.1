// طير — Rate Order Screen (mandatory after completion)
import React, { useState } from "react";
import { T, S } from "./tairTheme";
import { tairApi } from "./tairApi";
import { TopBar } from "./CreateListingScreen";

const TAG_OPTIONS = {
  seller: ["صادق", "سريع الرد", "طيور بحالة ممتازة", "معلومات دقيقة"],
  carrier: ["دقيق بالمواعيد", "حذر مع الطيور", "مهذّب", "سيارة نظيفة"],
  buyer: ["دفع سريع", "تعامل راقٍ", "التزم بالموعد"],
};

const ROLE_LABEL = { seller: "البائع", carrier: "الموصّل", buyer: "المشتري" };

export default function RateOrderScreen({ user, order, onBack, onDone }) {
  const uid = user.id || user.user_id;

  // Which roles can this user rate?
  const toRate = [];
  if (order.buyer_id === uid) {
    if (!order.seller_rated) toRate.push({ role: "seller", targetId: order.seller_id });
    if (order.carrier_id && !order.carrier_rated) toRate.push({ role: "carrier", targetId: order.carrier_id });
  }
  if (order.seller_id === uid && !order.buyer_rated) {
    toRate.push({ role: "buyer", targetId: order.buyer_id });
  }
  if (order.carrier_id === uid && !order.buyer_rated) {
    toRate.push({ role: "buyer", targetId: order.buyer_id });
  }

  const [idx, setIdx] = useState(0);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [tags, setTags] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (toRate.length === 0) {
    return (
      <div style={S.screen}>
        <TopBar title="تقييم" onBack={onBack} />
        <div style={{ padding: 40, textAlign: "center" }}>
          ✅ لا يوجد ما تقيّمه في هذا الطلب.
        </div>
      </div>
    );
  }

  const current = toRate[idx];
  const roleLabel = ROLE_LABEL[current.role];
  const tagOptions = TAG_OPTIONS[current.role] || [];

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await tairApi.createRating(
        {
          order_id: order.order_id,
          rated_id: current.targetId,
          rated_role: current.role,
          stars,
          comment: comment || null,
          tags,
        },
        uid,
      );

      if (idx + 1 < toRate.length) {
        setIdx(idx + 1);
        setStars(5);
        setComment("");
        setTags([]);
      } else {
        onDone?.();
      }
    } catch (e) {
      setError(e.response?.data?.detail || "فشل حفظ التقييم");
    } finally {
      setBusy(false);
    }
  };

  const toggleTag = (t) => {
    setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  };

  return (
    <div style={S.screen} data-testid="rate-order-screen">
      <TopBar title={`تقييم ${roleLabel}`} onBack={onBack} />

      <div style={S.container}>
        <div style={S.card}>
          <div style={{ textAlign: "center", padding: 12 }}>
            <div style={{ fontSize: 44 }}>⭐</div>
            <h2 style={{ margin: "6px 0", fontSize: 20, fontWeight: 900 }}>كيف كانت تجربتك مع {roleLabel}؟</h2>
            <p style={{ color: T.textMuted, margin: 0 }}>
              التقييم يساعد المجتمع على بناء الثقة.
            </p>
          </div>

          <div style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setStars(n)}
                style={{ ...styles.star, color: n <= stars ? T.yellow : T.divider }}
                data-testid={`star-${n}`}
              >
                ★
              </button>
            ))}
          </div>

          <h3 style={S.h3}>وسوم</h3>
          <div style={styles.tagsRow}>
            {tagOptions.map((t) => {
              const active = tags.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => toggleTag(t)}
                  style={{ ...styles.tag, ...(active ? styles.tagActive : {}) }}
                  data-testid={`tag-${t}`}
                >
                  {t}
                </button>
              );
            })}
          </div>

          <label style={{ ...S.label, marginTop: 12 }}>تعليقك</label>
          <textarea
            style={{ ...S.input, minHeight: 80 }}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="شارك تجربتك…"
            data-testid="rating-comment"
          />
        </div>

        {error && <div style={S.errorBox}>{error}</div>}

        <div style={{ color: T.textMuted, fontSize: 12, textAlign: "center", marginBottom: 6 }}>
          التقييم {idx + 1} من {toRate.length}
        </div>

        <button
          onClick={submit}
          disabled={busy}
          style={{ ...S.primaryBtn, width: "100%", opacity: busy ? 0.7 : 1 }}
          data-testid="submit-rating"
        >
          {busy
            ? "جاري الحفظ…"
            : idx + 1 < toRate.length
              ? "احفظ وتابع →"
              : "إنهاء"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  starsRow: {
    display: "flex",
    flexDirection: "row-reverse",
    justifyContent: "center",
    gap: 6,
    margin: "16px 0",
  },
  star: {
    background: "transparent",
    border: "none",
    fontSize: 44,
    cursor: "pointer",
    lineHeight: 1,
    transition: "transform 0.15s",
  },
  tagsRow: {
    display: "flex",
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    padding: "8px 14px",
    borderRadius: 999,
    border: `1.5px solid ${T.border}`,
    background: "#fff",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    color: T.textMuted,
  },
  tagActive: {
    background: "#ecfdf5",
    color: T.primary,
    borderColor: T.primary,
  },
};
