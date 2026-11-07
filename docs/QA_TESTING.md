# QA & Testing Checklist

| Test ID | Category | Description | Status |
| :--- | :--- | :--- | :--- |
| QA-001 | UI/Search | Verify search bar filters modules in real-time (case-insensitive) | ✅ Passed |
| QA-002 | UI/Search | Verify clear 'X' button restores full module list | ✅ Passed |
| QA-003 | UI/Search | Verify no unwanted white outline on focus in Web | ✅ Passed |
| QA-004 | Core Modules | Verify Add/Edit/Delete in Expense Tracker | ✅ Passed |
| QA-005 | Core Modules | Verify Password Vault encrypts/decrypts correctly | ✅ Passed |
| QA-006 | Navigation | Verify Admin Workplace only accessible by ADMIN role | ✅ Passed (Auth reconnected) |
| QA-007 | Auth | Verify Email/Password Login and Registration flows | ✅ Passed |
| QA-008 | Production | Verify Expo Web bundle compiles without errors | ✅ Passed |
| QA-009 | Auth | Verify Firebase Social Login (Google/GitHub/Facebook/Apple) | 🟡 Partial (Web tested; native Android pending) |
| QA-010 | Premium | Verify Private Wallet CRUD + Recycle Bin (30-day expiry) | 🟡 Untested on physical device |
| QA-011 | Security | Verify App Lock biometric gate on Private Wallet | 🟡 Untested on physical device |
| QA-012 | Notifications | Verify push notifications fire for tasks, bills, birthdays | 🟡 Untested on physical device |
| QA-013 | Auth | Verify Forgot Password email flow end-to-end | 🟡 Untested |
| QA-014 | Admin | Verify Admin can view, reply to user messages | 🟡 Untested |
| QA-015 | Production | Verify EAS Android build succeeds (APK/AAB) | 🔴 Not Started |