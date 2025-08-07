FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install
FROM node:20-alpine
WORKDIR /
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
ENTRYPOINT ["node", "dist/main"]
