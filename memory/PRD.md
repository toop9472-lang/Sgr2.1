# Saqr Rewards App - PRD

## Original Problem Statement
Build an application for watching rewarded video ads where users earn points. The app was rejected by Apple due to:
1. Primary purpose being ad display
2. Non-functional Google/Apple login on iPad  
3. Inadequate support URL

The user requested to transform the app into a gaming platform with Chess, Tic-Tac-Toe, Picture Puzzle, Trivia, Riddles, and **Brick Breaker** games.

## User's Preferred Language
Arabic (العربية)

---

## ✅ What's Been Implemented

### Gaming Platform (February 19, 2026) - COMPLETE
- [x] **6 Games Available:**
  - ♟️ Chess (الشطرنج) - 200 points, AI with medium/hard
  - ⭕ Tic-Tac-Toe (إكس أو) - 80 points, minimax AI
  - 🧱 **Brick Breaker (تكسير الطوب)** - 180 points - NEW!
  - 🧩 Picture Puzzle (تركيب الصور) - 150 points
  - ❓ Trivia (أسئلة ثقافية) - 100 points
  - 💡 Riddles (الألغاز) - 160 points
- [x] Global leaderboard
- [x] Points-based rewards
- [x] Mode selection (vs AI medium/hard)
- [x] **Glowing lime Games button** in bottom nav

### Password Recovery (February 19, 2026) - NEW
- [x] "نسيت كلمة المرور؟" link on login page
- [x] 3-step recovery flow: Email → OTP → New Password
- [x] APIs: `/api/auth/forgot-password`, `/api/auth/verify-reset-otp`, `/api/auth/reset-password`
- [x] Email with OTP code sent to user

### Support Page (February 19, 2026) - COMPLETE
- [x] Professional support page at /support
- [x] FAQ section with 8 Arabic questions
- [x] Contact form with ticket ID generation
- [x] Contact: support@saqr.app

### UI/UX Features - WORKING
- [x] **Language switching** - 6 languages (AR, EN, FR, TR, UR, HI)
- [x] **Theme switching** - Dark/Light/System modes
- [x] Settings page with theme and language modals
- [x] RTL support for Arabic

### WebSocket Multiplayer Infrastructure
- [x] WebSocket routes for real-time multiplayer
- [x] Game room management
- [x] Matchmaking system
- [ ] Frontend integration pending

---

## 📋 API Endpoints

### Games API
- `GET /api/games/leaderboard` - Get global leaderboard
- `POST /api/games/complete` - Record game completion

### Auth API - Password Recovery
- `POST /api/auth/forgot-password` - Send OTP email
- `POST /api/auth/verify-reset-otp` - Verify OTP, get reset token
- `POST /api/auth/reset-password` - Reset password with token

### Support API
- `POST /api/support/submit` - Submit support request

---

## 📁 Files Reference

### Games
- `/app/mobile/src/screens/GamesScreen.js` - Main games hub (6 games)
- `/app/mobile/src/screens/games/ChessGame.js` - Chess game
- `/app/mobile/src/screens/games/BrickBreakerGame.js` - **NEW** Brick Breaker game
- `/app/frontend/src/components/GamesPage.jsx` - Web games page

### Bottom Navigation
- `/app/mobile/src/components/BottomNav.js` - Mobile (glowing lime Games button)
- `/app/frontend/src/components/BottomNav.jsx` - Web (glowing lime Games button)

### Auth & Password Recovery
- `/app/frontend/src/components/ForgotPasswordPage.jsx` - **NEW** Password reset UI
- `/app/frontend/src/components/AuthPage.jsx` - Login with forgot password link
- `/app/backend/routes/auth_routes.py` - Password reset APIs

### Settings
- `/app/frontend/src/components/SettingsPage.jsx` - Theme and language settings
- `/app/frontend/src/context/ThemeContext.js` - Theme provider
- `/app/frontend/src/i18n/LanguageContext.js` - Language provider

---

## 🔐 Credentials
- **Admin:** sky-321@hotmail.com / Talal12@
- **Test User:** demo@saqr.app / Demo123456

---

## 📊 Test Status
- **Latest Report:** `/app/test_reports/iteration_19.json`
- **Backend:** 100% (11/11 tests passed)
- **Frontend:** 100% - All UI flows verified

---

## 🚀 Remaining Tasks (Priority Order)

### P0 - Apple Store Compliance
- [x] ✅ Games section (6 games including Brick Breaker)
- [x] ✅ Support page with FAQ and contact form
- [x] ✅ Password recovery flow
- [ ] Test Google/Apple login on iPad
- [ ] Build and submit new iOS version

### P1 - User-Reported Bugs (From List of 17)
- [x] ✅ Language switching - WORKING
- [x] ✅ Light mode - WORKING  
- [x] ✅ Forgot Password - IMPLEMENTED
- [ ] Points resetting on login (frontend state issue)
- [ ] Ads stuck on "loading"
- [ ] Daily login bonus calculation

### P2 - Future Features
- [ ] Real-time multiplayer integration
- [ ] More games
- [ ] Achievements system

---

## 📝 Change Log

### February 19, 2026 - Session 2
- ✅ Added **Brick Breaker (تكسير الطوب)** game - 180 points
- ✅ **Glowing lime Games button** in bottom nav (lime-500 to lime-600 gradient with shadow)
- ✅ **Forgot Password** flow - 3 steps with OTP verification
- ✅ Added password reset APIs (forgot-password, verify-reset-otp, reset-password)
- ✅ Verified language switching works (6 languages)
- ✅ Verified theme switching works (Dark/Light/System)
- ✅ All tests passed (100%)

### February 19, 2026 - Session 1
- ✅ Created 5 games (Chess, Tic-Tac-Toe, Puzzle, Trivia, Riddles)
- ✅ Games leaderboard API
- ✅ Support page with contact form
- ✅ WebSocket multiplayer infrastructure

---

**Last Updated:** February 19, 2026
