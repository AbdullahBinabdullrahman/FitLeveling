FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci
FROM deps AS migration
COPY drizzle.config.ts ./
COPY drizzle ./drizzle
COPY src/db ./src/db
CMD ["sh", "-c", "npm run db:migrate && npm run db:seed"]
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
RUN npm run build
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
USER app
EXPOSE 3000
CMD ["node","server.js"]
