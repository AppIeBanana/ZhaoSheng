# Build stage
# Use specified domain to pull image
FROM node:lts-jod AS build

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

# 允许在构建时传入环境变量
ARG VITE_COZE_AUTH_TOKEN
ARG VITE_COZE_API_URL
ARG VITE_COZE_BOT_ID
ARG VITE_COZE_WORKFLOW_ID
ARG VITE_WECHAT_TOKEN

# 导出为环境变量供构建时使用
ENV VITE_COZE_AUTH_TOKEN=$VITE_COZE_AUTH_TOKEN
ENV VITE_COZE_API_URL=$VITE_COZE_API_URL
ENV VITE_COZE_BOT_ID=$VITE_COZE_BOT_ID
ENV VITE_COZE_WORKFLOW_ID=$VITE_COZE_WORKFLOW_ID
ENV VITE_WECHAT_TOKEN=$VITE_WECHAT_TOKEN

# Build the application
RUN pnpm run build

# Production stage
# Use specified domain to pull image
FROM nginx:stable-perl

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build files from build stage
COPY --from=build /app/dist/static /usr/share/nginx/html

# Expose port
EXPOSE 82 443

# Start nginx server
CMD ["nginx", "-g", "daemon off;"]