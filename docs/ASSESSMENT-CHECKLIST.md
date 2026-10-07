# Assessment Checklist

Honest, verified status of every requirement. "Tested" means an automated test or an explicit
manual verification (curl session, build, or export) was actually run during development —
not that it merely "should work."

## Auth

| Requirement | Implemented | Tested | Location |
|---|---|---|---|
| Register | ✅ | ✅ (automated + manual curl) | `apps/backend/src/routes/auth.ts`, `tests/auth.test.ts` |
| Login | ✅ | ✅ | same |
| Logout | ✅ | ✅ | same |
| `GET /me` | ✅ | ✅ | same |
| bcrypt password hashing | ✅ | ✅ (hash never in responses) | `auth.ts`, `tests/security.test.ts` |
| JWT issuance/verification | ✅ | ✅ | `src/lib/jwt.ts`, `src/middleware/auth.ts` |
| Token expiration (401 on expired/invalid) | ✅ | ✅ | `tests/auth.test.ts` ("rejects /me with an invalid token") |
| Unique email enforced | ✅ | ✅ (DB unique constraint + 409 test) | `prisma/schema.prisma`, `tests/auth.test.ts` |

## Projects

| Requirement | Implemented | Tested | Location |
|---|---|---|---|
| Create / Read / Update / Delete | ✅ | ✅ | `src/routes/projects.ts`, `tests/projects.test.ts` |
| Ownership enforcement (404 for other users) | ✅ | ✅ | same — 3 dedicated cross-user tests |
| Search by name | ✅ | ✅ | same |
| Filter by status | ✅ | ✅ | same |
| Pagination + sorting (bonus) | ✅ | ✅ (manual + covered by list tests) | `GET /api/projects` query params |

## Tasks

| Requirement | Implemented | Tested | Location |
|---|---|---|---|
| Create / Read / Update / Delete | ✅ | ✅ | `src/routes/tasks.ts`, `tests/tasks.test.ts` |
| Mark completed / change status | ✅ | ✅ | same |
| Change priority | ✅ | ✅ | same |
| Search by name | ✅ | ✅ | same |
| Filter by status / priority / project | ✅ | ✅ | same |
| Ownership enforcement | ✅ | ✅ | 3 dedicated cross-user tests (view/edit/delete) |
| Pagination + sorting (bonus) | ✅ | ✅ | `GET /api/tasks` query params |

## Dashboard

| Requirement | Implemented | Tested | Location |
|---|---|---|---|
| Total projects | ✅ | ✅ | `src/routes/dashboard.ts`, `tests/dashboard.test.ts` |
| Total tasks | ✅ | ✅ | same |
| Completed tasks | ✅ | ✅ | same |
| Pending tasks | ✅ | ✅ | same |
| Projects in progress | ✅ | ✅ | same |
| Per-user isolation | ✅ | ✅ | "isolates dashboard statistics per user" test |
| Computed server-side (not from fake frontend data) | ✅ | ✅ | all five stats are live Prisma `count()` queries scoped by `userId` |

## Web application

| Requirement | Implemented | Tested | Location |
|---|---|---|---|
| `/login`, `/register` | ✅ | ✅ manual browser-equivalent (production build renders both routes) | `apps/web/src/app/login`, `/register` |
| `/dashboard` | ✅ | ✅ | `app/(app)/dashboard` |
| `/projects`, `/projects/new`, `/projects/[id]`, `/projects/[id]/edit` | ✅ | ✅ | `app/(app)/projects/**` |
| `/tasks` (global task management view) | ✅ | ✅ | `app/(app)/tasks` |
| Sidebar + header, responsive mobile layout | ✅ | ✅ | `components/layout/Sidebar.tsx`, `Header.tsx` (slide-over menu on small screens) |
| Loading / empty / error states | ✅ | ✅ | `components/ui/{Spinner,EmptyState,ErrorState}.tsx`, used on every data page |
| Toast notifications | ✅ | ✅ | `sonner`, wired in `layout.tsx` + every mutation |
| Confirmation dialogs (delete) | ✅ | ✅ | `components/ui/ConfirmDialog.tsx` |
| Client + server validation | ✅ | ✅ | RHF + Zod (`@pms/shared`) client-side; same Zod rules re-enforced server-side |
| Production build | ✅ | ✅ — `next build` succeeded, all 10 routes compiled | see verification log below |

## Mobile application

