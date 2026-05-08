# Saqr (صقر) — Reels & Chat Social App

## Original Problem Statement
Mobile-first social app (Reels/Clips + Chat) with rewards economy ("Saqr Gems") earned via AdMob. Web frontend mirrors mobile UI 1:1. Goal: pass Apple App Store review and ship live.

User language: العربية (Arabic).

## Architecture
- **Backend**: FastAPI + MongoDB + Cloudflare R2 storage. Routes under `/app/backend/routes/`.
- **Web**: React (`/app/frontend`).
- **Mobile**: React Native + Expo SDK 53 (`/app/mobile`).
- **Build**: EAS Build, profile `production`.
- **Storage**: Cloudflare R2 bucket `saqr-videos` with public dev URL `https://pub-9849a8b610d448febb21ebea9a01ad1e.r2.dev`.

## Implemented (CHANGELOG)

### 2026-05-08 — Build 108 / v7.2.18 submitted ✅
- **Cloudflare R2 integration**: clips, ads, avatars now upload to R2 (persistent across deploys); falls back to local disk only if R2 unconfigured.
- **Video Range/Streaming support**: backend serves `/api/clips/media/*` with HTTP 206 + `Accept-Ranges: bytes` (fixes iOS playback).
- **Reels playback**: full-screen video, ResizeMode.COVER, `usePoster=false`, supports query params and all video extensions.
- **Upload limit**: increased from 60MB → 200MB for higher quality.
- **HomeScreen icons fixed**: AppIcon now accepts Ionicons names directly (was treating them as image URIs and failing silently).
- **Balance auto-sync**: web `App.js` syncs `/api/economy/balance/{userId}` every 30s, mobile `HomeScreen` triggers refresh on mount.
- **Admin moderation in-app**:
  - `DELETE /api/clips/{clip_id}?user_id=X` — owner or admin can delete clips.
  - `DELETE /api/clips/{clip_id}/comment/{comment_id}?user_id=X` — owner/clip-owner/admin can delete comments.
  - `DELETE /api/economy/chat/messages/{message_id}?user_id=X` — author or admin can delete chat messages.
  - Mobile UI: trash button on Reels for owners/admins, long-press on chat messages.
- **Admin CSV export**: `GET /api/admin/dashboard/export/{users|ads|withdrawals|clips}.csv` (UTF-8 BOM for Excel).
- **AdminSettings contrast fix**: white background, slate-700 text, indigo active tabs.
- **Avatar upload from gallery**: `POST /api/users/upload-avatar` (mobile uses ImagePicker; uploads to R2).
- **Privacy Policy updated**: reflects Reels/AdMob/Saqr Gems (May 2026).
- Submission: `8098b857-...` → FINISHED 13:03 UTC, build `db63d1a7-...`.

### Previous (May 6–7)
- Pivot to Reels/Clips, removed minigames.
- Synced Web UI with Mobile (lucide-react icons, removed dark overlays).
- Fixed 11 routes for ObjectId serialization.
- Apple Auth `[object Object]` parsing fixed.

## Pending / Roadmap
- **P0** Wait for Apple App Review on build 108. User must finalize ASC metadata if not already.
- **P1** Migrate any old clips with `/api/clips/media/*` URLs to R2 once disk is wiped (one-shot script if needed).
- **P1** Connect a custom domain to R2 for production (currently using r2.dev rate-limited URL).
- **P1** In-App Purchases (backend + mobile).
- **P1** Achievements system logic.
- **P2** iPad-specific layout fixes.
- **P2** App Tracking Transparency (ATT) prompt verification.

## Test Credentials
See `/app/memory/test_credentials.md`.

## Known Pitfalls
- `git pull` from external repo can revert backend fixes — re-verify after each pull.
- EAS auto-increment OFF (`appVersionSource: local`); always bump `ios.buildNumber` before each iOS build.
- R2 public bucket: only those with the URL can view — don't link clip URLs publicly outside the app context.
- `load_dotenv()` must run BEFORE route imports in `server.py` (else R2 sees empty env vars).

## Critical Env Vars (backend/.env)
```
R2_ACCOUNT_ID=b244be903ca944ebf565be51ea007ad8
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=saqr-videos
R2_PUBLIC_BASE_URL=https://pub-9849a8b610d448febb21ebea9a01ad1e.r2.dev
R2_ENDPOINT=https://b244be903ca944ebf565be51ea007ad8.r2.cloudflarestorage.com
```
