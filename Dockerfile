# Stage 1: Build frontend
FROM node:20-alpine AS frontend
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Production server
FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ ./
COPY --from=frontend /app/client/dist ./public
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production
CMD ["node", "src/index.js"]