# ---------- base ----------
FROM node:22-slim AS base
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# ---------- dependencies ----------
FROM base AS deps
# Toolchain for native modules (better-sqlite3) when no prebuilt binary
# matches the platform.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --no-audit --fund=false \
  && npm rebuild better-sqlite3 sharp

# ---------- build ----------
FROM deps AS build
COPY . .
RUN npm run build

# ---------- runtime ----------
FROM base AS runtime
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8000 \
    DATABASE_PATH=/data/app.db \
    UPLOAD_DIR=/data/uploads

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build /app/drizzle ./drizzle
COPY package.json ./

RUN mkdir -p /data/uploads
VOLUME ["/data"]

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://localhost:8000/resources/up || exit 1

CMD ["npm", "run", "start"]
