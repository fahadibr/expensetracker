# ─── Stage 1: Build React frontend ───
FROM node:20-alpine AS client-build

WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

# ─── Stage 2: Production server ───
FROM node:20-alpine

WORKDIR /app

# Copy server files
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

COPY server/prisma ./server/prisma/
RUN cd server && npx prisma generate

COPY server/src ./server/src/

# Copy built frontend
COPY --from=client-build /app/client/dist ./client/dist/

# Expose port (Render sets PORT env var automatically)
EXPOSE 3000

# Start: run migrations then start server
CMD ["sh", "-c", "cd server && npx prisma migrate deploy && node src/index.js"]
