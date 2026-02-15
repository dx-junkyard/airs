# =============================================================================
# Stage 1: Dependencies
# =============================================================================
FROM node:24.12.0-slim AS deps

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

RUN pnpm install --frozen-lockfile

# =============================================================================
# Stage 2: Builder
# =============================================================================
FROM node:24.12.0-slim AS builder

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma クライアント生成
RUN pnpm run db:generate

# ビルド引数
ARG NEXT_PUBLIC_ADMIN_MODE=0
ARG NEXT_PUBLIC_DEMO_MODE=0

# クライアント参照される環境変数は明示的にビルド時ENVへ渡す
ENV NEXT_PUBLIC_ADMIN_MODE=${NEXT_PUBLIC_ADMIN_MODE}
ENV NEXT_PUBLIC_DEMO_MODE=${NEXT_PUBLIC_DEMO_MODE}

# ビルド時ダミー DATABASE_URL（静的ページ生成で Prisma 初期化に必要）
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Vertex AI（ビルド時のページデータ収集で createVertex() 初期化に必要）
ENV GOOGLE_VERTEX_PROJECT="dummy-project"
ENV GOOGLE_VERTEX_LOCATION="global"

# Next.js ビルド
RUN pnpm run build

# =============================================================================
# Stage 3: Runner
# =============================================================================
FROM node:24.12.0-slim AS runner

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# standalone 出力をコピー
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
