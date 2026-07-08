# Site Score API

A small full stack TypeScript API for managing website projects, audit reports, and user accounts.

It was built as a practical learning and portfolio project to strengthen back end and full stack skills using a realistic structure, PostgreSQL persistence, authentication, ownership rules, runtime validation, database migrations, OpenAPI documentation, and integration tests.

## Live links

- API base URL: `https://site-score-api.onrender.com`
- API docs: `https://site-score-api.onrender.com/docs`

## Features

### Auth
- Register a user
- Log in with email and password
- Log out
- Get the current authenticated user
- Session cookie stored in the browser
- Session records stored in PostgreSQL

### Projects
- List authenticated user's projects with compact report summaries
- Get an owned project by id
- Create a project when authenticated
- Update a project when authenticated and authorised
- Delete a project when authenticated and authorised
- Paginated list endpoint with `page`, `limit`, `search`, `sort`, and `order`

### Reports
- List report groups for an owned project
- Create report groups for an owned project
- List reports for an owned project
- Get an owned report by id
- Create a report for a project when authenticated and authorised
- Update a report when authenticated and authorised
- Delete a report when authenticated and authorised
- Paginated list endpoint for project reports with `page`, `limit`, `search`, `sort`, `order`, and optional `groupId`
- Score and User Timing comparisons against the previous report in the same group
- Full-history report group trend data for frontend charts
- Preview PageSpeed metrics, page weight, opportunities, failed/warning audits, and User Timings before saving them to a report

### Security and access rules
- Project and report read routes require authentication
- Users can only read their own projects and reports
- Project write routes require authentication
- Only the project owner can update or delete their project
- Only the project owner can create reports for that project
- Only the project owner can update or delete those reports

## Tech stack

- TypeScript
- Node.js
- Express
- PostgreSQL
- pg
- Zod
- bcrypt
- cookie-parser
- Vitest
- Supertest
- Swagger UI
- swagger-jsdoc
- Bruno

## Project structure

```txt
src/
    config/
    controllers/
    db/
    errors/
    middleware/
    routes/
    scripts/
    services/
    test/
    types/
    utils/
    validation/

sql/
    migrations/

bruno/
```

### Structure overview
- `routes` map HTTP endpoints to controllers
- `controllers` handle request and response logic
- `services` contain application and database logic
- `middleware` handles shared request behaviour
- `validation` contains Zod request schemas
- `utils` contains shared helpers such as pagination parsing
- `test` contains DB cleanup and reusable test helpers
- `scripts` contains utility scripts such as migrations and seeders
- `sql/migrations` contains ordered SQL migration files
- `bruno` contains a manual API testing collection for local and live environments

## Environment variables

Create a `.env` file in the project root.

Example:

```env
PORT=3000
DATABASE_URL=postgresql://localhost:5432/site_score_api
DATABASE_TEST_URL=postgresql://localhost:5432/site_score_api_test
SESSION_SECRET=change-this-to-a-long-random-string
```

Optional, depending on your workflow:

```env
DATABASE_MIGRATION_URL=postgresql://localhost:5432/site_score_api
SEED_DATABASE_URL=
SEED_USER_NAME=Phil
SEED_USER_EMAIL=phil@example.com
SEED_USER_PASSWORD=secret123
ALLOW_DESTRUCTIVE_SEED=false
PAGESPEED_API_KEY=
PAGESPEED_TIMEOUT_MS=15000
```

**Which database URL is used where**

