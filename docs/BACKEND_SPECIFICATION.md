# Backend Specification

## Backend Architecture
- **Server**: Node.js with Express.js (`backend/server.js`).
- **Database**: SQLite (`backend/config/database.js` / `database/tushuledger.sqlite`).
- **Firebase Admin**: Configured via `backend/firebase.js` using `backend/firebase-service-account.json.json`.
- **Port**: 3000 (default).

## Routes & Controllers

### Auth Routes (`/api/auth` → `authRoutes.js`)
- `POST /api/auth/login` — Email/Password login; returns JWT.
- `POST /api/auth/register` — New user registration; returns JWT.
- `POST /api/auth/forgot-password` — Sends password reset email.
- `POST /api/auth/social-login` — Accepts Firebase ID Token, verifies via Firebase Admin, returns JWT.
- `POST /api/auth/change-password` — Authenticated user changes own password.

### Admin User Routes (`/api/admin/users` → `adminUserRoutes.js`) — Requires ADMIN role
- `GET /api/admin/users` — List all users.
- `POST /api/admin/users` — Admin creates a user.
- `GET /api/admin/users/:id` — Get specific user.
- `PUT /api/admin/users/:id` — Update user details.
- `PATCH /api/admin/users/:id/status` — Toggle user status (ACTIVE/INACTIVE).
- `DELETE /api/admin/users/:id` — Delete user.

### Admin Record Routes (`/api/admin` → `adminRecordRoutes.js`) — Requires ADMIN role
- `GET /api/admin/users/:userId/records` — Fetch user's records.
- `GET /api/admin/users/:userId/records/total` — Fetch user's total amount.
- `POST /api/admin/users/:userId/records` — Add record for user.
- `GET /api/admin/records/:id` — Fetch specific record.
- `PUT /api/admin/records/:id` — Update record.
- `DELETE /api/admin/records/:id` — Delete record.

### Admin Documentation & Files Routes (`/api/admin/docs` → `adminDocsRoutes.js`) — Requires ADMIN role
- `GET /api/admin/docs` — List all 19 documentation and report files with metadata (category, size, lines, updatedAt).
- `GET /api/admin/docs/:fileName` — Fetch full content of a specific documentation file.
- `PUT /api/admin/docs/:fileName` — Write edited content directly to the file on disk.

### User Routes (`/api/user` → `userRoutes.js`) — Requires Auth
- `GET /api/user/profile` — Returns authenticated user's profile.
- `GET /api/user/records` — Returns user's own records.
- `GET /api/user/records/total` — Returns user's total amount.
- `GET /api/user/family` — Returns family members (used by admin API client).

### Message Routes (`/api/messages` → `messageRoutes.js`) — Mixed Auth
- `POST /api/messages/user` — User sends message to admin.
- `GET /api/messages/user` — User fetches their own messages/replies.
- `GET /api/messages/admin` — Admin fetches all messages (Requires ADMIN).
- `POST /api/messages/admin/:id/reply` — Admin replies to a message (Requires ADMIN).

### Health
- `GET /api/health` — Returns `{ success: true, message: "TushuDiary API is running" }`.

## Middleware
- `authMiddleware.js` (`authenticateUser`): Verifies Firebase ID Token or JWT.
- `roleMiddleware.js` (`requireRole`): Ensures user has specified role before proceeding.
- `ownershipMiddleware.js`: Ensures users only edit their own data.
- `validationMiddleware.js`: Validates request bodies.

## Backend Utility Scripts
- `seedAdmin.js` — Seeds the initial admin user with role `ADMIN`. Safe utility preserved for initial setup.
*(All one-time setup and migration scripts like `fixAdmin.js`, `setAdminPassword.js`, `checkAdmin.js`, `updateCredentials.js`, `deletePapa.js`, and `migrationInterface.js` have been securely cleaned up).*

## Module-wise Backend Functionality
The **vast majority of modules rely on Local `AsyncStorage`** via `personalDataService.js`. The SQLite backend serves for:
1. Auth (Login, Register, Social Login, Forgot Password)
2. Admin User Management (CRUD for users)
3. Admin Record Management (financial records per user)
4. Message System (user ↔ admin)