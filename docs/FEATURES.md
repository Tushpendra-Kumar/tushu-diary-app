# Complete Feature & Module Inventory

| Feature ID | Module Name | Purpose | User/Admin | Status | Completed | CRUD Support | Dependencies |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| MOD-01 | Daily Planner | Tasks & Schedule | User | Active | 100% | Yes | `AsyncStorage`, `notificationService` |
| MOD-02 | Work Tasks | Manage Work | User | Active | 100% | Yes | `AsyncStorage` |
| MOD-03 | Expense Tracker | Daily Spending | User | Active | 100% | Yes | `AsyncStorage`, Khata Linker |
| MOD-04 | Monthly Budget | Track Expenses | User | Active | 100% | Yes | `AsyncStorage`, Categories |
| MOD-05 | Shopping List | Grocery & More | User | Active | 100% | Yes | `AsyncStorage` |
| MOD-06 | Vehicle Manager | Service & Papers | User | Active | 100% | Yes | `AsyncStorage` |
| MOD-07 | Bills & Payments | Monthly Bills | User | Active | 100% | Yes | `AsyncStorage`, `notificationService` |
| MOD-08 | EMI Reminder | Loan & EMI | User | Active | 100% | Yes | `AsyncStorage` |
| MOD-09 | Goals & Savings | Savings Targets | User | Active | 100% | Yes | `AsyncStorage` |
| MOD-10 | Self-Care Goals | Personal Growth | User | Active | 100% | Yes | `AsyncStorage` |
| MOD-11 | Recipes | Favourite Dishes | User | Active | 100% | Yes | `AsyncStorage` |
| MOD-12 | Medicine Reminder | Medicines & Appt. | User | Active | 100% | Yes | `AsyncStorage` |
| MOD-13 | Family Events | Dates & Gatherings | User | Active | 100% | Yes | `AsyncStorage` (shared) |
| MOD-14 | Birthdays | Family Dates | User | Active | 100% | Yes | `AsyncStorage` (shared), `notificationService` |
| MOD-15 | Notice Board | Family Updates | User | Active | 100% | Yes | `AsyncStorage` (shared) |
| MOD-16 | Quick Notes | Jot it down | User | Active | 100% | Yes | `AsyncStorage` |
| MOD-17 | My Media | Photos, Videos & Docs | User | Active | 100% | Yes | `AsyncStorage`, `expo-image-picker` |
| MOD-18 | Website Links | Useful sites | User | Active | 100% | Yes | `AsyncStorage` |
| MOD-19 | My Music | Songs & Playlists | User | Active | 100% | Yes | `AsyncStorage` |
| MOD-20 | Movies & Series | Watchlist & Tracker | User | Active | 100% | Yes | `AsyncStorage` |
| MOD-21 | Password Vault | Secure credentials | User | Active | 100% | Yes | `AsyncStorage`, `crypto-js` AES |

**Special Modules (Not in main grid, accessible separately):**

| Feature ID | Module Name | Purpose | User/Admin | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| MOD-K1 | Khata Book | Personal Ledger (Contact + Entries) | User | Active | Accessible from Home via dedicated button; linked to Expense Tracker |
| MOD-P1 | Private Wallet | Multi-category financial records, recycle bin, history | User | Active | Premium Tab; biometric-gated via App Lock |
| MOD-A1 | Admin Workplace | User management, records, messages, security | Admin | Active | Middle tab transforms when role=ADMIN |

*Note: All 21 primary modules are maintained in `mobile/config/modulesConfig.js` allowing dynamic scaling and global search inclusion. The `label` and `route` fields drive both the search bar and navigation.*