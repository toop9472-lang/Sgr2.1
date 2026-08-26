// طير — Listing Details (contact + comments + like — no direct buy)
import React, { useCallback, useEffect, useState } from "react";
import {
  MapPin, Heart, Flag, User, Calendar, Palette, Tag, Fingerprint,
  Syringe, HeartPulse, MessageCircle, Bird, X, Phone, Send,
} from "lucide-react";
import { T, S } from "./tairTheme";
import { tairApi } from "./tairApi";
import { TopBar, StatusPill } from "./TairUI";

const GENDER_LABEL = { male: "ذكر", female: "أنثى", pair: "زوج", unknown: "غير محدد" };
const HEALTH_LABEL = {
  excellent: "ممتازة", good: "جيدة", needs_care: "تحتاج رعاية", special_needs: "احتياجات خاصة",
};
const HEALTH_COLOR = {
  excellent: T.success, good: T.info, needs_care: T.warning, special_needs: T.danger,
};

function timeAgo(iso) {
  if (!iso) return "الآن";
  const diff = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "الآن";
  if (diff < 3600) return `قبل ${Math.floor(diff / 60)} د`;
  if (diff < 86400) return `قبل ${Math.floor(diff / 3600)} س`;
  return new Date(iso).toLocaleDateString("ar-SA");
}

