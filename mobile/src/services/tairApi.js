// طير — Bird marketplace API client
import api from "./api";

// Small helper — always returns JSON or throws.
const req = (path, opts = {}) => api.fetch(path, opts);

// ==================== Species ====================
export const speciesApi = {
  list: (category) =>
    req(`/api/species/list${category ? `?category=${category}` : ""}`),
  get: (id) => req(`/api/species/${id}`),
};

// ==================== Listings ====================
export const listingsApi = {
  feed: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""),
    ).toString();
    return req(`/api/listings/feed${qs ? `?${qs}` : ""}`);
  },

  create: (userId, payload) =>
    req(`/api/listings/create?user_id=${encodeURIComponent(userId)}`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  get: (id, viewerId) =>
    req(
      `/api/listings/${id}${
        viewerId ? `?viewer_id=${encodeURIComponent(viewerId)}` : ""
      }`,
    ),

  update: (id, userId, payload) =>
    req(`/api/listings/${id}?user_id=${encodeURIComponent(userId)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  remove: (id, userId) =>
    req(`/api/listings/${id}?user_id=${encodeURIComponent(userId)}`, {
      method: "DELETE",
    }),

  bySeller: (sellerId, includeAll = false) =>
    req(`/api/listings/seller/${sellerId}?include_all=${includeAll}`),

  toggleFavorite: (id, userId) =>
    req(`/api/listings/${id}/favorite?user_id=${encodeURIComponent(userId)}`, {
      method: "POST",
    }),

  myFavorites: (userId) =>
    req(`/api/listings/favorites/me?user_id=${encodeURIComponent(userId)}`),
};

// ==================== Trips ====================
export const tripsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""),
    ).toString();
    return req(`/api/trips/list${qs ? `?${qs}` : ""}`);
  },
  create: (userId, payload) =>
    req(`/api/trips/create?user_id=${encodeURIComponent(userId)}`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  get: (id) => req(`/api/trips/${id}`),
  byCarrier: (carrierId, includeCompleted = false) =>
    req(`/api/trips/carrier/${carrierId}?include_completed=${includeCompleted}`),
  updateStatus: (id, userId, status, note) =>
    req(`/api/trips/${id}/status?user_id=${encodeURIComponent(userId)}`, {
      method: "PATCH",
      body: JSON.stringify({ status, note }),
    }),
  cancel: (id, userId) =>
    req(`/api/trips/${id}?user_id=${encodeURIComponent(userId)}`, {
      method: "DELETE",
    }),
};

// ==================== Orders ====================
export const ordersApi = {
  create: (userId, payload) =>
    req(`/api/orders/create?user_id=${encodeURIComponent(userId)}`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  get: (id, userId) =>
    req(`/api/orders/${id}?user_id=${encodeURIComponent(userId)}`),
  byUser: (userId, role = "all", status) => {
    const qs = new URLSearchParams({ role });
    if (status) qs.set("status", status);
    return req(`/api/orders/user/${userId}?${qs.toString()}`);
  },
  acceptCarrier: (id, userId) =>
    req(
      `/api/orders/${id}/accept-carrier?user_id=${encodeURIComponent(userId)}`,
      { method: "POST" },
    ),
  startTransit: (id, userId) =>
    req(
      `/api/orders/${id}/start-transit?user_id=${encodeURIComponent(userId)}`,
      { method: "POST" },
    ),
  markDelivered: (id, userId) =>
    req(
      `/api/orders/${id}/mark-delivered?user_id=${encodeURIComponent(userId)}`,
      { method: "POST" },
    ),
  complete: (id, userId) =>
    req(`/api/orders/${id}/complete?user_id=${encodeURIComponent(userId)}`, {
      method: "POST",
    }),
  cancel: (id, userId, note) =>
    req(
      `/api/orders/${id}/cancel?user_id=${encodeURIComponent(userId)}${
        note ? `&note=${encodeURIComponent(note)}` : ""
      }`,
      { method: "POST" },
    ),
  dispute: (id, userId, reason, details) =>
    req(
      `/api/orders/${id}/dispute?user_id=${encodeURIComponent(
        userId,
      )}&reason=${encodeURIComponent(reason)}${
        details ? `&details=${encodeURIComponent(details)}` : ""
      }`,
      { method: "POST" },
    ),
};

// ==================== Ratings ====================
export const ratingsApi = {
  create: (userId, payload) =>
    req(`/api/ratings/create?user_id=${encodeURIComponent(userId)}`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  forUser: (userId, role) =>
    req(`/api/ratings/user/${userId}${role ? `?role=${role}` : ""}`),
};

// ==================== Reports ====================
export const tairReportsApi = {
  create: (userId, payload) =>
    req(`/api/tair-reports/create?user_id=${encodeURIComponent(userId)}`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export default {
  species: speciesApi,
  listings: listingsApi,
  trips: tripsApi,
  orders: ordersApi,
  ratings: ratingsApi,
  reports: tairReportsApi,
};
