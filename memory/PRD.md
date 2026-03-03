# صقر - Saqr App PRD

## Original Problem Statement
تطبيق صقر هو تطبيق مكافآت يتيح للمستخدمين مشاهدة الإعلانات وكسب النقاط والماس. الهدف الأصلي كان إصلاح مشاكل iPad للإرسال إلى App Store.

## Core Requirements
1. نظام مصادقة (Email, Google, Apple)
2. مشاهدة الإعلانات وكسب النقاط
3. ألعاب متعددة (13 لعبة)
4. نظام اقتصادي (نقاط + ماس + جواهر صقر)
5. دعم iPad وiPhone

---

## What's Been Implemented

### March 3, 2026 - Final Session

#### NEW FEATURES:
- ✅ **MillionaireScreen** - لعبة من سيربح المليون (15 سؤال + وسائل مساعدة)
- ✅ **OnboardingScreen** - شاشة ترحيب للمستخدمين الجدد
- ✅ **DailyStreakModal** - نظام التسجيل اليومي (7 أيام)
- ✅ **ReferralService** - نظام الإحالات (100 نقطة للداعي)
- ✅ **LeaderboardScreen** - لوحة المتصدرين (يومي/أسبوعي/الكل)
- ✅ **SkeletonLoading** - تحميل متحرك احترافي
- ✅ **AdRewardService** - نظام مكافآت إعلانات محسن

#### IMPROVED GAMES:
- ✅ **Snake Game** - تحكم باللمس (Swipe) + 4 مستويات
- ✅ **Brick Breaker** - 10 مراحل + Power-ups + وقت محدد
- ✅ **Chess Game** - ألوان خشبية واقعية

#### BACKEND:
- ✅ `/api/referrals/apply` - تطبيق كود إحالة
- ✅ `/api/referrals/stats` - إحصائيات الإحالات
- ✅ `/api/referrals/list` - قائمة الإحالات
- ✅ `/api/rewarded-ads/start-session` - بدء جلسة إعلان
- ✅ `/api/rewarded-ads/sync-pending` - مزامنة المكافآت

---

## All Files Created/Modified

### NEW FILES:
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

### MODIFIED FILES:
```
mobile/src/screens/HomeScreen.js
mobile/src/screens/games/SnakeGame.js
mobile/src/screens/games/BrickBreakerGame.js
mobile/src/screens/games/ChessGame.js
mobile/src/screens/GamesScreen.js
mobile/src/components/BalanceHeader.js
mobile/App.js
backend/server.py
backend/routes/rewarded_ads_routes.py
```

---

## Games (13 total)
1. AI Quest - تحدي الذكاء الاصطناعي
2. الشطرنج - Chess with AI (ألوان خشبية)
3. إكس أو - Tic Tac Toe
4. الذاكرة - Memory Match
5. الثعبان - Snake (Touch Control)
6. أسئلة ثقافية - Trivia
7. تركيب الصور - Puzzle
8. الألغاز - Riddles
9. تكسير الطوب - Brick Breaker (10 levels)
10. سباق الحساب - Math Race
11. سباق الكلمات - Word Race
12. تبديل الألوان - Color Switch
13. **من سيربح المليون - Millionaire (NEW)**

---

## Prioritized Backlog

### P0 - Critical
- [ ] Fix iPad crashes and UI issues
- [ ] Add new screens to App.js navigation
- [ ] Build and test on device

### P1 - High Priority
- [ ] Add Sentry for Crash Reporting
- [ ] Add Firebase Analytics
- [ ] Convert FlatList to FlashList
- [ ] Test Apple/Google Sign-In

### P2 - Future
- [ ] Add expo-secure-store for token
- [ ] Add Firebase App Check
- [ ] Enable New Architecture

---

## Key APIs
- `POST /api/auth/signin` - Email login
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/apple/native` - Native Apple Sign-In
- `GET /api/referrals/stats` - Referral statistics
- `POST /api/referrals/apply` - Apply referral code
- `GET /api/leaderboard` - Get leaderboard
- `POST /api/rewarded-ads/start-session` - Start ad session

---

## Referral System
- **Referrer**: 100 points + 10 diamonds
- **Referee**: 50 points + 5 diamonds
- **Link format**: https://saqr.app/invite/{CODE}

---

## Daily Streak Rewards
| Day | Reward |
|-----|--------|
| 1 | 5 points |
| 2 | 10 points |
| 3 | 5 diamonds |
| 4 | 15 points |
| 5 | 10 diamonds |
| 6 | 25 points |
| 7 | 20 diamonds (gift) |

---

## Credentials
- Demo: `demo@saqr.app` / `Demo123456`

---

## Last Updated
March 3, 2026
