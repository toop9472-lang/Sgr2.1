# Saqr Test Credentials

## Apple IAP (Phase 2)
- **Sandbox Tester**: `aaaaaatata079@gmail.com`
- **Country/Region**: Saudi Arabia
- **Bundle ID**: com.saqr.rewards
- **How to use**: On a real iPhone → Settings → [Your Apple ID] → Media & Purchases → Sandbox Account → Sign in.
  Then any purchase in the app shows `[Sandbox]` and is free.

## Apple App Store Server API
- **Issuer ID**: `2b3dfd1a-b44d-4cf7-94b8-6f10d64b9567`
- **Key ID**: `KX82RC2996`
- **Private Key**: `/app/backend/secrets/apple_iap_key.p8` (mode 600, NOT in git)

## Test User Email
- Reward test: `reward_test_22112@test.com` / `Test1234!`

## Notes
- Never commit `.p8` files to git (already in `.gitignore`).
- Sandbox tester emails must NOT be used as real Apple IDs.