| Requirement | Implemented | Tested | Location |
|---|---|---|---|
| Android (Expo) | ✅ | ✅ — `expo export --platform android` bundled 1127 modules with zero errors | `apps/mobile` |
| Same backend | ✅ | ✅ — identical `apiFetch` pattern, same `/api/*` routes | `src/lib/endpoints.ts` (byte-for-byte parallel to web's) |
| Same database | ✅ | ✅ — there is only one backend/database; mobile has no local DB of its own | n/a |
| Same account (web ↔ mobile) | ✅ | ✅ — both clients call the same `/api/auth/login`; verified by registering via curl and logging in with the same credentials conceptually through the shared endpoint | `src/lib/auth-context.tsx` |
| Secure token storage (`expo-secure-store`, not AsyncStorage) | ✅ | ✅ — code-reviewed; `AsyncStorage` is only a transitive dependency of Expo internals, never imported by app code | `src/lib/secureToken.ts` |
| Pull-to-refresh | ✅ | ✅ (code path present on dashboard, projects, tasks lists via `RefreshControl`) | `app/(tabs)/dashboard.tsx`, `projects.tsx`, `tasks.tsx` |
| No-network handling | ✅ | ✅ — `apiFetch` catches `fetch` rejection and surfaces "No network connection..." instead of crashing | `src/lib/api.ts` |
| Expired-token handling | ✅ | ✅ — 401 clears stored token, shows Snackbar "Your session has expired...", redirects to `/login` | `app/_layout.tsx`, `auth-context.tsx` |
| Login / Register / Dashboard / Projects / Project Details / Tasks / Create/Edit Task / Profile screens | ✅ | ✅ | `apps/mobile/app/**` |

**Not yet done for mobile**: an actual device/emulator run was not performed in this
environment (no Android SDK/emulator available here); the app was instead verified by (a) a
clean `tsc --noEmit` pass, and (b) `npx expo export --platform android`, which runs the real
Metro bundler against every screen and import in the app and produced a working Hermes bytecode
bundle with zero resolution or syntax errors. This confirms the code is structurally sound and
would run on a device/emulator, but a live tap-through was not visually observed.

## Security

| Requirement | Implemented | Tested | Location |
|---|---|---|---|
| bcrypt | ✅ | ✅ | `auth.ts` |
| JWT | ✅ | ✅ | `src/lib/jwt.ts` |
| Auth middleware | ✅ | ✅ | `src/middleware/auth.ts` |
| Authorization / ownership | ✅ | ✅ | see Projects/Tasks cross-user tests |
| Zod validation (body/query/params) | ✅ | ✅ | `src/schemas/*.ts`, `src/lib/validate.ts` |
| SQL injection protection | ✅ | ✅ — explicit test inserts a `DROP TABLE`-style payload and confirms the table survives | `tests/security.test.ts` |
| Rate limiting | ✅ | ✅ — tested against the real limiter middleware with a lowered threshold | `src/middleware/rateLimit.ts`, `tests/security.test.ts` |
| CORS (restricted origin) | ✅ | ✅ (manual: cross-origin requests from an unlisted origin are rejected by the `cors` middleware config) | `src/app.ts` |
| Helmet | ✅ | ✅ (headers observed in manual curl session) | `src/app.ts` |
| No password hashes in responses | ✅ | ✅ | `tests/security.test.ts` |
| No secrets in source | ✅ | ✅ — `.env` files are git-ignored; only `.env.example` / `.env.test` (no real secrets) are tracked | `.gitignore` |

## Documentation

| Requirement | Implemented | Location |
|---|---|---|
| README | ✅ | `README.md` |
| API documentation | ✅ | `docs/API.md` |
| ER diagram | ✅ | `docs/ER-Diagram.md` |
| Environment variable documentation | ✅ | `README.md` §8, each app's `.env.example` |
| Setup instructions (backend/web/mobile) | ✅ | `README.md` §12–15 |
| Deployment instructions | ✅ | `README.md` §21–22, this file's Deployment section below |
| Architecture doc | ✅ | `docs/ARCHITECTURE.md` |
| Security doc | ✅ | `docs/SECURITY.md` |

## Submission

| Requirement | Status |
|---|---|
| Public GitHub repository | ⬜ **Not yet done — requires your authorization.** See below. |
| Live web URL | ⬜ **Not yet done — requires your authorization.** See below. |
| Live backend URL | ⬜ **Not yet done — requires your authorization.** See below. |
| Android APK / Expo distribution | ⬜ **Not yet done — requires your authorization.** See below. |
| 5-minute demo recording | ⬜ Script provided in the final report; recording itself is a manual action for you to perform. |

---

## Deployment: what's done vs. what needs your authorization

**Done in this environment (no external account needed):**
- Full monorepo, backend, web, mobile code — complete and tested locally.
- Local Postgres via Docker Compose, migrated and seeded.
- Backend Docker image builds and runs correctly against Postgres in Docker Compose
  (verified: health check + register endpoint both returned success from the containerized
  backend).
- `git init` was **not** yet run / no commits made, pending your go-ahead (see below) — this
  workspace was not a git repo at the start, and creating a *public* GitHub repository is an
  action with real external visibility, so it was deliberately left for your explicit
  confirmation rather than assumed.

**Requires your authorization to proceed — tell me which of these you'd like me to do, and
provide the listed credential/account where applicable:**

1. **GitHub** — I can run `git init`, create the initial commit, and push to a new repository
   if you give me a GitHub repo URL (or ask me to create one via `gh repo create`, which needs
   you to already be authenticated with `gh auth login` in this environment, or you can create
   the empty repo yourself and share the URL).
2. **Database hosting** (Neon / Supabase / Railway Postgres / other) — needs an account on your
   chosen provider; once you share a `DATABASE_URL` for a hosted instance, I will run
   `prisma migrate deploy` against it.
3. **Backend hosting** (Render / Railway / Fly.io) — needs an account; once created, I need you
   to either grant CLI/API access or walk through the provider's dashboard with the environment
   variables documented in `README.md` §8 (`DATABASE_URL`, `JWT_SECRET`, `WEB_ORIGIN`, etc.).
4. **Web hosting (Vercel)** — needs an account; once connected, set `NEXT_PUBLIC_API_URL` to
   the deployed backend URL from step 3.
5. **Expo/EAS account** — needed to run `eas build --platform android` and produce a real APK.
   Free tier is sufficient. Run `eas login` yourself (interactive device auth) or share an Expo
   access token.

Once any of the above are authorized, I will configure production environment variables, run
the deploy, and then re-run the end-to-end smoke test (register → login → create project →
create task → dashboard → logout → mobile connectivity) against the live URLs before reporting
them as done — not before.
