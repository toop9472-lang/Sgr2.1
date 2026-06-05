# Test Credentials — Saqr App

## 🛡️ Super Admin
- **Email**: `sky-321@hotmail.com`
- **Password**: (held by owner)
- **user_id**: `user_93fd2a08e40e`
- **admin id**: `admin_e014ed8981b8`
- **role**: `super_admin`
- **name**: `مدير صقر`
- **is_admin**: `true`

## Apple Sandbox Tester
- Used for IAP testing in TestFlight (sandbox account managed by owner).

## Notes
- Admin login uses `/api/admin/auth/login` and returns a JWT for admin actions.
- Regular flows (delete clip/comment) accept either the admin's `user_id` or the linked `users.id` because backend `_is_admin` resolves admin status via:
  1. `admins.id / user_id / email`
  2. `users.role / is_admin` flags
  3. `users.email → admins.email` lookup
