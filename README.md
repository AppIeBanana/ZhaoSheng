# 福软AI招生智能问答系统

## 项目简介

这是一款专为福州软件职业技术学院开发的AI招生智能问答系统，旨在为考生提供个性化的招生咨询服务。系统通过收集考生基本信息（考试类型、考生类型、生源省份、民族、分数等），结合Coze大语言模型，为考生提供精准的招生政策、校园生活、奖助政策等方面的智能问答服务。

## 功能特性

- **考生信息收集**：通过友好的表单界面，收集考生关键信息
- **智能问答**：基于收集的考生信息，提供个性化的AI问答服务
- **问题分类导航**：涵盖招生政策、新生报到、志愿填报、校园生活、奖助政策、升学就业、新高考等八大分类
- **推荐问题库**：提供丰富的预设问题，方便考生快速获取所需信息
- **响应式设计**：适配各种设备尺寸，确保良好的用户体验
- **Docker容器化部署**：支持快速、可靠的部署和扩展

## 技术栈

### 前端技术
- **React 18**：构建用户界面的JavaScript库
- **TypeScript**：提供静态类型检查
- **Tailwind CSS**：实用优先的CSS框架
- **Vite**：快速的构建工具
- **React Router**：处理客户端路由
- **Framer Motion**：动画效果
- **Sonner**：通知组件
- **Recharts**：数据可视化（预留集成）
- **Zod**：数据验证

### 部署与运维
- **Docker**：容器化平台
- **Nginx**：高性能Web服务器
- **HTTPS配置**：支持安全访问

### 第三方API
- **Coze API**：提供大语言模型能力

## 项目结构

```
├── .dockerignore              # Docker忽略文件配置
├── .gitignore                 # Git忽略文件配置
├── Dockerfile                 # Docker构建文件
├── README.md                  # 项目说明文档
├── docker-compose.yml         # Docker Compose配置
├── index.html                 # HTML入口文件
├── nginx.conf                 # Nginx配置文件
├── package.json               # 项目依赖配置
├── pnpm-lock.yaml             # 依赖锁定文件
├── postcss.config.js          # PostCSS配置
├── src                        # 源代码目录
│   ├── App.tsx                # 应用入口组件
│   ├── components             # 公共组件
│   │   └── Empty.tsx          # 空状态组件
│   ├── contexts               # React上下文
│   │   ├── authContext.ts     # 认证上下文（已弃用）
│   │   └── studentContext.tsx # 学生信息上下文
│   ├── hooks                  # 自定义Hooks
│   │   └── useTheme.ts        # 主题切换Hook
│   ├── index.css              # 全局样式
│   ├── lib                    # 工具库
│   │   ├── api.ts             # API调用封装
│   │   └── utils.ts           # 通用工具函数
│   ├── main.tsx               # 应用入口文件
│   ├── pages                  # 页面组件
│   │   ├── Home.tsx           # 首页（重定向）
│   │   ├── InfoCollection.tsx # 信息收集页面
│   │   └── QAPage.tsx         # 问答页面
│   └── vite-env.d.ts          # Vite环境声明
├── tailwind.config.js         # Tailwind配置
├── tsconfig.json              # TypeScript配置
└── vite.config.ts             # Vite配置
```

## 快速开始

### 前置条件

- Node.js 20+
- pnpm 9+
- Docker（用于容器化部署）

### 本地开发

1. **克隆项目**

```bash
git clone [项目仓库地址]
cd [项目目录]
```

2. **安装依赖**

```bash
pnpm install
```

3. **启动开发服务器**

```bash
pnpm dev
```

应用将在 `http://localhost:3303` 启动。

4. **构建生产版本**

```bash
pnpm build
```

构建后的文件将生成在 `dist/static` 目录。

## Docker部署

### 使用Docker Compose部署

1. **确保已安装Docker和Docker Compose**

2. **配置SSL证书**

将您的SSL证书文件放置在项目根目录的 `ssl` 文件夹中，并确保Nginx配置文件中的证书路径正确。

当前配置使用的证书路径为：
```
/etc/letsencrypt/live/zswd.fzrjxy.com/fullchain.pem
/etc/letsencrypt/live/zswd.fzrjxy.com/privkey.pem
```

如果您的证书路径不同，请修改 `nginx.conf` 文件中的相关配置。

3. **启动服务**

