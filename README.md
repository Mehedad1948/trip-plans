# From Desert to Mist

A Persian, RTL, mobile-first group travel planner built with Next.js 16. It
includes the itinerary, attractions, per-member packing, group chat, shared
expenses, settlements, authentication, PWA installation, and Web Push
notifications.

## Requirements

- Node.js 22.5 or newer when using the local `node:sqlite` seed script
- npm
- A Turso database for Vercel or other serverless deployments

## Local setup

```bash
npm install
npm run seed
npm run dev
```

Open `http://localhost:3000`. The current trip is available at:

```text
/trip/az-kavir-ta-meh
```

If `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are configured, the application
uses Turso. Without them, the runtime falls back to `data/trip.db`.

## Initial accounts

| Username | Display name | Temporary password |
| --- | --- | --- |
| `mehrdad` | Mehrdad | `123456` |
| `amir-mohammad` | Amir Mohammad | `123456` |
| `ali` | Ali | `123456` |

Passwords are hashed with `scrypt`. Login sessions use random tokens, hashed
session records in the database, and secure `HttpOnly` cookies. Change the
temporary passwords before exposing the application publicly.

## Database architecture

The runtime uses `@libsql/client` for both Turso and local SQLite:

```dotenv
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-private-token
```

All server components, authentication queries, mutations, expense transactions,
chat messages, packing updates, sessions, and push subscriptions use the same
asynchronous data access layer.

`npm run seed` resets only the local `data/trip.db` file from
[`data/trip.json`](data/trip.json). It does not reset Turso.

### Check Turso connectivity

```bash
npm run db:check
```

This verifies credentials and reports non-sensitive table counts.

### Import the local database into Turso

```bash
npm run db:migrate:turso -- --force
```

This is intentionally explicit and destructive for the remote target. It:

1. Connects to the Turso database configured in the environment.
2. Replaces its application schema.
3. Copies the current local users, trip, sessions, packing, messages, expenses,
   and push subscriptions while preserving IDs and timestamps.
4. Verifies every table count after import.

Do not add this command to the Vercel build command.

### Test remote transactions

```bash
npm run db:smoke
```

The smoke test reads the trip, performs a temporary remote write inside a
transaction, rolls it back, and verifies that no test data remains.

## PWA and Web Push

Generate VAPID keys once:

```bash
npm run push:keys
```

Configure:

```dotenv
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:your-real-email@example.com
```

Do not regenerate VAPID keys on every deployment. Existing subscriptions are
tied to the public key. The notification button in the trip navigation enables
message and expense notifications for the active account.

Web Push requires HTTPS. Vercel supplies HTTPS automatically. On iOS/iPadOS
16.4 or newer, users must first add the PWA to their Home Screen and open the
installed application before enabling notifications.

The service worker does not cache authenticated pages, RSC responses, or APIs.
It only caches the offline shell, manifest, icons, and static assets.

## Vercel deployment

In Vercel, open **Project → Settings → Environment Variables** and add the
following to Production:

```dotenv
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:...
```

Mark `TURSO_AUTH_TOKEN` and `VAPID_PRIVATE_KEY` as sensitive. Configure the same
variable names for Preview, preferably using a separate preview Turso database.

Keep the standard Vercel commands:

```text
Install command: npm install
Build command:   npm run build
```

Do not run `npm run seed` or `db:migrate:turso` during deployment. After adding
or changing environment variables, redeploy because `NEXT_PUBLIC_*` values are
embedded during the build.

The configured Turso database is in AWS Mumbai. In Vercel
**Settings → Functions**, choose the closest available function region to that
database and redeploy.

## Commands

```bash
npm run dev                     # Development server
npm run seed                    # Reset local SQLite from JSON
npm run db:check                # Check Turso connectivity
npm run db:migrate:turso -- --force # Replace/import the remote database
npm run db:smoke                # Verify remote transaction behavior
npm run push:keys               # Generate VAPID keys
npm run lint                    # ESLint
npm run build                   # Production build
npm start                       # Run the production build
```

## Architecture

- Next.js 16 App Router and React Server Components
- Tailwind CSS 4 and the Vazirmatn Persian font
- Turso/libSQL in production with local SQLite fallback
- Extensible `/trip/[slug]` routes
- Many-to-many `users` and `trip_members`
- Server-side username/password authentication and revocable sessions
- Editable, per-member packing responsibilities
- Chat overlay controlled by `nuqs`
- Shared expenses with payer, recorder, participants, exact shares, and
  settlement suggestions
- Web App Manifest, service worker, offline fallback, and VAPID Web Push

All mutations re-check authentication and trip membership on the server. User
identity is never accepted from a form field.
