# طير (Tair) — Product Requirements & Status

## 🎯 Vision
Saudi Arabia's most trusted marketplace and logistics network for birds and pets.

## 🚀 Strategic Pivot Journey
- **v1**: Saqr (Watch-to-Earn) — paused
- **v2 (June 2026)**: طير — bird/pet marketplace + carrier delivery network
- Bundle ID: `com.saqr.rewards`, App name: **طير**

## ✅ Completed

### Backend (Phase 0 → Phase 2)
- **7 Models**: `listing`, `trip`, `order`, `rating`, `tair_report`, `species` (with `family` field)
- **7 Route groups**: listings (+upload-image), trips, orders, ratings, tair-reports, species (+families)
- **Species taxonomy** (Feb 26, 2026): 25 species grouped into 10 families — canaries, finches, parrots, falcons, pigeons, songbirds, cats_dogs, small_mammals, reptiles, fish
- **Listings feed** now supports `family` filter (resolves to species_ids server-side)
- Fixed `cursor.to_list()` async iteration bugs (iteration_16)
- R2-backed image upload endpoint with local fallback

### Web Frontend — Tair MVP + Professional Design v2 (Feb 26, 2026)
- **Auto-guest**: no more login wall — device-scoped guest id on first load. Auth optional from Profile.
- **New Theme (v2)**: teal-based professional palette (`T` tokens), refined spacing, cleaner borders, subtle shadows
- **Shared UI Kit** (`TairUI.jsx`): TopBar, BottomSheet, SelectorItem, FilterChipButton, SearchField, EmptyState, StatusPill, InjectAnimations
- **Zero emojis**: all icons use lucide-react SVGs (Bird, Truck, Package, User, Star, Heart, MapPin, Bird, Music2, Feather, Wind, Egg, Music, Cat, Rabbit, Shell, Fish, ShoppingBag, Store, HeartPulse, Syringe, Fingerprint, Palette, Tag, Calendar, Clock, ShieldCheck, FileText, HelpCircle, Trash2, LogIn, LogOut, ChevronLeft, ArrowRight, Check, X, Plus…)
- **HomeScreen**:
  - Full-page gradient background (mint→cyan→sky)
  - 200×200 prominent logo box at top
  - Filters → Bottom-Sheet pickers (city + family) — no more inline chip rows
  - Haraj-style row listings: image on left, teal title, SAR symbol ﷼, meta chips, owner + avatar row
- **Bottom Nav**: 4 lucide tabs, active state pill, home indicator bar
- **Onboarding**, **Trips**, **Orders**, **Profile**, **Listing Details**, **Checkout**, **Order Details** (5-step timeline), **Rate Order** (lucide stars) — all redesigned
- **Privacy Policy** & **Terms of Service** — fully redesigned with lucide hero icons, matching app theme
- **Testing (iteration_17)**: 16/16 checks 100% pass

## 🔧 Files of Reference
- `/app/backend/models/species.py` (with FAMILIES metadata)
- `/app/backend/routes/species_routes.py` (+ `/families`)
- `/app/backend/routes/listings_routes.py` (+ family filter, + upload-image)
- `/app/frontend/src/tair/*.jsx` (12 screens + UI kit)
- `/app/frontend/src/App.js` (auto-guest bootstrap)
- `/app/frontend/src/pages/{PrivacyPolicy,TermsOfService}.jsx`

## 🚧 Next (P1)
- Real chat wiring between order parties
- KYC upload for carriers/shops (backend model exists)
- Notifications (FCM/APNS) for matching trips + order updates
- Admin panel for report review & species catalog editor

## 🛡️ Compliance
- Species `is_prohibited` + `requires_cites_permit` flags
- Auto-flag on 3+ reports or prohibited species

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
