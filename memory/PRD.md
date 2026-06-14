# Saqr App - Product Requirements & Status

## 🔖 Current State (June 14, 2026)

### ✅ Live on TestFlight
- **Version**: 7.3.2 (Build 131)
- **Build ID**: `846cbcad-fea8-44a8-b7be-16c2d48a3fc2`
- **Bundle ID**: com.saqr.rewards
- **ASC App ID**: 6758868843
- **Submitted**: 2026-06-14 10:06 UTC ✅ FINISHED

### 🔐 Verification
- ✅ Maroof verified: Registration No. **0000294044**
- ✅ Apple Sign-In, Apple IAP (12 gifts) live

### 🎯 Key Architecture
- **Mobile**: React Native (Expo SDK 53) + react-native-iap + AdMob
- **Backend**: FastAPI + MongoDB
- **Web**: React + Tailwind
- **Plugin**: `withFmtPodfileFix.js` to handle Xcode 26 `fmt::consteval` issue

### 🛡️ Admin
- Email: `sky-321@hotmail.com`
- user_id: `user_93fd2a08e40e`
- admin id: `admin_e014ed8981b8`
- Role: `super_admin`
- Hidden trigger: tap version number 7 times on Profile screen

### 💰 Revenue Sources
1. Apple IAP (12 gifts, 5–500 SAR each)
2. Google AdMob (rewarded ads) — ⚠️ suspended, appeal pending
3. Personal advertiser system (paid promotions)
4. Gem-to-cash exchange (500 gems = 3 SAR)

## 📦 Build History
| Build | Version | Status | Notes |
|-------|---------|--------|-------|
| 121 | 7.3.0 | Live on TestFlight | Original AdMob with custom backgrounds |
| 124 | 7.3.1 | Submitted | Maroof badge + minor fixes |
| 131 | **7.3.2** | ✅ **FINISHED** | Xcode 26 SDK + fmt fix + AdMob reverted + settings fix |

## 🔧 Files of Reference
- `/app/mobile/plugins/withFmtPodfileFix.js` - Critical Xcode 26 fix
- `/app/mobile/app.json` - Expo config (version: 7.3.2, build: 131)
- `/app/mobile/eas.json` - EAS build config
- `/app/mobile/src/screens/ProfileScreen.js` - 7-tap admin trigger + menu
- `/app/mobile/src/screens/AdViewerScreen.js` - AdMob screen (restored to pre-update state)
- `/app/mobile/src/screens/GiftStoreScreen.js` - Gift store (icons centered)
- `/app/mobile/src/components/GiftPickerModal.js` - Gift picker (icons centered)
- `/app/backend/routes/clips_routes.py` - Admin permission fix in `_is_admin`

## 🚧 Pending (P0)
- [ ] Moyasar payment gateway integration (waiting for contract approval)
- [ ] Gem withdrawal atomic deduction
- [ ] Google AdSense appeal response

## 🚀 Pending (P1)
- [ ] KYC flow for gem withdrawals
- [ ] Maroof DNS TXT verification (current meta-tag blocked by Cloudflare JS challenge)

## 🎨 Backlog (P2/P3)
- AR Filters for Reels
- Background Music for Reels
- Live Streaming (Agora)
- Stripe Connect for automated payouts (when applicable)
