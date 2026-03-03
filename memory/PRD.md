# صقر - Saqr App PRD

## Original Problem Statement
تطبيق صقر هو تطبيق مكافآت يتيح للمستخدمين مشاهدة الإعلانات وكسب النقاط والماس. الهدف الأصلي كان إصلاح مشاكل iPad للإرسال إلى App Store.

## User Personas
- **المستخدم العادي**: يشاهد الإعلانات ويلعب الألعاب لكسب النقاط
- **المعلن**: يريد عرض إعلاناته للمستخدمين

## Core Requirements
1. نظام مصادقة (Email, Google, Apple)
2. مشاهدة الإعلانات وكسب النقاط
3. ألعاب متعددة
4. نظام اقتصادي (نقاط + ماس)
5. دعم iPad وiPhone

---

## What's Been Implemented

### March 3, 2026
- ✅ تحسين شريط الرصيد (BalanceHeader) - أفقي ومتراص
- ✅ إعادة تصميم الصفحة الرئيسية (HomeScreen) - منظم واحترافي
- ✅ RTL ديناميكي بناءً على اللغة
- ✅ إضافة PointsProvider لـ App.js
- ✅ إضافة مفاتيح Google OAuth للـ backend

### Previous Sessions
- ✅ **Web App**: UI/UX overhaul, 12 games functional
- ✅ **Mobile App**: 18+ screens implemented
- ✅ **Backend**: Full API with auth, games, IAP, leaderboards
- ✅ **Authentication**: Email, Google, Apple (native) providers
- ✅ **Economy System**: Points, Diamonds, Saqr Gems
- ✅ **Features**: Global Chat, Daily Rewards, AI Chat, Achievements, Shop

---

## Prioritized Backlog

### P0 - Critical (Blocking App Store)
- [ ] Fix iPad crashes and UI issues
- [ ] Get actual Google API keys for Sign-In
- [ ] Test native Apple/Google Sign-In on device

### P1 - High Priority
- [ ] Build and test mobile app
- [ ] Submit to App Store
- [ ] Implement Redis caching

### P2 - Future
- [ ] Add new mobile features to web app
- [ ] Move API_URL to .env file
- [ ] Performance optimizations

---

## Architecture

```
/app
├── backend/
│   ├── routes/
│   │   ├── auth_routes.py      # Auth with Google/Apple support
│   │   ├── iap_routes.py       # In-app purchases
│   │   └── leaderboards_routes.py
│   └── server.py
├── frontend/ (Web)
│   └── src/
│       ├── pages/
│       └── games/
└── mobile/ (React Native)
    └── src/
        ├── screens/
        │   ├── HomeScreen.js   # UPDATED - redesigned
        │   ├── ShopScreen.js   # Working - opens from Profile
        │   └── ...
        ├── components/
        │   └── BalanceHeader.js # UPDATED - horizontal design
        ├── services/
        │   ├── api.js          # With NetInfo
        │   ├── authProviders.js # Google/Apple
        │   └── PointsContext.js
        └── App.js              # UPDATED - with PointsProvider
```

---

## Key APIs
- `POST /api/auth/signin` - Email login
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/apple/native` - Native Apple Sign-In
- `GET /api/health` - Health check

---

## Required API Keys (Add to backend/.env)
```
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>
```

Get from: https://console.cloud.google.com/apis/credentials

---

## Credentials
- Demo: `demo@saqr.app` / `Demo123456`

---

## Shop Access
المتجر يُفتح من: **صفحة الملف الشخصي** → أيقونة "المتجر" 🛒

---

## Last Updated
March 3, 2026
