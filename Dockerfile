# syntax=docker/dockerfile:1.24@sha256:87999aa3d42bdc6bea60565083ee17e86d1f3339802f543c0d03998580f9cb89

FROM oven/bun:1.3.14-slim@sha256:d56a2534ffd262e92c12fd3249d3924d296d97086da773f821d7d0477435ea04 AS build

WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update \
  && apt-get -y --no-install-recommends install ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json tsconfig.json next.config.ts bun.lock ./
RUN bun install

COPY src ./src

RUN bun run build \
  && rm -rf .next/cache

FROM oven/bun:1.3.14-slim@sha256:d56a2534ffd262e92c12fd3249d3924d296d97086da773f821d7d0477435ea04

WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update \
  && apt-get -y --no-install-recommends install ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/src ./src

CMD ["bun", "run", "start"]
