# Project Management System

A full-stack project management system: a Next.js web app and an Expo (Android) mobile app,
sharing one Express/PostgreSQL backend, one database, and one JWT-based auth system. A user
registered on web can log in on mobile with the same account, and vice versa.

## 1. Overview

- **Web**: Next.js 14 (App Router) + TypeScript + Tailwind CSS — login/register, dashboard,
  projects (CRUD, search, filter), tasks (CRUD, search, filter, status/priority changes).
- **Mobile**: Expo (React Native) + Expo Router + React Native Paper — the same feature set,
  targeting Android, with secure token storage and pull-to-refresh.
- **Backend**: Express + TypeScript + Prisma + PostgreSQL — one REST API consumed by both
  clients. JWT auth, bcrypt password hashing, Zod validation, Helmet, CORS, rate limiting,
  structured logging, centralized error handling.

## 2. Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full diagram and request lifecycle.
In short: both clients call the same REST API over HTTPS with `Authorization: Bearer <jwt>`;
there is exactly one backend and one database.

## 3. Technology stack

| Layer | Stack |
|---|---|
| Web | Next.js 14, TypeScript, Tailwind CSS, TanStack Query, React Hook Form, Zod, Lucide icons, Sonner (toasts) |
| Mobile | Expo SDK 51, Expo Router, React Native Paper, TanStack Query, React Hook Form, Zod, expo-secure-store |
| Backend | Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, JWT, bcryptjs, Zod, Helmet, CORS, express-rate-limit, pino |
| Shared | `@pms/shared` — TypeScript types + Zod schemas used by both web and mobile |
| Testing | Vitest + Supertest (backend: auth, projects, tasks, dashboard, security — 46 tests) |
| Infra | pnpm workspaces monorepo, Docker + docker-compose (Postgres + backend) |

## 4. Repository structure

```
/apps
  /web       Next.js web app
  /mobile    Expo Android app
  /backend   Express API + Prisma schema/migrations/seed
/packages
  /shared    Shared TypeScript types + Zod validation schemas
/docs        Architecture, API reference, security, ER diagram, assessment checklist
docker-compose.yml   Local Postgres + backend
```

## 5. Features

- **Auth**: register, login, logout, `GET /me`, JWT, bcrypt, unique email, token expiration.
- **Projects**: full CRUD, ownership enforcement, search by name, filter by status, pagination
  + sorting.
- **Tasks**: full CRUD, mark complete, change status/priority, search by name, filter by
  status/priority/project, pagination + sorting.
- **Dashboard**: total projects, total tasks, completed tasks, pending tasks, projects in
  progress — all computed server-side, scoped to the authenticated user.
- **Security**: see [`docs/SECURITY.md`](docs/SECURITY.md) — ownership checks, rate limiting,
  injection-safe queries, no password hashes in responses, etc.
- **Cross-platform sync**: a task created/edited on web is visible on mobile (and vice versa)
  via pull-to-refresh or automatic query invalidation — both clients read the same database
  through the same API.

## 6. Prerequisites

- **Node.js** ≥ 20 (tested with 20.18.0)
- **pnpm** ≥ 9 (`npm install -g pnpm`)
- **Docker Desktop** (for local PostgreSQL — or use a hosted Postgres instead, see §9)
- **Android Studio** (optional, for an Android emulator) or the **Expo Go** app on a physical
  Android device
- **Java 17** (already required by Android tooling / Expo EAS builds)

## 7. Installation

```bash
git clone <your-repo-url>
cd newassinment
pnpm install
```

This installs dependencies for all three apps and the shared package in one pass (pnpm
workspaces).

## 8. Environment variables

Each app has a `.env.example`. Copy it to the real file and fill in values before running:

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env
```

**`apps/backend/.env`**
| Variable | Example | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql://pms_user:pms_password@localhost:5432/pms_dev?schema=public` | Postgres connection string |
| `JWT_SECRET` | a long random string | **never commit a real value** |
| `JWT_EXPIRES_IN` | `7d` | token lifetime |
| `PORT` | `4000` | |
| `NODE_ENV` | `development` | |
| `WEB_ORIGIN` | `http://localhost:3000` | CORS allow-list, comma-separated for multiple origins |

**`apps/web/.env.local`**
| Variable | Example |
|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api` |

**`apps/mobile/.env`**
| Variable | Example |
|---|---|
| `EXPO_PUBLIC_API_URL` | `http://10.0.2.2:4000/api` (Android emulator → host loopback) or your machine's LAN IP for a physical device |

Never commit `.env` files with real secrets — `.gitignore` already excludes them (only
`.env.example` and `.env.test`, which holds no real secrets, are tracked).

## 9. PostgreSQL setup

**Option A — Docker (recommended for local dev):**
```bash
docker compose up -d postgres
```
This starts Postgres on `localhost:5432` with the credentials already baked into
`apps/backend/.env.example`.

**Option B — a hosted provider** (Neon, Supabase, Railway Postgres, etc.): create a database
and paste its connection string into `DATABASE_URL`.

