# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Copy package.json และ install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code ทั้งหมด
COPY . .


# สร้างไฟล์ .env.production (ใช้ ARG เพื่อรับค่าจาก docker-compose build arg)
ARG VITE_API_BASE_URL
ARG VITE_WS_BASE_URL
ARG VITE_WS_RECONNECT_INTERVAL
ARG VITE_WS_MAX_RECONNECT_ATTEMPTS
ARG VITE_WS_PING_INTERVAL

# สร้างไฟล์ .env.production ด้วยค่า ARG
RUN echo "VITE_API_BASE_URL=${VITE_API_BASE_URL}" > .env.production && \
    echo "VITE_WS_BASE_URL=${VITE_WS_BASE_URL}" >> .env.production && \
    echo "VITE_WS_RECONNECT_INTERVAL=${VITE_WS_RECONNECT_INTERVAL}" >> .env.production && \
    echo "VITE_WS_MAX_RECONNECT_ATTEMPTS=${VITE_WS_MAX_RECONNECT_ATTEMPTS}" >> .env.production && \
    echo "VITE_WS_PING_INTERVAL=${VITE_WS_PING_INTERVAL}" >> .env.production

# Build project
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# สร้าง nginx config แบบง่าย
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # Enable gzip compression \
    gzip on; \
    gzip_vary on; \
    gzip_min_length 10240; \
    gzip_proxied expired no-cache no-store private auth; \
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript; \
    gzip_disable "MSIE [1-6]\."; \
}' > /etc/nginx/conf.d/default.conf

# สร้างไฟล์ health-check เพื่อใช้กับ healthcheck
RUN echo "OK" > /usr/share/nginx/html/health

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]