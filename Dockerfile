FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps --ignore-scripts --no-audit --no-fund
COPY index.html styles.css vite.config.ts tsconfig.json server.ts ./
COPY src ./src
COPY shared ./shared
COPY public ./public
RUN npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production PORT=8080
COPY --from=build /app/dist ./dist
COPY infra/staticServer.mjs ./infra/staticServer.mjs
USER node
EXPOSE 8080
CMD ["node", "infra/staticServer.mjs"]