- **`DATABASE_MIGRATION_URL`** — Used only by `npm run migrate` and `npm run migrate:test` (running SQL migrations / DDL). Set this to a direct Postgres connection when your `DATABASE_URL` is pooled or otherwise unsuitable for migrations (for example, a Neon direct URL).
- **`DATABASE_URL` / `DATABASE_TEST_URL`** — Used by the API at runtime and by seed scripts **by default** (`DATABASE_TEST_URL` when `NODE_ENV=test`, otherwise `DATABASE_URL`).
- **`SEED_DATABASE_URL`** — Optional. When set, `npm run seed:user`, `npm run seed:dev-data`, and `npm run seed:test-data` connect to this URL instead of the default above. Use it sparingly when a seed command must target a specific database without changing `DATABASE_URL`.
- **`ALLOW_DESTRUCTIVE_SEED`** — Required as `true` before the bulk dev/test seed scripts can wipe a database when `SEED_DATABASE_URL` is set, `NODE_ENV=production`, or the target database host is not local.
- **`PAGESPEED_API_KEY`** — Optional server-side Google PageSpeed API key. Do not expose this to the frontend.
- **`PAGESPEED_TIMEOUT_MS`** — Optional PageSpeed request timeout in milliseconds. Defaults to `15000`.

You should also keep `.env.example` updated with the same keys but safe placeholder values.

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create the databases

```bash
createdb site_score_api
createdb site_score_api_test
```

### 3. Run migrations

```bash
npm run migrate
npm run migrate:test
```

### 4. Optionally seed local dev data

```bash
npm run seed:dev-data
```

To point seeds at another database without editing `.env`, set `SEED_DATABASE_URL` for that command (see **Which database URL is used where** above).

Bulk seed data is for local and test use only. Do not run `npm run seed:dev-data` or `npm run seed:test-data` as part of production deployment.

### 5. Start the dev server

```bash
npm run dev
```

The API should then be available at:

```txt
http://localhost:3000
```

Docs should be available at:

```txt
http://localhost:3000/docs
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm test
npm run test:watch
npm run migrate
npm run migrate:test
npm run seed:user
npm run seed:dev-data
npm run seed:test-data
```

## API overview

### Landing route

#### `GET /`
Returns a small status payload with useful links.

Response example:

```json
{
    "name": "Site Score API",
    "status": "ok",
    "docs": "/docs",
    "endpoints": {
        "auth": "/auth",
        "projects": "/projects",
        "reports": "/reports/:id"
    }
}
```

---

### Auth routes

#### `POST /auth/register`
Register a new user.

Request body:

```json
{
    "name": "Phil",
    "email": "phil@example.com",
    "password": "secret123"
}
```

Response:

```json
{
    "id": "user-id",
    "name": "Phil",
    "email": "phil@example.com",
    "createdAt": "2026-04-01T13:15:06.935Z"
}
```

#### `POST /auth/login`
Log in and set a session cookie.

Request body:

```json
{
    "email": "phil@example.com",
    "password": "secret123"
}
```

Response:

```json
{
    "id": "user-id",
    "name": "Phil",
    "email": "phil@example.com",
    "createdAt": "2026-04-01T13:15:06.935Z"
}
```

#### `POST /auth/logout`
Log out and clear the session cookie.

Response:
- `204 No Content`

#### `GET /auth/me`
Get the current authenticated user.

Response:

```json
{
    "id": "user-id",
    "name": "Phil",
    "email": "phil@example.com",
    "createdAt": "2026-04-01T13:15:06.935Z"
}
```

---

### Project routes

#### `GET /projects`
Get a paginated list of the authenticated user's projects.

Supported query params:
- `page`
- `limit`
- `search`
- `sort`
- `order`

Response example:

```json
{
    "data": [
        {
            "id": "project-id",
            "name": "My project",
            "url": "https://example.com",
            "createdAt": "2026-04-01T13:15:06.935Z",
            "summary": {
                "reportCount": 2,
                "reportGroupCount": 1,
                "latestReportCreatedAt": "2026-07-08T08:00:00.000Z",
                "latestReportTitle": "Homepage mobile audit",
                "latestScores": {
                    "performanceScore": 94,
                    "accessibilityScore": 89,
                    "seoScore": 97,
                    "bestPracticesScore": 93,
                    "agenticBrowsingScore": 84
                }
            }
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 10,
        "total": 1,
        "totalPages": 1
    }
}
```

#### `GET /projects/:id`
Get an owned project by id.

