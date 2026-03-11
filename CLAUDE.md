# Wonderelo

Speed networking event management platform. Vite + React SPA with Supabase (auth, database, edge functions), TailwindCSS, shadcn/ui.

GitHub: `https://github.com/andydoublea/wonderelo.git`

---

## Multi-project machine

This machine also runs **Blanc Brain** at `/Users/andy/Claude/Blanc Brain/`. Here are Blanc Brain's identifiers — **NEVER** use them for Wonderelo:

| | Wonderelo | Blanc Brain |
|---|---|---|
| Vercel project | `wonderelo` | `blanc-brain` (`prj_VNXoDuItHWtBYPUo6yyJngYYVsSR`) |
| Supabase prod ref | `tpsgnnrkwgvgnsktuicr` | `eagiouhnsghdsvoojvmv` |
| Supabase dev/staging ref | `dqoybysbooxngrsxaekd` | `iuqaledpjsacxrtddkfq` |

Always double-check `--project-ref` before running any Supabase CLI commands.

### Critical rules
- NEVER delete the Vercel project or change Vercel account without explicit permission
- NEVER commit `.env.local` to git (it's in `.gitignore`)
- NEVER use production Supabase credentials during local development
- Before ANY infrastructure change, verify current state first
- Before committing, ALWAYS ask the user which branch to commit to. Never assume the branch — wait for explicit confirmation (e.g. "commit to development", "commit to staging").
- When pushing to `main`, ALWAYS also deploy edge functions to production (`npm run deploy:edge:prod`) — they don't auto-deploy. Frontend auto-deploys via Vercel, but edge functions require manual deployment.
- When the user uploads files (images, assets, etc.), ALWAYS copy them into the project directory (e.g. `public/`) before referencing them. Never link directly to the upload location (e.g. `~/Downloads/`) — those files may be deleted at any time.

---

## Environments

| | Localhost | Staging | Production |
|---|---|---|---|
| Frontend URL | `http://localhost:3001` | Vercel preview | Vercel production |
| Git branch | `development` | `staging` | `main` |
| Supabase | **local** (Docker, port 54321) | `dqoybysbooxngrsxaekd` (cloud) | `tpsgnnrkwgvgnsktuicr` (cloud) |
| Edge functions | local (`supabase functions serve`) | cloud | cloud |
| Deploy | `npm run dev` | `npm run deploy:staging` | `npm run deploy:prod` |

### Git branch flow

```
development → staging → main
(localhost)    (preview)   (production)
```

- Feature branches are created from `development`
- Merge to `staging` for testing, then to `main` for production

---

## Credentials

### Supabase Access Token (shared across projects)
```
sbp_bd8d0a5a7416bebbd5470623d33d807ba8ac0067
```

### Production Supabase
- **Project ref:** `tpsgnnrkwgvgnsktuicr`
- **Anon key:** in `src/utils/supabase/info.tsx` (fallback default)

### Staging Supabase
- **Project ref:** `dqoybysbooxngrsxaekd`
- **Anon key:** in `deploy:staging` script in `package.json`

### Local Supabase (Docker)
- **URL:** `http://127.0.0.1:54321`
- **Studio:** `http://127.0.0.1:54323`
- **Anon key:** shown by `supabase start` (default key in `.env.local`)
- **Config:** `supabase/config.toml`

---

## Deploy commands

```bash
# Local development (start Supabase + Vite)
npm run dev:local
# Or separately:
supabase start
npm run dev

# Deploy frontend to staging
npm run deploy:staging

# Deploy frontend to production
npm run deploy:prod

# Deploy edge functions to staging
npm run deploy:edge:dev

# Deploy edge functions to production
npm run deploy:edge:prod

# Reset local database (applies all migrations + seed)
supabase db reset

# Stop local Supabase
supabase stop
```

### package.json scripts
| Script | Purpose |
|--------|---------|
| `dev` | Start Vite dev server on port 3001 |
| `dev:local` | Start local Supabase + Vite dev server |
| `build` | Build for production |
| `deploy:prod` | Deploy to Vercel production |
| `deploy:staging` | Deploy to Vercel preview with staging Supabase env vars |
| `deploy:edge:prod` | Deploy edge functions to production Supabase |
| `deploy:edge:dev` | Deploy edge functions to staging Supabase |

---

## Local dev workflow

**Development runs on local Docker Supabase** — NOT staging or production.

1. Start Docker Desktop (required for local Supabase)
2. Run `supabase start` (starts PostgreSQL, Auth, Edge Functions, Studio — all in Docker)
3. Run `npm run dev` (or use Claude worktree's `launch.json` with `npx vite --port 3011`)
4. Open `http://localhost:3011` (worktree) or `http://localhost:3001` (main)
5. Frontend connects to **local Docker Supabase** at `http://127.0.0.1:54321`
6. Supabase Studio at `http://127.0.0.1:54323` for DB management
7. Email testing at `http://127.0.0.1:54324` (Inbucket/Mailpit)

### Seed users (survive `supabase db reset`)

`supabase/seed.sql` creates auth users + organizer profiles automatically. After every `supabase db reset`, these accounts are ready to use:

| Email | Password | Role | Slug |
|-------|----------|------|------|
| `andy.double.a+org@gmail.com` | `Rukuku` | admin | `andyconf` |
| `admin@test.com` | `test123456` | organizer | `test-event` |

The admin account (`andy.double.a+org@gmail.com`) is the primary dev account. Always preserve it in the seed.

### Admin settings (system parameters)

**CRITICAL: When modifying `seed.sql`, NEVER overwrite existing `admin_settings` rows.** The admin configures system parameters via the Admin Panel and those values must survive `supabase db reset`. Use `ON CONFLICT (key) DO NOTHING` (not `DO UPDATE`) for `admin_settings` inserts in seed.sql so existing values are preserved. Only insert if the row doesn't exist yet.

When adding NEW parameter fields, update both `seed.sql` (as default for fresh installs) and `src/utils/systemParameters.ts` (as runtime fallback). But never force-overwrite existing parameter values in the seed.

### Stripe for local development

Edge functions need Stripe keys for payment flows. Add your Stripe **test** keys to **two** files (both are in `.gitignore`):

1. **`.env`** (project root) — read by `config.toml` via `env()` for `supabase start`
2. **`supabase/functions/.env`** — auto-loaded by `supabase functions serve`

```bash
# Both files should contain:
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
APP_URL=http://127.0.0.1:3011
```

Get test keys from https://dashboard.stripe.com/test/apikeys

After adding keys, restart Supabase: `supabase stop && supabase start`

**Alternative for testing without Stripe:** Use Admin panel → Billing management to grant subscriptions and credits directly (bypasses Stripe entirely).

### How environment detection works

`src/utils/supabase/info.tsx` exports:
- `supabaseUrl` — from `VITE_SUPABASE_URL` env var, defaults to production cloud URL
- `apiBaseUrl` — `${supabaseUrl}/functions/v1/make-server-ce05600a`
- `projectId` — from `VITE_SUPABASE_PROJECT_ID`, defaults to production
- `publicAnonKey` — from `VITE_SUPABASE_ANON_KEY`, defaults to production

`.env.local` (not committed) overrides these for local development.

---

## Claude Code sessions & worktrees

Each Claude Code session creates a **git worktree** at `.claude/worktrees/<random-name>/`. Wonderelo uses port range **3010+** (Blanc Brain uses 3001+).

### Git workflow

1. Claude creates a feature branch inside its worktree (e.g. `claude/optimistic-mayer`)
2. When ready, merge to `development` then to `staging` and push
3. After testing on staging, merge to `main` and push for production

---

## Key files

| File | Purpose |
|---|---|
| `src/utils/supabase/info.tsx` | Supabase config (URLs, keys, environment detection) |
| `src/utils/supabase/client.tsx` | Supabase client initialization |
| `src/utils/supabase/apiClient.tsx` | Authenticated fetch wrapper for edge functions |
| `supabase/config.toml` | Local Supabase configuration |
| `supabase/functions/make-server-ce05600a/` | Edge function (API backend) |
| `supabase/migrations/` | Database migrations |
| `vite.config.ts` | Vite build config (port, aliases, output) |
| `vercel.json` | Vercel deployment config |
| `.env` | Stripe keys + secrets for local Docker edge functions (not committed) |
| `.env.local` | Local Vite environment overrides (not committed) |
| `supabase/functions/.env` | Edge function secrets for `supabase functions serve` (not committed) |
| `package.json` | Scripts and dependencies |

---

## Application details

### Tech stack
- **Frontend:** Vite + React 18 SPA
- **Language:** TypeScript
- **Backend:** Supabase Edge Functions (Hono framework, Deno)
- **Database:** PostgreSQL (Supabase-hosted)
- **Auth:** Supabase Auth (magic links, email/password)
- **Styling:** TailwindCSS, shadcn/ui
- **State:** Zustand, React Query
- **UI language:** Slovak/English

### API pattern
All frontend API calls use `apiBaseUrl` from `src/utils/supabase/info.tsx`. This resolves to:
- Local: `http://127.0.0.1:54321/functions/v1/make-server-ce05600a`
- Staging: `https://dqoybysbooxngrsxaekd.supabase.co/functions/v1/make-server-ce05600a`
- Production: `https://tpsgnnrkwgvgnsktuicr.supabase.co/functions/v1/make-server-ce05600a`
