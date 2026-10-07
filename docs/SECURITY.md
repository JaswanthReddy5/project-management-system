# Security

This document lists the concrete security decisions made in this codebase and how to verify
each one.

## Authentication

- **Passwords** are hashed with `bcryptjs` (cost factor 10) before being stored. The raw
  password is never persisted, logged, or returned in any API response.
  See `apps/backend/src/routes/auth.ts` (`bcrypt.hash` / `bcrypt.compare`).
- **JWTs** are signed with `JWT_SECRET` (an environment variable, never committed — see
  `.env.example`) and carry only `{ sub: userId, email }`. Default expiry is `7d`
  (`JWT_EXPIRES_IN`), configurable per environment.
- **`passwordHash` is never serialized** in any response — `toSafeUser()` in `auth.ts`
  explicitly whitelists the fields returned (`id`, `fullName`, `email`, `createdAt`,
  `updatedAt`). Verified by `tests/security.test.ts`
  (`never returns passwordHash in register/login/me responses`).
- **Logout** is a stateless-JWT logout: the server has no session/refresh-token store to revoke
  (by design — a refresh-token rotation system was judged unnecessary complexity for this
  assessment's scope), so logout is a client-side token discard. The `/api/auth/logout` endpoint
  still requires a valid token and exists for API symmetry / future extension.

## Authorization (ownership)

Every `Project` and `Task` row carries a `userId`. Every project/task route:

1. Requires a valid JWT (`requireAuth` middleware) — no route is left unauthenticated by
   accident; `requireAuth` is applied with `router.use(requireAuth)` once per route file, not
   per-handler, so a newly added route can't forget it.
2. Loads the row and checks `row.userId === req.userId` **before** any read, update, or delete.
   A mismatch returns `404 Not Found` — not `403 Forbidden` — so a user probing IDs cannot even
   learn that a given id exists for another account.
3. On task creation, the referenced `projectId` is independently checked against the
   authenticated user before the task is created (`POST /api/tasks` in
   `apps/backend/src/routes/tasks.ts`) — otherwise a user could create a task under someone
   else's project by guessing its id.

This is tested explicitly and exhaustively in `apps/backend/tests/projects.test.ts` and
`tests/tasks.test.ts` — one test per operation (view/update/delete) per resource (project/task),
asserting both the `404` response **and** that the victim's data is unchanged afterward.

## Input validation

Every request body, query string, and route param is parsed through a Zod schema
(`apps/backend/src/schemas/*.ts`) before touching the database:

- Empty/blank strings rejected (`z.string().trim().min(1)`).
- Email format validated (`z.string().email()`).
- Enum fields (`ProjectStatus`, `TaskPriority`, `TaskStatus`) restricted to their exact allowed
  values — an unrecognized value is a `422`, not silently coerced.
- Dates parsed and checked for validity; `endDate` is rejected if earlier than `startDate`.
- Route `:id` params validated as UUIDs — a malformed id (e.g. a SQL-injection-style string)
  returns `422` before it ever reaches a database call.
- Unknown/missing required fields surface as structured `422` responses with a `path` +
  `message` per failing field, not a generic 500.

## Injection safety

All database access goes through Prisma's generated client, which uses parameterized queries
under the hood — there is no raw string concatenation into SQL anywhere in the codebase. A
project or task name containing `Robert'); DROP TABLE "Project"; --` is stored and returned as
an ordinary string; it cannot alter the query. This is verified directly in
`tests/security.test.ts` (`treats SQL-injection-style strings as safe literal data`), which
creates a record with that exact payload and then asserts the `Project` table is still
queryable and still contains it.

## Transport-level hardening

- **Helmet** sets standard security headers (CSP, `X-Content-Type-Options`, HSTS,
  `X-Frame-Options`, etc.) on every response.
- **CORS** is restricted to `WEB_ORIGIN` (a configured allow-list, not `*`); credentials are
  allowed only for that origin.
- **express-rate-limit** on all `/api/*` routes (300 req / 15 min), with a stricter limit on
  `/api/auth/register` and `/api/auth/login` specifically (10 req / 15 min per IP) to blunt
  credential-stuffing / brute-force attempts. Verified in
  `tests/security.test.ts` (`enforces rate limiting on repeated auth attempts`) against the
  real `createAuthRateLimiter` middleware with a small threshold, independent of the main app's
  higher test-environment limit (raised in tests purely so functional test suites that register
  many fixture users aren't themselves rate-limited — the limiter logic under test is identical
  to production).

## Error handling & logging

- The centralized `errorHandler` (`apps/backend/src/middleware/errorHandler.ts`) maps known
  error types (`ApiError`, `ZodError`, known Prisma error codes) to specific status codes and
  messages, and logs anything unexpected server-side without leaking a stack trace to the client
  in production (`NODE_ENV=production` strips `err.stack` from the 500 response body).
- `pino`'s logger is configured with `redact` paths covering `authorization` headers,
  `password`, `passwordHash`, and `token` fields, so even if a handler accidentally logged a
  request/response object, those fields are replaced with `[REDACTED]` rather than written to
  logs.

## Mobile-specific: token storage

The JWT is stored via `expo-secure-store` (`apps/mobile/src/lib/secureToken.ts`), which uses the
iOS Keychain / Android Keystore-backed encrypted storage — **never** `AsyncStorage` or any
plain-text storage. On a `401` response (expired or invalid token), the mobile client clears the
stored token and surfaces "Your session has expired. Please log in again." before redirecting to
the login screen, rather than silently failing or crashing (`apps/mobile/src/lib/api.ts` +
`auth-context.tsx`).

## What's deliberately out of scope

- **CSRF protection**: not applicable — the API is a stateless Bearer-token API with no cookie
  based session, so there is no ambient credential for a CSRF attack to ride on.
- **Refresh token rotation**: noted above; a single longer-lived JWT was chosen for simplicity.
  Noted in `docs/ASSESSMENT-CHECKLIST.md` as a bonus item if extending this further.
- **Role-based access control (RBAC)**: every user has an identical, flat permission set over
  their own data; there is no admin/staff role to model, so `403 Forbidden` is reserved in the
  API design for a future RBAC layer but not currently emitted.

## How to re-verify these claims yourself

```bash
cd apps/backend
pnpm test          # runs tests/security.test.ts along with the full suite
```

The security-specific assertions live in `apps/backend/tests/security.test.ts`,
`tests/projects.test.ts` (cross-user tests), and `tests/tasks.test.ts` (cross-user tests).
