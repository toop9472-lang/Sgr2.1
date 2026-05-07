# Saqr (صقر) — Reels & Chat Social App

## Original Problem Statement
Mobile-first social app (Reels/Clips + Chat) with rewards economy ("Saqr Gems") earned via AdMob. Web frontend must mirror the mobile UI 1:1. Goal: pass Apple App Store review and ship live.

User language: العربية (Arabic).

## Architecture
- **Backend**: FastAPI + MongoDB (motor). Routes under `/app/backend/routes/`.
- **Web**: React (`/app/frontend`).
- **Mobile**: React Native + Expo SDK 53 (`/app/mobile`).
- **Build**: EAS Build, profile `production`, ASC API key at `mobile/certificates/AuthKey_L598DUD53L.p8`.

## Implemented (CHANGELOG)
### 2026-05-06 — iOS Build 105 / v7.2.14 submitted to App Store Connect ✅
- Bumped `app.json` version → `7.2.14`, `ios.buildNumber` → `105`.
- Triggered `eas build --platform ios --profile production --auto-submit`. Build `cd5d0b99-08c5-4cef-b865-c92599f2c2fd`, submission `8a8bf8d6-d06d-4104-b0de-0d09e6d345e8` finished at 23:56 UTC.
- Earlier attempt at build 104 failed in submission step (`Build number 104 already used`); resolved by incrementing to 105.

### Earlier this session
- Synced web UI to mobile (lucide-react icons, removed dark overlays).
- Fixed 11 backend routes for MongoDB ObjectId serialization (clips, chat, etc.).
- Reels/FYP: Instagram-style autoplay, snap-to-interval, fullscreen hides BottomNav, mobile upload timeout 180s.
- Apple Auth `[object Object]` parsing fixed via `extractErrorMessage`.
- Dummy ads cleared + startup auto-cleanup hook in `server.py`.

### Reels/FYP backend verified (curl)
- `GET /api/clips/feed?limit=N&viewer_id=...` → 200, returns enriched clips (likes_count, comments_count, liked_by_me, followers_count, followed_by_me).
- `POST /api/clips/create` → 200, persists clip.
- `POST /api/clips/{id}/toggle-like` and legacy `/api/clips/like` → both work.
- `POST /api/clips/{id}/comment` → works.
- Frontend `ClipsScreen.js` uses `pagingEnabled`, `snapToInterval={screenHeight}`, `shouldPlay={isActive}`, `onViewableItemsChanged` → correct FYP behavior.

## Pending / Roadmap
- **P0** Wait for Apple App Review on build 105 → user must complete metadata/screenshots in ASC if not already done.
- **P1** In-App Purchases (backend + mobile).
- **P1** Achievements system logic.
- **P2** iPad-specific layout fixes for stability.
- **P2** Privacy Manifest / App Tracking Transparency final compliance.

## Test Credentials
See `/app/memory/test_credentials.md` (none modified this session).

## Known Pitfalls
- `git pull` from `toop9472-lang/Sgr2.1` has previously overwritten backend ObjectId fixes — re-verify after each pull.
- EAS auto-increment is OFF (`appVersionSource: local`); always bump `ios.buildNumber` in `app.json` before each iOS build.
