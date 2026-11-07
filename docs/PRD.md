# Product Requirements Document (PRD)

## Problem Statement
Users struggle to manage different aspects of their lives (finances, tasks, passwords, health) across multiple fragmented apps.

## Product Vision
To provide a single, secure, visually premium "super-app" for personal life management that feels professional and easy to navigate.

## Target Audience
General consumers, professionals, and families needing robust organization tools.

## Core Use Cases
- **PRD-001**: A user wants to track their daily expenses and monthly budget.
- **PRD-002**: A user needs a secure place to store website links and passwords.
- **PRD-003**: A user wants to manage family events and medical reminders.
- **PRD-004**: A user wants to manage loans/EMIs and work tasks.

## Public User Journey
1. Open the app (currently bypasses auth straight to Home).
2. View the dashboard with greeting and Khata Book.
3. Search or browse "Explore Modules".
4. Enter a module (e.g., Expense Tracker), add records, and see data securely saved to their profile.

## Admin Journey
1. Login as an Admin.
2. Navigate to "Admin Workplace".
3. Manage users (Add/Edit/Delete).
4. Configure global app settings and view support messages.

## User Onboarding
(Currently suspended) Will feature a welcome screen, sign-up/login, and a brief walkthrough of the module library.

## Authentication Requirements
- Support for email/password and potential Google Sign-In.
- Secure token generation and local session persistence.

## Free / Common Modules
All 20+ modules are currently available to all public users.

## Future Monetization
- Potential premium modules (e.g., Cloud Sync, Advanced Analytics) could be locked behind a paywall.

## Functional Requirements
- **FR-001**: Modules must save data specific to the logged-in user.
- **FR-002**: Password vault items must be AES encrypted before saving.
- **FR-003**: The Home Screen search must filter modules dynamically and case-insensitively in real-time.

## Non-Functional Requirements
- **NFR-001**: The UI must maintain the premium dark-neutral aesthetic.
- **NFR-002**: Data operations (save/load) must be near-instantaneous (under 100ms) leveraging local storage.

## Out-of-Scope Features (For Now)
- Real-time multiplayer collaborative modules.