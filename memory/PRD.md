# طير (Tair) — Product Requirements & Status

## 🎯 Vision
Saudi Arabia's most trusted classifieds + carrier network for birds and pets.
User model = Haraj-style: post listing → chat/WhatsApp → carrier trip → face-to-face exchange.

## 🚀 Strategic Journey
- v1: Saqr (Watch-to-Earn) — paused
- v2 (June 2026): طير — bird/pet marketplace + carrier delivery network
- v2.1 (Feb 2026): Pivot from direct-checkout → contact-seller + KYC + WebSocket chat + In-App notifications
- Bundle ID: `com.saqr.rewards`, App name: **طير**

## ✅ Completed

### Backend
- **Models**: `listing`, `trip`, `forum`, `chat`, `listing_comment`, `species` (17 families + 58 species), `tair_report`, `rating`, `order` (deprecated), `kyc_submissions`, `tair_notifications`
- **Routes**:
  - `/api/listings/*` — CRUD + families/species filter + upload-image (R2) + comments + likes
  - `/api/trips/*` — with waypoints + carrier_phone + is_direct
  - `/api/forum/*` — categories, feed, posts, replies, likes
  - `/api/chat/*` — REST (start, threads, messages, mark-read, unread-count) + **WebSocket `/api/chat/ws`** real-time push + typing indicator
  - `/api/tair-notifications/*` — in-app inbox (auto-created on new chat message + KYC decision)
  - `/api/kyc/*` — carrier/shop identity submission + upload-doc + admin review
- **Data cleanup (Feb 26, 2026)**: Deleted all fake test listings, trips, chats, notifications from DB.
- **Bug fix**: `models/listing.py` had duplicate `Optional` field overrides in `ListingCreate` — fixed. Timestamps now persist on new listings.

### Web Frontend (React MVP)
- **Auto-guest**: no login wall, device-scoped guest_id in localStorage
- **Bottom Nav**: floating semi-transparent pill (5 tabs — السوق, الرحلات, رسائل, المنتدى, حسابي)
- **HomeScreen**:
  - Notifications bell + Messages bell in header
  - Category chips (17 families, lucide icons)
  - Haraj-style row listings with clean divider spacing (matches user's reference image)
- **ListingDetailsScreen**: no more "شراء" — replaced with "راسل البائع" (chat) + WhatsApp + Like + Comments section
- **MessagesScreen + ChatThreadScreen**: WebSocket real-time messages, typing indicator, unread badges
- **NotificationsScreen**: in-app inbox with per-type icons, mark-read + read-all
- **KycScreen**: role selector (carrier/shop), ID upload (front/back/selfie/business), status view (pending/approved/rejected)
- **ProfileScreen**: KYC menu link, Privacy, Terms, Support, Delete account
- **Deleted**: `CheckoutScreen.jsx`, `OrderDetailsScreen.jsx`, `RateOrderScreen.jsx`, `OrdersScreen.jsx` (deprecated by pivot)
- **Testing (iteration_18)**: 15/15 backend + 100% frontend pass

## 🔧 Files of Reference
- `/app/backend/routes/chat_routes.py` — REST + WebSocket + notification fanout
- `/app/backend/routes/tair_notifications_routes.py`
- `/app/backend/routes/kyc_routes.py`
- `/app/backend/routes/listings_routes.py`
- `/app/frontend/src/tair/TairShell.jsx` — global WebSocket + overlays
- `/app/frontend/src/tair/HomeScreen.jsx` — categories + row listings + bells
- `/app/frontend/src/tair/MessagesScreen.jsx` — WS + typing indicator
- `/app/frontend/src/tair/KycScreen.jsx` (new)
- `/app/frontend/src/tair/NotificationsScreen.jsx` (new)

## 🚧 Backlog (P1/P2)
- P1: Admin panel screen to review KYC submissions + approve/reject
- P1: Send FCM/APNS push notifications (backend already has helpers; needs device-token registration wired to Expo/FCM on future mobile builds)
- P2: Voice/video call from chat thread
- P2: Auctions, Subscriptions, Insurance (frozen per user request)
- P2: Refactor: shared `db` module (chat/kyc/notifs each open own Motor client)
- P2: Split server.py routers into `routers/__init__.py` list

## 🔐 Admin
- Email: `sky-321@hotmail.com` | user_id: `user_93fd2a08e40e` | super_admin

## 📦 Build History
| Build | Version | Status | Notes |
|-------|---------|--------|-------|
| 131 | 7.3.2 | Live TestFlight | Last Saqr build |
| — | 8.0.0 | ⏸ NOT TRIGGERED | Awaiting explicit "ابنِ" |

## ⚠️ Rules
- **DO NOT** trigger EAS build unless user explicitly says "ابنِ" / "build now"
- Web preview only for testing
- Language: Arabic (RTL)
