// طير — Forum / Community discussions
import React, { useEffect, useState } from "react";
import {
  MessageSquare, Plus, Heart, MessageCircle, Eye, Clock,
  Lightbulb, Star, HeartPulse, Wheat, Egg, HelpCircle, Bird, X, Pin,
} from "lucide-react";
import { T, S } from "./tairTheme";
import { tairApi } from "./tairApi";
import { BottomSheet, SelectorItem, FilterChipButton, EmptyState } from "./TairUI";

const CATEGORY_ICONS = {
  general: MessageSquare,
  tips: Lightbulb,
  experience: Star,
  health: HeartPulse,
  food: Wheat,
  breeding: Egg,
  questions: HelpCircle,
  market: Bird,
};

function timeAgo(iso) {
  if (!iso) return "الآن";
  const then = new Date(iso).getTime();
  const diff = Math.max(0, (Date.now() - then) / 1000);
  if (diff < 60) return "الآن";
  if (diff < 3600) return `قبل ${Math.floor(diff / 60)} د`;
  if (diff < 86400) return `قبل ${Math.floor(diff / 3600)} س`;
  if (diff < 86400 * 30) return `قبل ${Math.floor(diff / 86400)} يوم`;
  return new Date(iso).toLocaleDateString("ar-SA");
}

export default function ForumScreen({ user, onOpenPost }) {
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    tairApi.forumCategories().then(setCategories).catch(() => {});
  }, []);

  const load = () => {
    setLoading(true);
    const params = { limit: 40 };
    if (category) params.category = category;
    tairApi
      .forumFeed(params)
      .then((d) => setPosts(d.items || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [category]);

  const currentCat = categories.find((c) => c.id === category);

  return (
    <div style={S.screen} data-testid="forum-screen">
      <header style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.headTop}>
            <div>
              <h1 style={styles.title}>المنتدى</h1>
              <p style={styles.subtitle}>نقاشات وتجارب مربّي الطيور والحيوانات</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              style={styles.createBtn}
              data-testid="forum-create-btn"
            >
              <Plus size={16} strokeWidth={2.6} />
              <span>منشور جديد</span>
            </button>
          </div>
        </div>
      </header>

      <div style={styles.filterBar}>
        <div style={styles.filterInner}>
          <FilterChipButton
            icon={<MessageSquare size={15} strokeWidth={2.2} />}
            label="القسم"
            value={currentCat?.name_ar}
            onClick={() => setSheetOpen(true)}
            testId="forum-category-btn"
          />
          {category && (
            <button
              onClick={() => setCategory(null)}
              style={styles.clearBtn}
            >
              مسح
            </button>
          )}
        </div>
      </div>

      <div style={S.container}>
        {loading ? (
          <div style={S.loadingText}>جاري التحميل…</div>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={36} strokeWidth={1.5} />}
            title="لا توجد منشورات هنا"
            desc="كن أول من يبدأ نقاشاً في هذا القسم!"
            action={
              <button onClick={() => setShowCreate(true)} style={S.primaryBtn}>
                <Plus size={16} strokeWidth={2.6} />
                <span>ابدأ نقاشاً</span>
              </button>
            }
          />
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {posts.map((p) => (
              <PostCard
                key={p.post_id}
                post={p}
                categories={categories}
                onClick={() => onOpenPost(p.post_id)}
              />
            ))}
          </div>
        )}
      </div>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="اختر قسم النقاش"
      >
        <SelectorItem
          icon={<MessageSquare size={16} strokeWidth={2.2} />}
          label="جميع الأقسام"
          active={!category}
          onClick={() => { setCategory(null); setSheetOpen(false); }}
        />
        {categories.map((c) => {
          const Icon = CATEGORY_ICONS[c.id] || MessageSquare;
          return (
            <SelectorItem
              key={c.id}
              icon={<Icon size={16} strokeWidth={2.2} />}
              label={c.name_ar}
              active={category === c.id}
              onClick={() => { setCategory(c.id); setSheetOpen(false); }}
              testId={`forum-cat-${c.id}`}
            />
          );
        })}
      </BottomSheet>

      {showCreate && (
        <CreatePostModal
          user={user}
          categories={categories}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(); }}
        />
      )}
    </div>
  );
}

