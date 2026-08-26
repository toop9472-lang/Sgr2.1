// طير — Forum post details + replies
import React, { useCallback, useEffect, useState } from "react";
import {
  Heart, MessageCircle, Eye, Clock, Send,
  Lightbulb, Star, HeartPulse, Wheat, Egg, HelpCircle, Bird, MessageSquare,
} from "lucide-react";
import { T, S } from "./tairTheme";
import { tairApi } from "./tairApi";
import { TopBar } from "./TairUI";

const CATEGORY_ICONS = {
  general: MessageSquare, tips: Lightbulb, experience: Star,
  health: HeartPulse, food: Wheat, breeding: Egg,
  questions: HelpCircle, market: Bird,
};

function timeAgo(iso) {
  if (!iso) return "الآن";
  const diff = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "الآن";
  if (diff < 3600) return `قبل ${Math.floor(diff / 60)} د`;
  if (diff < 86400) return `قبل ${Math.floor(diff / 3600)} س`;
  return new Date(iso).toLocaleDateString("ar-SA");
}

export default function ForumPostScreen({ user, postId, onBack }) {
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  const uid = user.id || user.user_id;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = await tairApi.forumGetPost(postId, uid);
      setPost(p);
      setLikesCount(p.likes_count || 0);
      setLiked(Array.isArray(p.liked_by) && p.liked_by.includes(uid));
      const r = await tairApi.forumListReplies(postId);
      setReplies(r);
    } catch (e) {
      setError(e.response?.data?.detail || "فشل التحميل");
    } finally {
      setLoading(false);
    }
  }, [postId, uid]);

  useEffect(() => { load(); }, [load]);

  const toggleLike = async () => {
    try {
      const res = await tairApi.forumToggleLike(postId, uid);
      setLiked(res.liked);
      setLikesCount((c) => c + (res.liked ? 1 : -1));
    } catch (e) { /* ignore */ }
  };

  const postReply = async () => {
    const body = replyBody.trim();
    if (!body) return;
    setPosting(true);
    try {
      const authorName = user?.name && user.name !== "زائر" ? user.name : null;
      await tairApi.forumReply(postId, body, uid, authorName);
      setReplyBody("");
      await load();
    } catch (e) {
      setError(e.response?.data?.detail || "فشل إرسال الرد");
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div style={S.screen}>
        <TopBar title="المنشور" onBack={onBack} />
        <div style={S.loadingText}>جاري التحميل…</div>
      </div>
    );
  }
  if (!post) {
    return (
      <div style={S.screen}>
        <TopBar title="المنشور" onBack={onBack} />
        <div style={{ padding: 40, textAlign: "center", color: T.danger }}>
          {error || "المنشور غير موجود"}
        </div>
      </div>
    );
  }

  const Icon = CATEGORY_ICONS[post.category] || MessageSquare;
  const authorInitial = (post.author_name || post.author_id || "?").charAt(0).toUpperCase();

  return (
    <div style={S.screen} data-testid="post-details-screen">
      <TopBar title="المنشور" onBack={onBack} />

      <div style={S.container}>
        <div style={S.card}>
          <div style={styles.postTop}>
            <div style={styles.avatar}>{authorInitial}</div>
            <div style={{ flex: 1, minWidth: 0, textAlign: "right" }}>
              <div style={styles.authorName}>{post.author_name || "مستخدم طير"}</div>
              <div style={styles.postMetaTop}>
                <Clock size={11} strokeWidth={2.2} />
                <span>{timeAgo(post.created_at)}</span>
              </div>
            </div>
            <span style={styles.catPill}>
              <Icon size={11} strokeWidth={2.4} />
              <span>{post.category}</span>
            </span>
          </div>

          <h1 style={styles.postTitle}>{post.title}</h1>
          <p style={styles.postBody}>{post.body}</p>

          <div style={styles.actionsRow}>
            <button
              onClick={toggleLike}
              style={{
                ...styles.actionBtn,
                background: liked ? "#fef2f2" : T.bgAlt,
                color: liked ? T.danger : T.textMuted,
                borderColor: liked ? T.danger : T.border,
              }}
              data-testid="post-like-btn"
            >
              <Heart size={16} strokeWidth={2.2} fill={liked ? T.danger : "none"} />
              <span>{likesCount}</span>
            </button>
            <span style={styles.stat}>
              <MessageCircle size={14} strokeWidth={2.2} />
              {post.replies_count || 0}
            </span>
            <span style={styles.stat}>
              <Eye size={14} strokeWidth={2.2} />
              {post.views_count || 0}
            </span>
          </div>
        </div>

        <h2 style={{ ...S.h2, marginBottom: 8, marginTop: 20 }}>
          الردود ({replies.length})
        </h2>

        {replies.length === 0 ? (
          <div style={styles.emptyReplies}>لا توجد ردود بعد — كن أول من يشارك رأيه</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {replies.map((r) => (
              <ReplyCard key={r.reply_id} reply={r} />
            ))}
          </div>
        )}
      </div>

      {/* Reply composer */}
      <div style={styles.composer}>
        <div style={styles.composerInner}>
          <input
            style={styles.composerInput}
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="اكتب رداً…"
            onKeyDown={(e) => { if (e.key === "Enter") postReply(); }}
            data-testid="reply-input"
          />
          <button
            onClick={postReply}
            disabled={posting || !replyBody.trim()}
            style={{
              ...styles.sendBtn,
              opacity: (posting || !replyBody.trim()) ? 0.4 : 1,
            }}
            data-testid="reply-send"
            aria-label="إرسال"
          >
            <Send size={18} strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ReplyCard({ reply }) {
  const initial = (reply.author_name || reply.author_id || "?").charAt(0).toUpperCase();
  return (
    <div style={styles.replyCard}>
      <div style={styles.replyTop}>
        <div style={styles.avatarSm}>{initial}</div>
        <div style={{ flex: 1, textAlign: "right", minWidth: 0 }}>
          <div style={styles.replyAuthor}>{reply.author_name || "مستخدم"}</div>
          <div style={styles.postMetaTop}>
            <Clock size={10} strokeWidth={2.2} />
            <span>{timeAgo(reply.created_at)}</span>
          </div>
        </div>
      </div>
      <p style={styles.replyBody}>{reply.body}</p>
    </div>
  );
}

const styles = {
  postTop: {
    display: "flex",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    background: "#f0fdfa", color: T.primary,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 15, fontWeight: 800,
    flexShrink: 0,
  },
  avatarSm: {
    width: 32, height: 32, borderRadius: 16,
    background: "#f0fdfa", color: T.primary,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 12, fontWeight: 800,
    flexShrink: 0,
  },
  authorName: {
    fontSize: 14, fontWeight: 800, color: T.text,
  },
  postMetaTop: {
    display: "inline-flex", alignItems: "center", gap: 3,
    fontSize: 11, color: T.textMuted, fontWeight: 600, marginTop: 2,
  },
  catPill: {
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "4px 10px", borderRadius: T.radiusPill,
    background: "#f0fdfa", color: T.primary,
    fontSize: 11, fontWeight: 800, whiteSpace: "nowrap",
  },
  postTitle: {
    fontSize: 20, fontWeight: 900, color: T.textStrong,
    textAlign: "right", margin: "0 0 10px", letterSpacing: "-0.01em",
  },
  postBody: {
    fontSize: 15, color: T.text, lineHeight: 1.85, textAlign: "right",
    margin: "0 0 14px", whiteSpace: "pre-wrap",
  },
  actionsRow: {
    display: "flex", flexDirection: "row-reverse", gap: 10,
    paddingTop: 12, borderTop: `1px solid ${T.divider}`,
    alignItems: "center",
  },
  actionBtn: {
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "7px 14px", borderRadius: T.radiusPill,
    borderWidth: 1.5, borderStyle: "solid",
    fontSize: 13, fontWeight: 800, cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.15s",
  },
  stat: {
    display: "inline-flex", alignItems: "center", gap: 4,
    fontSize: 12, color: T.textMuted, fontWeight: 700,
  },
  emptyReplies: {
    padding: 20, background: T.surface,
    borderRadius: T.radiusMd, border: `1px solid ${T.border}`,
    color: T.textMuted, textAlign: "center", fontSize: 13,
  },
  replyCard: {
    background: T.surface, border: `1px solid ${T.border}`,
    borderRadius: T.radius, padding: 12,
  },
  replyTop: {
    display: "flex", flexDirection: "row-reverse",
    alignItems: "center", gap: 8, marginBottom: 8,
  },
  replyAuthor: {
    fontSize: 12, fontWeight: 800, color: T.text,
  },
  replyBody: {
    fontSize: 14, color: T.text, lineHeight: 1.7,
    textAlign: "right", margin: 0, whiteSpace: "pre-wrap",
  },
  composer: {
    position: "fixed", bottom: 78, left: 0, right: 0,
    background: T.surface, borderTop: `1px solid ${T.border}`,
    padding: "10px 12px",
    zIndex: 40,
  },
  composerInner: {
    maxWidth: 900, margin: "0 auto",
    display: "flex", flexDirection: "row-reverse",
    gap: 8, alignItems: "center",
  },
  composerInput: {
    flex: 1, padding: "11px 14px",
    border: `1.5px solid ${T.border}`, borderRadius: T.radiusPill,
    fontSize: 14, background: T.bgAlt, color: T.text,
    fontFamily: "inherit", textAlign: "right", outline: "none",
  },
  sendBtn: {
    background: T.primary, color: T.textInverse,
    border: "none", width: 40, height: 40, borderRadius: 20,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", fontFamily: "inherit",
    transition: "opacity 0.15s",
  },
};
