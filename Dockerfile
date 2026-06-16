FROM node:18-slim

# Install system dependencies required for video processing
RUN apt-get update && apt-get install -y \
    yt-dlp \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set up app
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Create storage directories for videos, audio, and clips
RUN mkdir -p storage/{videos,audio,clips}

EXPOSE 3000
ENV NODE_ENV=production
CMD ["npm", "start"]
