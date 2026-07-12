# syntax=docker/dockerfile:1.25@sha256:0adf442eae370b6087e08edc7c50b552d80ddf261576f4ebd6421006b2461f12

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
COPY .agents ./.agents

CMD ["bun", "run", "start"]
