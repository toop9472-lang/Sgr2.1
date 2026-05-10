# Saqr App - PRD

## Original Problem Statement
Pivot from minigames to Social Reels/Clips + Chat. Must pass Apple App Store review.
Strict requirement: Web UI MUST perfectly mirror Mobile UI.

## Tech Stack
- Mobile: React Native Expo (EAS Build)
- Web: React.js
- Backend: FastAPI + MongoDB
- Storage: Cloudflare R2 (boto3) — videos/avatars/ads persist across deploys
- Streaming: HTTP 206 Byte-Range for iOS Video compatibility
- Auth: JWT (email) + Apple Sign-in + Google OAuth
- Earning: AdMob rewarded ads → Saqr Gems

## Latest Implemented (Feb 2026)
- ✅ Cloudflare R2 migration (persistent uploads)
- ✅ iOS HTTP 206 byte-range streaming
- ✅ AdMob gems live UI sync
- ✅ 7-day rate limit on name/avatar changes
- ✅ Admin moderation tools (delete clip/chat/comment)
- ✅ User Profiles + Privacy toggle (Mobile + Web)
- ✅ "My Reels" grid (Mobile + Web)
- ✅ Click avatar → Public profile flow (Chat + Reels) on Mobile + Web
- ✅ **iOS Audio Mode Fix**: `Audio.setAudioModeAsync({playsInSilentModeIOS: true})` at app boot — videos now have sound on iPhone silent mode
- ✅ Web UserProfilePage.jsx created and wired

## P0 Pending
- Build iOS Build 110 via EAS (includes audio fix + profiles)
- User verification of synced Web UI

## P1 Backlog
- Privacy Manifest / App Tracking Transparency review
- Direct file upload on web Advertiser page

## Key API Endpoints
- `GET /api/users/public-profile/{user_id}?viewer_id=...`
- `GET /api/users/clips/{user_id}?viewer_id=...`
- `PUT /api/users/privacy/{user_id}`  body: `{is_private: bool}`
- `POST /api/clips/follow/toggle`
- `POST /api/clips/upload`
- `GET /api/economy/balance/{user_id}`

## Architecture
```
/app
├── backend/
│   ├── routes/ (clips_routes, economy_routes, user_routes, ...)
│   ├── services/ (r2_storage.py)
│   └── server.py
├── frontend/ (Web)
│   └── src/components/
│       ├── ProfilePage.jsx        (settings gear, my reels grid, follow stats)
│       ├── SettingsPage.jsx       (account privacy toggle)
│       ├── UserProfilePage.jsx    (public profile viewer — NEW)
│       ├── ClipsPage.jsx          (avatar click → user profile)
│       └── GlobalChatPage.jsx     (avatar click → user profile)
└── mobile/ (React Native)
    ├── App.js                     (setupAudioMode() — iOS sound fix)
    └── src/screens/
        ├── ProfileScreen.js
        ├── UserProfileScreen.js
        ├── SettingsScreen.js
        └── ClipsScreen.js
```

## Critical Notes for Next Agent
- RESPOND IN ARABIC
- Do NOT run `eas build` until user explicitly approves
- Video/image uploads MUST go through `r2_storage.py`
- iOS audio fix lives in `/app/mobile/App.js` (setupAudioMode useEffect)
- Web ProfilePage shows Settings gear + My Reels for ALL users (including guests) to mirror mobile parity
