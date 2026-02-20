# Saqr Rewards App - PRD

## Original Problem Statement
Build a professional gaming platform app (transformed from ad-watching app) to pass Apple's review, with a complete economy system featuring Saqr Points and Diamonds.

## User's Preferred Language
Arabic (العربية)

---

## ✅ All Implemented Features (February 20, 2026)

### NEW: Complete Economy System - IMPLEMENTED
- [x] **Saqr Points (نقاط صقر)**
  - Can be exchanged for real money (500 points = $1)
  - Earned from games and daily rewards
  - Daily earning cap: 150 points from games
  
- [x] **Diamonds (ألماسات)**
  - New users get 300 diamonds FREE on registration
  - Used for online multiplayer game entry
  - Can be purchased via in-app packages

- [x] **Diamond Purchase Packages (SAR)**
  - Starter: 100 diamonds for 3 SAR
  - Silver: 250+25 bonus for 7 SAR
  - Gold: 500+75 bonus for 12 SAR
  - Platinum: 1000+200 bonus for 19 SAR

- [x] **Online Game Costs (Diamonds)**
  - Chess: 30
  - Tic-Tac-Toe: 20
  - Puzzle: 25
  - Brick Breaker: 25
  - Trivia: 20
  - Riddles: 25

- [x] **Winner Rewards**
  - Offline win: 15 points
  - Online win: 25 points + opponent's diamonds + bonus
  - Loss: 5 participation points

- [x] **Leaderboard Rewards (Weekly)**
  - 1st Place: 3000 points
  - 2nd Place: 1900 points  
  - 3rd Place: 1000 points

- [x] **Daily Login Rewards**
  - Day 1: 10 points
  - Day 2: 15 points
  - Day 3: 5 diamonds
  - Day 4: 20 points
  - Day 5: 25 points
  - Day 6: 10 diamonds
  - Day 7: 25 diamonds
  - Streak resets if day is missed

### Gaming Platform - COMPLETE
- [x] **6 Games:** Chess, Tic-Tac-Toe, Brick Breaker, Puzzle, Trivia, Riddles
- [x] Global leaderboard with rewards
- [x] AI opponents (medium/hard difficulty)
- [x] Online vs offline play distinction

### UI Components - NEW
- [x] **Balance Header** - Shows points & diamonds at top of screen
- [x] **Diamond Shop Modal** - Purchase packages with + icon trigger
- [x] **Daily Rewards Modal** - Shows on app open, once per session

### Previous Features - COMPLETE
- [x] Admin Dashboard dark theme
- [x] Password Recovery (Forgot Password)
- [x] Support Page with FAQ
- [x] Language & Theme switching
- [x] Points sync on login

---

## 📊 Test Status
- **Latest:** `/app/test_reports/iteration_21.json`
- **Backend Success Rate:** 100% (14/14 tests passed)

---

## 🔐 Credentials
- **Admin:** sky-321@hotmail.com / Talal12@
- **Test User:** user_142f6a6ff7e2

---

## 📁 Key Files

### NEW: Economy System
- `/app/backend/routes/economy_routes.py` - Complete economy API
- `/app/mobile/src/components/DailyRewardsModal.js`
- `/app/mobile/src/components/DiamondShopModal.js`
- `/app/mobile/src/components/BalanceHeader.js`
- `/app/mobile/src/services/api.js` - Economy API methods

### Games
- `/app/mobile/src/screens/GamesScreen.js` - Updated with economy integration
- `/app/mobile/src/screens/games/ChessGame.js`
- `/app/mobile/src/screens/games/BrickBreakerGame.js`

### Auth (Updated for 300 diamonds)
- `/app/backend/routes/auth_routes.py`
- `/app/backend/routes/oauth_routes.py`

### App
- `/app/mobile/App.js` - Integrated daily rewards & diamond shop

---

## 📋 Remaining Tasks

### P0 - Apple Compliance
- [ ] Test Google/Apple login on iPad
- [ ] Build new iOS version

### P1 - Real Multiplayer
- [ ] Implement WebSocket-based real-time multiplayer
- [ ] Match-making system
- [ ] Live game state synchronization

### P2 - Payment Integration
- [ ] Integrate Stripe for diamond purchases
- [ ] Implement iOS In-App Purchases
- [ ] Implement Android Google Play billing

### P3 - Minor Fixes
- [ ] Video autoplay in ads viewer
- [ ] AI Chat functionality
- [ ] Profile picture change limit (once/week)

---

## 🏗️ Architecture

### Backend (FastAPI + MongoDB)
```
/app/backend/
├── routes/
│   ├── economy_routes.py   # Diamond/Points system
│   ├── auth_routes.py      # Registration (300 diamonds)
│   ├── oauth_routes.py     # Google/Apple login
│   └── games_routes.py     # Game completion
└── server.py
```

### Mobile (React Native/Expo)
```
/app/mobile/
├── App.js                  # Daily rewards integration
├── src/
│   ├── components/
│   │   ├── BalanceHeader.js
│   │   ├── DailyRewardsModal.js
│   │   └── DiamondShopModal.js
│   ├── screens/
│   │   └── GamesScreen.js  # Economy integrated
│   └── services/
│       └── api.js          # Economy endpoints
```

### Database Collections
- `users` - Added: diamonds, saqr_points, economy_initialized, diamond_transactions
- `daily_logins` - Tracks daily login streak and rewards
- `daily_game_points` - Tracks daily points earned per user

---

## 📝 Change Log

### February 20, 2026 - Economy System
- ✅ Created complete economy routes (/api/economy/*)
- ✅ Implemented Diamond & Saqr Points system
- ✅ Added 300 diamonds welcome bonus for new users
- ✅ Created daily login rewards (7-day cycle)
- ✅ Implemented daily 150-point earning cap
- ✅ Created Diamond Shop Modal UI
- ✅ Created Daily Rewards Modal UI
- ✅ Created Balance Header component
- ✅ Updated GamesScreen with economy integration
- ✅ All 14 backend tests passed

### February 19, 2026 - Gaming Platform
- ✅ 6 games created (Chess, Tic-Tac-Toe, Brick Breaker, Puzzle, Trivia, Riddles)
- ✅ Admin Dashboard dark theme
- ✅ Points sync fix
- ✅ Support page with FAQ

---

**Last Updated:** February 20, 2026
