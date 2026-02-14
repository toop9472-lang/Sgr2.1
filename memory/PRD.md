# Saqr Rewards App - PRD

## Original Problem Statement
Build an application for watching rewarded video ads where users earn points.

## User's Preferred Language
Arabic (العربية)

---

## What's Been Implemented

## ✅ إصلاح التنقل في عارض الإعلانات (February 14, 2026)
- [x] زر X → ينقل للصفحة الرئيسية
- [x] زر السهم ← → ينقل للملف الشخصي
- [x] تحديث الموبايل ليطابق الويب

## ✅ نظام التعليقات على الإعلانات (February 14, 2026)
- [x] أيقونة التعليقات ظاهرة دائماً بجانب زر الصوت
- [x] لوحة تعليقات جميلة وهادئة من الأسفل
- [x] التعليقات خاصة بكل إعلان (لا تتداخل بين الإعلانات)
- [x] ليست دردشة مفتوحة - فقط تعليقات على الإعلان
- [x] إمكانية الإعجاب بالتعليقات
- [x] تصميم نظيف ومريح
- [x] API يعمل: GET /api/comments/ad/{ad_id}, POST /api/comments/

## ✅ تم تحسين صفحة مشاهدة الإعلانات (February 14, 2026)
- [x] تصميم نظيف وهادئ
- [x] زر X للخروج للرئيسية + سهم للخلف للصفحة الشخصية
- [x] إلغاء جميع الأسهم الأخرى
- [x] عداد مختصر وأنيق
- [x] معلومات الإعلان مصغرة ومائلة لليمين
- [x] إلغاء صورة المعلن
- [x] رابط الموقع كنص خفيف
- [x] تحسين الأداء لتحمل آلاف الإعلانات

### New Hourly Ad Packages System ✅ (February 14, 2026)
- [x] 7 hourly pricing packages:
  - 1 hour: 79 SAR
  - 3 hours: 119 SAR
  - 6 hours: 149 SAR
  - 12 hours: 199 SAR
  - 24 hours: 275 SAR
  - 48 hours: 399 SAR
  - 7 days: 999 SAR
- [x] Countdown timer for active ads
- [x] Ad auto-activation after payment
- [x] Ad expiration tracking

### Ad Filtering System ✅ (February 14, 2026)
- [x] Local ads (personal ads) filter
- [x] Global ads filter
- [x] Type selection on advertiser page

### Manual Payout Approval System ✅ (February 14, 2026)
- [x] Automatic approval for payouts < 10 points
- [x] Manual admin approval required for payouts >= 10 points
- [x] Admin withdrawal management page
- [x] Points refund on rejection

### Phone Authentication System ✅ (February 13, 2026)
- [x] SMS OTP verification for registration
- [x] Phone number registration with password validation
- [x] Login with 2FA (SMS verification on every login)
- [x] Password reset via SMS
- [x] Password strength validation (8 chars, uppercase, number, symbol)
- [x] Rate limiting (max 5 OTPs per hour)
- [x] OTP expiration (5 minutes)
- [x] Max 3 attempts per OTP

### Core Features ✅
- [x] Cheat-proof point system (1 point per 60 seconds)
- [x] Ad Viewer with timer
- [x] Guest mode
- [x] Remember Me feature
- [x] Mobile-optimized UI

### Daily Challenges System ✅
- [x] 5 Daily Challenges (max 69 points/day)
- [x] 14-Day Login Rewards (150 points/month)

### Advertiser System ✅
- [x] Advertiser Dashboard
- [x] Hourly Ad Packages
- [x] Stripe payment integration
- [x] My Ads Page with countdown timer
- [x] Ad countdown timer component

### Security Features ✅
- [x] CORS policy with allowlist
- [x] JWT authentication
- [x] Rate limiting
- [x] Account lockout

---

## API Endpoints

### Payment Packages
- `GET /api/payments/packages` - Get hourly pricing packages
- `POST /api/payments/checkout` - Create Stripe checkout session
- `GET /api/payments/status/{session_id}` - Check payment status

