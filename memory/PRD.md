# طير (Tair) — Product Requirements & Status

## 🎯 Vision
Saudi Arabia's most trusted marketplace and logistics network for birds and pets.  
Trust > features. Simple UX. Compliance from day 1. Free MVP.

## 🚀 Strategic Pivot (June 14, 2026)
- Previously: **Saqr** — Watch-to-Earn app (paused for Google AdMob suspension).
- Now: **طير (Tair)** — Bird/pet marketplace + carrier delivery network.
- Bundle ID kept: `com.saqr.rewards` (updates to existing users via app store update).
- New app name: **طير** (Arabic only).

## 🎨 Brand
- Logo: 5 colorful cartoon birds in a semi-circle above the Arabic word "طير" in playful gradient calligraphy on mint→cyan pastel background.
- Colors: mint (#c8fce6), cyan (#7dd3fc), fresh green (#84cc16), sunny yellow (#fde047), primary emerald (#10b981).
- See `/app/design_guidelines.md` for the full palette + typography rules.

## ✅ Completed (Phase 0 + Phase 1B)

### Backend
- **6 Models**: `listing`, `trip`, `order`, `rating`, `tair_report`, `species`.
- **6 Route groups** registered in `server.py`:
  - `POST /api/listings/create`, `GET /api/listings/feed`, `PATCH /api/listings/{id}`, favorites
  - `POST /api/trips/create`, `GET /api/trips/list`, status transitions
  - `POST /api/orders/create` + full state machine (accept/transit/deliver/complete/cancel/dispute)
  - `POST /api/ratings/create` + auto-recompute avg
  - `POST /api/tair-reports/create` + admin resolve
  - `GET /api/species/list` (13 birds + 6 mammals/other, seeded on first call)
- Auto-flag prohibited species + 3+ report auto-flag on listings.
- End-to-end curl test PASSED: create listing → create trip → create order → carrier accept → transit → delivered → completed → 5⭐ rating → report submitted.

### Mobile (Tair MVP)
- **New tab navigation** (4 tabs): الرئيسية / الرحلات / طلباتي / حسابي.
- **New screens**:
  - `ListingsFeedScreen` — feed + search + city filter + species chips.
  - `CreateListingScreen` — full seller flow (images, health, price, location).
  - `ListingDetailsScreen` — gallery, specs, health box, favorite, share, report.
  - `TripsScreen` — trip list + filters + create-trip modal.
  - `OrdersScreen` — orders list with role filter (buyer/seller/carrier).
  - `BottomNav` — clean 4-tab component, emerald active state.
- **Kept**: Auth, Onboarding, Profile, UserProfile, Settings, Support, PrivateMessages, GlobalChat.
- **Deleted**: AdViewer, Clips, Gifts (all), Achievements, Fortunes, Advertiser, Home (old), Friends, Trending.
- **App.js**: rewritten from 1056 lines → 248 lines, forced RTL, cleaner navigation.
- **App identity**: `expo.name = "طير"`, icon replaced with new AI-generated logo.

## 🔧 Files of Reference
- `/app/backend/models/{listing,trip,order,rating,tair_report,species}.py`
- `/app/backend/routes/{listings,trips,orders,ratings,tair_reports,species}_routes.py`
- `/app/mobile/src/screens/{ListingsFeed,CreateListing,ListingDetails,Trips,Orders}Screen.js`
- `/app/mobile/src/services/tairApi.js`
- `/app/mobile/src/components/BottomNav.js`
- `/app/mobile/App.js` (root)
- `/app/design_guidelines.md`

## 🚧 Next (P0 — for the very next iteration)
- **Order details screen** with status timeline + actions (accept/transit/deliver/complete).
- **Trip details screen** with status transitions for carrier.
- **Rate-after-completion screen** (mandatory rating flow).
- **Onboarding update** — teach the 3 roles (buyer/seller/carrier).
- **Profile update** — show `active_roles`, ratings, KYC status, my listings + my trips.
- **Chat wiring**: `openChat(sellerId)` currently creates a modal — needs proper convo bootstrap.

## 🚧 Next (P1)
- Notifications (FCM/APNS) on: matching trips, order status updates, new messages, ratings received.
- KYC screen for carriers/shops.
- Admin dashboard: report review + prohibited species catalog editor.
- Real image upload endpoint for Tair listings (currently reusing `/api/clips/upload-media`).

## 🚧 Deferred to Phase 2
- Auctions, community feed, subscriptions, insurance, cross-country expansion.
- Payments (no IAP, no Stripe until user demand justifies it).
- Wholesale supplier tools.

## 🛡️ Compliance & Safety
- Terms of Use (draft pending) — platform is intermediary; no responsibility for animal condition.
- Report reasons include `prohibited_species` (CITES-flagged species).
- Species catalog has `is_prohibited` and `requires_cites_permit` flags per entry.

## 🔐 Admin
- Email: `sky-321@hotmail.com`
- user_id: `user_93fd2a08e40e`
- Role: `super_admin`
- Trigger: 7 taps on version number in Profile.

## 📦 Build History
| Build | Version | Status | Notes |
|-------|---------|--------|-------|
| 131 | 7.3.2 | Live on TestFlight | Last Saqr build (before pivot) |
| — | 8.0.0 | Pending | First Tair build — not yet triggered per user request |
