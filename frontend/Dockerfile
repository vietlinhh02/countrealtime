# syntax=docker/dockerfile:1.7
# Cache intentionally disabled for this image. We force a fresh install and
# fresh build on every container build to guarantee no stale artefacts ship.

FROM node:22-slim AS base
ENV CI=true \
    HUSKY=0 \
    NEXT_TELEMETRY_DISABLED=1 \
    PNPM_HOME=/usr/local/share/pnpm \
    PNPM_STORE_DIR=/tmp/.pnpm-store-empty
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
# Copy manifests first so the dependency layer can be invalidated by a
# package.json change.
COPY package.json pnpm-lock.yaml ./
# Disable the global pnpm store for this stage so nothing is reused.
RUN rm -rf /tmp/.pnpm-store-empty /root/.local/share/pnpm/store \
    && pnpm install --frozen-lockfile --ignore-scripts --no-frozen-lockfile=false

FROM base AS builder
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Wipe any previous build artefacts that may have been mounted in.
RUN rm -rf .next .swc out
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
# Wipe any pre-baked framework caches that may have been copied in.
RUN rm -rf .next/cache .swc /tmp/.pnpm-store-empty
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
