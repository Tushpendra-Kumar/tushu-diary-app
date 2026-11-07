# Development Backlog & Feature Tickets

| Ticket ID | Title | Module | Priority | Status | Progress | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| FT-001 | Migrate to unified public modules | System | Critical | Completed | 100% | Removed male/female silos |
| FT-002 | Add Search Bar to Home | Home | High | Completed | 100% | Real-time, case-insensitive |
| FT-003 | Fix Web Focus Outline on Search | UI | High | Completed | 100% | Removed white ring via global CSS |
| FT-004 | Add Website Links Module | Links | High | Completed | 100% | Implemented w/ AsyncStorage |
| FT-005 | Add Password Vault Module | Vault | Critical | Completed | 100% | Uses AES Encryption (per-user key) |
| FT-006 | Reconnect Authentication Flow | Auth | High | Completed | 100% | Email/Password + Firebase Social Login all reconnected |
| FT-007 | Cloud Sync Architecture | Data | Medium | Pending | 0% | Map local AsyncStorage to backend DB |
| FT-008 | Private Wallet | Premium | High | Completed | 100% | Categories, recycle bin (30-day), history, biometric gate |
| FT-009 | Firebase Social Login | Auth | High | Completed | 100% | Google, Apple, GitHub, Facebook via Firebase ID Token |
| FT-010 | App Lock (Biometric Gate) | Security | High | Completed | 100% | `AppLockContext` + `expo-local-authentication` |
| FT-011 | Movies & Series Module | Entertainment | Medium | Completed | 100% | Watchlist + tracker via AsyncStorage |
| FT-012 | Dynamic Theme System | UI | Medium | Completed | 100% | `ThemeContext` with accent color + density prefs |
| FT-013 | Message System (User ↔ Admin) | Support | Medium | Completed | 90% | Backend API done; Admin reply UI done |
| FT-014 | Push Notifications | Notifications | Medium | Completed | 80% | Task, bill, birthday, khata reminders via `expo-notifications` |
| FT-015 | EAS Build & Play Store Release | Deployment | Critical | Pending | 10% | Requires final QA + keystore setup |
| FT-016 | AES Key Migration to SecureStore | Security | High | Pending | 0% | Move hardcoded key to `expo-secure-store` |
| FT-017 | Native Android Google OAuth | Auth | Medium | Pending | 0% | Currently only Web/Firebase flow works |