function PostCard({ post, categories, onClick }) {
  const cat = categories.find((c) => c.id === post.category);
  const Icon = CATEGORY_ICONS[post.category] || MessageSquare;
  const authorInitial = (post.author_name || post.author_id || "?").charAt(0).toUpperCase();

  return (
    <div
      onClick={onClick}
      style={styles.postCard}
      data-testid={`post-card-${post.post_id}`}
    >
      <div style={styles.postTop}>
        <div style={styles.avatar}>{authorInitial}</div>
        <div style={{ flex: 1, minWidth: 0, textAlign: "right" }}>
          <div style={styles.authorName}>{post.author_name || "مستخدم طير"}</div>
          <div style={styles.postMeta}>
            <Clock size={11} strokeWidth={2.2} />
            <span>{timeAgo(post.created_at)}</span>
          </div>
        </div>
        {post.is_pinned && (
          <span style={styles.pinBadge}>
            <Pin size={12} strokeWidth={2.4} />
          </span>
        )}
        {cat && (
          <span style={styles.catPill}>
            <Icon size={11} strokeWidth={2.4} />
            <span>{cat.name_ar}</span>
          </span>
        )}
      </div>

      <h3 style={styles.postTitle}>{post.title}</h3>
      <p style={styles.postBody}>{post.body}</p>

      <div style={styles.postStats}>
        <span style={styles.stat}>
          <Heart size={13} strokeWidth={2.2} />
          {post.likes_count || 0}
        </span>
        <span style={styles.stat}>
          <MessageCircle size={13} strokeWidth={2.2} />
          {post.replies_count || 0}
        </span>
        <span style={styles.stat}>
          <Eye size={13} strokeWidth={2.2} />
          {post.views_count || 0}
        </span>
      </div>
    </div>
  );
}

function CreatePostModal({ user, categories, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    body: "",
    category: categories[0]?.id || "general",
    author_name: user?.name && user.name !== "زائر" ? user.name : "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (!form.title.trim()) return setError("العنوان مطلوب");
    if (!form.body.trim()) return setError("المحتوى مطلوب");
    setSaving(true);
    try {
      await tairApi.forumCreatePost(
        {
          title: form.title.trim(),
          body: form.body.trim(),
          category: form.category,
          author_name: form.author_name || null,
        },
        user.id || user.user_id,
      );
      onCreated?.();
    } catch (err) {
      setError(err.response?.data?.detail || "فشل نشر المنشور");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div
        style={modalStyles.modal}
        onClick={(e) => e.stopPropagation()}
        data-testid="create-post-modal"
      >
        <div style={modalStyles.header}>
          <button onClick={onClose} style={S.iconBtn} data-testid="close-create-post" aria-label="إغلاق">
            <X size={18} strokeWidth={2.2} />
          </button>
          <h2 style={modalStyles.title}>منشور جديد</h2>
          <div style={{ width: 40 }} />
        </div>

        <div style={modalStyles.body}>
          <label style={S.label}>اسمك (اختياري)</label>
          <input
            style={S.input}
            value={form.author_name}
            onChange={(e) => setForm({ ...form, author_name: e.target.value })}
            placeholder="مثال: أبو محمد"
            data-testid="post-author-name"
          />

          <label style={{ ...S.label, marginTop: 12 }}>القسم *</label>
          <select
            style={S.input}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            data-testid="post-category"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name_ar}</option>
            ))}
          </select>

          <label style={{ ...S.label, marginTop: 12 }}>العنوان *</label>
          <input
            style={S.input}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="مثال: تجربتي مع تفريخ الكناري"
            data-testid="post-title"
          />

          <label style={{ ...S.label, marginTop: 12 }}>المحتوى *</label>
          <textarea
            style={{ ...S.input, minHeight: 140, resize: "vertical", lineHeight: 1.7 }}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="شارك تجربتك، أسئلتك، أو نصيحتك للمجتمع…"
            data-testid="post-body"
          />

          {error && <div style={S.errorBox}>{error}</div>}

          <button
            onClick={submit}
            disabled={saving}
            style={{ ...S.primaryBtn, width: "100%", marginTop: 18, opacity: saving ? 0.7 : 1 }}
            data-testid="submit-post"
          >
            {saving ? "جاري النشر…" : "انشر"}
          </button>
        </div>
      </div>
    </div>
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
    fontWeight: 800,
    cursor: "pointer",
    padding: "6px 4px",
    fontFamily: "inherit",
  },

  // Post card
  postCard: {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radiusMd,
    padding: 14,
    cursor: "pointer",
    boxShadow: T.shadowXs,
  },
  postTop: {
    display: "flex",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    background: "#f0fdfa",
    color: T.primary,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 800,
    flexShrink: 0,
  },
  authorName: {
    fontSize: 13,
    fontWeight: 800,
    color: T.text,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  postMeta: {
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
    fontSize: 11,
    color: T.textMuted,
    fontWeight: 600,
    marginTop: 2,
  },
  pinBadge: {
    color: T.warning,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  catPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "4px 10px",
    borderRadius: T.radiusPill,
    background: "#f0fdfa",
    color: T.primary,
    fontSize: 11,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  postTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: T.textStrong,
    textAlign: "right",
    margin: "0 0 6px",
    letterSpacing: "-0.005em",
  },
  postBody: {
    fontSize: 13,
    color: T.textMuted,
    lineHeight: 1.7,
    textAlign: "right",
    margin: "0 0 10px",
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  postStats: {
    display: "flex",
    flexDirection: "row-reverse",
    gap: 14,
    paddingTop: 10,
    borderTop: `1px solid ${T.divider}`,
  },
  stat: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 12,
    color: T.textMuted,
    fontWeight: 700,
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
