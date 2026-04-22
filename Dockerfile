FROM node:22-slim

WORKDIR /app

# Install Chromium deps
RUN apt-get update && apt-get install -y chromium libnspr4 libnss3 libatk-bridge2.0-0 libatk1.0-0 libcups2 libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libgtk-3-0 libasound2 fonts-liberation xdg-utils --no-install-recommends && rm -rf /var/lib/apt/lists/*

COPY . .

RUN npm install

RUN useradd -m nodeuser

RUN chown -R nodeuser /app

USER nodeuser


CMD ["npm", "run", "build"]