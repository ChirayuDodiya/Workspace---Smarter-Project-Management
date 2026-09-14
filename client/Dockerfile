# Stage 1: Build the Vite React frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package management files
COPY package*.json ./

# Install all dependencies (needed for compiling TypeScript and building the React app)
RUN npm ci --legacy-peer-deps

# Copy client source code
COPY . .

# Set environment variables for the build
ENV VITE_API_URL=/api/v1
ENV VITE_SOCKET_URL=""

# Build production bundle
RUN npm run build

# Stage 2: Serve static files with Nginx
FROM nginx:1.25-alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
