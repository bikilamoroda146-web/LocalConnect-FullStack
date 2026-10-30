# LocalConnect Backend

The REST API for LocalConnect: **Node.js + Express 5 + PostgreSQL + Prisma 7** (plain JavaScript).

> **Current stage: Milestone 1 (foundation only).**
> The server starts, checks its configuration, connects to PostgreSQL and answers
> `GET /api/v1/health`. There are no database tables, no login and no other endpoints yet.
> The existing frontend still runs entirely on its own sample data and is unchanged,
> except for one small development setting in `vite.config.js` (the `/api` proxy).

---

## What you need installed

| Tool | Version | Why |
|---|---|---|
| **Node.js** | **24 LTS recommended** (22.18 or newer also works) | Runs the backend. Older versions will not start (the server tells you). |
| **PostgreSQL** | **16 or 17 recommended** (Prisma 7 supports 9.6 – 18) | The database. |

Check Node with `node -v`. Download it from <https://nodejs.org> if needed.

Pinned versions used in this project (checked against the official Prisma docs and the npm registry):
Express 5.3.0 · Prisma CLI and Prisma Client **7.10.1** (always keep these two identical) ·
`@prisma/adapter-pg` 7.10.1 · `pg` 8.23.1 · Zod 4.6.7 · Helmet 8.3.0 · Vitest 5.0.5.
No release candidates are used.

---

## Step 1 — Install PostgreSQL

Pick **one** way.

* **Windows:** download the installer from <https://www.postgresql.org/download/windows/>.
  During setup you choose a password for the `postgres` administrator. **Write it down.**
  Keep the default port `5432`. The installer includes "SQL Shell (psql)".
