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

**Coach** works immediately with a built-in companion using preset guidance and verified game progress. In **AI settings**, select OpenAI or Groq, add a personal API key, load available models (or enter a Responses-compatible text model ID), and save. You can also configure `OPENAI_API_KEY` / `OPENAI_MODEL` or `GROQ_API_KEY` / `GROQ_MODEL` on the server. Users can remove their personal key and switch back to built-in mode.

Personal keys are encrypted with AES-256-GCM using a key derived from `SESSION_SECRET`; changing that secret requires reconnecting saved keys. Saved keys are never returned to the client. AI requests send chat messages and a game-progress summary, set `store: false`, and have a timeout and per-user cooldown. API usage is billed to the connected API account. Chat history stays in memory for the current Coach screen and is cleared when leaving it. AI suggestions do not modify plans, targets, quests, or balances.

The integration uses the [OpenAI Responses API](https://developers.openai.com/api/docs/guides/text) and discovers model IDs through the [Models API](https://developers.openai.com/api/reference/resources/models/methods/list). Availability and suitability depend on your API account and selected model.

Provider selection controls both model discovery and chat routing. Groq uses its own API endpoint; Groq keys cannot authenticate with OpenAI. Model discovery tests a draft key without saving it, and saving an AI connection verifies access before replacing existing settings. Groq model IDs retain their namespace, for example `openai/gpt-oss-120b`. See [Groq’s Responses API documentation](https://console.groq.com/docs/responses-api).

## Adaptive coach training workspace

The Coach screen now includes **Adaptive training**:

1. Save a dated check-in with your energy, sleep, goal, recovery notes and exercise/equipment preferences. Saving a check-in updates the profile goal without changing nutrition targets.
2. Add InBody scans using the existing body tracking screen. The coach reads the latest three scans, up to 14 daily updates, your profile, current rotation and recent completed sets when generating a proposal.
3. Connect an OpenAI or Groq model in AI settings, then choose **Generate updated plan**. This saves the daily update and drafts a plan; it does not activate it. Manual editing works without an AI key.
4. Review or edit days, exercises, sets and rep ranges, then choose **Apply reviewed plan**. The server validates the plan and saves new exercise catalog entries and user-owned templates in one transaction. Your personalized rotation replaces the default rotation.
5. Use Plan history to review a previous version and apply it as a new version. Existing sessions retain their original templates and exercise prescriptions. Concurrent stale plan edits are rejected.

Run `npm run db:migrate` against your configured `DATABASE_URL` before using this feature. Migration `0003_naive_susan_delgado.sql` adds `coach_checkins` and `training_versions`. Configure the environment using `.env.example`; no database or API credentials are included in this checkout.

Generating proposals sends your saved fitness records to your selected AI provider. The conversational AI also reads your profile, recent scans/check-ins and latest applied plan. The built-in companion continues to use preset guidance. AI outputs are validated, but still require your review. This is a personal AI coaching workflow; separate human-coach accounts and client assignment are not implemented.

Validation: `npm run typecheck`, `npm test`, and `npm run build`. Database-backed behavior requires a configured PostgreSQL instance and migrations; AI generation additionally requires a supported model and key.

## Community and cosmetic collection

Migration `0004_majestic_gravity.sql` adds community profiles, weekly cheers, permanent cosmetic inventory, and character skin/aura slots. Apply this migration before deploying this release; older databases need `0000`–`0003` first.

- **Community:** members opt in with a public alias. The board shares their hero, level and capped weekly habit totals with authenticated users. It excludes email, body measurements, scan attachments and coach notes. Leaving removes the profile from standings. Scores are based on self-reported app logs, not verified athletic performance.
- **Scoring:** 100 points per distinct training day, 20 per nutrition logging day, and 20 per coach check-in day; each category counts at most three days (420 points maximum). Everyone uses Monday-to-Monday weeks in `Asia/Riyadh`. Future-dated check-ins and nutrition logs do not count. Ties share a rank. The top 50 members are shown, and your own standing remains available below the cutoff.
- **Shared mission:** weekly guild progress adds members’ scores against a target of `max(420, members × 200)`. This is a cooperative progress display, with no extra XP/coin payout. Target changes with membership.
- **Cheers:** members can cheer each other once per week. Cheers do not award score or currency. This first community release has no public posts or direct messages.
- **Collection:** five skins and two auras are defined in `src/lib/community.ts`. Prices range from 120 to 600 coins. SVG character art shows each skin’s plating details and aura. Purchased items stay in inventory permanently, and skin/aura slots can be equipped separately.
- **Purchases:** prices are server-defined; each purchase locks the same profile row used by other coin writes. Ownership and the debit ledger entry are recorded in one transaction. Retrying an owned purchase does not spend coins twice. Both equip routes enforce ownership. Skins give no scoring advantage.

Manual acceptance checks after migrating: opt in using an alias, verify your real weekly score and shared rank, cheer a second member twice and confirm one cheer, buy an affordable item and retry the purchase to confirm one debit, equip skin and aura together, update the hero’s name without losing cosmetics, then leave the community and confirm the profile disappears. Tests cover scoring caps, recovery check-ins, league thresholds and catalog integrity; live multi-account database/purchase testing is still required.