#### `POST /projects`
Create a project. Requires authentication.

Request body:

```json
{
    "name": "My project",
    "url": "https://example.com"
}
```

#### `PATCH /projects/:id`
Update a project. Requires authentication and ownership.

Request body example:

```json
{
    "name": "Updated project name"
}
```

#### `DELETE /projects/:id`
Delete a project. Requires authentication and ownership.

Response:
- `204 No Content`

---

### Report routes

#### `GET /projects/:id/report-groups`
Get report groups for an owned project.

Response example:

```json
[
    {
        "id": "report-group-id",
        "projectId": "project-id",
        "name": "Homepage mobile",
        "pageUrl": "https://example.com/",
        "strategy": "mobile",
        "createdAt": "2026-07-08T08:00:00.000Z"
    }
]
```

#### `POST /projects/:id/report-groups`
Create a report group for an owned project.

Request body example:

```json
{
    "name": "Homepage mobile",
    "pageUrl": "https://example.com/",
    "strategy": "mobile"
}
```

#### `GET /projects/:id/report-group-trends`
Get full-history score trend data for report groups in an owned project. This endpoint is independent of report list pagination, search, and sort order.

Supported query params:
- `groupId`

Response example:

```json
[
    {
        "groupId": "report-group-id",
        "groupName": "Homepage mobile",
        "pageUrl": "https://example.com/",
        "strategy": "mobile",
        "points": [
            {
                "id": "report-id",
                "title": "Homepage mobile - July snapshot",
                "pageUrl": "https://example.com/",
                "createdAt": "2026-07-08T09:30:00.000Z",
                "performanceScore": 75,
                "accessibilityScore": 97,
                "seoScore": 98,
                "bestPracticesScore": 90,
                "agenticBrowsingScore": 79
            }
        ]
    }
]
```

#### `GET /projects/:id/reports`
Get a paginated list of reports for an owned project.

Supported query params:
- `page`
- `limit`
- `search`
- `groupId`
- `sort`
- `order`

Response example:

```json
{
    "data": [
        {
            "id": "report-id",
            "projectId": "project-id",
            "groupId": "report-group-id",
            "group": {
                "id": "report-group-id",
                "name": "Homepage mobile",
                "pageUrl": "https://example.com/",
                "strategy": "mobile"
            },
            "title": "Homepage audit",
            "summary": "Initial report for homepage checks",
            "pageUrl": "https://example.com/",
            "accessibilityScore": 85,
            "performanceScore": 90,
            "seoScore": 78,
            "bestPracticesScore": 92,
            "agenticBrowsingScore": 80,
            "insights": null,
            "comparison": {
                "previousReportId": "previous-report-id",
                "previousCreatedAt": "2026-06-08T09:30:00.000Z",
                "scores": {
                    "performanceScore": 7,
                    "accessibilityScore": 0,
                    "seoScore": -2,
                    "bestPracticesScore": 4,
                    "agenticBrowsingScore": -3
                },
                "userTimings": [
                    {
                        "name": "app:hydrate",
                        "entryType": "measure",
                        "currentValue": 850,
                        "previousValue": 1270,
                        "delta": -420,
                        "unit": "ms",
                        "previousReportId": "previous-report-id",
                        "previousCreatedAt": "2026-06-08T09:30:00.000Z"
                    }
                ]
            },
            "createdAt": "2026-07-08T08:00:00.000Z"
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 10,
        "total": 1,
        "totalPages": 1
    }
}
```

#### `POST /projects/:id/reports`
Create a report for a project. Requires authentication and ownership of the parent project.

Request body example:

```json
{
    "groupId": "report-group-id",
    "title": "Homepage audit",
    "summary": "Initial report for homepage checks",
    "pageUrl": "https://example.com/",
    "accessibilityScore": 85,
    "performanceScore": 90,
    "seoScore": 78,
    "bestPracticesScore": 92,
    "agenticBrowsingScore": 80
}
```

