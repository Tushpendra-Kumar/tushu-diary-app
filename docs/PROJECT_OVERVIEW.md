# Project Overview

## Purpose
TushuDiary is a comprehensive personal life management application by CodeByTushu ("Your Life, Your Diary."), designed to organize daily tasks, financial tracking, event planning, and private records securely within a unified, professional mobile interface.

## Target Users
- Individuals looking for an all-in-one personal management tool (daily planners, budgets, passwords, music, links, watchlists).
- Originally designed as a private/family app, now fully transitioned to a **public consumer app**.

## Public Application Goal
To become a scalable, professional application available on the Google Play Store, offering a secure local-first experience with a unified module system for all users.

## Admin Purpose
To manage users, view records and analytics, handle support messages, and manage global configurations without breaching private user data.

## Public User Interface
Features a dark-neutral premium aesthetic with a unified "Explore Modules" search-enabled dashboard containing **21 productivity and lifestyle tools**.

## Admin Interface
A separate **"Admin Workplace"** accessible via the middle tab to users with the `ADMIN` role, featuring user management, records, security controls, global notifications, and support messages.

## Overall Workflow
- **Auth Flow**: Email/Password login, Register, Forgot Password, and Social Login (Google, Apple, GitHub, Facebook via Firebase). Session persists via `AsyncStorage`.
- **Dashboard**: Access via `UserTabNavigator` (Home, Premium/Admin Workplace, Profile).
- **Modules**: Standalone tools that interact with `personalDataService.js` utilizing `AsyncStorage` for fast, local-first data retention.
- **Premium Tab**: Accessible to all users; contains Private Wallet, App Lock, Advanced Backup, Smart Insights, Analytics, Export Reports, Calendar, Search, Personalization, etc.

## Technology Stack
- **Frontend**: React Native (Expo ~57) + React 19
- **Navigation**: `@react-navigation/native` (Stack + Bottom Tabs)
- **State**: React Context (`AuthContext`, `ThemeContext`, `AppLockContext`)
- **Local Storage**: `@react-native-async-storage/async-storage`
- **Encryption**: `crypto-js` AES for Password Vault
- **Firebase**: `firebase` SDK v13 for Social Auth (Google, Apple, GitHub, Facebook)
- **Icons**: `lucide-react-native`
- **Backend**: Node.js + Express.js (`backend/server.js`)
- **Database**: SQLite (`database/tushuledger.sqlite`)
- **Push Notifications**: `expo-notifications`
- **Biometrics**: `expo-local-authentication`

## Current Development Stage
- **Frontend**: Near completion (React Native / Expo), full authentication flow operational with Firebase Social Login.
- **Backend**: Basic Node.js + SQLite structure exists with auth, admin user/record management, and message system APIs. User module data is primarily client-side (local-first).
- **Security**: Local data scoped per-user (`tushu_${userId}_${type}`), AES encryption for Password Vault, biometric gate for Private Wallet.

## Completed Functionality
- 21 unified modules (Tasks, Budgets, Vaults, Khata Book, Movies & Series, etc.) with full CRUD.
- Premium dark theme design system with dynamic accent color and density settings.
- Real-time case-insensitive search for modules.
- Local data persistence architecture (`AsyncStorage`).
- Encrypted Password Vault (AES per-user keyed).
- Private Wallet with categories, recycle bin (30-day expiry), and history.
- Full Auth flow: Email/Password + Social (Firebase).
- Push notifications for tasks, bills, birthdays, khata.
- App Lock (biometric/PIN) for Premium Wallet.
- Admin Workplace: User CRUD, Records CRUD, Message System, Security Controls, Activity Logs.

## Pending Functionality
- Cloud Sync / Backend mapping for all local modules.
- EAS production build & Play Store submission.
- AES key moved to `expo-secure-store`.
- Google OAuth on native Android (currently Web/Firebase only).
- Full E2E QA on physical Android devices.

## Future Goals & Play Store Release
- Thorough QA & security testing on physical Android devices.
- Finalizing the production environment configuration (`eas build`, API URLs).
- Google Play Store submission.
- Optional: Cloud Sync for module data.

## Important Project Decisions
- **Local-First Architecture**: Maximizes privacy and speed. User modules write to AsyncStorage first.
- **Unified Modules**: Removed gender-based segregation (Gents/Ladies folder names remain for code organization only, but all modules are equally accessible to all users).
- **Design Language**: Premium dark-neutral aesthetic — deep black (`#050505`) background with gold (`#F0A500` / `#F59E0B`) accents.
- **Firebase for Auth**: Social login handled via Firebase ID Token exchange with the backend (`/api/auth/social-login`).
- **Premium Tab**: The middle tab (`FamilyTab`) serves as both the "Admin Workplace" (for ADMINs) and the "Premium" section (for regular users).