FROM node:20-bookworm-slim

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies forcing resolution
RUN npm install --force

# Copy application code
COPY . .

# Accept build argument and inject into Next.js compile stage
ARG NEXT_PUBLIC_API_BASE=https://api.miu33archstudio.xyz
ENV NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE

# Build Next.js assets
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]