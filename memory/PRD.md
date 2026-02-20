# Saqr Rewards App - PRD

## Original Problem Statement
Build a professional gaming platform app (transformed from ad-watching app) to pass Apple's review, with a complete economy system featuring Saqr Points and Diamonds.

## User's Preferred Language
Arabic (العربية)

---

## ✅ LATEST UPDATE (February 20, 2026) - Version 5.3.0

### NEW: Games Page Refactoring & Guest Restriction - IMPLEMENTED
- [x] **Guest Restriction System**
  - Guests cannot play games - modal appears asking to login
  - Lock icons displayed on all game cards for guests
  - Guest banner with "دخول" (Login) button
  
- [x] **Games Page Refactoring**
  - Extracted all 6 games into separate modular components
  - `/app/frontend/src/components/games/ChessGame.jsx`
  - `/app/frontend/src/components/games/TicTacToeGame.jsx`
  - `/app/frontend/src/components/games/TriviaGame.jsx`
  - `/app/frontend/src/components/games/SpeedMathGame.jsx`
  - `/app/frontend/src/components/games/WordChainGame.jsx`
  - `/app/frontend/src/components/games/PuzzleGame.jsx`
  - GamesPage.jsx reduced from 1900+ lines to ~750 lines

- [x] **Online Chat Integration**
  - GameChat component integrated into GamesPage
  - ChatToggleButton for online games
  - WebSocket-based real-time messaging
  
- [x] **New Games (Replaced)**
  - "سباق الكلمات" (Word Race) - replaced Brick Breaker
  - "سرعة الحساب" (Speed Math) - replaced Riddles

- [x] **Economy Updates**
  - Daily limit reduced to 70 Saqr Points
  - 14-day login rewards system (160 points + 200 diamonds total)
  - 200+ cultural questions added

- [x] **Mobile App Update**
  - Version: 5.3.0
  - Android versionCode: 55
  - iOS buildNumber: 25

---

## ✅ All Implemented Features (Earlier)

### Sound Effects & Payment Updates - IMPLEMENTED
- [x] **Sound Effects for All Games**
  - Web Audio API based - works on all browsers
  - Chess: piece move, capture sounds
  - Tic-Tac-Toe: click, win, lose sounds
  - Brick Breaker: brick hit, bonus brick, paddle hit, level up sounds
  - Puzzle: slide, complete sounds
  - Trivia/Riddles: correct/wrong answer sounds

- [x] **Diamond Shop with Apple Pay UI**
  - Apple Pay button (visual - Stripe handles actual payment)
  - Credit Card button
  - 4 packages with bonus diamonds
  - Stripe Checkout integration

### Complete Economy System - IMPLEMENTED
- [x] **Saqr Points (نقاط صقر)**
  - Can be exchanged for real money (500 points = $1)
  - Earned from games and daily rewards
  - Daily earning cap: 150 points from games
  
- [x] **Diamonds (ألماسات)**
  - New users get 300 diamonds FREE on registration
  - Used for online multiplayer game entry
  - Can be purchased via Stripe

- [x] **Diamond Purchase Packages (SAR) - Stripe Integrated**
  - Starter: 100 diamonds for 3 SAR ($0.81)
  - Silver: 275 diamonds (+25 bonus) for 7 SAR ($1.89)
  - Gold: 575 diamonds (+75 bonus) for 12 SAR ($3.24)
  - Platinum: 1200 diamonds (+200 bonus) for 19 SAR ($5.13)

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
- [x] **6 Games:** Chess, Tic-Tac-Toe, Word Chain, Puzzle, Trivia, Speed Math
- [x] Global leaderboard with rewards
- [x] AI opponents (medium/hard difficulty)
- [x] Online vs offline play distinction
- [x] **200+ Trivia Questions** (history, geography, science, islam, literature, sports, tech, art, health, general)
- [x] **Sound Effects** for all games via Web Audio API
- [x] **Guest Restriction** - Visitors cannot access games

### UI Components
- [x] **Balance Header** - Shows points & diamonds at top of screen
- [x] **Diamond Shop Modal** - Purchase packages with Apple Pay/Card options
- [x] **Daily Rewards Modal** - Shows on app open, once per session
- [x] **Daily Points Progress** - Visual bar showing 150-point daily limit

### Payment Integration
- [x] **Stripe Checkout** - For diamond purchases
- [x] **Apple Pay UI** - Visual buttons (Stripe handles actual flow)
- [x] **Payment Transactions** - MongoDB collection for tracking purchases
- [x] **Payment Status Polling** - Frontend checks payment completion

### WebSocket & Multiplayer
- [x] **Real-time Multiplayer** via /ws/game/{player_id}
- [x] **Online Players Status** via /api/game/online-players
- [x] **Chat Support** - Backend WebSocket handles chat messages

