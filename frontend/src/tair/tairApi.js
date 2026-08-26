// طير — Tair API client (backend base uses /api prefix via REACT_APP_BACKEND_URL)
import axios from "axios";

const BASE = process.env.REACT_APP_BACKEND_URL;

const client = axios.create({
  baseURL: `${BASE}/api`,
  withCredentials: true,
});

export const tairApi = {
  // Species catalog
  listSpecies: async (category, family) => {
    const { data } = await client.get("/species/list", { params: { category, family } });
    return data.items || [];
  },
  listFamilies: async () => {
    const { data } = await client.get("/species/families");
    return data.items || [];
  },

  // Listings
  feedListings: async (params = {}) => {
    const { data } = await client.get("/listings/feed", { params });
    return data;
  },
  getListing: async (id, viewerId) => {
    const { data } = await client.get(`/listings/${id}`, {
      params: { viewer_id: viewerId },
    });
    return data;
  },
  createListing: async (payload, userId) => {
    const { data } = await client.post("/listings/create", payload, {
      params: { user_id: userId },
    });
    return data;
  },
  listingsBySeller: async (sellerId, includeAll = false) => {
    const { data } = await client.get(`/listings/seller/${sellerId}`, {
      params: { include_all: includeAll },
    });
    return data.items || [];
  },
  toggleFavorite: async (listingId, userId) => {
    const { data } = await client.post(
      `/listings/${listingId}/favorite`,
      null,
      { params: { user_id: userId } },
    );
    return data;
  },
  myFavorites: async (userId) => {
    const { data } = await client.get("/listings/favorites/me", {
      params: { user_id: userId },
    });
    return data.items || [];
  },
  uploadImage: async (file, userId) => {
    const form = new FormData();
    form.append("file", file);
    form.append("user_id", userId);
    const { data } = await client.post("/listings/upload-image", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.url;
  },

  // Trips
  listTrips: async (params = {}) => {
    const { data } = await client.get("/trips/list", { params });
    return data;
  },
  getTrip: async (tripId) => {
    const { data } = await client.get(`/trips/${tripId}`);
    return data;
  },
  createTrip: async (payload, userId) => {
    const { data } = await client.post("/trips/create", payload, {
      params: { user_id: userId },
    });
    return data;
  },
  tripsByCarrier: async (carrierId, includeCompleted = false) => {
    const { data } = await client.get(`/trips/carrier/${carrierId}`, {
      params: { include_completed: includeCompleted },
    });
    return data.items || [];
  },
  updateTripStatus: async (tripId, status, note, userId) => {
    const { data } = await client.patch(
      `/trips/${tripId}/status`,
      { status, note },
      { params: { user_id: userId } },
    );
    return data;
  },

  // Orders
  createOrder: async (payload, userId) => {
    const { data } = await client.post("/orders/create", payload, {
      params: { user_id: userId },
    });
    return data;
  },
  getOrder: async (orderId, userId) => {
    const { data } = await client.get(`/orders/${orderId}`, {
      params: { user_id: userId },
    });
    return data;
  },
  ordersByUser: async (userId, role = "all", status) => {
    const { data } = await client.get(`/orders/user/${userId}`, {
      params: { role, status },
    });
    return data.items || [];
  },
  orderAction: async (orderId, action, userId, extra = {}) => {
    const { data } = await client.post(`/orders/${orderId}/${action}`, null, {
      params: { user_id: userId, ...extra },
    });
    return data;
  },

  // Ratings
  createRating: async (payload, userId) => {
    const { data } = await client.post("/ratings/create", payload, {
      params: { user_id: userId },
    });
    return data;
  },
  ratingsForUser: async (userId, role) => {
    const { data } = await client.get(`/ratings/user/${userId}`, {
      params: { role },
    });
    return data.items || [];
  },

  // Reports
  reportListing: async (listingId, reason, note, userId) => {
    const { data } = await client.post(
      "/tair-reports/create",
      { target_type: "listing", target_id: listingId, reason, note },
      { params: { user_id: userId } },
    );
    return data;
  },

  // Forum
  forumCategories: async () => {
    const { data } = await client.get("/forum/categories");
    return data.items || [];
  },
  forumFeed: async (params = {}) => {
    const { data } = await client.get("/forum/feed", { params });
    return data;
  },
  forumCreatePost: async (payload, userId) => {
    const { data } = await client.post("/forum/create", payload, {
      params: { user_id: userId },
    });
    return data;
  },
  forumGetPost: async (postId, viewerId) => {
    const { data } = await client.get(`/forum/post/${postId}`, {
      params: { viewer_id: viewerId },
    });
    return data;
  },
  forumListReplies: async (postId) => {
    const { data } = await client.get(`/forum/post/${postId}/replies`);
    return data.items || [];
  },
  forumReply: async (postId, body, userId, authorName) => {
    const { data } = await client.post(
      `/forum/post/${postId}/reply`,
      { body, author_name: authorName },
      { params: { user_id: userId } },
    );
    return data;
  },
  forumToggleLike: async (postId, userId) => {
    const { data } = await client.post(`/forum/post/${postId}/like`, null, {
      params: { user_id: userId },
    });
    return data;
  },

  // Listing comments
  listingComments: async (listingId) => {
    const { data } = await client.get(`/listings/${listingId}/comments`);
    return data.items || [];
  },
  addListingComment: async (listingId, body, userId, authorName) => {
    const { data } = await client.post(
      `/listings/${listingId}/comment`,
      { body, author_name: authorName },
      { params: { user_id: userId } },
    );
    return data;
  },
  toggleCommentLike: async (commentId, userId) => {
    const { data } = await client.post(
      `/listings/comment/${commentId}/like`,
      null,
      { params: { user_id: userId } },
    );
    return data;
  },

  // Chat / Direct Messages
  chatStart: async (payload, userId) => {
    const { data } = await client.post("/chat/start", payload, {
      params: { user_id: userId },
    });
    return data;
  },
  chatThreads: async (userId) => {
    const { data } = await client.get("/chat/threads", {
      params: { user_id: userId },
    });
    return data.items || [];
  },
  chatMessages: async (threadId, userId) => {
    const { data } = await client.get(`/chat/thread/${threadId}/messages`, {
      params: { user_id: userId },
    });
    return data.items || [];
  },
  chatSend: async (threadId, body, userId, senderName) => {
    const { data } = await client.post(
      `/chat/thread/${threadId}/message`,
      { body, sender_name: senderName },
      { params: { user_id: userId } },
    );
    return data;
  },
  chatMarkRead: async (threadId, userId) => {
    await client.post(`/chat/thread/${threadId}/read`, null, {
      params: { user_id: userId },
    });
  },
  chatUnreadCount: async (userId) => {
    const { data } = await client.get("/chat/unread-count", {
      params: { user_id: userId },
    });
    return data.count || 0;
  },

  // Notifications
  myNotifications: async (userId, limit = 50) => {
    const { data } = await client.get("/tair-notifications/list", {
      params: { user_id: userId, limit },
    });
    return data;
  },
  markNotifRead: async (notifId, userId) => {
    await client.post(`/tair-notifications/${notifId}/read`, null, {
      params: { user_id: userId },
    });
  },
  markAllNotifsRead: async (userId) => {
    await client.post("/tair-notifications/read-all", null, {
      params: { user_id: userId },
    });
  },

  // KYC
  getKyc: async (userId) => {
    const { data } = await client.get("/kyc/me", { params: { user_id: userId } });
    return data;
  },
  submitKyc: async (payload, userId) => {
    const { data } = await client.post("/kyc/submit", payload, {
      params: { user_id: userId },
    });
    return data;
  },
  uploadKycDoc: async (file, userId, docType) => {
    const form = new FormData();
    form.append("file", file);
    form.append("user_id", userId);
    form.append("doc_type", docType);
    const { data } = await client.post("/kyc/upload-doc", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.url;
  },
};

export const SAUDI_CITIES = [
  // Riyadh region
  "الرياض", "الدرعية", "الخرج", "المجمعة", "الدوادمي", "القويعية", "وادي الدواسر",
  "الأفلاج", "الزلفي", "شقراء", "حوطة بني تميم", "عفيف", "السليل", "ضرما",
  "الحريق", "رماح", "ثادق", "الغاط", "حريملاء", "المزاحمية",
  // Makkah region
  "مكة المكرمة", "جدة", "الطائف", "رابغ", "القنفذة", "الليث", "الجموم", "الكامل",
  "تربة", "الخرمة", "رنية", "ميسان", "أضم",
  // Madinah region
  "المدينة المنورة", "ينبع", "العلا", "بدر", "المهد", "الحناكية", "خيبر", "وادي الفرع",
  // Eastern region
  "الدمام", "الخبر", "الظهران", "الأحساء", "الجبيل", "القطيف", "حفر الباطن",
  "رأس تنورة", "بقيق", "النعيرية", "الخفجي", "قرية العليا",
  // Asir region
  "أبها", "خميس مشيط", "بيشة", "النماص", "محايل عسير", "تنومة", "رجال ألمع",
  "بلقرن", "ظهران الجنوب", "سراة عبيدة", "أحد رفيدة",
  // Jazan region
  "جازان", "صبيا", "أبو عريش", "صامطة", "بيش", "أحد المسارحة", "الحرث",
  "ضمد", "فيفا", "الدرب", "الريث", "الطوال",
  // Najran region
  "نجران", "شرورة", "حبونا", "بدر الجنوب", "يدمة", "خباش", "ثار",
  // Al-Baha region
  "الباحة", "بلجرشي", "المندق", "المخواة", "قلوة", "العقيق", "القرى",
  // Tabuk region
  "تبوك", "أملج", "الوجه", "ضباء", "تيماء", "حقل", "البدع",
  // Hail region
  "حائل", "بقعاء", "الشنان", "الغزالة", "الحائط", "موقق", "السليمي",
  // Northern Borders region
  "عرعر", "رفحاء", "طريف", "العويقيلة",
  // Qassim region
  "بريدة", "عنيزة", "الرس", "المذنب", "البدائع", "الأسياح", "رياض الخبراء",
  "البكيرية", "الفيصلية", "دلفى", "عيون الجواء", "الشماسية",
];

// Gulf countries (delivery to/from — country level only, no cities)
export const GULF_COUNTRIES = [
  "الإمارات العربية المتحدة",
  "البحرين",
  "قطر",
  "الكويت",
  "سلطنة عمان",
];

// Combined list for pickers (Saudi cities + Gulf countries)
export const ALL_LOCATIONS = [...SAUDI_CITIES, ...GULF_COUNTRIES];

export const ORDER_STATUS_LABEL = {
  pending: "بانتظار الموصّل",
  accepted_by_carrier: "قبل الموصّل",
  in_transit: "في الطريق",
  delivered: "تم التسليم",
  completed: "مكتمل",
  disputed: "نزاع",
  cancelled: "ملغى",
};

export const ORDER_STATUS_COLOR = {
  pending: "#f59e0b",
  accepted_by_carrier: "#0891b2",
  in_transit: "#3b82f6",
  delivered: "#10b981",
  completed: "#065f46",
  disputed: "#dc2626",
  cancelled: "#64748b",
};

export const TRIP_STATUS_LABEL = {
  scheduled: "مجدولة",
  departed: "انطلقت",
  in_transit: "في الطريق",
  arrived: "وصلت",
  completed: "مكتملة",
  cancelled: "ملغاة",
};

export default tairApi;