## 10. Prisma migrations

```bash
cd apps/backend
pnpm prisma:migrate          # applies migrations, prompts for a name on first run
```
In production / CI, use the non-interactive form:
```bash
pnpm prisma:migrate:deploy
```

## 11. Seed data

```bash
cd apps/backend
pnpm prisma:seed
```
Creates two demo accounts with sample projects/tasks (password for both: `Password123!`):
- `alice@example.com`
- `bob@example.com`

The seed script only ever inserts fictional, non-sensitive placeholder data.

## 12. Backend setup

```bash
cd apps/backend
pnpm dev          # starts on http://localhost:4000, auto-reloads
```
Health check: `curl http://localhost:4000/health`

## 13. Web setup

```bash
cd apps/web
pnpm dev          # starts on http://localhost:3000
```

## 14. Mobile setup

```bash
cd apps/mobile
pnpm start        # starts the Expo dev server / Metro bundler
```
Then either:
- Press `a` to open in a connected Android emulator, or
- Scan the QR code with the **Expo Go** app on a physical Android device (same Wi-Fi network;
  set `EXPO_PUBLIC_API_URL` to your computer's LAN IP, not `10.0.2.2`, in that case).

## 15. Running everything together

From the repo root, in three separate terminals:
```bash
docker compose up -d postgres     # once, leave running
pnpm --filter @pms/backend dev
pnpm --filter @pms/web dev
pnpm --filter @pms/mobile start
```

## 16. API documentation

Full endpoint-by-endpoint reference, including request/response shapes and example curl calls:
[`docs/API.md`](docs/API.md).

## 17. Authentication flow

1. `POST /api/auth/register` or `/login` → server returns `{ user, token }`.
2. Client stores `token` (web: `localStorage`; mobile: `expo-secure-store`, never
   `AsyncStorage`).
3. Every subsequent request sends `Authorization: Bearer <token>`.
4. A `401` response (expired/invalid token) clears the stored token on the client and redirects
   to `/login` with a "Your session has expired" message.

Full detail: [`docs/SECURITY.md`](docs/SECURITY.md).

## 18. Database / ER diagram

[`docs/ER-Diagram.md`](docs/ER-Diagram.md) — Mermaid ER diagram + design notes (indexes,
cascades, denormalization rationale).

## 19. Security decisions

[`docs/SECURITY.md`](docs/SECURITY.md) — bcrypt, JWT, ownership checks, rate limiting,
injection safety, mobile secure storage, and exactly how each claim is tested.

## 20. Testing

```bash
cd apps/backend
pnpm test
```
46 tests across `auth`, `projects`, `tasks`, `dashboard`, and `security` — including explicit
cross-user authorization tests (User A cannot view/edit/delete User B's projects or tasks),
SQL-injection-style input handling, rate limiting, and "no password hash in any response."

Web and mobile are verified via `tsc --noEmit`, `next build` (production build), and
`expo export` (full Metro bundle) — see [`docs/ASSESSMENT-CHECKLIST.md`](docs/ASSESSMENT-CHECKLIST.md)
for exactly what was run and the results.

## 21. Deployment

See the **Deployment** section of [`docs/ASSESSMENT-CHECKLIST.md`](docs/ASSESSMENT-CHECKLIST.md)
for current status and exactly what account authorization is needed to go live (Vercel,
Render/Railway, a hosted Postgres provider, and an Expo/EAS account for the Android build).

## 22. Mobile deployment / build

```bash
cd apps/mobile
npx eas login                 # requires a free Expo account
npx eas build:configure
npx eas build --platform android --profile preview
```
This produces a downloadable `.apk` (preview profile) or `.aab` (production profile) via Expo's
cloud build service. Requires an Expo account — see §21 / the checklist for what to authorize.

## 23. Troubleshooting

| Symptom | Fix |
|---|---|
| `P2002` / "email already exists" | expected — that email is already registered |
| Backend can't connect to Postgres | confirm `docker compose ps` shows `postgres` healthy, and `DATABASE_URL` matches |
| Mobile app can't reach the API from an emulator | Android emulators reach the host machine via `10.0.2.2`, not `localhost` |
| Mobile app can't reach the API from a physical device | use your computer's LAN IP in `EXPO_PUBLIC_API_URL`, and ensure the phone is on the same network and your firewall allows inbound on port 4000 |
| Prisma "openssl" warning in Docker | already handled — the Dockerfile installs `openssl` in the Alpine image |
| `pnpm install` fails on a single workspace | run `pnpm install` from the repo root, not inside an individual `apps/*` folder |

## 24. Demo credentials

Seeded via `pnpm prisma:seed` (see §11):
- `alice@example.com` / `Password123!`
- `bob@example.com` / `Password123!`

## 25. Live URLs

Not yet deployed — see [`docs/ASSESSMENT-CHECKLIST.md`](docs/ASSESSMENT-CHECKLIST.md) for exact
deployment status and the account authorization required to publish live URLs.