```bash
docker-compose up -d --build
```

服务将启动并监听80和443端口。HTTP请求将自动重定向到HTTPS。

4. **访问系统**

通过浏览器访问 `https://zswd.fzrjxy.com` 即可使用系统。

## 环境配置

### Nginx配置

项目使用Nginx作为Web服务器，主要配置包括：

- HTTP 82端口重定向到HTTPS
- HTTPS 443端口配置SSL证书
- Gzip压缩配置
- 静态资源缓存策略
- 安全头信息设置

详细配置请查看项目根目录下的 `nginx.conf` 文件。

### 环境变量配置

为了提高安全性，敏感信息如API密钥、Token等已移至环境变量管理。项目提供了 `.env.example` 模板文件，您可以基于此创建自己的环境配置。

### 配置步骤

1. 复制环境变量模板文件
```bash
cp .env.example .env
```

2. 根据您的实际情况修改 `.env` 文件中的配置值

3. **重要**：确保 `.env` 文件不被提交到版本控制系统（已在 `.gitignore` 中配置）

### 主要环境变量说明

- **微信相关**：
  - `WECHAT_TOKEN`：微信服务器验证Token
  - `WECHAT_APPID`：微信应用ID
  - `WECHAT_APPSECRET`：微信应用密钥
  - `WECHAT_REDIRECT_URI`：微信授权回调地址

- **Coze API相关**：
  - `COZE_AUTH_TOKEN`：Coze API授权令牌
  - `COZE_API_URL`：Coze API接口地址
  - `COZE_BOT_ID`：机器人ID
  - `COZE_WORKFLOW_ID`：工作流ID

- **服务器相关**：
  - `NODE_ENV`：运行环境（development/production）
  - `PORT`：服务端口
  - `SSL_CERT_PATH`：SSL证书路径
  - `SSL_KEY_PATH`：SSL私钥路径

### 开发环境配置

在开发环境中，系统会使用默认值作为备选，确保开发工作顺利进行。但在生产环境中，建议配置所有必要的环境变量。

### 代码中的配置读取

所有配置通过 `src/lib/config.ts` 统一管理，使用以下模式从环境变量读取：

```typescript
const CONFIG_VALUE = process.env.ENV_VARIABLE_NAME || 'default_value';
```

如果需要更换API密钥或调整其他配置，请修改该文件。

## 开发指南

### 代码规范

- 组件使用TypeScript编写，文件名使用 `.tsx` 扩展名
- 遵循React最佳实践，组件拆分合理，关注点分离
- 使用Tailwind CSS进行样式设计，避免使用内联样式
- 使用 `clsx` 和 `tailwind-merge` 组合类名，提高复用性

### 路由结构

项目使用React Router进行路由管理，当前路由结构如下：

- `/`：信息收集页面
- `/qa`：问答页面

路由配置位于 `src/App.tsx` 文件中。

### 组件说明

1. **InfoCollection**：考生信息收集表单，包含考试类型、考生类型、生源省份、民族和分数等字段
2. **QAPage**：智能问答页面，展示AI对话内容，并提供问题分类和推荐问题功能
3. **StudentProvider**：React上下文提供者，用于在组件间共享学生信息

## API集成

系统通过Coze API实现智能问答功能，配置已移至环境变量管理。详细实现请参考 `src/lib/api.ts` 文件中的 `sendMessageToAPIStream` 函数。

### API调用流程

1. 应用从环境变量读取Coze API配置
2. 前端组件通过 `sendMessageToAPIStream` 函数发送消息
3. 系统接收流式响应并实时更新UI
4. 支持根据学生信息（考试类型、省份、分数等）提供个性化回答

## 注意事项

1. **数据安全**：系统仅在内存中存储考生信息，不会持久化到服务器
2. **API使用**：系统使用的Coze API令牌需要定期更新以确保服务正常运行
3. **SSL证书**：部署时请确保SSL证书有效且路径配置正确
4. **Nginx配置**：HTTP端口已修改为82，请确保服务器安全组和防火墙已开放相应端口
5. **响应式设计**：系统针对不同设备进行了优化，但在小屏幕设备上可能需要调整布局以获得最佳体验

## 技术支持

如有任何问题或建议，请联系福州软件职业技术学院智慧校园规划与建设处。

© 2025 福州软件职业技术学院 版权所有


   