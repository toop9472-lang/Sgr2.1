# صقر - Saqr App PRD

## Application Status: ✅ BUG FIXES COMPLETED - READY FOR RE-BUILD

---

## What's Implemented (Complete)

### Games (12 total - Millionaire hidden temporarily)
1. AI Quest - تحدي الذكاء الاصطناعي
2. الشطرنج - Chess (قطع موحدة بتصميم احترافي)
3. إكس أو - Tic Tac Toe
4. الذاكرة - Memory Match
5. الثعبان - Snake (Touch Control + 4 levels)
6. أسئلة ثقافية - Trivia
7. تركيب الصور - Puzzle (صور AI جديدة)
8. الألغاز - Riddles
9. تكسير الطوب - Brick Breaker (10 levels)
10. سباق الحساب - Math Race
11. سباق الكلمات - Word Race
12. تبديل الألوان - Color Switch

### Features
- ✅ Authentication (Email, Google, Apple)
- ✅ Ad Viewing & Rewards
- ✅ Points, Diamonds, Saqr Gems Economy
- ✅ Daily Streak System (7 days)
- ✅ Referral System (100 pts/referral)
- ✅ Leaderboard (Daily/Weekly/All)
- ✅ Global Chat
- ✅ Friends System
- ✅ Shop with AI-generated Images (6 diamond packages)
- ✅ Achievements (مبني على الإعلانات والمشاركة)
- ✅ Challenges
- ✅ Profile & Settings (مع زر تسجيل خروج)

---

## Bug Fixes Completed (March 3, 2026)

### 1. صفحة تسجيل الدخول ✅
- Fixed login flow to show login page
- Email login works correctly
- Added logout button in Settings

### 2. قطع الشطرنج ✅
- Unified chess piece design (same Unicode characters)
- White pieces: #FFFFFF with black shadow
- Black pieces: #1a1a1a with gray shadow

### 3. لعبة البازل ✅
- Replaced Unsplash images with AI-generated images
- 4 new themes: غروب الشمس, الجبال, القطة, الزهور

### 4. المتجر ✅
- Added AI-generated diamond package images
- 6 packages with professional gem/diamond designs

### 5. الإنجازات ✅
- Completely rewritten to be based on:
  - مشاهدة الإعلانات (ads_watched)
  - مشاركة التطبيق (app_shares)
  - الإحالات الناجحة (successful_referrals)
- 12 new achievements total

### 6. الإعدادات ✅
- Added logout button
- Theme and language settings working

---

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Email login
- `POST /api/auth/register` - Email registration
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/apple/native` - Apple Sign-In

### Referrals
- `GET /api/referrals/stats`
- `POST /api/referrals/apply`
- `GET /api/referrals/list`

### Ads
- `POST /api/rewarded-ads/start-session`
- `POST /api/rewarded-ads/complete`
- `POST /api/rewarded-ads/sync-pending`

### Leaderboard
- `GET /api/leaderboard?period=daily|weekly|allTime`

---

## Upcoming Tasks (P0)

1. **Build new app version**
   - iOS: `eas build --platform ios --profile production`
   - Android: `eas build --platform android --profile production`

2. **Submit to stores**
   - iOS: `eas submit --platform ios`
   - Android: Manual upload to Google Play Console

---

## Future Tasks (P1/P2)

### P1 - High Priority
- Fix critical iPad bugs (crashes, UI glitches)
- Get Google Client IDs from user for Google Sign-In
- Make Golden Saqr rewards give diamonds

### P2 - Medium Priority
- Generate AI images for remaining UI elements
- Research third-party game integration
- Sync mobile features to web app
- Refactor hardcoded API URL in mobile/src/api/api.js

### P3 - Low Priority
- Improve game sounds
- Add crash reporting (Sentry)
- Implement Redis caching

---

## Test Credentials
- Email: `demo@saqr.app`
- Password: `Demo123456`

---

## Architecture

```
/app
├── backend/           # FastAPI backend
│   ├── routes/       # API endpoints
│   ├── models/       # Data models
│   └── auth/         # Authentication
├── mobile/           # React Native (Expo)
│   ├── src/
│   │   ├── screens/  # All app screens
│   │   ├── services/ # API, Storage, Context
│   │   ├── components/ # Reusable UI
│   │   └── utils/    # Helpers
│   └── app.json      # Expo config
└── frontend/         # React web app
```

---

## Last Updated
March 3, 2026 - Bug fixes completed, ready for re-build
