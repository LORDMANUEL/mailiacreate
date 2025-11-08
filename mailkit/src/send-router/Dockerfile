# Dockerfile for Send-Router service

# --- 1. Dependencies ---
FROM node:18-alpine AS deps
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- 2. Runner ---
FROM node:18-alpine AS runner
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .

EXPOSE 3000
CMD [ "node", "index.js" ]