Add optional normalised `insights` to save a reviewed PageSpeed import alongside the manual scores. Report responses include `comparison: null` for the first report in a group, then score deltas and any comparable User Timing deltas for later reports.

#### `POST /projects/:projectId/report-insight-imports`
Fetch and normalise PageSpeed insights for review. Requires authentication and ownership of the parent project. This endpoint does not create a report.

Request body example:

```json
{
    "source": "PAGESPEED",
    "url": "https://example.com/",
    "strategy": "mobile"
}
```

The response includes normalised scores, page weight, lab metrics, field data placeholder, up to five opportunities, failed/warning audit references, and User Timings. The frontend can pass that `insights` object into report create after user review. Report update requests reject `insights` so existing import snapshots are not replaced accidentally.

#### `GET /reports/:id`
Get an owned report by id.

#### `PATCH /reports/:id`
Update a report. Requires authentication and ownership.

Request body example:

```json
{
    "groupId": "report-group-id",
    "title": "Updated report title",
    "summary": "Updated report summary",
    "pageUrl": "https://example.com/",
    "accessibilityScore": 88,
    "performanceScore": 95,
    "seoScore": 80,
    "bestPracticesScore": 88,
    "agenticBrowsingScore": 82
}
```

#### `DELETE /reports/:id`
Delete a report. Requires authentication and ownership.

Response:
- `204 No Content`

## Validation

Request body validation is handled with Zod for:

- auth register payloads
- auth login payloads
- project create payloads
- project update payloads
- report create payloads
- report update payloads
- report group create payloads
- report insight import payloads
- persisted report insights

### Database constraints
PostgreSQL also enforces report score ranges with `CHECK` constraints so scores must remain between `0` and `100`.

This gives you validation at both the app layer and the database layer.

## Database notes

The app uses PostgreSQL for:
- users
- sessions
- projects
- report groups
- reports

### Main relationships
- a user can own many projects
- a project belongs to one user
- a project can have many report groups
- a project can have many reports
- a report belongs to one project and can be attached to one report group
- a report can optionally store normalised PageSpeed or future CrUX insights
- report comparisons are derived from the nearest earlier report in the same group
- a session belongs to one user

## Migrations

Database schema changes are managed with ordered SQL migration files in:

```txt
sql/migrations/
```

Migrations are tracked in the `schema_migrations` table and applied with:

```bash
npm run migrate
npm run migrate:test
```

Current migrations include:
- `001_initial_schema.sql`
- `002_add_project_user_id.sql`
- `003_add_report_score_checks.sql`
- `004_add_read_path_indexes.sql`
- `005_add_report_insights.sql`
- `006_add_report_groups_and_replace_ux_score.sql`

## Seed data

The project includes simple seed scripts for local development and test environments.

### Seed a single user

Creates one user from `SEED_USER_EMAIL`, `SEED_USER_PASSWORD`, and optional `SEED_USER_NAME` in `.env`. Uses the same database URL rules as other seeds (`DATABASE_URL` by default, or `SEED_DATABASE_URL` when set).

```bash
npm run seed:user
```

### Seed local dev data

```bash
npm run seed:dev-data
```

### Seed test data

```bash
npm run seed:test-data
```

The bulk seed scripts delete existing rows before inserting a small deterministic dataset of:
- one local test user
- realistic projects
- flat report groups, such as `Homepage mobile` and `Homepage desktop`
- dated report history using the five-score report contract, with enough points for trend graphs
- normalised PageSpeed insights on every seeded report, including page weight, audit refs, and User Timings

By default, the bulk seed scripts only run without confirmation against local database hosts (`localhost`, `127.0.0.1`, or `::1`) outside production. If `SEED_DATABASE_URL` is set, `NODE_ENV=production`, or the target database host is remote, set `ALLOW_DESTRUCTIVE_SEED=true` for that command to confirm the target database can be wiped.

Do not run the bulk seed scripts as part of production deployment. Production should run migrations only, then use real user-created data or a deliberately created admin user.

