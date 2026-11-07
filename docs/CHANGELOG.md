# Changelog

## [Unreleased — v1.0.0]

### Added
- **21 User Modules**: All productivity and lifestyle modules implemented with CRUD via `AsyncStorage`.
- **Movies & Series**: Watchlist and tracker module with rating, status tracking.
- **Private Wallet**: Multi-category financial records (Bank, Cash, Crypto, Gold, etc.), recycle bin (30-day auto-expiry), history log; biometric-gated.
- **App Lock**: Biometric/PIN gate for sensitive Premium features via `AppLockContext` + `expo-local-authentication`.
- **Firebase Social Login**: Google, Apple, GitHub, Facebook via Firebase ID Token exchange.
- **Forgot Password**: Email-based password reset flow connected to backend.
- **Change Password**: Authenticated password update via backend API.
- **Dynamic Theme System**: `ThemeContext` allowing accent color and layout density preferences.
- **Push Notifications**: `notificationService.js` for task, bill, birthday, and khata reminders via `expo-notifications`.
- **Message System**: Users can contact admin; admin can reply; full `messageRoutes.js` + `messageController.js` backend.
- **Social Auth Service**: `socialAuthService.js` handling Firebase Social providers.
- **Advanced Premium Screens**: Advanced Backup & Sync, Advanced Calendar, Advanced Analytics, Smart Insights, Export Reports, Advanced Reminders, Advanced Search, Extra Storage, Premium Personalization, Advanced Website Manager, My Music Advanced, Advanced Data Management.
- **9 Reusable Components**: `AppHeader`, `AppTextInput`, `EmptyState`, `KhataLinker`, `NavigationDrawer`, `ParticleBackground`, `SecurityFooter`, `StatCard`, `UserCard`.
- **Explore Modules**: Real-time, case-insensitive search bar on Home Screen.
- **Website Links**: Module to store and open URLs.
- **My Music**: Module to track songs/playlists.
- **Password Vault**: Secure, AES-encrypted credentials manager.
- **Project Documentation**: Comprehensive `docs/` architecture.

### Changed
- **Authentication**: Reconnected full auth flow (was bypassed during development; now active with Email/Password + Firebase Social Login).
- **Unified Modules**: Merged separate male/female interfaces into a single public unified module registry (`config/modulesConfig.js`). Folder structure (`gents/`, `ladies/`) retained for code organization.
- **Middle Tab**: Renamed from "Family/Circle" to "Premium" for regular users; shows "Admin Workplace" for ADMIN role.
- **UI Theme**: Perfected the premium black & gold theme with dynamic accent support.
- **Tab Navigator**: Gold active indicator with glow effect; label hidden, icons + small text.

### Fixed
- **Web UI**: Removed default browser white focus outline ring on TextInputs (global CSS injection in `App.js`).
- **Metro Bundler**: Resolved `crypto-js` caching issues via `--clear` flag.
- **Navigation**: Fixed double-header issues, prop warnings (`props.pointerEvents` deprecated), and `aria-hidden` warnings.