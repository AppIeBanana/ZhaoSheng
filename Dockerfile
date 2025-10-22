# Build stage
FROM node:lts-alpine3.22 AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package.json ./
COPY pnpm-lock.yaml ./
RUN npm config set registry https://registry.npmmirror.com && \
    npm install -g pnpm && \
    pnpm config set registry https://registry.npmmirror.com && \
    pnpm install

# Copy project files
COPY . .

# Build the application
RUN pnpm run build

# Production stage
FROM nginx:stable-alpine3.21-perl

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build files from build stage
COPY --from=build /app/dist/static /usr/share/nginx/html

# Expose port
EXPOSE 82 443

# Start nginx server
CMD ["nginx", "-g", "daemon off;"]