export default function ListingDetailsScreen({ user, listingId, onBack, onOpenThread }) {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

  // Comments
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  // Like state
  const [liked, setLiked] = useState(false);
  const [favCount, setFavCount] = useState(0);

  const uid = user.id || user.user_id;

  const loadListing = useCallback(async () => {
    setLoading(true);
    try {
      const l = await tairApi.getListing(listingId, uid);
      setListing(l);
      setImgIdx(0);
      setFavCount(l.favorite_count || 0);
      const favs = await tairApi.myFavorites(uid).catch(() => []);
      setLiked(favs.some((f) => f.listing_id === l.listing_id));
    } catch (e) {
      setError(e.response?.data?.detail || "فشل تحميل الإعلان");
    } finally {
      setLoading(false);
    }
  }, [listingId, uid]);

  const loadComments = useCallback(async () => {
    try {
      const c = await tairApi.listingComments(listingId);
      setComments(c);
    } catch (e) { /* ignore */ }
  }, [listingId]);

  useEffect(() => { loadListing(); }, [loadListing]);
  useEffect(() => { loadComments(); }, [loadComments]);

  const toggleLike = async () => {
    if (!listing) return;
    try {
      const res = await tairApi.toggleFavorite(listing.listing_id, uid);
      setLiked(res.favorited);
      setFavCount((c) => c + (res.favorited ? 1 : -1));
    } catch (e) { /* silent */ }
  };

  const startChat = async (initialMessage) => {
    if (!listing || listing.seller_id === uid) return;
    try {
      const thread = await tairApi.chatStart(
        {
          peer_id: listing.seller_id,
          listing_id: listing.listing_id,
          listing_title: listing.title,
          listing_image: listing.cover_image,
          initial_message: initialMessage,
        },
        uid,
      );
      onOpenThread?.(thread.thread_id);
    } catch (e) { /* silent */ }
  };

  const openWhatsApp = () => {
    if (!listing?.seller_phone) return;
    const phone = String(listing.seller_phone).replace(/[^\d+]/g, "");
    const clean = phone.startsWith("+") ? phone.slice(1) : phone;
    const text = encodeURIComponent(`السلام عليكم، بخصوص إعلانك: ${listing.title}`);
    window.open(`https://wa.me/${clean}?text=${text}`, "_blank");
  };

  const postComment = async () => {
    const body = newComment.trim();
    if (!body) return;
    setPostingComment(true);
    try {
      const authorName = user?.name && user.name !== "زائر" ? user.name : null;
      await tairApi.addListingComment(listingId, body, uid, authorName);
      setNewComment("");
      await loadComments();
    } catch (e) { /* silent */ }
    finally { setPostingComment(false); }
  };

  const toggleCommentLike = async (commentId) => {
    try {
      const res = await tairApi.toggleCommentLike(commentId, uid);
      setComments((cs) => cs.map((c) => {
        if (c.comment_id !== commentId) return c;
        return {
          ...c,
          likes_count: (c.likes_count || 0) + (res.liked ? 1 : -1),
          liked_by: res.liked
            ? [...(c.liked_by || []), uid]
            : (c.liked_by || []).filter((u) => u !== uid),
        };
      }));
    } catch (e) { /* silent */ }
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

  const isOwn = listing.seller_id === uid;
  const gallery = listing.images?.length ? listing.images : (listing.cover_image ? [listing.cover_image] : []);
  const activeImg = gallery[imgIdx];

  return (
    <div style={{ ...S.screen, paddingBottom: 100 }} data-testid="listing-details-screen">
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
          {listing.price_negotiable && <div style={styles.negBadge}>قابل للتفاوض</div>}
          <button
            onClick={toggleLike}
            style={styles.floatLike}
            data-testid="like-btn"
            aria-label="إعجاب"
          >
            <Heart
              size={22}
              strokeWidth={2.2}
              fill={liked ? T.danger : "none"}
              color={liked ? T.danger : T.text}
            />
          </button>
        </div>

        {gallery.length > 1 && (
          <div style={styles.thumbRow}>
            {gallery.slice(0, 6).map((url, i) => (
              <button
                key={i}
                onClick={() => setImgIdx(i)}
                style={{ ...styles.thumb, borderColor: i === imgIdx ? T.primary : T.border }}
                data-testid={`thumb-${i}`}
              >
                <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </button>
            ))}
          </div>
        )}

        <div style={S.card}>
          <div style={{ display: "flex", flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
            <div style={styles.price}>
              {listing.price_sar} <span style={styles.currency}>ر.س</span>
            </div>
            <div style={styles.likeStat}>
              <Heart size={14} strokeWidth={0} fill={T.danger} color={T.danger} />
              <span>{favCount}</span>
            </div>
          </div>
          <div style={styles.location}>
            <MapPin size={13} strokeWidth={2.2} color={T.textMuted} />
            <span>{listing.city}{listing.district ? ` · ${listing.district}` : ""}</span>
          </div>
          <h1 style={styles.title}>{listing.title}</h1>
        </div>

        <div style={S.card}>
          <h2 style={S.h2}>المواصفات</h2>
          <div style={styles.specGrid}>
            {listing.gender && <Spec Icon={User} label="الجنس" value={GENDER_LABEL[listing.gender]} />}
            {listing.age_months && <Spec Icon={Calendar} label="العمر" value={`${listing.age_months} شهر`} />}
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
            <div style={styles.specGrid}>
              <Spec Icon={HeartPulse} label="الحالة" value={
                <StatusPill
                  label={HEALTH_LABEL[listing.health.status] || "-"}
                  color={HEALTH_COLOR[listing.health.status] || T.textMuted}
                />
              } />
              <Spec Icon={Syringe} label="محصّن" value={listing.health.vaccinated ? "نعم" : "لا"} />
              {listing.health.ring_number && (
                <Spec Icon={Fingerprint} label="رقم الخاتم" value={listing.health.ring_number} />
              )}
            </div>
            {listing.health.notes && (
              <p style={{ ...styles.desc, marginTop: 10 }}>{listing.health.notes}</p>
            )}
          </div>
        )}

        {/* Comments Section */}
        <div style={S.card}>
          <h2 style={S.h2}>
            التعليقات ({comments.length})
          </h2>
          {comments.length === 0 ? (
            <div style={styles.emptyComments}>لا توجد تعليقات بعد — كن أول من يعلّق</div>
          ) : (
            <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
              {comments.map((c) => (
                <CommentItem
                  key={c.comment_id}
                  comment={c}
                  isLiked={(c.liked_by || []).includes(uid)}
                  onToggleLike={() => toggleCommentLike(c.comment_id)}
                />
              ))}
            </div>
          )}
          <div style={styles.commentComposer}>
            <input
              style={styles.commentInput}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="اكتب تعليقاً…"
              onKeyDown={(e) => { if (e.key === "Enter") postComment(); }}
              data-testid="comment-input"
            />
            <button
              onClick={postComment}
              disabled={postingComment || !newComment.trim()}
              style={{ ...styles.commentSend, opacity: (postingComment || !newComment.trim()) ? 0.4 : 1 }}
              data-testid="comment-send"
              aria-label="إرسال"
            >
              <Send size={16} strokeWidth={2.4} />
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowReport(true)}
          style={styles.reportBtn}
          data-testid="report-btn"
        >
          <Flag size={13} strokeWidth={2.2} />
          <span>الإبلاغ عن هذا الإعلان</span>
        </button>
      </div>

      {/* Sticky contact bar (only if not own listing) */}
      {!isOwn && (
        <div style={styles.contactBar}>
          <div style={styles.contactInner}>
            <button
              onClick={() => startChat()}
              style={styles.chatBtn}
              data-testid="chat-seller-btn"
            >
              <MessageCircle size={18} strokeWidth={2.2} />
              <span>راسل البائع</span>
            </button>
            {listing.seller_phone && (
              <button
                onClick={openWhatsApp}
                style={styles.whatsappBtn}
                data-testid="whatsapp-btn"
                aria-label="واتساب"
              >
                <Phone size={18} strokeWidth={2.4} />
                <span>واتساب</span>
              </button>
            )}
          </div>
        </div>
      )}

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

function CommentItem({ comment, isLiked, onToggleLike }) {
  const initial = (comment.author_name || comment.author_id || "?").charAt(0).toUpperCase();
  return (
    <div style={styles.commentItem}>
      <div style={styles.commentAvatar}>{initial}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={styles.commentTop}>
          <span style={styles.commentAuthor}>{comment.author_name || "مستخدم"}</span>
          <span style={styles.commentTime}>{timeAgo(comment.created_at)}</span>
        </div>
        <p style={styles.commentBody}>{comment.body}</p>
        <button
          onClick={onToggleLike}
          style={{
            ...styles.commentLike,
            color: isLiked ? T.danger : T.textMuted,
          }}
          data-testid={`comment-like-${comment.comment_id}`}
        >
          <Heart
            size={12}
            strokeWidth={2.2}
            fill={isLiked ? T.danger : "none"}
          />
          <span>{comment.likes_count || 0}</span>
        </button>
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
    } catch (e) { setSending(false); }
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
              <select style={S.input} value={reason} onChange={(e) => setReason(e.target.value)} data-testid="report-reason">
                <option value="prohibited_species">نوع محظور (سايتس)</option>
                <option value="scam">احتيال</option>
                <option value="animal_abuse">إساءة للحيوان</option>
                <option value="wrong_info">معلومات خاطئة</option>
                <option value="other">أخرى</option>
              </select>
              <label style={{ ...S.label, marginTop: 12 }}>ملاحظات</label>
              <textarea style={{ ...S.input, minHeight: 70 }} value={note} onChange={(e) => setNote(e.target.value)} placeholder="اختياري…" data-testid="report-note" />
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button onClick={onClose} style={{ ...S.secondaryBtn, flex: 1 }}>إلغاء</button>
                <button onClick={submit} disabled={sending} style={{ ...S.primaryBtn, flex: 1, background: T.danger, opacity: sending ? 0.7 : 1 }} data-testid="submit-report">
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
    width: "100%", height: "100%",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  negBadge: {
    position: "absolute", top: 12, insetInlineStart: 12,
    background: "rgba(15, 23, 42, 0.8)", color: "#fff",
    fontSize: 11, fontWeight: 700, padding: "5px 12px",
    borderRadius: T.radiusPill, backdropFilter: "blur(4px)",
  },
  floatLike: {
    position: "absolute", top: 12, insetInlineEnd: 12,
    background: "rgba(255,255,255,0.95)", border: "none",
    width: 44, height: 44, borderRadius: 22,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", boxShadow: T.shadowMd,
    backdropFilter: "blur(6px)",
  },
  thumbRow: {
    display: "flex", flexDirection: "row-reverse", gap: 8,
    marginBottom: 14, overflowX: "auto",
  },
  thumb: {
    width: 64, height: 64, borderRadius: T.radiusSm,
    overflow: "hidden", borderWidth: 2, borderStyle: "solid",
    padding: 0, background: T.bgAlt, cursor: "pointer", flexShrink: 0,
  },
  price: {
    fontSize: 28, fontWeight: 900, color: T.primary,
    letterSpacing: "-0.02em", textAlign: "right",
  },
  currency: { fontSize: 14, fontWeight: 700, color: T.textMuted },
  likeStat: {
    display: "inline-flex", alignItems: "center", gap: 5,
    fontSize: 13, fontWeight: 800, color: T.danger,
  },
  location: {
    display: "inline-flex", alignItems: "center", gap: 4,
    color: T.textMuted, fontSize: 13, fontWeight: 600, marginTop: 4,
  },
  title: {
    margin: "12px 0 0", fontSize: 19, fontWeight: 800,
    color: T.textStrong, textAlign: "right", letterSpacing: "-0.01em",
  },
  specGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  spec: {
    display: "flex", flexDirection: "row-reverse", alignItems: "center",
    gap: 10, padding: 10, background: T.bgAlt, borderRadius: T.radius,
  },
  specIcon: {
    width: 32, height: 32, borderRadius: 8, background: T.surface,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  specLabel: { fontSize: 11, color: T.textMuted, fontWeight: 700 },
  specValue: { fontSize: 13, color: T.text, fontWeight: 700, marginTop: 2 },
  desc: {
    color: T.text, fontSize: 14, lineHeight: 1.75,
    textAlign: "right", margin: 0, whiteSpace: "pre-wrap",
  },

  // Comments
  emptyComments: {
    padding: 16, background: T.bgAlt, borderRadius: T.radius,
    color: T.textMuted, fontSize: 13, textAlign: "center", marginBottom: 10,
  },
  commentItem: {
    display: "flex", flexDirection: "row-reverse", gap: 10,
  },
  commentAvatar: {
    width: 34, height: 34, borderRadius: 17,
    background: "#f0fdfa", color: T.primary,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, fontWeight: 800, flexShrink: 0,
  },
  commentTop: {
    display: "flex", flexDirection: "row-reverse", alignItems: "center",
    justifyContent: "space-between", gap: 8, marginBottom: 3,
  },
  commentAuthor: { fontSize: 13, fontWeight: 800, color: T.text },
  commentTime: { fontSize: 10, color: T.textFaint, fontWeight: 600 },
  commentBody: {
    fontSize: 13, color: T.text, lineHeight: 1.65,
    textAlign: "right", margin: "0 0 4px", whiteSpace: "pre-wrap",
  },
  commentLike: {
    display: "inline-flex", alignItems: "center", gap: 4,
    background: "transparent", border: "none", padding: "4px 0",
    fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
  },
  commentComposer: {
    display: "flex", flexDirection: "row-reverse",
    gap: 6, alignItems: "center",
    borderTop: `1px solid ${T.divider}`, paddingTop: 10,
  },
  commentInput: {
    flex: 1, padding: "10px 14px",
    border: `1.5px solid ${T.border}`, borderRadius: T.radiusPill,
    fontSize: 13, background: T.bgAlt, color: T.text,
    fontFamily: "inherit", textAlign: "right", outline: "none",
  },
  commentSend: {
    background: T.primary, color: T.textInverse, border: "none",
    width: 36, height: 36, borderRadius: 18,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer",
  },

  reportBtn: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 6, width: "100%", background: "transparent",
    border: `1px solid ${T.border}`, color: T.textMuted,
    padding: "11px", borderRadius: T.radius, fontSize: 12,
    fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
    marginTop: 12,
  },

  // Sticky contact bar
  contactBar: {
    position: "fixed", bottom: 78, left: 0, right: 0,
    background: T.surface, borderTop: `1px solid ${T.border}`,
    padding: "10px 12px", zIndex: 40,
    boxShadow: "0 -4px 16px rgba(15, 23, 42, 0.06)",
  },
  contactInner: {
    maxWidth: 900, margin: "0 auto",
    display: "flex", flexDirection: "row-reverse", gap: 8,
  },
  chatBtn: {
    flex: 1,
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
    background: T.primary, color: T.textInverse, border: "none",
    borderRadius: T.radius, padding: "12px 18px",
    fontSize: 14, fontWeight: 800, cursor: "pointer",
    fontFamily: "inherit", boxShadow: T.shadowSm,
  },
  whatsappBtn: {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
    background: "#25d366", color: "#fff", border: "none",
    borderRadius: T.radius, padding: "12px 18px",
    fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
    boxShadow: T.shadowSm,
  },
};

const modalStyles = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(3, 7, 18, 0.55)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 100, padding: 16,
  },
  modal: {
    background: T.surface, borderRadius: T.radiusLg,
    maxWidth: 480, width: "100%",
    fontFamily: "'Tajawal', 'IBM Plex Sans Arabic', system-ui, sans-serif",
    direction: "rtl", overflow: "hidden",
  },
  header: {
    display: "flex", flexDirection: "row-reverse",
    alignItems: "center", justifyContent: "space-between",
    padding: "14px 18px", borderBottom: `1px solid ${T.divider}`,
  },
};
