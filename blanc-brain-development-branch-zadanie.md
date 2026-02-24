# Zadanie: Vytvorenie `development` branchu pre Blanc Brain

## Kontext

V projekte Wonderelo sme práve nastavili 3-úrovňový branch flow:
```
development (localhost, lokálny Supabase) → staging → main (production)
```

Blanc Brain potrebuje obdobné nastavenie. Aktuálne Blanc Brain nemá `development` branch — localhost sa pripája k DEV Supabase v cloude (čo je lepšie ako Wonderelo, kde to šlo na produkciu, ale stále to nie je plne izolované).

## Čo treba spraviť

### 1. Vytvoriť `development` branch zo `staging`
```bash
git checkout staging
git checkout -b development
git push -u origin development
```

### 2. Nastaviť lokálny PostgreSQL pre localhost

Blanc Brain používa Supabase čisto ako PostgreSQL host cez Prisma (žiadny Supabase SDK, žiadne edge functions). Pre lokálny vývoj máme 2 možnosti:

**Možnosť A: Lokálny Supabase (rovnako ako Wonderelo)**
- Vytvoriť `supabase/config.toml` s lokálnou konfiguráciou
- Spustiť `supabase start` → lokálny PostgreSQL na porte 54322
- Výhoda: rovnaký workflow ako Wonderelo
- Nevýhoda: potrebuje Docker, trochu overkill keď nepotrebujeme Supabase features

**Možnosť B: Čistý lokálny PostgreSQL (jednoduchšie)** ← ODPORÚČANÉ
- Nainštalovať PostgreSQL cez Homebrew (`brew install postgresql@17`)
- Vytvoriť lokálnu databázu `blanc_brain_dev`
- Výhoda: ľahšie, rýchlejšie, nepotrebuje Docker
- Nevýhoda: mierne odlišný setup od Wonderelo

### 3. Vytvoriť `.env.development.local` (alebo upraviť `.env`)

Pre lokálny PostgreSQL (Možnosť B):
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/blanc_brain_dev"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/blanc_brain_dev"
```

Pre lokálny Supabase (Možnosť A):
```env
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
DIRECT_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
```

### 4. Aplikovať migrácie na lokálnu databázu
```bash
npx prisma migrate deploy
npx tsx scripts/seed-admin.ts
```

### 5. Pridať `dev:local` script do `package.json`
```json
"dev:local": "next dev --port 3001"
```
(Ak Možnosť A: `"dev:local": "supabase start && next dev --port 3001"`)

### 6. Aktualizovať CLAUDE.md

V sekcii Environments zmeniť:

```markdown
| | Localhost | Staging | Production |
|---|---|---|---|
| Frontend URL | `http://localhost:3001` | `https://brainstaging.blancstudio.com` | `https://brain.blancstudio.com` |
| Git branch | `development` | `staging` | `main` |
| Database | **lokálny PostgreSQL** | `iuqaledpjsacxrtddkfq` (DEV) | `eagiouhnsghdsvoojvmv` (PROD) |
```

V sekcii Git workflow zmeniť na:
```
development → staging → main
(localhost)    (preview)   (production)
```

Pridať do sekcie "Local dev workflow":
```markdown
### Lokálna databáza
- Localhost používa lokálny PostgreSQL (nie cloud DEV Supabase)
- Migrácie: `npx prisma migrate deploy`
- Seed: `npx tsx scripts/seed-admin.ts`
- Reset: `npx prisma migrate reset`
```

Odstrániť poznámku "Localhost connects to DEV Supabase by default" a nahradiť za "Localhost connects to local PostgreSQL".

### 7. Aktualizovať Git workflow v CLAUDE.md

Zmeniť workflow na:
1. Feature branch z `development`
2. Merge do `development` → testovanie na localhoste
3. Merge do `staging` → Vercel auto-deploy na brainstaging.blancstudio.com
4. Merge do `main` → Vercel auto-deploy na brain.blancstudio.com

## Overenie

1. Spustiť lokálny PostgreSQL
2. Spustiť `npx prisma migrate deploy` — migrácie sa aplikujú
3. Spustiť `npx tsx scripts/seed-admin.ts` — admin účet sa vytvorí
4. Spustiť `npm run dev` — appka beží na localhost:3001
5. Prihlásiť sa s `admin` / `admin123`
6. Overiť, že dáta sú v lokálnej DB (nie v cloud DEV)
