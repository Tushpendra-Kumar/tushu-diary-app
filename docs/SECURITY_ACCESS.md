# Security & Access Specification

## Authentication
- **Email/Password**: Full login, register, and forgot-password flow via backend JWT.
- **Social Login**: Google, Apple, GitHub, Facebook via Firebase ID Token → backend validates → issues JWT.
- **Session Persistence**: `userToken` and `userData` stored in `AsyncStorage`. Restored on app launch.
- **Strict Admin Role Enforcement**: Only the registered admin email `tushpendrakumar@gmail.com` (and matching user ID `tushpendrakumar`) is granted `role: ADMIN`. All other registered or logging-in users are strictly enforced as `role: USER`.

## Public User Access
- Normal users see only the public user interface: `PublicHomeScreen` (21 modules + Khata Book), "Premium" tab (Private Wallet, App Lock, etc.), and their own profile settings. Admin screens are completely hidden and inaccessible.
- Users access only their own data stored locally in `AsyncStorage` under their specific `userId` prefix.
- Auth guard architecture is active — `user == null` renders `AuthStack`, `user != null` renders `UserTabNavigator`.

## Admin Access
- Exclusively active when logging in with registered admin ID `tushpendrakumar@gmail.com`.
- `HomeTab` displays the **Admin Portal** with dedicated **Files & Documentation Hub Hero Card**, quick admin module shortcuts, Khata Book, and modules.
- The `FamilyTab` transforms into **"Admin Workplace"** with user metrics, quick user management, message system, and direct Files & Documentation Hub access.
- Backend Admin routes (`/api/admin/docs`, `/api/admin/users`, `/api/admin/records`, etc.) are protected by `authenticateUser` and `requireRole('ADMIN')` middleware.

## App Lock (Biometric Gate)
- `AppLockContext` provides `requireAuthForModule()` for protecting sensitive features.
- **Private Wallet** is gated behind biometric/PIN verification via `expo-local-authentication`.
- Lock state persists across navigation sessions.

## Data Privacy & Encryption
- **Password Vault**: Uses `crypto-js` AES encryption with a per-user composite key (`ENCRYPTION_KEY + userId`) before saving to `AsyncStorage`.
- **Private Wallet**: Separated under `tushu_${userId}_wallet_${category}` keys; biometric-gated access.
- **Local-First**: User module data never leaves the device unless explicitly synced to a backend.

## Security Checklist
- [x] Auth flow reconnected (Email/Password + Social via Firebase).
- [x] JWT verification enforced on all protected backend routes.
- [x] Role-based access (`ADMIN` / `USER`) enforced on backend.
- [x] AES encryption for Password Vault (per-user key).
- [x] Biometric gate for Private Wallet via `AppLockContext`.
- [ ] Migrate AES Secret Key to `expo-secure-store` (currently hardcoded in `personalDataService.js`).
- [ ] Implement proper Google OAuth on native Android (currently web/Firebase flow).
- [ ] Full E2E security audit before Play Store release.