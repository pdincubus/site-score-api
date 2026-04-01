# Site Score API

A small full stack TypeScript API for managing website projects, audit reports, and user accounts.

It was built as a practical learning and portfolio project to strengthen back end and full stack skills using a realistic structure, PostgreSQL persistence, authentication, ownership rules, runtime validation, database migrations, and integration tests.

## Features

### Auth
- Register a user
- Log in with email and password
- Log out
- Get the current authenticated user
- Session cookie stored in the browser
- Session records stored in PostgreSQL

### Projects
- List all projects
- Get a single project by id
- Create a project when authenticated
- Update a project when authenticated and authorised
- Delete a project when authenticated and authorised

### Reports
- List reports for a project
- Get a single report by id
- Create a report for a project when authenticated and authorised
- Update a report when authenticated and authorised
- Delete a report when authenticated and authorised

### Security and access rules
- Project write routes require authentication
- Only the project owner can update or delete their project
- Only the project owner can create reports for that project
- Only the project owner can update or delete those reports
- Project and report reads are public

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
    validation/

sql/
    migrations/
```

### Structure overview
- `routes` map HTTP endpoints to controllers
- `controllers` handle request and response logic
- `services` contain application and database logic
- `middleware` handles shared request behaviour
- `validation` contains Zod request schemas
- `test` contains DB cleanup and reusable test helpers
- `scripts` contains utility scripts such as the migration runner
- `sql/migrations` contains ordered SQL migration files

## Environment variables

Create a `.env` file in the project root.

Example:

```env
PORT=3000
DATABASE_URL=postgresql://localhost:5432/site_score_api
DATABASE_TEST_URL=postgresql://localhost:5432/site_score_api_test
SESSION_SECRET=change-this-to-a-long-random-string
```

You should also keep `.env.example` updated with the same keys but safe placeholder values.

Example:

```env
PORT=3000
DATABASE_URL=postgresql://localhost:5432/site_score_api
DATABASE_TEST_URL=postgresql://localhost:5432/site_score_api_test
SESSION_SECRET=your-session-secret-here
```

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

### 4. Start the dev server

```bash
npm run dev
```

The API should then be available at:

```txt
http://localhost:3000
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
```

## API overview

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
Get all projects.

Response:

```json
[
    {
        "id": "project-id",
        "name": "My project",
        "url": "https://example.com",
        "createdAt": "2026-04-01T13:15:06.935Z"
    }
]
```

#### `GET /projects/:id`
Get a single project by id.

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

#### `GET /projects/:id/reports`
Get all reports for a project.

Response:

```json
[
    {
        "id": "report-id",
        "projectId": "project-id",
        "title": "Homepage audit",
        "summary": "Initial report for homepage checks",
        "accessibilityScore": 85,
        "performanceScore": 90,
        "seoScore": 78,
        "uxScore": 82,
        "createdAt": "2026-04-01T13:15:06.935Z"
    }
]
```

#### `POST /projects/:id/reports`
Create a report for a project. Requires authentication and ownership of the parent project.

Request body example:

```json
{
    "title": "Homepage audit",
    "summary": "Initial report for homepage checks",
    "accessibilityScore": 85,
    "performanceScore": 90,
    "seoScore": 78,
    "uxScore": 82
}
```

#### `GET /reports/:id`
Get a single report by id.

#### `PATCH /reports/:id`
Update a report. Requires authentication and ownership.

Request body example:

```json
{
    "title": "Updated report title",
    "performanceScore": 95
}
```

#### `DELETE /reports/:id`
Delete a report. Requires authentication and ownership.

Response:
- `204 No Content`

## Validation

Request body validation is currently handled in two ways.

### Zod
Zod is used for:
- auth register payloads
- auth login payloads
- project create payloads
- project update payloads
- report create payloads
- report update payloads

### Database constraints
PostgreSQL also enforces report score ranges with `CHECK` constraints so scores must remain between `0` and `100`.

This gives you validation at both the app layer and the database layer.

## Database notes

The app uses PostgreSQL for:
- users
- sessions
- projects
- reports

### Main relationships
- a user can own many projects
- a project belongs to one user
- a project can have many reports
- a report belongs to one project
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
- `sameSite: 'lax'`
- `secure: true`

This keeps local development simple while making production safer over HTTPS.

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

## Example curl commands

### Register

```bash
curl -i -X POST http://localhost:3000/auth/register   -H "Content-Type: application/json"   -d '{"name":"Phil","email":"phil@example.com","password":"secret123"}'
```

### Login and save cookies

```bash
curl -i -c cookies.txt -X POST http://localhost:3000/auth/login   -H "Content-Type: application/json"   -d '{"email":"phil@example.com","password":"secret123"}'
```

### Get current user with saved cookies

```bash
curl -i -b cookies.txt http://localhost:3000/auth/me
```

### Create a project with saved cookies

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/projects   -H "Content-Type: application/json"   -d '{"name":"My project","url":"https://example.com"}'
```

### Create a report with saved cookies

```bash
curl -i -b cookies.txt -X POST http://localhost:3000/projects/<project-id>/reports   -H "Content-Type: application/json"   -d '{
    "title":"Homepage audit",
    "summary":"Initial report for homepage checks",
    "accessibilityScore":85,
    "performanceScore":90,
    "seoScore":78,
    "uxScore":82
  }'
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

## What I learned

Building this project helped strengthen practical back end and full stack skills in:
- Express route, controller, service, and middleware structure
- PostgreSQL schema design and queries
- authentication and session handling
- ownership and authorisation rules
- runtime validation with Zod
- integration testing with Vitest and Supertest
- database migrations and schema evolution
- keeping a project structured enough to grow beyond toy examples

## Possible next improvements

- deploy to Vercel with a hosted PostgreSQL database
- add OpenAPI or Swagger documentation
- add pagination and filtering
- add sorting and search
- add a small front end or admin UI
- refactor repeated validation and mapping further
- add richer report querying and dashboards

## Why this project exists

This project exists to build stronger back end and full stack experience in a practical way, using a realistic API structure rather than a throwaway tutorial app.
