# Dockerfile for Next.js admin-panel frontend

# --- 1. Dependencies ---
FROM node:18-alpine AS deps
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci

# --- 2. Builder ---
FROM node:18-alpine AS builder
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- 3. Runner ---
FROM node:18-alpine AS runner
WORKDIR /usr/src/app
# No es necesario copiar node_modules, Next.js los empaqueta
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/public ./public
COPY package.json .

EXPOSE 3000
CMD ["npm", "start"]
