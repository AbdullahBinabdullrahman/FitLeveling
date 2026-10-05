# FitLeveling mobile

React Native with Expo Router, sharing the website's Next.js APIs and Postgres data. Native screens include workouts and saved sets, coach chat with reviewed plan/goal/nutrition actions, equipment shop and animated hero, friends and requests, direct chat, closed guild applications and owner approvals, habits, fitness profile/InBody, nutrition, progress, and account settings.

## Run

Deploy the accompanying backend and apply migrations through 0010 before pointing this app at production. Existing website deployments do not have the new mobile authentication endpoint.

```
cd mobile
cp .env.example .env.local
npm ci
npm start
```

Set `EXPO_PUBLIC_API_URL` to the backend origin (a physical phone cannot reach your computer through `localhost`). Email/password uses existing FitLeveling accounts. Tokens are stored with SecureStore on devices; the web preview uses session storage. Mobile sessions expire after seven days.

For Google/Apple, configure the providers in Supabase, supply the project URL and publishable/anon key in both backend and mobile environments, and allow `fitleveling://auth/callback` and your site's `/auth/callback`. Never put the database password or service-role key in the mobile environment. The bridge verifies the Supabase token on the server. Existing accounts must be linked with their existing password; matching emails never merge accounts automatically.

## Devices and publishing

Create/link an EAS project and set `EXPO_PUBLIC_EAS_PROJECT_ID`. Confirm the final bundle identifiers in `app.config.ts`. Use an Expo development build for native OAuth and push testing. Configure APNs and Android FCM credentials before enabling push. Users opt into local reminders and social notifications in Settings. Haptics and hero animation can be disabled; reduced-motion settings are respected.

```
npx eas-cli login
npx eas-cli build --profile development --platform ios
npx eas-cli build --profile development --platform android
npx eas-cli build --profile production --platform all
npx eas-cli submit --platform ios
npx eas-cli submit --platform android
```

EAS Update is configured conditionally by the project ID; updates must match the app-version runtime. TestFlight requires Apple Developer membership. Store submission also needs signing credentials, store listings, privacy disclosures, review login, and Google Play developer access. No store build or submission has been performed here.

## Economy and exercise evidence

Migration 0010 initializes a fixed 10,000,000-coin bank after subtracting all existing player balances. Rewards transfer coins from this bank; purchases return them. Exhaustion caps coin rewards rather than creating more coins. Existing XP and inventory remain intact. Workout XP/coins are awarded once per local calendar day; extra sessions still save. This is an in-game economy with no blockchain, withdrawals, or item trading.

Workout logs remain explicitly self-reported. HealthKit/Health Connect, wearable evidence, device attestation, and server validation have not been implemented. Logging sets and elapsed time alone do not prove a workout happened. Do not label these sessions verified. A device-evidence feature needs separate native permission handling and real-device tests across exercise types before reward policies can rely on it.

## Checks and remaining release work

Run `npm run typecheck`, `npm run lint`, and `npm run export`. Exports validate JavaScript bundles for iOS, Android, and web; they do not validate native compilation or on-device behavior. OAuth and push remain configuration-dependent and require device testing. Push sending is best-effort; this implementation does not poll Expo receipts or use a durable delivery outbox.

Dependency audit currently reports upstream Expo toolchain advisories involving braces, node-forge, decode-uri-component, and uuid. Do not force incompatible Expo/native package upgrades. Recheck SDK-compatible fixes before a production store release.

## Interactive demo

Run `npm run demo` for a browser preview with sample data and no sign-in. `npm run demo:export` creates `dist-demo/` for local static preview; serve it with SPA fallback for direct routes. The banner identifies the demo and offers Reset demo. Demo state stays in memory and resets on refresh. Purchases, equipping, workout sets, coach suggestions, requests, chat replies, guild approvals and habits affect only this sample state. The demo API never calls the backend. External OAuth/provider connections and device notifications are not simulated. Keep `EXPO_PUBLIC_DEMO` unset for normal app builds.
