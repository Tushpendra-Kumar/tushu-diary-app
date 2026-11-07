# Logical Data Model

## User Entity
- `userId` (String)
- `fullName` (String)
- `role` (String: USER | ADMIN)
- `dpUri` (String, Optional)

## Generic Module Entity (AsyncStorage)
Most modules follow a standard JSON object structure:
- `id`: UUID string
- `createdAt`: ISO Date string
- `title` / `name` / `label`: String
- `description` / `notes`: String
- *Module-specific fields* (e.g., `url` for Website Links, `amount` for Expenses, `encryptedData` for Vaults).

## Khata Book Entity
- **Contact**: `id`, `name`, `createdAt`
- **Entry**: `id`, `amount` (Positive=You Gave, Negative=You Got), `desc`, `date`

## Credentials Record (Vault)
- `id`
- `title`
- `encryptedPassword` (AES ciphertext)
- `iv` (If applicable)
- `createdAt`