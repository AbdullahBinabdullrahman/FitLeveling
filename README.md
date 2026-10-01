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
- Nutrition XP is awarded by claiming completed daily and weekly check-in quests. Logging alone does not automatically collect the reward.
- The calorie estimate uses Mifflin-St Jeor and an activity multiplier, then a configurable goal adjustment. It is a proposal that requires explicit acceptance. It does not automatically calibrate from intake/weight trends yet.

## Companion and quests

The **Hero** screen lets each user name a companion, choose a Vanguard, Ranger, or Mystic appearance, select an energy color, and preview animations. Hunter capes unlock at level 3, orbit halos at level 5, and star crowns at level 10. Character settings are stored in PostgreSQL. Disable animations in Hero or use your device’s reduced-motion preference.

**Quests** includes a daily nutrition check-in, weekly training/nutrition/weight challenges, and lifetime workout achievements. The weekly Iron Colossus raid requires workouts on three different days. Weeks start Monday in the profile timezone (Asia/Riyadh by default). Claiming a completed quest awards XP and coins through the existing ledgers, including level-up coin bonuses. Claims are serialized with workout progression and can only be collected once per applicable period. Recovery days never deduct progress.

Workout logging includes saved-set progress and a configurable rest timer. Completing a mission shows earned XP, coins, personal records, and level-ups.

## Optional AI coach

**Coach** works immediately with a built-in companion using preset guidance and verified game progress. In **AI settings**, select OpenAI, add a personal API key, load available models (or enter a Responses-compatible text model ID), and save. You can also configure `OPENAI_API_KEY` and `OPENAI_MODEL` on the server. Users can remove their personal key and switch back to built-in mode.

Personal keys are encrypted with AES-256-GCM using a key derived from `SESSION_SECRET`; changing that secret requires reconnecting saved keys. Saved keys are never returned to the client. OpenAI requests send chat messages and a game-progress summary, set `store: false`, and have a timeout and per-user cooldown. API usage is billed to the connected API account. Chat history stays in memory for the current Coach screen and is cleared when leaving it. AI suggestions do not modify plans, targets, quests, or balances.

The integration uses the [OpenAI Responses API](https://developers.openai.com/api/docs/guides/text) and discovers model IDs through the [Models API](https://developers.openai.com/api/reference/resources/models/methods/list). Availability and suitability depend on your API account and selected model.
