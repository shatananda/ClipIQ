FROM node:18-slim

RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp binary (not available via apt on slim)
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN rm -f .env .env.* && npm run build

RUN mkdir -p storage/{videos,audio,clips}

EXPOSE 3000
ENV NODE_ENV=production

# Ensure no .env files exist at runtime (use Railway env vars only)
RUN rm -f .env .env.local .env.*.local .env.production.local

CMD ["npm", "start"]
