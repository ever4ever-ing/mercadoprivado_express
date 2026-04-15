# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mercado Privado Chile is a B2B marketplace for industrial/trade services in Chile. It connects empresas (client companies) with proveedores (service providers). The stack is Vue 3 + TypeScript (frontend) and Express + Prisma + PostgreSQL (backend).

## Development Commands

### Frontend (`/frontend`)
```bash
npm run dev       # Vite dev server on port 5173
npm run build     # vue-tsc typecheck + Vite build
npm run preview   # Preview production build
```

### Backend (`/backend`)
```bash
npm run dev       # tsx watch (hot reload) on port 3000
npm run build     # tsc → dist/
npm run start     # node dist/index.js (production)
```

### Database (`/backend`)
```bash
npm run db:migrate   # prisma migrate dev (apply migrations)
npm run db:generate  # prisma generate (regenerate client after schema changes)
npm run db:studio    # Prisma Studio GUI
npm run db:seed      # Seed test data
npm run db:reset     # Reset DB and re-run all migrations + seed
```

### Environment Setup
Copy `.env.example` to `.env` in both `backend/` and `frontend/` and fill in values. Key variables:
- **Backend:** `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, Cloudinary credentials, SMTP config, `FRONTEND_URL`
- **Frontend:** `VITE_API_URL` (defaults to `http://localhost:3000` via Vite proxy in dev)

## Architecture

### Two-App Structure
`/frontend` and `/backend` are independent npm workspaces. The Vite dev server proxies `/api/*` to `http://localhost:3000`, so both run simultaneously during development.

### Backend (`/backend/src`)
- **`index.ts`** — Express app entry: CORS, rate limiting on `/api/auth`, mounts routers, error handler
- **`routes/`** — Organized by resource: `auth`, `providers`, `inquiries`, `admin`
- **`controllers/`** — Route handlers using `catchAsync()` wrapper for async error propagation
- **`middleware/`** — `authenticate()` (JWT verification), `requireRole(...roles)` (RBAC), `errorHandler()` (global Zod + generic errors)
- **`validators/`** — Zod schemas for request body validation
- **`services/`** — Business logic (score calculation, email notifications via Nodemailer, Cloudinary uploads)
- **`prisma/schema.prisma`** — Single source of truth for data models

### Frontend (`/frontend/src`)
- **`router/index.ts`** — Vue Router with navigation guards: `requiresAuth` + `requiresRole`, `guestOnly` redirects
- **`stores/`** — Pinia stores: `auth` (JWT + refresh token, localStorage-persisted), `providers` (list, filters, pagination)
- **`services/api.ts`** — Axios instance with interceptors: auto-attach Bearer token, handle 401 by refreshing token (deduplicated to prevent token storms)
- **`services/auth.ts`**, **`services/providers.ts`** — API call wrappers; providers service has a `USE_MOCK` flag for development without backend
- **`views/`** — Page components; **`components/`** — Reusable UI components
- **`@`** alias maps to `src/`

### Authentication Flow
1. Login returns access token (15m) + refresh token (7d), both stored in localStorage
2. Axios interceptor attaches `Authorization: Bearer <token>` to all requests
3. On 401, interceptor calls `/api/auth/refresh` once (deduplicated), retries original request
4. Logout deletes refresh token from DB and clears localStorage
5. `RefreshToken` model in DB enables token rotation and invalidation

### Data Models (key relationships)
- `User` (role: EMPRESA | PROVEEDOR | ADMIN) → `Provider` (one-to-one for PROVEEDOR role)
- `Provider` → `Service[]`, `PortfolioImage[]`, `ProviderDocument[]`, `Review[]`, `Inquiry[]`
- `Review` has unique constraint on `(providerId, authorId)` — one review per company per provider
- Provider score formula: **50% reviews + 30% verification + 20% activity**
- Badge tiers: Gold ≥4.5, Silver 3.5–4.4, Bronze 2.5–3.4

### Validation Pattern
- Backend validates all request bodies with Zod; `errorHandler` middleware formats Zod errors as 400 with field-level detail
- Frontend relies on API validation responses; no duplicate Zod schemas on frontend

### Image Uploads
Portfolio images go to Cloudinary; `publicId` is stored in DB for deletion. Cloudinary credentials are in backend `.env`.
