// Gifts service — wraps gift catalog + send/receive APIs for the mobile app.
import api from "./api";

let cachedCatalog = null;
let cachedAt = 0;

export const getCatalog = async (force = false) => {
  const now = Date.now();
  if (!force && cachedCatalog && now - cachedAt < 5 * 60 * 1000) {
    return cachedCatalog;
  }
  const r = await api.fetch("/api/gifts/catalog");
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`HTTP ${r.status} — ${text.slice(0, 120) || "no body"}`);
  }
  const data = await r.json();
  cachedCatalog = data;
  cachedAt = now;
  return data;
};

export const sendGift = async ({
  senderId,
  receiverId,
  giftId,
  contextType = "profile",
  contextId,
  message,
  platform,
  transactionId,
  receipt,
}) => {
  const r = await api.fetch("/api/gifts/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sender_id: senderId,
      receiver_id: receiverId,
      gift_id: giftId,
      context_type: contextType,
      context_id: contextId,
      message,
      platform,
      transaction_id: transactionId,
      receipt,
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.detail || "فشل إرسال الهدية");
  return data;
};

export const fetchPending = async (userId) => {
  if (!userId) return { gifts: [], count: 0 };
  try {
    const r = await api.fetch(`/api/gifts/pending/${encodeURIComponent(userId)}`);
    if (!r.ok) return { gifts: [], count: 0 };
    return await r.json();
  } catch (_) {
    return { gifts: [], count: 0 };
  }
};

export const fetchInbox = async (userId, limit = 50) => {
  const r = await api.fetch(
    `/api/gifts/inbox/${encodeURIComponent(userId)}?limit=${limit}`,
  );
  if (!r.ok) return { gifts: [], count: 0 };
  return r.json();
};

export default { getCatalog, sendGift, fetchPending, fetchInbox };
