# Next.js 16 + NextAuth + Prisma Boilerplate

A modern, production-ready full-stack boilerplate featuring Next.js 16 (App Router), NextAuth.js v5 (Auth), Prisma ORM (Database), and a hybrid UI system (Shadcn UI + Mantine).

## Features

- **Authentication:** NextAuth.js v5 (Email/Password & Google OAuth).
- **Database:** Prisma ORM with PostgreSQL.
- **Authorization:** Role-based access (User vs Admin) & Account Approval System.
- **Admin Dashboard:** Manage users and approvals.
- **Modern Stack:** Next.js 16, TypeScript, Shadcn UI, Mantine UI v7, Tailwind CSS.

## Getting Started

### 1. Prerequisites
- Node.js 20+ (Recommended)
- PNPM (Recommended) or NPM

### 2. Configure Environment Variables
Copy the example file and fill in your keys:

```bash
cp .env.example .env
```

Open `.env` and fill in the details:

```env
# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-at-least-32-chars" # Generate with: openssl rand -base64 32

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

### 3. Initialize Database
Install dependencies and run Prisma migrations to set up your database schema.

```bash
# Install dependencies
pnpm install

# Generate Prisma Client
pnpm prisma generate

# Push schema to database (for development)
pnpm prisma db push
# OR create a migration
# pnpm prisma migrate dev --name init
```

### 4. Create Admin Account
Since new sign-ups are unapproved by default, use the included script to create your first admin user. This script connects directly to your database via Prisma.

```bash
# Ensure your database is running and schema is pushed before running this
npm run setup:admin
# or
pnpm setup:admin
```

Follow the prompts to enter email and password. This will:
- Create the user in the database (or update existing one).
- Automatically promote them to `admin`.
- Approve their account.

### 5. Run the App

```bash
pnpm dev
```

Visit `http://localhost:3000`. You can login with the admin account you created.

## Documentation

For detailed architecture and folder structure, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## CI/CD

This project includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that:
- Lints the code.
- Checks types.
- Builds the application.

### Required GitHub Secrets

Set these in **GitHub repo or org-level Secrets** (Settings → Secrets and variables → Actions).

| Secret | Purpose | Format |
|---|---|---|
| `DATABASE_URL` | Pooled connection for runtime app | `postgresql://user:pass@aws-X-XX-Y.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | **Direct** connection for `prisma migrate deploy` (deploy job) | `postgresql://user:pass@db.<projectref>.supabase.co:5432/postgres` |
| `STAGING_DIRECT_URL` | **Direct** read-only connection for `prisma migrate status` pre-flight (generate-migration job) | `postgresql://readonly_user:pass@db.<projectref>.supabase.co:5432/postgres` |
| `NEXTAUTH_SECRET` | NextAuth signing secret | 32+ chars, generate via `openssl rand -base64 32` |
| `VERCEL_TOKEN` | Vercel API token for deploy | from Vercel dashboard |
| `VERCEL_ORG_ID` | Vercel team ID | `team_xxxxx` (optional) |
| `GH_PAT` | GitHub PAT for auto-merge (optional) | `repo` scope |

**Critical rule about Supabase connection URLs:**
- ✅ Direct (use for `DIRECT_URL` and `STAGING_DIRECT_URL`): host `db.<projectref>.supabase.co`, port `5432`.
- ❌ Pooler (use for `DATABASE_URL` runtime only): host contains `pooler.`, port `5432` (session) or `6543` (transaction).

Running `prisma migrate deploy` through a pooler URL is the historical source of partial-apply failures that leave a half-committed row in `_prisma_migrations` (Prisma error `P3009`). The `Validate STAGING_DIRECT_URL` step in the generate-migration job will fail fast if either secret is mis-configured with a pooler host.

The `STAGING_DIRECT_URL` should use a read-only role with these grants:
- `SELECT` on `_prisma_migrations`
- `SELECT` on `pg_catalog.*` (for schema introspection)

No write permissions needed — this URL is for pre-flight check only, never for apply.

### Optional: `ENFORCE_DRIFT_CHECK` Variable

The CI pre-flight has two checks:
1. **Failed migration detection** (always active) — blocks if Supabase has a half-applied migration. This is the core P3009 protection and cannot be disabled.
2. **Drift detection** (configurable via `ENFORCE_DRIFT_CHECK`) — blocks if Supabase has migrations that aren't in your repo. Default: **disabled**.

| `ENFORCE_DRIFT_CHECK` | When to use | Behavior |
|---|---|---|
| `false` (default) | **Shared Supabase setup** — e.g. free tier with 1 Supabase project shared across multiple apps. Sibling apps' migrations naturally appear as "drift" but are not actual problems. | Drift detected → log warning, don't block CI. |
| `true` | **1-to-1 Supabase setup** — each app has its own dedicated Supabase project. Any drift is genuinely unexpected. | Drift detected → block CI with `[STAGING_DB_STATE_ERROR]`. |

How to set: GitHub repo or org → Settings → Secrets and variables → Actions → **Variables** tab (not Secrets) → Add `ENFORCE_DRIFT_CHECK` with value `true`.

**Recommended migration path**:
1. Start with shared Supabase + `ENFORCE_DRIFT_CHECK=false` (or unset).
2. When scaling to paid Supabase with dedicated projects per app, set `ENFORCE_DRIFT_CHECK=true` org-wide or per-repo. No code change needed.