### Ads
- `GET /api/ads` - Get all active ads (supports ?ad_type=local|global filter)
- `GET /api/ads/advertiser/status/{ad_id}` - Get ad status with countdown
- `GET /api/ads/advertiser/my-ads?email={email}` - Get advertiser's ads

### Withdrawals (Admin)
- `GET /api/withdrawals/admin/pending` - Get pending withdrawal requests
- `POST /api/withdrawals/admin/{id}/approve` - Approve withdrawal
- `POST /api/withdrawals/admin/{id}/reject` - Reject withdrawal

### Phone Authentication
- `POST /api/phone/send-otp` - Send verification OTP
- `POST /api/phone/verify-otp` - Verify OTP code
- `POST /api/phone/register` - Register with phone
- `POST /api/phone/login` - Login step 1 (password)
- `POST /api/phone/verify-login` - Login step 2 (2FA OTP)
- `POST /api/phone/forgot-password` - Request password reset
- `POST /api/phone/reset-password` - Reset password with OTP

---

## Environment Variables

### Twilio SMS (Add to /app/backend/.env)
```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
```

### Stripe (Already configured)
```
STRIPE_API_KEY=sk_test_...
```

---

## New Components Created

### Backend
- `/app/backend/routes/payment_routes.py` - Updated with hourly packages
- `/app/backend/routes/ad_routes.py` - Updated with ad filtering and countdown
- `/app/backend/routes/withdrawal_routes.py` - Updated with manual approval
- `/app/backend/routes/advertiser_routes.py` - Updated with hourly packages

### Frontend
- `/app/frontend/src/components/AdvertiserPage.jsx` - Updated with hourly packages
- `/app/frontend/src/components/AdCountdownTimer.jsx` - NEW - Countdown timer component
- `/app/frontend/src/components/AdTypeFilter.jsx` - NEW - Ad type filter component
- `/app/frontend/src/components/MyAdsPage.jsx` - NEW - Advertiser's ads page
- `/app/frontend/src/components/AdminWithdrawalsPage.jsx` - NEW - Admin withdrawals management

---

## Credentials
- **Admin:** sky-321@hotmail.com / Talal12@
- **Test User:** demo@saqr.app / Demo123456

---

## Pending Tasks

### P0 - Critical
- [ ] Test mobile app build (eas build --local)
- [ ] Integrate SMS/2FA into mobile app UI

### P1 - High Priority
- [x] Server always-on (User upgraded hosting plan)
- [ ] Test full payment flow with real Stripe
- [ ] Add countdown timer to user profile picture

### Completed This Session
- [x] Mobile AdViewerScreen redesigned to match Web version
  - Clean minimal design
  - Top bar with back/close buttons and info (points, duration, time)
  - Sound button bottom right
  - "المس للتحكم" (Tap for controls) hint
  - Play/pause controls on tap
  - Navigation between ads
  - Points animation on earning

---

## Files Reference

### New Ads System
- Packages: `/app/backend/routes/payment_routes.py` (PRICING_PACKAGES)
- Ad filtering: `/app/backend/routes/ad_routes.py` (ad_type parameter)
- Withdrawal approval: `/app/backend/routes/withdrawal_routes.py` (MANUAL_APPROVAL_THRESHOLD)
- Advertiser pricing: `/app/backend/routes/advertiser_routes.py` (HOURLY_PACKAGES)

### Phone Auth
- Service: `/app/backend/services/sms_service.py`
- Routes: `/app/backend/routes/phone_auth_routes.py`

---

## Test Reports
- Latest: `/app/test_reports/iteration_16.json`
- Backend tests: `/app/backend/tests/test_new_ads_system.py`

---

**Last Updated:** February 14, 2026

---

## Change Log

### February 14, 2026 - Mobile UI Sync
- Updated `/app/mobile/src/screens/AdViewerScreen.js` to match web design
- Key changes:
  - Removed complex bottom info panel (advertiser avatar, description, etc.)
  - Added minimal top bar with: back button, info stats, close button
  - Added "المس للتحكم" hint at bottom
  - Controls show on tap: play/pause center, navigation
  - Points animation on earning minute
  - Clean black background with transparent overlays
