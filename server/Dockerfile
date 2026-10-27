FROM node:22-alpine

# Install system dependencies needed for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package management files and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Expose backend server port
EXPOSE 5000

ENV NODE_ENV=production

# Start command
CMD ["node", "dist/index.js"]
