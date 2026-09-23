FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY server.js ./
COPY public/ ./public/
RUN mkdir -p /app/public/uploads
CMD ["node", "server.js"]
