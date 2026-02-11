FROM node:20-alpine AS base

# Stage 1: Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
COPY web-ui/package.json ./web-ui/
RUN npm ci

# Stage 2: Build the Next.js app
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/web-ui/node_modules ./web-ui/node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build --workspace=web-ui

# Stage 3: Production runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone server
COPY --from=builder /app/web-ui/.next/standalone ./
# Ensure root package.json is present (Railway runs npm start)
COPY --from=builder /app/package.json ./package.json
# Copy static assets
COPY --from=builder /app/web-ui/.next/static ./web-ui/.next/static
# Copy public assets
COPY --from=builder /app/web-ui/public ./web-ui/public
# Copy plugins directory (agents, commands, hooks read from filesystem at runtime)
COPY --from=builder /app/plugins ./plugins

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "web-ui/server.js"]
