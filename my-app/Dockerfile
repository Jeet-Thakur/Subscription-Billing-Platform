FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

FROM node:24-alpine

WORKDIR /app

ENV NODE_ENV=production

RUN npm install -g serve@14

COPY --from=builder /app/dist ./dist

EXPOSE 8080

# Cloud Run sets $PORT dynamically; serve reads it here.
CMD ["sh", "-c", "serve -s dist -l ${PORT:-8080}"]
