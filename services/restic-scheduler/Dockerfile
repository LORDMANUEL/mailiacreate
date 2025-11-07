# syntax=docker/dockerfile:1.7

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY src ./src
COPY state ./state
ENV PORT=8000
EXPOSE 8000
CMD ["npm", "run", "start"]
