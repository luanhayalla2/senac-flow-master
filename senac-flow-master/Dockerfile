# Dockerfile for SENAC Flow app
# -------------------------------------------------
# Builder stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies (use npm with legacy peer deps to match project)
COPY package.json .
COPY bun.lock .
RUN npm ci --legacy-peer-deps

# Copy source code and build
COPY . .
RUN npm run build

# Production stage - serve static files with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
