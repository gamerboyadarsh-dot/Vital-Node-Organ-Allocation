# Multi-stage Dockerfile for VitalNode Fullstack Deployment
# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Production Server
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy backend package and install production dependencies
WORKDIR /app/backend
COPY backend/package*.json ./
COPY backend/prisma ./prisma
RUN npm ci --only=production
RUN npx prisma generate

# Copy backend source code
COPY backend/ ./

# Copy built frontend assets from stage 1
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Expose server port
EXPOSE 3001

# Start VitalNode backend (serves API, WebSockets, and React SPA)
CMD ["node", "server.js"]