### Previous Features - COMPLETE
- [x] Admin Dashboard dark theme
- [x] Password Recovery (Forgot Password)
- [x] Support Page with FAQ
- [x] Language & Theme switching
- [x] Points sync on login

---

## 📊 Test Status
- **Latest:** `/app/test_reports/iteration_30.json`
- **Frontend Success Rate:** 100%
- **Backend Success Rate:** 100%
- **All features verified and working**

---

## 🔐 Credentials
- **Admin:** sky-321@hotmail.com / Talal12@
- **Test User:** user_142f6a6ff7e2
- **Stripe Key:** sk_test_emergent (test mode)

---

## 📁 Key Files

### Web Frontend (React) - REFACTORED
- `/app/frontend/src/components/GamesPage.jsx` - Main games page (refactored, ~750 lines)
- `/app/frontend/src/components/games/` - Individual game components:
  - `ChessGame.jsx` - Chess with AI and hints
  - `TicTacToeGame.jsx` - Tic-Tac-Toe with minimax AI
  - `TriviaGame.jsx` - 200+ cultural questions
  - `SpeedMathGame.jsx` - Math problems with timer
  - `WordChainGame.jsx` - Arabic word chain game
  - `PuzzleGame.jsx` - 12 real images puzzle
  - `index.js` - Exports all game components
- `/app/frontend/src/components/GameChat.jsx` - Online chat component
- `/app/frontend/src/components/BottomNav.jsx` - Navigation bar
- `/app/frontend/src/components/AuthPage.jsx` - Apple/Google OAuth
- `/app/frontend/src/App.js` - Main app routing

### Economy System
- `/app/backend/routes/economy_routes.py` - Complete economy API
- `/app/backend/routes/stripe_routes.py` - Stripe payment integration

### Games & Questions
- `/app/mobile/src/data/questionsData.js` - 100 trivia + 50 riddles
- `/app/mobile/src/screens/GamesScreen.js` - Updated games with economy integration
- `/app/mobile/src/screens/games/ChessGame.js`
- `/app/mobile/src/screens/games/BrickBreakerGame.js`

### UI Components
- `/app/mobile/src/components/DailyRewardsModal.js`
- `/app/mobile/src/components/DiamondShopModal.js`
- `/app/mobile/src/components/BalanceHeader.js`

### Auth (Updated for 300 diamonds)
- `/app/backend/routes/auth_routes.py`
- `/app/backend/routes/oauth_routes.py`
- `/app/backend/routes/user_routes.py` - Avatar change restriction

### App
- `/app/mobile/App.js` - Integrated daily rewards & diamond shop

---

## 📋 Remaining Tasks

### P0 - Apple Compliance
- [x] Apple Sign In fixed to use Emergent Auth (works on iPad)
- [ ] Build and submit new iOS version to App Store

### P1 - Enhanced Features
- [ ] Live chat integration during online games (backend ready, UI component exists)
- [ ] Phone login removal (keep for OTP recovery only)
- [x] Update Terms & Conditions page (sections 4 & 5 added)

### P2 - Minor Fixes
- [x] Video autoplay in ads viewer (fixed with fallback)
- [ ] AI Chat functionality (needs ANTHROPIC_API_KEY or admin activation)
- [x] Profile picture change limit (once/week) - IMPLEMENTED
- [x] Replace dummy contact info with real accounts - DONE (support@saqr.app)

---

## 📝 Change Log

### February 20, 2026 - Major Games Replacement
- ✅ Replaced Brick Breaker with **Word Chain (سباق الكلمات)** - cooperative online game
- ✅ Replaced Riddles with **Speed Math (سرعة الحساب)** - competitive math game
- ✅ Increased Trivia questions to **205 questions**
- ✅ Removed OTP from password reset - uses direct link now
- ✅ All 6 games work: Chess, TicTacToe, WordChain, Puzzle, Trivia, SpeedMath

### February 20, 2026 - Major Game & Economy Updates
- ✅ Fixed Brick Breaker game click (pointer-events-none on overlay)
- ✅ Changed daily points limit from 150 to **70 points**
- ✅ Updated login rewards to 14 days (160 points + 200 diamonds)
- ✅ Added 12 puzzle images (was 6)
- ✅ All tests passed (100% success rate)

### February 20, 2026 - All Remaining Tasks Completed
- ✅ Fixed Apple Sign In to use Emergent Auth (works on iPad)
- ✅ Updated Terms of Service with Games & In-App Purchases sections
- ✅ Implemented profile picture change limit (7 days)
- ✅ Fixed video autoplay with proper fallback
- ✅ Unified support email to support@saqr.app

