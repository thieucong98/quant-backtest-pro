# ===================================================
# Stage 1: Build Frontend Client (Vite + React 18)
# ===================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app

COPY package*.json ./
RUN npm ci || npm install

COPY . .
RUN npm run build

# ===================================================
# Stage 2: Build Backend Server (Express + Prisma)
# ===================================================
FROM node:20-alpine AS server-builder
WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci || npm install

COPY server/ ./
RUN npx prisma generate
RUN npm run build

# ===================================================
# Stage 3: Production Runtime
# ===================================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV STATIC_PATH=/app/dist
ENV DATABASE_URL=file:./data/dev.db

# Install openssl and wget for Alpine Prisma SQLite & Healthcheck
RUN apk add --no-cache openssl wget

# Copy Frontend Build Output
COPY --from=frontend-builder /app/dist /app/dist

# Copy Server Dependencies & Build Output
COPY --from=server-builder /app/server/node_modules /app/server/node_modules
COPY --from=server-builder /app/server/dist /app/server/dist
COPY --from=server-builder /app/server/prisma /app/server/prisma
COPY --from=server-builder /app/server/package.json /app/server/package.json
COPY --from=server-builder /app/server/package-lock.json /app/server/package-lock.json

# Ensure data directory exists for SQLite database storage
RUN mkdir -p /app/server/prisma/data

EXPOSE 3001

WORKDIR /app/server

CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/index.js"]

