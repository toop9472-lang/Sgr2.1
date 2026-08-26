# Test Credentials — طير (Tair)

## 🛡️ Super Admin
- **Email**: `sky-321@hotmail.com`
- **Password**: (held by owner)
- **user_id**: `user_93fd2a08e40e`
- **admin id**: `admin_e014ed8981b8`
- **role**: `super_admin`
- **name**: `مدير صقر`
- **is_admin**: `true`

## Guest Mode (for web preview testing)
- Tap **"الدخول كزائر"** on the auth page. No account needed.
- The guest gets a temporary `id: guest_<timestamp>` and can browse listings/trips freely.
- Guest cannot create listings or place real orders (backend expects a valid user_id).

## Test User (create via /api/auth/register)
- Any email/password works. `POST /api/auth/register` with a valid strong password will create a user and return `{ user, token }`.

## Notes
- Admin login uses `/api/admin/auth/login` and returns a JWT for admin actions.
- Tair backend routes are user-scoped via `?user_id=` query — no strict JWT enforcement on the marketplace endpoints (MVP).
