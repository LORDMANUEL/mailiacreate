FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production --ignore-scripts || true
COPY src ./src
ENV PORT=4100
EXPOSE 4100
CMD ["npm", "start"]
