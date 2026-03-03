# صقر - Saqr App PRD (Final)

## Application Status: ✅ READY FOR BUILD & SUBMISSION

---

## What's Implemented (Complete)

### Games (13 total)
1. AI Quest - تحدي الذكاء الاصطناعي
2. الشطرنج - Chess (ألوان خشبية)
3. إكس أو - Tic Tac Toe
4. الذاكرة - Memory Match
5. الثعبان - Snake (Touch Control + 4 levels)
6. أسئلة ثقافية - Trivia
7. تركيب الصور - Puzzle
8. الألغاز - Riddles
9. تكسير الطوب - Brick Breaker (10 levels)
10. سباق الحساب - Math Race
11. سباق الكلمات - Word Race
12. تبديل الألوان - Color Switch
13. **من سيربح المليون - Millionaire (NEW)**

### Features
- ✅ Authentication (Email, Google, Apple)
- ✅ Ad Viewing & Rewards
- ✅ Points, Diamonds, Saqr Gems Economy
- ✅ Daily Streak System (7 days)
- ✅ Referral System (100 pts/referral)
- ✅ Leaderboard (Daily/Weekly/All)
- ✅ Global Chat
- ✅ Friends System
- ✅ Shop with IAP
- ✅ Achievements
- ✅ Challenges
- ✅ Profile & Settings

### New Components
```
mobile/src/screens/MillionaireScreen.js
mobile/src/screens/OnboardingScreen.js
mobile/src/screens/LeaderboardScreen.js
mobile/src/components/DailyStreakModal.js
mobile/src/components/SkeletonLoading.js
mobile/src/services/ReferralService.js
mobile/src/services/AdRewardService.js
backend/routes/referrals_routes.py
```

---

## Build Configuration (2026 Compliant)

### eas.json
- iOS: `image: "latest"` (Xcode 26+)
- Android: `targetSdkVersion: 35`
- Production channel ready

### app.json
- Android: targetSdkVersion 35, compileSdkVersion 35
- iOS: Supports iOS 26 SDK
- All plugins configured

---

## API Endpoints

### Authentication
- `POST /api/auth/signin`
- `POST /api/auth/google`
- `POST /api/auth/apple/native`

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

## Rewards Structure

### Referral System
| Role | Points | Diamonds |
|------|--------|----------|
| Referrer | 100 | 10 |
| Referee | 50 | 5 |

### Daily Streak
| Day | Reward |
|-----|--------|
| 1 | 5 points |
| 2 | 10 points |
| 3 | 5 diamonds |
| 4 | 15 points |
| 5 | 10 diamonds |
| 6 | 25 points |
| 7 | 20 diamonds |

---

## Build Commands
```bash
cd /app/mobile
npx expo install
eas build --platform all --profile production
eas submit --platform ios
eas submit --platform android
```

---

## Test Credentials
- Email: `demo@saqr.app`
- Password: `Demo123456`

---

## Last Updated
March 3, 2026 - FINAL VERSION
