# طير (Tair) — Product Requirements & Status

## 🎯 Vision
Saudi Arabia's most trusted marketplace and logistics network for birds and pets.  
Trust > features. Simple UX. Compliance from day 1. Free MVP.

## 🚀 Strategic Pivot (June 14, 2026)
- Previously: **Saqr** — Watch-to-Earn app (paused for Google AdMob suspension).
- Now: **طير (Tair)** — Bird/pet marketplace + carrier delivery network.
- Bundle ID kept: `com.saqr.rewards`. New app name: **طير**.

## 🎨 Brand
- Logo: 5 colorful cartoon birds in a semi-circle above "طير" in gradient calligraphy on mint→cyan background.
- Colors: mint (#c8fce6), cyan (#7dd3fc), emerald (#065f46), turquoise (#06b6d4), yellow (#fde047).
- See `/app/design_guidelines.md`.

## ✅ Completed

### Backend (Phase 0 + Phase 1B)
- **6 Models**: `listing`, `trip`, `order`, `rating`, `tair_report`, `species`.
- **6 Route groups**: listings, trips, orders (state machine), ratings, tair-reports, species.
- **New endpoint (Feb 26, 2026)**: `POST /api/listings/upload-image` — R2-backed image upload with local fallback.
- Auto-flag prohibited species + 3+ report auto-flag on listings.
- **Fix (Feb 26, 2026)**: Corrected `cursor.to_list()` misuse in `ratings_routes.py`, `tair_reports_routes.py`, `orders_routes.py` — was throwing 500s.
- Backend E2E via curl PASSED (iteration_15).

### Mobile (Tair MVP)
- 4-tab navigation, all core screens created. **Builds paused per user instruction.**

### Web Frontend — Tair MVP (Feb 26, 2026)
- **`/app/frontend/src/App.js`**: rewritten to route through Tair experience.
- **`/app/frontend/src/tair/`** — new modular directory:
  - `TairShell.jsx`: authenticated shell (bottom nav + overlay stack)
  - `TairBottomNav.jsx`: 4-tab nav (السوق / الرحلات / طلباتي / حسابي)
  - `HomeScreen.jsx`: listings feed + city/species chips + search
  - `TripsScreen.jsx`: trips list + create-trip modal + from/to filters
  - `OrdersScreen.jsx`: orders list with buyer/seller/carrier tabs
  - `ProfileScreen.jsx`: avatar, stats (⭐seller / ⭐carrier), my listings / trips / ratings
  - `ListingDetailsScreen.jsx`: gallery, specs, health box, favorite, checkout, report modal
  - `CheckoutScreen.jsx`: pick trip + agreed price + create order
  - `OrderDetailsScreen.jsx`: 5-step status timeline + role-aware actions
  - `RateOrderScreen.jsx`: mandatory rating flow (multi-role in one screen)
  - `OnboardingScreen.jsx`: 3 role explainer (buyer/seller/carrier)
  - `tairApi.js`: axios wrapper for all Tair endpoints
  - `tairTheme.js`: shared T/S design tokens
- **`AuthPage.jsx`**: rebranded (logo, title, tagline) to Tair.
- **Testing (iteration_16)**: 100% frontend pass, guest browse flows all work; backend cursor.to_list bug fixed and re-tested.

## 🔧 Files of Reference
- `/app/backend/models/{listing,trip,order,rating,tair_report,species}.py`
- `/app/backend/routes/{listings,trips,orders,ratings,tair_reports,species}_routes.py`
- `/app/frontend/src/tair/*.jsx` (new web MVP)
- `/app/frontend/src/App.js`
- `/app/mobile/src/screens/{ListingsFeed,CreateListing,ListingDetails,Trips,Orders}Screen.js`

## 🚧 Next (P1)
- KYC screen for carriers/shops (backend model exists; UI pending).
- Real chat wiring between order parties (currently identifies parties but no in-app messaging).
- Notifications (FCM/APNS): matching trips, order status changes, ratings received.
- Admin panel for report review + prohibited species catalog editor.
- Registered-user flow polish (currently guest can only browse — need auth-guarded UX hints for write actions).

## 🚧 Deferred to Phase 2
- Auctions, community feed, subscriptions, insurance, cross-country expansion.
- Payments (no IAP, no Stripe until user demand justifies it).
- Wholesale supplier tools.

## 🛡️ Compliance & Safety
- Report reasons include `prohibited_species` (CITES-flagged).
- Species catalog has `is_prohibited` and `requires_cites_permit` flags per entry.

## 🔐 Admin
- Email: `sky-321@hotmail.com` | user_id: `user_93fd2a08e40e` | Role: `super_admin`.

## 📦 Build History
| Build | Version | Status | Notes |
|-------|---------|--------|-------|
| 131 | 7.3.2 | Live on TestFlight | Last Saqr build |
| — | 8.0.0 | ⏸ NOT TRIGGERED | Awaiting explicit user "ابنِ" command |

## ⚠️ Rules
- **DO NOT** trigger any EAS build until user explicitly says "ابنِ" / "build now".
- All work continues on Web frontend for preview.
