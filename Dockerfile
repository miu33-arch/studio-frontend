FROM node:20-bullseye-slim

WORKDIR /app

# Install build tools needed for native Node module compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency manifests
COPY package*.json ./

# Install dependencies forcing resolution
RUN npm install --force

# Copy application code
COPY . .

# Build Next.js assets
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]