This is useful for:
- Bruno testing
- pagination testing
- manual smoke testing
- local demos

## Cookie configuration

The session cookie is environment-aware.

### Development
- `httpOnly: true`
- `sameSite: 'lax'`
- `secure: false`

### Test
- same simple behaviour as development so test requests work cleanly

### Production
- `httpOnly: true`
- `sameSite: 'none'`
- `secure: true`

This keeps local development simple while allowing the deployed UI to send cookies to the deployed API over HTTPS.

## Documentation

The API is documented with OpenAPI and served using Swagger UI.

Docs are available at:

- local: `http://localhost:3000/docs`
- production: `https://site-score-api.onrender.com/docs`

## Testing

The project uses:
- Vitest
- Supertest

Tests run against a separate PostgreSQL test database.

### Run tests

```bash
npm test
```

### Watch mode

```bash
npm run test:watch
```

### Notes
- test files run serially because they share the same test database
- the test database is cleared between tests
- reusable helpers live in `src/test/test-helpers.ts`
- database cleanup lives in `src/test/test-db.ts`

## Manual API testing

A Bruno collection is included in the repo for local and live API testing.

Location:

```txt
bruno/Site Score API/
```

Included environments:
- Local
- Live

The Bruno collection covers:
- auth flows
- project CRUD
- report CRUD
- manual smoke testing against the deployed API

## Example curl commands

### Register

```bash
curl -i -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Phil","email":"phil@example.com","password":"secret123"}'
```

### Login and save cookies

```bash
curl -i -c cookies.txt -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"phil@example.com","password":"secret123"}'
```

### Get current user with saved cookies

```bash
curl -i -b cookies.txt http://localhost:3000/auth/me
```

### Create a project with saved cookies

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"My project","url":"https://example.com"}'
```

### Create a report group with saved cookies

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/projects/<project-id>/report-groups \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Homepage mobile",
    "pageUrl":"https://example.com/",
    "strategy":"mobile"
  }'
```

### Create a report with saved cookies

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/projects/<project-id>/reports \
  -H "Content-Type: application/json" \
  -d '{
    "groupId":"<report-group-id>",
    "title":"Homepage audit",
    "summary":"Initial report for homepage checks",
    "pageUrl":"https://example.com/",
    "accessibilityScore":85,
    "performanceScore":90,
    "seoScore":78,
    "bestPracticesScore":92,
    "agenticBrowsingScore":80
  }'
```

### Get paginated projects

```bash
curl -i "http://localhost:3000/projects?page=1&limit=2"
```

### Get paginated reports for a project

```bash
curl -i "http://localhost:3000/projects/<project-id>/reports?page=1&limit=2&groupId=<report-group-id>"
```

## Current status

This project currently demonstrates:
- TypeScript Express API structure
- PostgreSQL persistence
- authentication with cookie-based sessions
- ownership and authorisation rules
- relational data modelling
- integration testing
- runtime request validation with Zod
- database-level constraints for report score ranges
- ordered SQL migrations with a simple migration runner
- OpenAPI docs with Swagger UI
- paginated list endpoints
- Bruno-based manual API testing
- a deployed live version on Render

## What I learned

Building this project helped strengthen practical back end and full stack skills in:
- Express route, controller, service, and middleware structure
- PostgreSQL schema design and queries
- authentication and session handling
- ownership and authorisation rules
- runtime validation with Zod
- integration testing with Vitest and Supertest
- database migrations and schema evolution
- documenting an API with OpenAPI and Swagger UI
- shaping APIs for both automated and manual testing
- keeping a project structured enough to grow beyond toy examples

## Possible next improvements

- add sorting and search to list endpoints
- add reusable paginated response schemas to OpenAPI
- add a small front end or admin UI
- refactor repeated seed logic
- add richer report querying and dashboards
- add role-based access if the app grows further

## Why this project exists

This project exists to build stronger back end and full stack experience in a practical way, using a realistic API structure rather than a throwaway tutorial app.
