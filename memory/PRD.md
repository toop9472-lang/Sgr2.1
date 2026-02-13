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
- [x] Advertiser Packages System

---

## App Versions
- **Current Version:** 5.0.0
- **iOS Build Number:** 14
- **Android Version Code:** 35

---

## Technical Architecture

### Frontend (Web)
- React + Tailwind CSS + Shadcn UI
- ThemeContext for dark/light modes
- LanguageContext for i18n

### Backend
- FastAPI (Python) + MongoDB
- Routes: auth, challenges, support, 2fa, comments, ads, payment

### Mobile
- React Native + Expo
- Ionicons for icons

---

## Key API Endpoints

### Challenges
- `GET /api/challenges/daily` - Get daily challenges with progress
- `POST /api/challenges/daily/claim` - Claim challenge reward
- `GET /api/challenges/login-rewards` - Get 14-day rewards status
- `POST /api/challenges/login-rewards/claim` - Claim login reward
- `GET /api/challenges/stats` - Get challenge statistics

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
- [ ] Build new Android version
- [ ] Submit to App Store & Google Play

### P2 - Medium Priority
- [ ] Advertiser Dashboard UI (Mobile) - Needs implementation
- [ ] Support Screen UI Enhancement (Mobile)
- [ ] Update Android SDK target version

### P3 - Future
- [ ] Redis caching
- [ ] General API Rate Limiting

---

## Files Reference

### Challenges Feature
- Backend: `/app/backend/routes/challenges_routes.py`
- Web: `/app/frontend/src/components/ChallengesPage.jsx`
- Mobile: `/app/mobile/src/screens/ChallengesScreen.js`
- Tests: `/app/backend/tests/test_challenges_api.py`

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
- ✅ Daily Challenges: 15/15 tests passed
- ✅ 14-Day Login Rewards: Working
- ✅ Web Frontend: Working
- 📱 Mobile: Ready for build

---

## Build Instructions
See `/app/mobile/BUILD_APK_GUIDE.md` for detailed build instructions.

```bash
# Android
eas build --platform android --profile preview

# iOS (requires Mac)
eas build --platform ios --profile production
```

---

**Last Updated:** February 13, 2026
