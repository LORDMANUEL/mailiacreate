FROM node:20-alpine
WORKDIR /app
COPY services/synthetic-exporter/package.json ./package.json
COPY services/synthetic-exporter/src ./src
COPY scripts/synthetic-checks.sh ./synthetic-checks.sh
RUN apk add --no-cache bash curl jq netcat-openbsd openssl && \
    chmod +x /app/synthetic-checks.sh && \
    addgroup -S exporter && adduser -S exporter -G exporter
USER exporter
ENV NODE_ENV=production
ENV SYNTHETIC_INTERVAL_SECONDS=300
EXPOSE 8090
CMD ["node", "src/index.js"]
