# API Reference

Base URL: `http://localhost:4000/api` (local) or your deployed backend URL + `/api`.

All request/response bodies are JSON. All authenticated endpoints require:

```
Authorization: Bearer <jwt>
```

## Response conventions

Success:
```json
{ "data": { ... } }
```
or for lists:
```json
{ "data": [ ... ], "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 } }
```

Error:
```json
{ "error": { "message": "Human readable message", "details": [ ... ] } }
```

`details` is present for `422` validation errors and is an array of `{ path, message }`.

---

## Auth

### `POST /api/auth/register`
Create a new account.

- **Auth required**: No
- **Rate limited**: Yes (10 requests / 15 min per IP)

Request body:
```json
{ "fullName": "Jane Doe", "email": "jane@example.com", "password": "Password123!" }
```

Responses:
- `201` — `{ "user": { "id", "fullName", "email", "createdAt", "updatedAt" }, "token": "<jwt>" }`
- `409` — email already registered
- `422` — validation error (blank name, invalid email, password < 8 chars)

### `POST /api/auth/login`
- **Auth required**: No
- **Rate limited**: Yes (10 requests / 15 min per IP)

Request body:
```json
{ "email": "jane@example.com", "password": "Password123!" }
```

Responses:
- `200` — `{ "user": { ... }, "token": "<jwt>" }`
- `401` — invalid email or password (same message for both cases, to avoid leaking which part was wrong)
- `422` — malformed email / missing password

### `POST /api/auth/logout`
- **Auth required**: Yes

Stateless JWT — the server has nothing to revoke (no refresh-token store), so this simply
confirms the request was authenticated; the client is responsible for discarding the token.

Response: `200` — `{ "message": "Logged out successfully" }`

### `GET /api/auth/me`
- **Auth required**: Yes

Response: `200` — `{ "user": { "id", "fullName", "email", "createdAt", "updatedAt" } }`
Never includes `passwordHash`.

- `401` — missing / invalid / expired token

---

## Projects

All project routes require authentication and are scoped to the authenticated user —
**a user can never see, modify, or delete another user's project.** Cross-user access returns
`404` (not `403`), so a malicious actor cannot even tell whether a given id exists.

### `GET /api/projects`
- **Auth required**: Yes

Query parameters (all optional):

| Param | Type | Notes |
|---|---|---|
| `search` | string | case-insensitive substring match on project name |
| `status` | `NOT_STARTED` \| `IN_PROGRESS` \| `COMPLETED` | exact match |
| `page` | number | default `1` |
| `limit` | number | default `20`, max `100` |
| `sortBy` | `name` \| `createdAt` \| `startDate` \| `endDate` \| `status` | default `createdAt` |
| `sortOrder` | `asc` \| `desc` | default `desc` |

Response: `200` — `{ "data": Project[], "pagination": {...} }`. Each project includes
`_count.tasks`.

### `GET /api/projects/:id`
Response: `200` — `{ "data": Project & { tasks: Task[] } }`
- `404` — not found, or not owned by the authenticated user
- `422` — `:id` is not a valid UUID

### `POST /api/projects`
Request body:
```json
{
  "name": "Website Redesign",
  "description": "Optional",
  "status": "NOT_STARTED",
  "startDate": "2026-01-05",
  "endDate": "2026-03-01"
}
```
Only `name` is required. `endDate` must not be before `startDate` when both are present.

Responses: `201` — `{ "data": Project }` · `422` — validation error

### `PUT /api/projects/:id`
Partial update; same body shape as create, all fields optional.

Responses: `200` — `{ "data": Project }` · `404` · `422`

### `DELETE /api/projects/:id`
Deletes the project and cascades to delete all of its tasks.

Responses: `204` (no body) · `404`

---

## Tasks

All task routes require authentication and are scoped to the authenticated user — same
404-on-cross-user-access behavior as projects.

### `GET /api/tasks`
Query parameters (all optional):

| Param | Type | Notes |
|---|---|---|
| `search` | string | case-insensitive substring match on task name |
| `status` | `PENDING` \| `IN_PROGRESS` \| `COMPLETED` | |
| `priority` | `LOW` \| `MEDIUM` \| `HIGH` | |
| `projectId` | uuid | restrict to one project |
| `page` / `limit` | number | default `1` / `20`, max `100` |
| `sortBy` | `name` \| `createdAt` \| `dueDate` \| `priority` \| `status` | default `createdAt` |
| `sortOrder` | `asc` \| `desc` | default `desc` |

Response: `200` — `{ "data": Task[], "pagination": {...} }`. Each task includes
`project: { id, name }`.

### `GET /api/tasks/:id`
Responses: `200` — `{ "data": Task }` · `404` · `422` (malformed id)

### `POST /api/tasks`
Request body:
```json
{
  "projectId": "uuid-of-a-project-you-own",
  "name": "Design homepage mockup",
  "description": "Optional",
  "priority": "HIGH",
  "status": "PENDING",
  "dueDate": "2026-01-15"
}
```
`projectId` and `name` are required. The server verifies the referenced project belongs to the
authenticated user before creating the task.

Responses:
- `201` — `{ "data": Task }`
- `400` — `projectId` does not exist or belongs to another user
- `422` — validation error

### `PUT /api/tasks/:id`
Partial update — used for editing name/description, marking complete (`status: "COMPLETED"`),
or changing priority.

Responses: `200` — `{ "data": Task }` · `404` · `422`

### `DELETE /api/tasks/:id`
Responses: `204` · `404`

---

## Dashboard

### `GET /api/dashboard`
- **Auth required**: Yes

All statistics are computed server-side from the database, scoped strictly to the authenticated
user's own projects and tasks.

Response: `200`
```json
{
  "data": {
    "totalProjects": 4,
    "totalTasks": 17,
    "completedTasks": 9,
    "pendingTasks": 5,
    "projectsInProgress": 2,
    "recentProjects": [ Project, ... ],
    "recentTasks": [ Task, ... ]
  }
}
```

---

## Status codes used across the API

| Code | Meaning |
|---|---|
| 200 | success |
| 201 | resource created |
| 204 | success, no body (delete) |
| 400 | bad request (e.g. referencing a project you don't own) |
| 401 | missing / invalid / expired JWT, or wrong credentials |
| 403 | reserved for future role-based checks (not currently emitted — ownership failures use 404) |
| 404 | resource not found, or not owned by the caller |
| 409 | conflict (duplicate email) |
| 422 | validation error (zod) |
| 429 | rate limited |
| 500 | unexpected server error (stack trace hidden in production) |

## Example: end-to-end curl session

```bash
# Register
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Jane Doe","email":"jane@example.com","password":"Password123!"}' \
  | node -e "process.stdin.once('data',d=>console.log(JSON.parse(d).token))")

# Create a project
PROJECT_ID=$(curl -s -X POST http://localhost:4000/api/projects \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"My First Project"}' \
  | node -e "process.stdin.once('data',d=>console.log(JSON.parse(d).data.id))")

# Create a task under it
curl -s -X POST http://localhost:4000/api/tasks \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"projectId\":\"$PROJECT_ID\",\"name\":\"First task\"}"

# View the dashboard
curl -s http://localhost:4000/api/dashboard -H "Authorization: Bearer $TOKEN"
```
