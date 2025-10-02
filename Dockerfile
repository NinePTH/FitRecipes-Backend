# Base stage
FROM oven/bun:1 AS base

# Install OpenSSL for Prisma
RUN apt-get update -y && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencies stage
FROM base AS deps

COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# Build stage
FROM base AS build

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN bun run db:generate

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1 AS production

# Install OpenSSL in production image too
RUN apt-get update -y && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built application
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY package.json ./

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Create non-root user (but don't switch yet, entrypoint needs db access)
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 appuser --gid 1001 && \
    chown -R appuser:appgroup /app

EXPOSE 3000

ENV NODE_ENV=production

# Switch to non-root user
USER appuser

ENTRYPOINT ["./docker-entrypoint.sh"]