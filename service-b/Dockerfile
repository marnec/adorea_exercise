FROM node:18-bullseye-slim AS development
WORKDIR /app
RUN apt-get update && apt-get install -y openssl libssl1.1 procps curl
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm install -g prisma
RUN npm install -g @nestjs/cli
RUN npx prisma generate
EXPOSE 3000
CMD ["sh", "-c", "npm install && npm run start:dev"]

FROM node:18-bullseye-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:18-bullseye-slim AS production
WORKDIR /app
RUN apt-get update && apt-get install -y openssl libssl1.1 procps curl
COPY package.json package-lock.json* ./
RUN npm install --only=production
COPY prisma ./prisma
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
RUN npm install -g prisma
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]