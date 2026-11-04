# AdonisJS 7 Template

A server-rendered web application template built on **AdonisJS 7** (hypermedia starter kit — Edge + Vite + Alpine.js), pre-wired with PostgreSQL, Redis, and a BullMQ-based queue processor.

## Stack

| Concern         | Package                                   |
| --------------- | ----------------------------------------- |
| Framework       | `@adonisjs/core` 7 (hypermedia web kit)   |
| ORM             | `@adonisjs/lucid` + `pg` (PostgreSQL)     |
| Cache / Redis   | `@adonisjs/redis`                         |
| Queues          | `@acidiney/bull-queue` (BullMQ + Bull Board) |
| Views           | Edge, Vite, Alpine.js                     |
| Auth            | `@adonisjs/auth`                          |

## Requirements

- **Node.js >= 24**
- **PostgreSQL** running and reachable
- **Redis** running and reachable (required for the queue worker)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

   > `@acidiney/bull-queue` still declares a peer dependency on AdonisJS core 6, so if you hit an `ERESOLVE` error run `npm install --legacy-peer-deps`.

2. **Configure environment**

   Copy the example file and fill in your credentials:

   ```bash
   cp .env.example .env
   ```

   Key variables:

   ```dotenv
   # Database (PostgreSQL)
   DB_CONNECTION=postgres
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=root
   DB_DATABASE=my_app_dev_db

   # Redis
   REDIS_HOST=127.0.0.1
   REDIS_PORT=6379
   REDIS_PASSWORD=
   ```

   Generate an app key if one isn't set:

   ```bash
   node ace generate:key
   ```

3. **Create the database and run migrations**

   ```bash
   node ace db:create     # creates the database named in DB_DATABASE
   node ace migration:run
   ```

## Running

Start the dev server (with HMR) at <http://localhost:3333>:

```bash
npm run dev
```

Run the queue worker. Use the `:ui` variant to also expose Bull Board at `/admin`:

```bash
node ace queue:listen        # process jobs
node ace queue:listen:ui     # process jobs + Bull Board dashboard at /admin
```

## Useful commands

| Command                      | Description                                        |
| ---------------------------- | -------------------------------------------------- |
| `npm run dev`                | Start the HTTP server with hot reload              |
| `npm run build`              | Build for production                               |
| `npm start`                  | Run the production build (`node bin/server.js`)    |
| `npm test`                   | Run the test suites                                |
| `npm run lint`               | Lint the codebase                                  |
| `npm run format`             | Format with Prettier                               |
| `npm run typecheck`          | Type-check without emitting                        |
| `node ace db:create`         | Create the configured PostgreSQL database          |
| `node ace db:drop [--force]` | Drop the configured PostgreSQL database            |
| `node ace migration:run`     | Run pending migrations                             |
| `node ace make:job <name>`   | Generate a queue job                               |
| `node ace list`              | List all available ace commands                    |

### Custom database commands

`db:create` and `db:drop` connect to the `postgres` maintenance database and operate on the database configured for the active Lucid connection.

```bash
node ace db:create                       # idempotent: skips if the DB exists
node ace db:drop                         # prompts for confirmation
node ace db:drop --force                 # skip the prompt
node ace db:create --connection=postgres # target a specific connection
```

## Project structure

```
app/
  controllers/   HTTP controllers
  models/        Lucid models
  middleware/    HTTP middleware
commands/        Custom ace commands (db:create, db:drop)
config/          Framework & package config (database, redis, queue, ...)
database/
  migrations/    Database migrations
resources/       Edge views & frontend assets
start/
  routes.ts      Route definitions
  jobs.ts        Queue job registrations
```

## Queues

Register jobs in `start/jobs.ts`, generate new ones with `node ace make:job <name>`, and dispatch them from anywhere via the queue service. Worker settings, retry attempts, and the Bull Board UI path live in `config/queue.ts`.
