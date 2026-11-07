# Frontend Specification

## Architecture
- **Framework**: React Native (Expo ~57) + React 19
- **Navigation**: `@react-navigation/native` (Native Stack + Bottom Tabs)
- **State Management**: React Context (`AuthContext`, `ThemeContext`, `AppLockContext`) & Local State (`useState`, `useFocusEffect`)
- **Package**: `mobile/package.json` — managed under the `mobile/` directory

## Entry Points
- `mobile/index.js`: Expo entry point, registers `App` component.
- `mobile/App.js`: Wraps `AuthProvider` > `ThemeProvider` > `AppLockProvider` > `AppNavigator`.

## Screen/Page Structure
```
mobile/
├── App.js                          — Root, providers + AppNavigator
├── navigation/
│   └── UserTabNavigator.js         — 3-tab navigator (HomeStack, FamilyStack, ProfileStack)
├── screens/
│   ├── WelcomeScreen.js            — Auth entry
│   ├── LoginScreen.js              — Email/Password + Social Login
│   ├── RegisterScreen.js           — Account creation
│   ├── ForgotPasswordScreen.js     — Password reset
│   ├── admin/                      — 11 Admin screens (Dashboard, Users, Records, Docs Manager, etc.)
│   └── user/
│       ├── PublicHomeScreen.js     — Home tab: Greeting, Khata summary, Explore Modules grid
│       ├── common/                 — 33 screens (modules, premium features, settings views)
│       ├── gents/                  — 6 screens (Expense, Work, Vehicle, Bills, EMI, Goals)
│       ├── ladies/                 — 5 screens (Shopping, Budget, Recipes, Medicine, SelfCare)
│       ├── khata/                  — 2 screens (KhataScreen, KhataContactScreen)
│       └── settings/               — 21 screens (Profile settings + Admin settings)
```

## Navigation Structure
- **Tab 1 — Home** (`HomeStack`): `PublicHomeScreen` (or `AdminHomeScreen` for ADMIN) → All 21 module screens + Settings screens accessible via `AppHeader`.
- **Tab 2 — Premium/Admin Workplace** (`FamilyStack`): `FamilyScreen` → Private Wallet, App Lock, Advanced features, OR Admin screens for ADMIN role.
- **Tab 3 — Profile** (`ProfileStack`): `ProfileScreen` → Settings, Personal Info, Privacy, Admin settings.

## Components (Reusable — `mobile/components/`)
| Component | Purpose |
| :--- | :--- |
| `AppHeader.js` | Standardized top navigation header with back/settings navigation |
| `AppTextInput.js` | Themed text input with consistent styling |
| `EmptyState.js` | Empty list placeholder used across all modules |
| `KhataLinker.js` | Links expense entries to Khata contacts |
| `NavigationDrawer.js` | Sidebar for quick navigation access |
| `ParticleBackground.js` | Premium animated dark background layer |
| `SecurityFooter.js` | Security seal appended to module lists |
| `StatCard.js` | Summary statistics card |
| `UserCard.js` | User profile card in admin views |

## Services (`mobile/services/`)
| Service | Purpose |
| :--- | :--- |
| `personalDataService.js` | All AsyncStorage CRUD for 21 modules + Private Wallet + Khata |
| `adminApi.js` | HTTP calls to backend Admin APIs (users, records, messages) |
| `userApi.js` | HTTP calls to backend User APIs (profile, records) |
| `notificationService.js` | Push notification scheduling (tasks, bills, birthdays, khata) |
| `analyticsService.js` | Local analytics calculations |
| `appLockService.js` | Biometric/PIN verification for App Lock |
| `attachmentService.js` | File attachment handling |
| `backupService.js` | Local backup export/import |
| `calendarService.js` | Calendar integration helpers |
| `dashboardService.js` | Dashboard data aggregation |
| `dataManagementService.js` | Data import/export and management |
| `insightsEngine.js` | Smart insights calculations |
| `personalizationService.js` | Theme/accent/density preference storage |
| `recycleBinService.js` | Recycle bin management (non-wallet) |
| `reminderService.js` | Reminder scheduling helpers |
| `reportService.js` | Report generation for Export Reports |
| `searchService.js` | Advanced cross-module search |
| `socialAuthService.js` | Firebase social auth (Google, Apple, GitHub, Facebook) |

## Current Theme & Design Rules
Defined in `mobile/constants/theme.js`.
- **Background**: Deep black (`#050505`) with subtle corner glows.
- **Cards**: Translucent dark surfaces (`rgba(10, 10, 10, 0.75)`) with gold borders (`rgba(240, 165, 0, 0.35)`).
- **Primary Accent**: Gold (`#F0A500` / `#F59E0B`) — dynamically configurable via `ThemeContext`.
- **Typography**: Clean, sans-serif, using `C.textMuted` for subtitles.
- **Icons**: `lucide-react-native`.
- **Search Bar**: Case-insensitive, real-time filtering, border-less on focus (web via `outlineStyle: 'none'`).
- **Bottom Tabs**: Height `68px`, dark background, gold active indicator with glow.

## Mobile Behavior
- Uses `SafeAreaView` for notch handling.
- `ScrollView` indicators hidden.
- Grid layouts adapt via percentage widths (`45%` on module cards).
- `react-native-screens` enabled for native performance.
- Web focus outlines suppressed globally via injected CSS in `App.js`.

## Config Files
- `mobile/config/modulesConfig.js` — Module registry (`APP_MODULES` array) powering search and navigation.
- `mobile/config/firebase.js` — Firebase app init + Auth providers (Google, Apple, GitHub, Facebook).
- `mobile/constants/theme.js` — `C` object with all color/spacing constants.
- `mobile/app.json` — Expo config (name, slug, Android package `com.codebytushu.tushudiary`, icons).
- `mobile/eas.json` — EAS build profiles.