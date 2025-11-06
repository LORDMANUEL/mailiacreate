# Dockerfile for Mock API service

FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 3001

CMD [ "node", "index.js" ]