* **macOS:** install [Postgres.app](https://postgresapp.com), or run `brew install postgresql@17` and then `brew services start postgresql@17`.
* **Ubuntu/Debian:** `sudo apt install postgresql` (it starts automatically).
* **Docker (any system):**
  ```
  docker run --name localconnect-db -e POSTGRES_PASSWORD=CHOOSE_A_PASSWORD -p 5432:5432 -d postgres:17
  ```
  Replace `CHOOSE_A_PASSWORD` with your own. Later use `docker stop localconnect-db` and `docker start localconnect-db`.

## Step 2 — Create the databases

Open a PostgreSQL prompt (**psql**):

* Windows: start menu → "SQL Shell (psql)", press Enter for each default, then type the `postgres` password.
* macOS (Homebrew): `psql postgres`  ·  Ubuntu: `sudo -u postgres psql`  ·  Docker: `docker exec -it localconnect-db psql -U postgres`

Then paste these lines (choose **your own** password instead of the placeholder):

```sql
CREATE USER localconnect WITH PASSWORD 'CHOOSE_A_STRONG_PASSWORD' CREATEDB;
CREATE DATABASE localconnect_dev  OWNER localconnect;
CREATE DATABASE localconnect_test OWNER localconnect;
\q
```

* `localconnect_dev` is the database you develop with.
* `localconnect_test` is a **separate** database used only by automated tests. Tests refuse to run on any database whose name does not end with `_test`, so they can never touch your real data.
* `CREATEDB` lets Prisma create a temporary helper database when we add tables in Milestone 2.

## Step 3 — Configure the backend

Inside the `backend/` folder, copy the template files:

```
# macOS / Linux / Git Bash
cp .env.example .env
cp .env.test.example .env.test

# Windows Command Prompt
copy .env.example .env
copy .env.test.example .env.test
```

Open `.env` in an editor and replace `YOUR_DB_USER` and `YOUR_DB_PASSWORD`:

```
DATABASE_URL="postgresql://localconnect:CHOOSE_A_STRONG_PASSWORD@localhost:5432/localconnect_dev"
```

Do the same in `.env.test` (the database name stays `localconnect_test`).

The format is `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`.
If your password contains special characters like `@ : / # ? %`, write them percent-encoded (`@` → `%40`, `#` → `%23`, `/` → `%2F`). The simplest fix is a password made of letters and digits.

> `.env` and `.env.test` hold secrets. They are listed in `.gitignore` and must **never** be committed or shared.

## Step 4 — Install and prepare (inside `backend/`)

```
npm install
npm run db:generate
npm run db:check
```

* `npm install` downloads the libraries.
* `npm run db:generate` creates the Prisma database client in `backend/generated/`. It needs the `.env` file from Step 3 and internet access. Run it again after every fresh `npm install` on a new machine, and whenever `prisma/schema.prisma` changes.
* `npm run db:check` tests the connection (read-only). You should see `PostgreSQL connection OK`. If not, it prints a specific hint.

## Step 5 — Start the backend and the frontend

Use **two terminals**.

**Terminal 1 — backend** (in `backend/`):
```
npm run dev
```
Expected:
```
INFO  LocalConnect API listening on http://127.0.0.1:4000/api/v1 (development)
INFO  PostgreSQL connection OK (database "localconnect_dev")
```
`npm run dev` restarts automatically when you edit backend files. Stop it with `Ctrl+C`.

**Terminal 2 — frontend** (in the project's main folder, one level up):
```
npm install      # first time only
npm run dev
```
Open the address it prints, normally <http://localhost:5173>.

## Step 6 — Test the health endpoint

Use any of these (the backend must be running):

* **Browser, directly:** <http://127.0.0.1:4000/api/v1/health>
* **Browser, through the frontend's proxy** (this is how the frontend will call the API later): <http://localhost:5173/api/v1/health>
* **Terminal:** `curl http://127.0.0.1:4000/api/v1/health`
* **Windows PowerShell:** `Invoke-RestMethod http://127.0.0.1:4000/api/v1/health`

Healthy response (HTTP 200):
```json
{"data":{"status":"ok","database":"up","timestamp":"2026-10-29T06:56:39.421Z"}}
```
If PostgreSQL is stopped or unreachable you get HTTP **503** with `"status":"degraded","database":"down"`.
The server stays up, so you can fix the database and the next request recovers by itself.
The response never contains passwords or error details.

## Development administrator setup

Public registration accepts only customer and provider roles. To create the first administrator locally, add `DEV_ADMIN_NAME`, `DEV_ADMIN_EMAIL`, and a strong `DEV_ADMIN_PASSWORD` to `backend/.env`, then run:

```
npm run db:setup-admin:dev
```

The command checks whether any administrator already exists and makes no changes if one does. It refuses production mode, refuses to overwrite an existing email, and hashes the password with the same scrypt implementation used by login. Never commit these values or use this command in production.

Administrators can review pending providers at `GET /api/v1/admin/providers/pending` and approve or reject them with the CSRF-protected `POST /api/v1/admin/providers/:providerId/approve` and `/reject` endpoints. Approval activates and verifies the provider; rejection suspends the account.

## Tests

```
npm test          # unit tests: need NO database (22 tests)
npm run test:db   # real PostgreSQL tests: need Step 2 and .env.test (4 tests)
npm run test:all  # both
```

`npm run test:db` **fails** (it never silently skips) if PostgreSQL is not reachable. A failure there means "fix the database setup", not "the code is broken".

## Troubleshooting

| You see | Meaning and fix |
|---|---|
| `needs Node.js 22.18 or newer` | Install Node 24 LTS from nodejs.org. |
| `DATABASE_URL: is required` | `backend/.env` is missing. Do Step 3. |
| `Prisma client has not been generated yet` | Run `npm run db:generate`. |
| `db:check`: password rejected (`28P01`) | Wrong user or password in `DATABASE_URL`. |
| `db:check`: database does not exist (`3D000`) | Run the `CREATE DATABASE` lines in Step 2. |
| `db:check`: `DatabaseNotReachable` | PostgreSQL is not running, or the port is wrong. |
| `Port 4000 is already in use` | Another program uses it. Stop it, or set `PORT=4001` in `.env` (and update the proxy in `vite.config.js`). |
| Proxy URL shows an error but the direct URL works | The backend is not on port 4000. Check Terminal 1. |
| `npm run test:db`: name must end with `_test` | Fix `DATABASE_URL` in `.env.test`. |

## Folder structure

```
backend/
  prisma/schema.prisma      database schema (no tables yet: Milestone 2)
  prisma.config.ts          Prisma CLI settings (reads DATABASE_URL)
  generated/                generated Prisma client (git-ignored)
  src/
    server.js               starts the server, shuts down cleanly
    app.js                  builds the Express app (also used by tests)
    config/                 settings: env validation, fixed constants
    routes/ controllers/ services/   request -> logic layers (only "health" for now)
    middleware/             error handling, logging, 404
    lib/prisma.js           creates the database client
    utils/ validators/      helpers (validators/ stays empty until Milestone 3)
  scripts/check-db.js       `npm run db:check`
  tests/unit, tests/integration
  .env.example  .env.test.example   templates (safe to commit)
```

## Security notes for this stage

* Secrets only come from environment variables (`.env`, git-ignored). The server refuses to start with invalid settings.
* CORS: only the origins in `CORS_ORIGINS` may call the API from a browser.
* Helmet security headers, a 100 KB request body limit, and JSON error responses with no stack traces.
* Logs contain only method, path and status, never query strings, headers or credentials.
* Defaults bind to `127.0.0.1`, so only your own computer can reach the API during development.

## Fixed project decisions

Time zone `Africa/Addis_Ababa` · currency `ETB` · booking status name `CONFIRMED` ·
sessions stored in PostgreSQL with HTTP-only cookies (Milestone 3) ·
media stored on local disk in development, cloud object storage later.

## Next

Milestone 2 (database schema and first migration) has **not** been started. It begins only after you confirm Milestone 1 works on your computer.
