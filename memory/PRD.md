# Saqr Rewards App - PRD

## Original Problem Statement
Build an application for watching rewarded video ads where users earn points.

## User's Preferred Language
Arabic (العربية)

---

## What's Been Implemented

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
- [x] 4 Ad Packages (1000-8400 SAR)
- [x] Stripe payment integration

### Security Features ✅
- [x] CORS policy with allowlist
- [x] JWT authentication
- [x] Rate limiting
- [x] Account lockout

---

## API Endpoints

### Phone Authentication (NEW)
- `POST /api/phone/send-otp` - Send verification OTP
- `POST /api/phone/verify-otp` - Verify OTP code
- `POST /api/phone/register` - Register with phone
- `POST /api/phone/login` - Login step 1 (password)
- `POST /api/phone/verify-login` - Login step 2 (2FA OTP)
- `POST /api/phone/forgot-password` - Request password reset
- `POST /api/phone/reset-password` - Reset password with OTP
- `GET /api/phone/check/{phone}` - Check if phone exists

---

## Environment Variables

### Twilio SMS (Add to /app/backend/.env)
```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
```

**To get Twilio credentials:**
1. Go to https://www.twilio.com
2. Create account and verify
3. Go to Console > Account Info
4. Copy Account SID and Auth Token
5. Buy a phone number with SMS capability

---

## App Versions
- **Current Version:** 5.0.0
- **Android SDK:** API 35

---

## Pending Tasks

### P0 - Critical
- [ ] Add phone auth UI to web and mobile apps
- [ ] Configure Twilio with real credentials
- [ ] Build iOS and Android apps

### P1 - High Priority
- [ ] Server always-on (hosting upgrade needed)

---

## Files Reference

### Phone Auth (NEW)
- Service: `/app/backend/services/sms_service.py`
- Routes: `/app/backend/routes/phone_auth_routes.py`

### Other Key Files
- Backend: `/app/backend/server.py`
- Challenges: `/app/backend/routes/challenges_routes.py`

---

## Credentials
- **Admin:** sky-321@hotmail.com / Talal12@
- **Test User:** demo@saqr.app / Demo123456
- **Phone Test:** +966551234567 / NewPass123@

---

**Last Updated:** February 13, 2026
