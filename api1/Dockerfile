FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npx tsc -p tsconfig.json
RUN npm prune --omit=dev
EXPOSE 8787
CMD ["node", "dist/server.js"]
