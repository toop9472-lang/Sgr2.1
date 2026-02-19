# Saqr Rewards App - PRD

## Original Problem Statement
Build an application for watching rewarded video ads where users earn points. The app was rejected by Apple due to:
1. Primary purpose being ad display
2. Non-functional Google/Apple login on iPad  
3. Inadequate support URL

The user requested to transform the app into a gaming platform with Chess, Tic-Tac-Toe, Picture Puzzle, Trivia, and Riddles games.

## User's Preferred Language
Arabic (العربية)

---

## What's Been Implemented

### ✅ Gaming Platform (February 19, 2026) - MAJOR UPDATE
- [x] Complete games section with 5 games:
  - Chess (الشطرنج) - 200 points, AI with medium/hard difficulty
  - Tic-Tac-Toe (إكس أو) - 80 points, AI with minimax algorithm
  - Picture Puzzle (تركيب الصور) - 150 points, 3x3, 4x4, 5x5 grids
  - Trivia (أسئلة ثقافية) - 100 points, 10 cultural questions
  - Riddles (الألغاز) - 160 points, Arabic riddles with hints
- [x] Global leaderboard with rankings
- [x] Points-based rewards system
- [x] Mode selection (vs AI medium/hard)
- [x] Game statistics tracking

### ✅ Support Page (February 19, 2026)
- [x] Professional support page at /support
- [x] FAQ section with 8 questions in Arabic
- [x] Contact form that submits to backend
- [x] Ticket ID generation for support requests
- [x] Contact info: support@saqr.app

### ✅ WebSocket Multiplayer Infrastructure (February 19, 2026)
- [x] WebSocket routes for real-time multiplayer
- [x] Game room management
- [x] Matchmaking system
- [x] Player waiting queue
- [x] Note: Frontend integration pending

### ✅ Previous Features (Still Working)
- [x] Cheat-proof point system (1 point per 60 seconds)
- [x] Ad Viewer with timer
- [x] Guest mode
- [x] Remember Me feature
- [x] Mobile-optimized UI
- [x] Daily Challenges System
- [x] Advertiser System with Stripe
- [x] Phone Authentication with OTP
- [x] Social Logins (Google/Apple)

---

## API Endpoints

### Games API
- `GET /api/games/leaderboard` - Get global leaderboard
- `POST /api/games/complete` - Record game completion and award points

### Support API
- `POST /api/support/submit` - Submit support request
- `GET /api/support/tickets` - Get support tickets (admin)
- `PUT /api/support/tickets/{id}/status` - Update ticket status

### WebSocket (Multiplayer)
- `WS /ws/game/{player_id}` - Real-time game connection
- `GET /api/game/online-players` - Get online player count

---

## Environment Variables

### Backend (/app/backend/.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=saqr_db
JWT_SECRET=xxx
CORS_ORIGINS=*
STRIPE_API_KEY=sk_test_xxx
```

---

## Files Reference

### Games (Mobile)
- `/app/mobile/src/screens/GamesScreen.js` - Main games hub (5 games)
- `/app/mobile/src/screens/games/ChessGame.js` - Chess game component

### Games (Web)
- `/app/frontend/src/components/GamesPage.jsx` - Web games page

### Support
- `/app/frontend/src/pages/SupportPage.jsx` - Support page with FAQ
- `/app/backend/routes/support_form_routes.py` - Support form API

### Backend
- `/app/backend/routes/games_routes.py` - Games API
- `/app/backend/routes/websocket_routes.py` - WebSocket multiplayer

---

## Credentials
- **Admin:** sky-321@hotmail.com / Talal12@
- **Test User:** demo@saqr.app / Demo123456

---

## Pending Tasks (Priority Order)

### P0 - Apple Store Compliance
- [x] ✅ Games section implemented (main purpose is now gaming)
- [x] ✅ Support page with FAQ and contact form
- [ ] Test Google/Apple login on iPad
- [ ] Build and submit new iOS version

### P1 - User-Reported Bugs (List of 17)
- [ ] Points resetting on login (frontend issue)
- [ ] Ads stuck on "loading"
- [ ] Language switching not working
- [ ] Light mode not working
- [ ] Daily login bonus calculation

### P2 - Future Features
- [ ] Real-time multiplayer integration (WebSocket backend ready)
- [ ] More games and content
- [ ] Achievements system

---

## Test Reports
- Latest: `/app/test_reports/iteration_18.json` - All tests passed (100%)

---

**Last Updated:** February 19, 2026

---

## Change Log

### February 19, 2026 - Gaming Platform
- ✅ Created 5 games (Chess, Tic-Tac-Toe, Puzzle, Trivia, Riddles)
- ✅ Games leaderboard API
- ✅ Support page with contact form
- ✅ WebSocket multiplayer infrastructure
- ✅ Updated BottomNav to show "الألعاب" (Games)
- ✅ All tests passed (100% success rate)

### February 15, 2026 - iOS & Android Builds
- ✅ Built iOS IPA for App Store (v5.2.0, Build #16)
- ✅ Android AAB uploaded to Play Store
- ✅ Server stability verified

### February 14, 2026 - Mobile UI Sync
- ✅ Updated AdViewerScreen to match web design
- ✅ Comments system
- ✅ 2-second ad info display timeout
