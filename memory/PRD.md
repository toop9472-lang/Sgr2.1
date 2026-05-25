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
- ✅ Smart feed algorithm `v2_engagement_recency_follow`
- ✅ Profanity filter + URL block in global chat
- ✅ Boost Ad (5 SAR) feature
- ✅ Premium features backend (Stories, Trending Hashtags, Creator Fund)
- ✅ Mobile premium UI: Stories bar, Trending modal, Share/Deep links/Push
- ✅ iOS Build 113 (v7.2.20) submitted to App Store Connect
- ✅ **Home Screen restored background + polished icons (May 2026)**:
  - Restored `APP_BACKGROUND_IMAGE` across all main app pages (translucent overlay)
  - Generated 6 luxury 3D icons via Gemini Nano Banana, bundled at `/app/mobile/assets/home_icons/`
  - HomeScreen ActionRow now displays polished image icons (watch/fortunes/reels/chat/friends)
- ✅ **World-class home redesign (May 2026)**:
  - **Single luxury dark design** — removed Classic/Luxury toggle from Mobile & Web
  - Full-image **HeroTile** cards (16:9) + paired **SquareTile** cards
  - Regenerated home icons as **photorealistic Unsplash-style JPGs** via Nano Banana (royalty-free)
  - Bundled locally as `.jpg` (60-90KB each) for mobile, mirrored to `frontend/public/home_icons/` for web
- ✅ **Critical AdMob gem-reward fix (May 2026)**:
  - Root cause: iOS race condition — `CLOSED` event fired before `EARNED_REWARD`, causing gems to be skipped
  - Fix: added 1.2s grace period in `admobService.js` `showRewardedAd()` to catch late `EARNED_REWARD`
- ✅ **Bottom-sheet Comments for Reels** (TikTok style):
  - Replaced the large details modal with a 72%-height sheet that keeps video visible behind
  - Drag handle + clean header + empty-state illustration + sticky composer
- ✅ Reusable polished `Skeleton` + `EmptyState` components added; integrated into ClipsScreen.
- ✅ **Live / Reels top toggle** in ClipsScreen — pressing "لايف" shows polite "Coming soon" alert.
- ✅ **Bookmark/Save Reels** — heart-bookmark button, persisted locally via AsyncStorage.
- ✅ **VerifiedBadge** component — inline cyan checkmark, shown next to user names where `is_verified` is true.
- ✅ **OnboardingTour** — first-launch 4-slide intro (welcome → watch & earn → reels → fortunes), persistence flag `saqr_onboarding_v1_completed`.
- ✅ **Notification badges** on BottomNav — `badges={profile, advertiser}` wired through props.
- ✅ **Realistic gem brand icon** — replaced the falcon emblem in the balance card with a photo of a cyan diamond on velvet.
- ✅ **Search Bar in ClipsScreen** — header toggle + sliding input, filters by title/content/publisher.
- ✅ **A11y labels** — added `accessibilityRole`/`accessibilityLabel` on BottomNav, HomeScreen tiles, Clips header buttons, Profile settings gear, Settings back, Friends search & back, PrivateMessages composer.
- ✅ **DM Sticker bar** — 8 quick-reaction emoji shortcuts (❤️🔥👏😂🎉👍🙏⚡) above the message composer, sends instantly with one tap.

## Build History (May 24, 2026)
- ✅ Android Build `e439e6fb-5ae2-4b50-ba2f-61fa4caaf287` — in progress (v7.2.21 / versionCode 92)
- ✅ iOS Build `c70a0880-65b9-476d-b46f-6a1ab9c0213b` — scheduled with auto-submit to App Store Connect (v7.2.21 / buildNumber 114)
  - First iOS attempt was blocked by Free plan quota, retry succeeded
  - Submission ID: `3b0548eb-db9c-46d3-ae5a-452aee98ccdf`

## P1 Backlog
- Privacy Manifest / App Tracking Transparency review
- Direct file upload on web Advertiser page

## Key API Endpoints
- `GET /api/users/public-profile/{user_id}?viewer_id=...`
- `GET /api/users/clips/{user_id}?viewer_id=...`
- `GET /api/users/followers/{user_id}?viewer_id=...` (NEW - Feb 2026, privacy-aware)
- `GET /api/users/following/{user_id}?viewer_id=...` (NEW - Feb 2026, privacy-aware)
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

## Changelog (Feb 2026)
- **ClipsScreen.js layout fix**: Top "Live/Reels" bar is now compact (font 13/14, padding tightened). Card height now subtracts StoriesBar height (~86px) so each reel fits the visible viewport. Right-side action stack moved to absolute position (TikTok-style) with safe bottom offset — Follow/Share/Bookmark are no longer clipped off-screen.
- **Profile follower/following lists**: New backend endpoints `/api/users/followers/{id}` and `/api/users/following/{id}` with proper privacy enforcement (private accounts only expose lists to owner or existing followers). New reusable `FollowListModal` component used by both `ProfileScreen` (own profile) and `UserProfileScreen` (other users).
- **Settings revamp**: New sectioned layout (Account, Preferences, About & Support, Account Actions). All icons unified to pure white (`#FFF`). Added Blocked Users, Help & Support, Terms, Privacy Policy, Version row. Header redone with dark luxury palette instead of bright purple block.
- **Fixed UserProfileScreen follow bug**: payload was sending `follower_user_id` but backend expects `viewer_user_id` — now corrected.
- **Profile reel thumbnails fix**: Each reel tile in the profile grid now renders its own real thumbnail (absolute URL resolved). When `thumbnail_url` is missing, a deterministic varied fallback is picked from a pool of 9 Unsplash images per `clip_id`, so the grid no longer looks like a uniform red/pink block. A subtle play-overlay icon is rendered above the image. Applied to both `ProfileScreen.js` and `UserProfileScreen.js`.
- **Blocked Users feature wired**: New `BlockedUsersScreen.js` with route `blocked-users` in `App.js`, opened from Settings → "المستخدمون المحظورون". Lists blocked users with avatar/name/verified-badge and an "إلغاء الحظر" action. Backend `GET /api/moderation/blocks/{user_id}` enhanced to return hydrated `users` array (name/avatar/is_verified) so the frontend doesn't need extra round-trips.

## Verified Backend (curl)
- AdMob reward flow: `/api/economy/ad-watch-reward` grants +5 gems, cooldown 15s enforced, daily progress tracked. Tested end-to-end.
- Followers/Following lists: privacy honored (`private: true` returned when viewer can't see).
- Block/Unblock: persists, hydrated list works, idempotent block returns `already_blocked: true`.
