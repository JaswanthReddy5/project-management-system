# Build from the monorepo root, e.g.:
#   docker build -f apps/web/Dockerfile -t pms-web --build-arg NEXT_PUBLIC_API_URL=https://api.example.com/api .
# (Vercel is the recommended deployment path for the web app; this Dockerfile is provided
# as a bonus for self-hosting scenarios.)

FROM node:20-alpine AS build
WORKDIR /repo
COPY pnpm-workspace.yaml package.json ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
RUN npm install -g pnpm@9.15.0 && pnpm install --filter @pms/web... --frozen-lockfile=false
WORKDIR /repo/apps/web
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /repo/apps/web/.next ./.next
COPY --from=build /repo/apps/web/public ./public
COPY --from=build /repo/apps/web/node_modules ./node_modules
COPY --from=build /repo/apps/web/package.json ./package.json
COPY --from=build /repo/apps/web/next.config.js ./next.config.js

EXPOSE 3000
CMD ["npm", "run", "start"]
