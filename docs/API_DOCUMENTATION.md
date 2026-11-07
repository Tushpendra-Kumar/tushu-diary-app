# API Documentation

## Auth APIs
- **POST `/api/auth/login`**
  - Authenticates user, returns JWT.
- **POST `/api/auth/register`**
  - Registers a new user.

## Admin APIs (Requires JWT & Role=ADMIN)
- **GET `/api/admin/users`**
  - Lists all users.
- **POST `/api/admin/users`**
  - Admin creates a user.
- **PUT `/api/admin/users/:id`**
  - Updates user details.
- **DELETE `/api/admin/users/:id`**
  - Deletes user.
- **GET `/api/admin/records/:id`**
  - Fetches specific records.

## User APIs (Requires JWT)
- **GET `/api/user/profile`**
  - Returns authenticated user's details.

## Health
- **GET `/api/health`**
  - Returns `{ success: true }`.

*Note: The frontend currently primarily uses local `AsyncStorage` for module data retention to maximize speed and privacy, reducing API dependency.*