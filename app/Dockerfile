FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=base /app ./
EXPOSE 3000
CMD ["sh", "-c", "npx prisma db push --skip-generate --accept-data-loss && npm run start"]
