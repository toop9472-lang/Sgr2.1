# Saqr Rewards App - PRD

## Original Problem Statement
Build an application for watching rewarded video ads where users earn points. Users watch ads, earn points (1 point per 60 seconds), and can withdraw earnings when they reach 500 points ($1).

## User's Preferred Language
Arabic (العربية)

---

## What's Been Implemented

### Core Features ✅
- [x] Cheat-proof point system (1 point per 60 seconds)
- [x] Ad Viewer with timer
- [x] Guest mode
- [x] Remember Me feature
- [x] Mobile-optimized UI
- [x] Privacy Policy page

### Daily Challenges System ✅ (February 13, 2026)
- [x] 5 Daily Challenges (max 69 points/day):
  - مشاهد نشط (Watch 5 ads) = 15 points
  - مشاهد متفاني (Watch 10 ads) = 25 points
  - الحضور اليومي (Daily Login) = 10 points
  - البداية (First ad) = 5 points
  - المثابر (Stay online 1 hour) = 14 points with countdown timer
- [x] API Endpoints:
  - GET /api/challenges/daily
  - POST /api/challenges/daily/claim
  - GET /api/challenges/stats

### 14-Day Login Rewards ✅ (February 13, 2026)
- [x] 150 points/month distributed over 14 days
- [x] Progressive rewards (5→15 points)
- [x] API Endpoints:
  - GET /api/challenges/login-rewards
  - POST /api/challenges/login-rewards/claim

### Advertiser Dashboard ✅ (Mobile)
- [x] Login by email
- [x] View ad statistics (views, unique viewers, completion rate)
- [x] List all ads with status
- [x] Create new ad button
- [x] File: `/app/mobile/src/screens/AdvertiserDashboardScreen.js`
- [x] Accessible from ProfileScreen → "لوحة تحكم المعلن"

### Advertiser Packages System ✅
- [x] 4 packages available:
  - 1 month: 1000 SAR
  - 3 months: 2700 SAR (10% discount)
  - 6 months: 4800 SAR (20% discount)
  - 12 months: 8400 SAR (30% discount)
- [x] Stripe payment integration
- [x] Bank transfer option

### Security Features ✅
- [x] CORS policy with allowlist
- [x] Security headers middleware
- [x] Rate limiting on login
- [x] Password strength validation
- [x] JWT refresh tokens
- [x] Account lockout
- [x] Change password API

### Other Features ✅
- [x] Support Tickets System
- [x] Two-Factor Authentication (2FA)
- [x] Comments System
- [x] Dark Mode
- [x] Multi-Language Support (Arabic/English)
- [x] Settings Page
- [x] Analytics Dashboard

---

## App Versions
- **Current Version:** 5.0.0
- **iOS Build Number:** 14
- **Android Version Code:** 35
- **Android SDK:** API 35 (Google Play 2025-2026 compliant)

---

## Technical Architecture

### Frontend (Web)
- React + Tailwind CSS + Shadcn UI
- ThemeContext for dark/light modes
- LanguageContext for i18n

### Backend
- FastAPI (Python) + MongoDB
- Routes: auth, challenges, support, 2fa, comments, ads, payment, analytics

### Mobile
- React Native + Expo
- Ionicons for icons
- expo-build-properties for SDK configuration

---

## Key API Endpoints

### Challenges
- `GET /api/challenges/daily` - Get daily challenges with progress
- `POST /api/challenges/daily/claim` - Claim challenge reward
- `GET /api/challenges/login-rewards` - Get 14-day rewards status
- `POST /api/challenges/login-rewards/claim` - Claim login reward
- `GET /api/challenges/stats` - Get challenge statistics

### Advertiser Analytics
- `GET /api/analytics/advertiser/{email}` - Get advertiser dashboard data
- `GET /api/payments/packages` - Get available ad packages
- `POST /api/advertiser/ads` - Create new ad
- `GET /api/advertiser/pricing` - Get pricing info

### Authentication
- `POST /api/auth/signin` - Login
- `POST /api/auth/register` - Register
- `GET /api/auth/me` - Get current user

---

## Pending Tasks

### P0 - Critical
- [ ] **Server Always-On:** Upgrade hosting plan (Root cause of Apple rejection)

### P1 - High Priority
- [ ] Build new iOS version (v5.0.0, build 14)
- [ ] Build new Android version (versionCode 35)
- [ ] Submit to App Store & Google Play

### P2 - Medium Priority
- [ ] Support Screen UI Enhancement (Mobile)

### P3 - Future
- [ ] Redis caching
- [ ] General API Rate Limiting

---

## Build Instructions

### Prerequisites
- Node.js 18+
- Expo CLI & EAS CLI
- Expo account (ziyad333)

### Commands
```bash
cd /app/mobile

# Install dependencies
yarn install

# Login to Expo
eas login

# Build Android APK
eas build --platform android --profile preview

# Build iOS (requires Mac)
eas build --platform ios --profile production
```

See `/app/mobile/BUILD_APK_GUIDE.md` for detailed instructions.

---

## Files Reference

### Challenges Feature
- Backend: `/app/backend/routes/challenges_routes.py`
- Web: `/app/frontend/src/components/ChallengesPage.jsx`
- Mobile: `/app/mobile/src/screens/ChallengesScreen.js`

### Advertiser Dashboard
- Mobile: `/app/mobile/src/screens/AdvertiserDashboardScreen.js`
- Mobile Advertiser Form: `/app/mobile/src/screens/AdvertiserScreen.js`

### Navigation
- Web BottomNav: `/app/frontend/src/components/BottomNav.jsx`
- Mobile BottomNav: `/app/mobile/src/components/BottomNav.js`

---

## Credentials
- **Test User:** demo@saqr.app / Demo123456
- **Guest Mode:** Click "دخول كزائر"

---

## Testing Status (February 13, 2026)
- ✅ Backend APIs: 100% working
- ✅ Daily Challenges: Working
- ✅ 14-Day Login Rewards: Working
- ✅ Advertiser Dashboard: Working
- ✅ Packages API: Working (4 packages)
- ✅ Web Frontend: Working
- 📱 Mobile: Ready for build

---

**Last Updated:** February 13, 2026
