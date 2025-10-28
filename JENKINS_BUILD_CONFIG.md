# Jenkins 构建配置说明

本文档说明如何在 Jenkins 中配置和构建本项目。

## 构建参数

Jenkins 任务支持以下构建参数：

### 基本参数

- **DEPLOY_TO_PROD** (布尔): 是否部署到生产环境，默认值: `true`
- **BRANCH** (选择): 选择要构建的分支，可选值: `main`, `develop`

### 环境变量参数

这些参数会在构建时作为 Docker 构建参数传递，用于配置前端应用：

- **VITE_COZE_AUTH_TOKEN**: Coze API 认证令牌
- **VITE_COZE_API_URL**: Coze API 地址，默认值: `https://api.coze.cn/v3/chat`
- **VITE_COZE_BOT_ID**: Coze Bot ID
- **VITE_COZE_WORKFLOW_ID**: Coze Workflow ID
- **VITE_WECHAT_TOKEN**: 微信 Token

## 如何使用

### 方式一：通过 Jenkins UI 手动触发

1. 登录 Jenkins 管理界面
2. 找到对应的任务（通常名为 `zhaosheng-web`）
3. 点击"使用参数构建"（Build with Parameters）
4. 填写或修改以下参数：
   - 选择分支（BRANCH）
   - 填写 Coze API 配置（VITE_COZE_*）
   - 填写微信 Token（VITE_WECHAT_TOKEN）
   - 选择是否部署到生产环境（DEPLOY_TO_PROD）
5. 点击"构建"按钮

### 方式二：通过 HTTP API 触发（推荐用于自动化）

```bash
# 触发构建的示例命令
curl -X POST "http://jenkins-server/job/zhaosheng-web/buildWithParameters" \
  --user "username:password_or_api_token" \
  --data-urlencode "DEPLOY_TO_PROD=true" \
  --data-urlencode "BRANCH=main" \
  --data-urlencode "VITE_COZE_AUTH_TOKEN=your_token" \
  --data-urlencode "VITE_COZE_API_URL=https://api.coze.cn/v3/chat" \
  --data-urlencode "VITE_COZE_BOT_ID=your_bot_id" \
  --data-urlencode "VITE_COZE_WORKFLOW_ID=your_workflow_id" \
  --data-urlencode "VITE_WECHAT_TOKEN=your_wechat_token"
```

### 方式三：通过 GitLab Webhook 自动触发

在 GitLab 中配置 Webhook，当代码推送到指定分支时自动触发 Jenkins 构建。需要在 Jenkins 中预先配置好构建参数，或者在 Webhook 调用时传递参数。

## 构建流程

Jenkins Pipeline 包含以下阶段：

1. **Checkout Code**: 从 GitLab 仓库拉取指定分支的代码
2. **Install Dependencies**: 安装 pnpm 和项目依赖
3. **Code Quality**: 执行 TypeScript 类型检查
4. **Build Project**: 运行 `pnpm run build` 构建前端应用
5. **Build Docker Image**: 使用 Dockerfile 构建 Docker 镜像，**在此时传入环境变量参数**
6. **Deploy to Server**: 将 Docker 镜像部署到生产服务器（需要 DEPLOY_TO_PROD=true）

## 环境变量传递机制

环境变量通过 Docker 的 `--build-arg` 参数传递到构建过程中：

1. Jenkins 参数 → Docker Build Args → Dockerfile ENV → Vite 构建时使用
2. Vite 会读取以 `VITE_` 开头的环境变量并将其注入到前端代码中
3. 最终这些变量会在运行时通过 `import.meta.env` 在代码中访问

## 注意事项

1. **敏感信息**: 所有参数包含敏感信息，不建议硬编码在 Jenkinsfile 中
2. **参数验证**: Jenkins 会自动验证参数类型，请确保输入正确
3. **默认值**: 空字符串作为默认值时，构建可能失败，建议在首次配置时填写完整参数
4. **缓存**: Docker 镜像构建会被缓存，修改参数可能不会自动触发重建，需要清理缓存
5. **分支切换**: 切换分支时，确保目标分支也存在相应的代码

## 故障排查

### 构建失败

1. 检查参数是否正确填写（特别是空字符串）
2. 查看 Jenkins 构建日志中的 Docker 构建输出
3. 确认服务器 SSH 密钥配置正确
4. 检查网络连接（Docker 镜像加载可能失败）

### 环境变量未生效

1. 确认 Docker 构建日志中显示了正确的 `--build-arg` 参数
2. 检查 Dockerfile 中是否正确声明了 ARG 和 ENV
3. 在 Vite 构建输出中查找环境变量注入日志
4. 确保前端代码中使用 `import.meta.env.VITE_*` 访问变量

## 安全建议

1. 不要在代码仓库中存储真实的密钥和令牌
2. 使用 Jenkins 凭据管理（Credentials）存储敏感信息
3. 定期轮换 API 密钥和令牌
4. 限制 Jenkins 任务的访问权限
5. 在生产环境使用单独的配置
