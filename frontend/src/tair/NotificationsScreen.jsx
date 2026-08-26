// طير — Notifications screen (in-app inbox)
import React, { useCallback, useEffect, useState } from "react";
import { Bell, MessageCircle, ShoppingBag, ShieldCheck, CheckCheck } from "lucide-react";
import { T, S } from "./tairTheme";
import { tairApi } from "./tairApi";
import { TopBar, EmptyState } from "./TairUI";

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "الآن";
  if (diff < 3600) return `قبل ${Math.floor(diff / 60)} د`;
  if (diff < 86400) return `قبل ${Math.floor(diff / 3600)} س`;
  if (diff < 86400 * 7) return `قبل ${Math.floor(diff / 86400)} يوم`;
  return new Date(iso).toLocaleDateString("ar-SA");
}

const TYPE_META = {
  chat: { Icon: MessageCircle, color: "#0891b2" },
  listing: { Icon: ShoppingBag, color: T.primary },
  kyc_decision: { Icon: ShieldCheck, color: "#059669" },
  default: { Icon: Bell, color: T.textMuted },
};

export default function NotificationsScreen({ user, onBack, onOpenThread, onOpenListing }) {
  const uid = user.id || user.user_id;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tairApi.myNotifications(uid);
      setItems(data.items || []);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => { load(); }, [load]);

  const openItem = async (n) => {
    if (!n.is_read) {
      await tairApi.markNotifRead(n.notif_id, uid).catch(() => {});
    }
    if (n.type === "chat" && n.data?.thread_id) {
      onOpenThread(n.data.thread_id);
    } else if (n.type === "listing" && n.data?.listing_id) {
      onOpenListing(n.data.listing_id);
    } else {
      load();
    }
  };

  const markAll = async () => {
    await tairApi.markAllNotifsRead(uid);
    load();
  };

  return (
    <div style={S.screen} data-testid="notifications-screen">
      <TopBar
        title="الإشعارات"
        onBack={onBack}
        right={
          items.some((n) => !n.is_read) && (
            <button onClick={markAll} style={styles.markAllBtn} data-testid="mark-all-read">
              <CheckCheck size={14} strokeWidth={2.4} />
              <span>قراءة الكل</span>
            </button>
          )
        }
      />

      <div style={S.container}>
        {loading ? (
          <div style={S.loadingText}>جاري التحميل…</div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Bell size={36} strokeWidth={1.5} />}
            title="لا توجد إشعارات بعد"
            desc="ستصلك هنا رسائل جديدة وتحديثات على إعلاناتك ورحلاتك"
          />
        ) : (
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            {items.map((n) => {
              const meta = TYPE_META[n.type] || TYPE_META.default;
              const Icon = meta.Icon;
              return (
                <button
                  key={n.notif_id}
                  onClick={() => openItem(n)}
                  style={{
                    ...styles.card,
                    background: n.is_read ? T.surface : "#f0fdfa",
                    borderColor: n.is_read ? T.border : T.primary + "44",
                  }}
                  data-testid={`notif-${n.notif_id}`}
                >
                  <div style={{ ...styles.icon, background: meta.color + "15", color: meta.color }}>
                    <Icon size={20} strokeWidth={2} />
                  </div>
                  <div style={styles.body}>
                    <div style={styles.rowTop}>
                      <div style={styles.title}>{n.title}</div>
                      <div style={styles.time}>{timeAgo(n.created_at)}</div>
                    </div>
                    <div style={styles.desc}>{n.body}</div>
                  </div>
                  {!n.is_read && <span style={styles.dot} />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  markAllBtn: {
    display: "inline-flex", alignItems: "center", gap: 5,
    background: T.primary, color: T.textInverse, border: "none",
    borderRadius: 999, padding: "6px 12px",
    fontSize: 11, fontWeight: 800, cursor: "pointer",
    fontFamily: "inherit",
  },
  card: {
    position: "relative",
    display: "flex", flexDirection: "row-reverse",
    alignItems: "flex-start", gap: 12,
    padding: 12, border: `1px solid ${T.border}`,
    borderRadius: T.radiusMd, cursor: "pointer",
    fontFamily: "inherit", textAlign: "right", width: "100%",
  },
  icon: {
    width: 40, height: 40, borderRadius: 12,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  body: { flex: 1, minWidth: 0, textAlign: "right" },
  rowTop: {
    display: "flex", flexDirection: "row-reverse",
    justifyContent: "space-between", alignItems: "center", gap: 8,
  },
  title: {
    fontSize: 13, fontWeight: 800, color: T.text,
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
    flex: 1, minWidth: 0,
  },
  time: { fontSize: 10, color: T.textFaint, fontWeight: 700, flexShrink: 0 },
  desc: {
    fontSize: 12, color: T.textMuted, marginTop: 3,
    lineHeight: 1.5,
    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  dot: {
    position: "absolute", top: 12, insetInlineStart: 12,
    width: 8, height: 8, borderRadius: 4, background: T.primary,
  },
};
