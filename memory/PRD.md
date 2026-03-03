# صقر - Saqr App PRD

## Original Problem Statement
تطبيق صقر هو تطبيق مكافآت يتيح للمستخدمين مشاهدة الإعلانات وكسب النقاط والماس. الهدف الأصلي كان إصلاح مشاكل iPad للإرسال إلى App Store.

## User Personas
- **المستخدم العادي**: يشاهد الإعلانات ويلعب الألعاب لكسب النقاط
- **المعلن**: يريد عرض إعلاناته للمستخدمين

## Core Requirements
1. نظام مصادقة (Email, Google, Apple)
2. مشاهدة الإعلانات وكسب النقاط
3. ألعاب متعددة (12 لعبة)
4. نظام اقتصادي (نقاط + ماس + جواهر صقر)
5. دعم iPad وiPhone

---

## What's Been Implemented

### March 3, 2026 - Session 2
- ✅ **Skeleton Loading Component** - تحميل متحرك احترافي
- ✅ **Ad Reward Service** - نظام مكافآت إعلانات محسن
- ✅ **Backend Endpoints** - start-session و sync-pending

### March 3, 2026 - Session 1
- ✅ تحسين شريط الرصيد (BalanceHeader)
- ✅ إعادة تصميم الصفحة الرئيسية (HomeScreen)
- ✅ RTL ديناميكي بناءً على اللغة
- ✅ إضافة PointsProvider لـ App.js

### الألعاب المحسنة:
- ✅ **الثعبان** - تحكم باللمس (Swipe) + 4 مستويات
- ✅ **تكسير الطوب** - 10 مراحل + Power-ups + وقت محدد
- ✅ **الشطرنج** - ألوان خشبية واقعية
- ✅ **تركيب الصور** - إصلاح الأخطاء

---

## Prioritized Backlog

### P0 - Critical
- [ ] Fix iPad crashes and UI issues
- [ ] Test native Apple/Google Sign-In on device
- [ ] Build and submit to App Store

### P1 - High Priority
- [ ] Add FlashList instead of FlatList
- [ ] Add Sentry for Crash Reporting
- [ ] Add Firebase Analytics
- [ ] Enable New Architecture

### P2 - Future
- [ ] Add expo-secure-store for token
- [ ] Add Firebase App Check
- [ ] Add OTA Updates (expo-updates)

---

## New Components

### SkeletonLoading.js
Location: `/app/mobile/src/components/SkeletonLoading.js`
- HomeScreenSkeleton
- ProfileScreenSkeleton
- GamesScreenSkeleton
- ShopScreenSkeleton
- ChatScreenSkeleton
- ListItemSkeleton

### AdRewardService.js
Location: `/app/mobile/src/services/AdRewardService.js`
Features:
- Session tracking
- Daily limit (50 ads)
- Cooldown (30 seconds)
- Fraud prevention
- Pending rewards sync

---

## Key APIs
- `POST /api/auth/signin` - Email login
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/apple/native` - Native Apple Sign-In
- `GET /api/rewarded-ads/next` - Get next ad
- `POST /api/rewarded-ads/start-session` - Start ad session
- `POST /api/rewarded-ads/complete` - Complete ad + get reward
- `POST /api/rewarded-ads/sync-pending` - Sync pending rewards

---

## Games (12 total)
1. AI Quest - تحدي الذكاء الاصطناعي
2. الشطرنج - Chess with AI
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

---

## Credentials
- Demo: `demo@saqr.app` / `Demo123456`

---

## Last Updated
March 3, 2026
