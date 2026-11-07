# Deployment Specification

## Local Development
- **Frontend**: `cd mobile && npx expo start -c --web`
- **Backend**: `cd backend && node server.js` (Port 3000)

## Frontend Deployment (Expo Web)
- Build command: `npx expo export -p web`
- Output: `mobile/dist/` directory (contains HTML/JS/CSS assets; a previous build exists).
- Hosting: Can be deployed to Vercel, Netlify, or Firebase Hosting.

## Native App Deployment (Google Play Store)
- Requires EAS (Expo Application Services).
- Command: `cd mobile && eas build --platform android`
- Configuration: Managed in `mobile/app.json` and `mobile/eas.json`.
- Android Package: `com.codebytushu.tushudiary` (Version Code: 1)
- Keys: Requires Android Keystore setup before submission.
- Status: **Not Started (Pending QA completion)**

## Environment Variables

### Backend (`.env` in project root or `backend/` — see `.env.example`)
- `PORT` — Backend port (default: 3000)
- `JWT_SECRET` — Secret for signing JWT tokens
- `NODE_ENV` — `development` or `production`
- `FRONTEND_URL` — Allowed CORS origin in production
- `DATABASE_PATH` — Path to SQLite database file

### Frontend (Expo — `EXPO_PUBLIC_*` prefix required)
- `EXPO_PUBLIC_API_URL` — Backend API base URL *(planned; currently auto-detected via `adminApi.js`)*
- `EXPO_PUBLIC_ENCRYPTION_KEY` — AES key for Password Vault *(planned; currently hardcoded)*

### Firebase (Configured directly in `mobile/config/firebase.js`)
- `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`, `measurementId`
- Firebase service account for backend: `backend/firebase-service-account.json.json`

## Pre-Release Checklist
- [ ] Set `JWT_SECRET` to a strong secret in production `.env`
- [ ] Set `FRONTEND_URL` for CORS restriction
- [ ] Migrate AES key to `EXPO_PUBLIC_ENCRYPTION_KEY` + `expo-secure-store`
- [ ] Run `eas build --platform android` and test APK on physical device
- [ ] Set up Android Keystore for Play Store signing
- [ ] Submit to Google Play Console