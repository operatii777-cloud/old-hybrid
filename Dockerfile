# ============================================================
# Stage 1 — Build the React/Vite frontend
# ============================================================
FROM node:20-alpine AS frontend-build

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build

# ============================================================
# Stage 2 — Production server
# ============================================================
FROM node:20-alpine AS production

WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps --omit=dev

# Copy backend source
COPY backend/ ./backend/
COPY packages/ ./packages/

# Copy built frontend assets
COPY --from=frontend-build /app/dist ./dist

# Create data and logs directories
RUN mkdir -p data logs

# Environment defaults (override at runtime)
ENV NODE_ENV=production \
    PORT=3001 \
    SQLITE_PATH=./data/restaurant.db \
    FRONTEND_BUILD=dist \
    LOG_LEVEL=info

EXPOSE 3001

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

CMD ["node", "backend/server.js"]
