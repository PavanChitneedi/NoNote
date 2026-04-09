FROM node:22-alpine AS base
RUN apk add --no-cache curl dumb-init
WORKDIR /app

FROM base AS deps
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY package.json ./

RUN addgroup -g 1001 -S nodejs && \
    adduser  -S nodemap -u 1001 -G nodejs && \
    chown -R nodemap:nodejs /app

USER nodemap
EXPOSE 3001
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]
