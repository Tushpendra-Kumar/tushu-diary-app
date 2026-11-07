# Database Specification

## Backend DB: SQLite (`database/tushuledger.sqlite`)
*(Managed via `backend/config/database.js`)*

### Table: `users`
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `full_name`: TEXT NOT NULL
- `user_id`: TEXT UNIQUE NOT NULL (slug-style, e.g. `tushpendrakumar`)
- `email`: TEXT UNIQUE
- `password_hash`: TEXT (nullable for social-only accounts)
- `firebase_uid`: TEXT (for social login linkage)
- `status`: TEXT DEFAULT `'ACTIVE'` (`ACTIVE` | `INACTIVE`)
- `role`: TEXT DEFAULT `'USER'` (`USER` | `ADMIN`)
- `has_khata`: INTEGER DEFAULT 1
- `created_at`: DATETIME
- `updated_at`: DATETIME

### Table: `records`
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `user_id`: INTEGER (FK → users.id, ON DELETE CASCADE)
- `title`: TEXT NOT NULL
- `amount`: REAL NOT NULL
- `description`: TEXT
- `record_date`: TEXT NOT NULL

### Table: `messages`
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `user_id`: INTEGER (FK → users.id)
- `subject`: TEXT NOT NULL
- `message`: TEXT NOT NULL
- `admin_reply`: TEXT
- `created_at`: DATETIME
- `replied_at`: DATETIME

---

## Frontend Data Store: `AsyncStorage`
All user data is stored locally using namespaced keys per user.

### Per-User Keys (`tushu_${userId}_${type}`)
| Key Pattern | Data Type | Used By |
| :--- | :--- | :--- |
| `tushu_${userId}_tasks` | Task[] | Daily Planner |
| `tushu_${userId}_work_tasks` | WorkTask[] | Work Tasks |
| `tushu_${userId}_notes` | Note[] | Quick Notes |
| `tushu_${userId}_expenses` | Expense[] | Expense Tracker |
| `tushu_${userId}_budget_${month}` | BudgetData | Monthly Budget |
| `tushu_${userId}_categories` | Category[] | Expense Categories |
| `tushu_${userId}_shopping` | ShoppingList[] | Shopping List |
| `tushu_${userId}_khata` | KhataContact[] | Khata Book |
| `tushu_${userId}_recipes` | Recipe[] | Recipes |
| `tushu_${userId}_medicines` | Medicine[] | Medicine Reminder |
| `tushu_${userId}_docs` | Document[] | Media Vault / Important Docs |
| `tushu_${userId}_goals` | Goal[] | Self-Care Goals |
| `tushu_${userId}_savings` | Saving[] | Goals & Savings |
| `tushu_${userId}_vehicles` | Vehicle[] | Vehicle Manager |
| `tushu_${userId}_bills` | Bill[] | Bills & Payments |
| `tushu_${userId}_emis` | EMI[] | EMI Reminder |
| `tushu_${userId}_website_links` | Link[] | Website Links |
| `tushu_${userId}_my_music` | MusicEntry[] | My Music |
| `tushu_${userId}_movies_series` | MovieEntry[] | Movies & Series |
| `tushu_${userId}_password_vault` | VaultEntry[] (AES encrypted) | Password Vault |
| `tushu_${userId}_wallet_${category}` | WalletRecord[] | Private Wallet |
| `tushu_${userId}_wallet_recycle_bin` | WalletRecord[] | Wallet Recycle Bin |
| `tushu_${userId}_wallet_history` | HistoryEntry[] | Wallet History |
| `tushu_${userId}_personal_events` | PersonalEvent[] | Personal Events (Calendar) |
| `tushu_${userId}_files_mock` | FileEntry[] | Media Vault |

### Shared Keys (No userId prefix)
| Key Pattern | Data Type | Used By |
| :--- | :--- | :--- |
| `tushu_shared_fam_events` | FamilyEvent[] | Family Events |
| `tushu_shared_fam_notices` | FamilyNotice[] | Notice Board |
| `tushu_shared_fam_birthdays_v2` | Birthday[] | Birthdays |

### Auth Session Keys
| Key | Data Type |
| :--- | :--- |
| `userToken` | JWT string |
| `userData` | User object JSON |