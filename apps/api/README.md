# @LedgerHQ/api

Node.js + Express + MongoDB backend for the LedgerHQ free tools portal.

## Stack

- **Express** — HTTP server
- **Mongoose** — MongoDB ODM
- **bcryptjs** — password hashing
- **jsonwebtoken** — JWT auth
- **ts-node-dev** — dev server with hot reload

## Setup

```bash
cp .env.example .env
# Edit .env with your real MONGODB_URI and JWT_SECRET
npm install
```

## Development

```bash
npm run dev          # starts API on http://localhost:4000
npm run seed         # seeds superadmin user + default SystemConfig
```

## Environment variables

| Variable              | Description                              | Default                                         |
|-----------------------|------------------------------------------|-------------------------------------------------|
| `PORT`                | Port the server listens on               | `4000`                                          |
| `MONGODB_URI`         | MongoDB connection string                | `mongodb://localhost:27017/ledgerhq_freetools`  |
| `JWT_SECRET`          | Secret used to sign JWTs                 | —                                               |
| `JWT_EXPIRES_IN`      | JWT expiry (e.g. `7d`, `24h`)            | `7d`                                            |
| `SUPERADMIN_EMAIL`    | Email for seeded superadmin              | `admin@ledgerhq.com`                            |
| `SUPERADMIN_PASSWORD` | Password for seeded superadmin           | `Admin@1234`                                    |

## API Routes

### Auth

| Method | Path               | Auth     | Description                                      |
|--------|--------------------|----------|--------------------------------------------------|
| POST   | `/auth/register`   | Public   | Register with email + password. OTP is `123456`. |
| POST   | `/auth/verify-otp` | Public   | Verify OTP → returns JWT                         |
| POST   | `/auth/login`      | Public   | Login → returns JWT + user                       |
| GET    | `/auth/me`         | JWT      | Get current user                                 |

### Config

| Method | Path                    | Auth        | Description                           |
|--------|-------------------------|-------------|---------------------------------------|
| GET    | `/config/tools-access`  | Public      | Get `requireLogin` flag               |
| PATCH  | `/config/tools-access`  | Superadmin  | Set `requireLogin` true/false         |

### Health

| Method | Path      | Auth   | Description   |
|--------|-----------|--------|---------------|
| GET    | `/health` | Public | Liveness check |

## OTP in development

Registration always issues OTP `123456`. No email is sent. This is intentional — wire up a real email provider (Resend, SendGrid, etc.) when ready for production.

## Seeding superadmin

```bash
npm run seed
```

Reads `SUPERADMIN_EMAIL` and `SUPERADMIN_PASSWORD` from `.env`. Safe to run multiple times (idempotent).

## Frontend integration

Set `NEXT_PUBLIC_API_URL=http://localhost:4000` in `apps/web/.env.local`.

The `AuthProvider` in `apps/web/src/lib/AuthContext.tsx` wraps the entire app and exposes:
- `user` — logged-in user or `null`
- `requireLogin` — current tools access policy
- `login / logout`
- `setRequireLogin(boolean)` — calls `PATCH /config/tools-access` (superadmin only in production)

The Navbar shows a **Public access / Login required** toggle button (always visible for now, will be restricted to superadmin once role checks are added to the UI).
