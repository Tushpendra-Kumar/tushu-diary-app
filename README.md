# TushuDiary
**Brand**: CodeByTushu  
**Tagline**: Your Life, Your Diary.  
**Package**: `com.codebytushu.tushudiary`

## Current Phase
Phase 9 — Premium Features & Pre-Release

## Technology Stack
* React Native (Expo ~57) + React 19
* Node.js + Express.js (Backend)
* SQLite (Backend database)
* Firebase (Social Auth — Google, Apple, GitHub, Facebook)
* AsyncStorage (Local-first frontend data)
* crypto-js (AES encryption for Password Vault)
* expo-local-authentication (Biometric App Lock)
* expo-notifications (Push Notifications)
* lucide-react-native (Icons)

## Current Status
**~87% complete.** 21 modules fully implemented. Full auth flow (Email/Password + Social/Firebase) reconnected. Premium features (Private Wallet, App Lock, Smart Insights, Analytics, etc.) implemented. Backend APIs for auth, admin user/record management, and message system operational. Pending: EAS production build, Play Store submission, E2E QA on physical Android devices.

## Quick Start
```bash
cd mobile
npx expo start -c --web   # Frontend (Web)

cd backend
node server.js             # Backend API (Port 3000)
```

## Documentation
See `docs/` for full specifications:
- `docs/PROJECT_STATUS.md` — Current status (single source of truth)
- `docs/PROJECT_OVERVIEW.md` — Architecture & decisions
- `docs/FEATURES.md` — Module inventory
- `docs/BACKEND_SPECIFICATION.md` — API routes
- `docs/FRONTEND_SPECIFICATION.md` — Screen structure & components
- `docs/SECURITY_ACCESS.md` — Auth & encryption
- `docs/ROADMAP.md` — Phase progress
