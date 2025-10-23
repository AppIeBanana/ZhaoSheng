# Build stage
# 使用指定域名拉取镜像
FROM i0qlp8mg3an5h2.xuanyuan.run/library/node:lts-jod AS build
# 或者使用阿里云镜像源（注释掉上面一行，取消下面一行注释）
# FROM node.registry.cn-hangzhou.aliyuncs.com/library/node:25-alpine3.21 AS build
# 或者使用官方镜像源（注释掉上面一行，取消下面一行注释）
# FROM node:25-alpine3.21 AS build

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
# 使用指定域名拉取镜像
FROM i0qlp8mg3an5h2.xuanyuan.run/library/nginx:stable-perl
# 或者使用阿里云镜像源（注释掉上面一行，取消下面一行注释）
# FROM nginx.registry.cn-hangzhou.aliyuncs.com/library/nginx:stable-alpine3.21-perl
# 或者使用官方镜像源（注释掉上面一行，取消下面一行注释）
# FROM nginx:stable-alpine3.21-perl

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build files from build stage
COPY --from=build /app/dist/static /usr/share/nginx/html

# Expose port
EXPOSE 82 443

# Start nginx server
CMD ["nginx", "-g", "daemon off;"]