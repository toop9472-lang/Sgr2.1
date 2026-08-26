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
};

export const SAUDI_CITIES = [
  "الرياض", "جدة", "مكة", "المدينة", "الدمام", "الأحساء",
  "الطائف", "بريدة", "تبوك", "أبها", "خميس مشيط", "حائل",
  "نجران", "جازان", "الجبيل", "ينبع", "الخبر", "عرعر",
];

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
