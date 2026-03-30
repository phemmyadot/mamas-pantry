FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS builder
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/types/package.json ./packages/types/
COPY packages/types/index.ts ./packages/types/
COPY apps/admin/package.json ./apps/admin/
RUN pnpm install --frozen-lockfile
COPY apps/admin ./apps/admin
COPY packages/types ./packages/types
ARG VITE_API_URL=https://mamaspantryapi.babafemicodes.dev
ENV VITE_API_URL=${VITE_API_URL}
WORKDIR /app/apps/admin
RUN node_modules/.bin/vite build

FROM nginx:alpine AS runner
COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"]
