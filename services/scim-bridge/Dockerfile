FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY src ./src
RUN addgroup -S scim && adduser -S scim -G scim
USER scim
ENV NODE_ENV=production
EXPOSE 8089
CMD ["node", "src/index.js"]
