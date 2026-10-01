# LevelUp Fitness

Personal workout RPG PWA backed by Supabase PostgreSQL, Drizzle, and Next.js. It includes private account registration, Push/Pull/Legs logging, previous performance, PR detection, XP and Coin ledgers, reward redemption, weight and nutrition check-ins, manual InBody data, and reviewable calorie/protein proposals.

## Configure

1. Copy `.env.example` to `.env` and fill `DATABASE_URL` with your Supabase **transaction pooler** URL. URL-encode special characters in the password. Keep the file private; it is ignored by git.
2. Set `SESSION_SECRET` to at least 32 random characters and choose a private `REGISTRATION_CODE` for first account creation.
3. In Supabase, use a database user allowed to create tables. Drizzle uses `prepare: false` for transaction pooling.
4. To attach InBody reports, create a **private** Supabase Storage bucket named `inbody-private`. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in server-only `.env`. Never prefix the service key with `NEXT_PUBLIC_`. Manual scan entry works without Storage configuration.

## Run with Docker

```bash
docker compose up -d --build
```

The `migrate` service applies committed SQL migrations and seeds the workouts/rewards before the web service starts. Open `http://localhost:3000` and sign in with your seeded account, or create an account using `REGISTRATION_CODE`. Supabase is the database; Docker does not create a local PostgreSQL instance.

## Local development

```bash
npm ci
set -a; source .env; set +a
npm run db:migrate
npm run db:seed
npm run dev
```

To seed an initial account, set `SEED_USER_EMAIL`, `SEED_USER_NAME`, and `SEED_USER_PASSWORD` (at least 10 characters) in `.env` before running `npm run db:seed`. The seed creates the user and profile together and preserves existing accounts and passwords on subsequent runs. Leave the email and password unset to seed only workouts and rewards.

The seed is safe to run again. Do not commit `.env` or expose the database password in client variables.

## Verification

```bash
npm run typecheck
npm test
npm run build
```

## Current limits

- InBody values must be confirmed manually. A photo/PDF can be stored privately when Supabase Storage is configured; OCR extraction is not implemented yet.
- The PWA has an offline shell, but workout set writes require a connection. Avoid assuming a set was saved until the UI confirms it.
- Nutrition entries do not currently award XP. Weekly mission bonuses and achievement definitions remain to be implemented.
- The calorie estimate uses Mifflin-St Jeor and an activity multiplier, then a configurable goal adjustment. It is a proposal that requires explicit acceptance. It does not automatically calibrate from intake/weight trends yet.