### February 20, 2026 - Sound Effects & Diamond Shop Update
- ✅ Added sound effects for all 6 games using Web Audio API
- ✅ Fixed DiamondShop component (added paymentMethod state)
- ✅ Updated packages to show bonus diamonds correctly
- ✅ Apple Pay & Card payment buttons in Diamond Shop
- ✅ Updated PaymentSuccess to handle diamond purchases
- ✅ All tests passed (100% success rate)

### February 20, 2026 - Professional Games Implementation
- ✅ Complete Chess game with AI opponent and hints
- ✅ Puzzle game with 12 real images and 3 difficulty levels
- ✅ 100 Cultural Questions with timer and hint system
- ✅ 100 Riddles with reveal answer hint
- ✅ Brick Breaker with 5 levels and golden brick bonus

---

## 🏗️ Architecture

### Backend (FastAPI + MongoDB)
```
/app/backend/
├── routes/
│   ├── economy_routes.py   # Diamond/Points system
│   ├── stripe_routes.py    # Stripe payments
│   ├── auth_routes.py      # Registration (300 diamonds)
│   ├── oauth_routes.py     # Google/Apple login
│   └── websocket_routes.py # Multiplayer
└── server.py
```

### Mobile (React Native/Expo)
```
/app/mobile/
├── App.js                  # Daily rewards integration
├── src/
│   ├── data/
│   │   └── questionsData.js # 100 trivia + 50 riddles
│   ├── components/
│   │   ├── BalanceHeader.js
│   │   ├── DailyRewardsModal.js
│   │   └── DiamondShopModal.js
│   ├── screens/
│   │   └── GamesScreen.js  # Economy integrated
│   └── services/
│       └── api.js          # Economy + payment endpoints
```

### Database Collections
- `users` - diamonds, saqr_points, economy_initialized, diamond_transactions
- `daily_logins` - Tracks daily login streak and rewards
- `daily_game_points` - Tracks daily points earned per user
- `payment_transactions` - Stripe checkout sessions

---

## 📝 Change Log

### February 20, 2026 - Bug Fixes & Diamond Shop
- ✅ Fixed Brick Breaker game - ball now moves correctly after click
- ✅ Added Diamond Shop with 4 packages (100-1000 diamonds, 3-19 SAR)
- ✅ Added "+" button on diamonds to open shop
- ✅ Fixed 100 questions and 100 riddles count
- ✅ Fixed animal image URL in puzzle game

### February 20, 2026 - Professional Games Implementation
- ✅ Complete Chess game with 8×8 board, all pieces, valid moves, AI opponent
- ✅ Puzzle game with 6 real images and 3 difficulty levels (3×3, 4×4, 5×5)
- ✅ 100 Cultural Questions with timer and hint system
- ✅ 100 Riddles with reveal answer hint
- ✅ Brick Breaker with 5 levels, golden brick (50 points), ball physics
- ✅ Online play option for Chess, TicTacToe, Puzzle with diamond cost
- ✅ Hint system across all games (2 diamonds each)
- ✅ Leaderboard rewards: 1st=3000, 2nd=1900, 3rd=1000 points
- ✅ All games use lucide-react professional icons
- ✅ Frontend testing: 95% → 100% after fixes

### February 20, 2026 - Web Frontend Games Implementation
- ✅ Fixed all 6 games on web frontend
- ✅ Implemented RiddlesGame (10 riddles with answers)
- ✅ Implemented PuzzleGame (8-puzzle sliding game)
- ✅ Implemented BrickBreakerGame (with ball physics, paddle, lives)
- ✅ ChessGame placeholder with participation points
- ✅ All games use lucide-react professional icons
- ✅ All games have proper back navigation and scoring

### February 20, 2026 - Web Frontend Update
- ✅ Updated GamesPage.jsx to show all 6 games on web
- ✅ Replaced all emojis with lucide-react professional icons
- ✅ Redesigned bottom navigation: "ألعاب" (green, center), "شاهد" (red)
- ✅ Added diamond and saqr points balance display to games page
- ✅ Frontend testing passed (100% success rate)

### February 20, 2026 - Complete Implementation
- ✅ Created complete economy routes (/api/economy/*)
- ✅ Implemented Diamond & Saqr Points system
- ✅ Added 300 diamonds welcome bonus for new users
- ✅ Created daily login rewards (7-day cycle)
- ✅ Implemented daily 150-point earning cap
- ✅ Created Diamond Shop Modal UI with Stripe
- ✅ Created Daily Rewards Modal UI
- ✅ Created Balance Header component
- ✅ Updated GamesScreen with economy integration
- ✅ Added 100 trivia questions (multi-category)
- ✅ Added 50 riddles with multiple choice
- ✅ Integrated Stripe payment for diamond purchases
- ✅ All backend tests passed (28/28 total)

---

**Last Updated:** February 20, 2026
