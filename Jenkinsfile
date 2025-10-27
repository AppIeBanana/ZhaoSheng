// Jenkinsfile for 招生前端开发项目 CI/CD Pipeline
pipeline {
    agent any
    
    // 工具定义，用于指定NodeJS版本
    tools {
        nodejs 'NodeJS 24.10.0' // 使用在Jenkins中已配置的NodeJS工具名称
    }
    
    // 环境变量定义
    environment {
        // Docker相关配置
        DOCKER_IMAGE_NAME = 'zhaosheng-web'
        DOCKER_CONTAINER_NAME = 'zhaosheng-web'
        DOCKER_IMAGE_PATH_NODE = '/docker_images/node-lts-jod.tar'
        DOCKER_IMAGE_PATH_NGINX = '/docker_images/nginx-stable-perl.tar'
        // 生成版本号（基于构建ID和时间戳）
        DOCKER_IMAGE_VERSION = "${BUILD_NUMBER}-${new Date().format('yyyyMMdd-HHmmss')}"
        // 部署服务器配置
        DEPLOY_SERVER = '10.26.1.82'
        DEPLOY_PATH = '/projects/ZhaoSheng'
        GITLAB_REPO = 'http://172.21.9.233:18080/Wanzhong/zhaosheng.git'
        // 后端服务配置
        BACKEND_SERVICE_NAME = 'zhaosheng-backend'
    }
    
    // 构建参数，可在Jenkins界面手动触发时修改
    parameters {
        booleanParam(name: 'DEPLOY_TO_PROD', defaultValue: true, description: '是否部署到生产环境')
        choice(name: 'BRANCH', choices: ['main', 'develop'], description: '选择要构建的分支')
    }
    
    stages {
        // 阶段1: 拉取代码
        stage('Checkout Code') {
            steps {
                echo "从 ${GITLAB_REPO} 拉取 ${params.BRANCH} 分支代码"
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: "*/${params.BRANCH}"]],
                    doGenerateSubmoduleConfigurations: false,
                    extensions: [
                        [$class: 'CleanBeforeCheckout'],
                        [$class: 'PruneStaleBranch']
                    ],
                    submoduleCfg: [],
                    userRemoteConfigs: [[
                        url: "${GITLAB_REPO}",
                        credentialsId: '741bbcae-2cc0-44e1-b0aa-fb0e579a0354' // 在Jenkins中配置的GitLab凭证ID
                    ]]
                ])
            }
        }
        
        // 阶段2: 安装依赖
        stage('Install Dependencies') {
            steps {
                script {
                    echo '安装项目依赖...'
                    // 显示当前使用的Node和npm版本
                    sh 'node -v && npm -v'
                    // 安装pnpm并使用pnpm安装依赖
                    sh '''
                        # 安装pnpm
                        npm install -g pnpm
                        
                        # 使用淘宝镜像加速下载
                        pnpm config set registry https://registry.npmmirror.com
                        
                        # 安装项目依赖
                        pnpm install

                        # 更新browserslist数据库...
                        npx update-browserslist-db@latest
                    '''
                }
            }
        }
        
        // 阶段3: 代码质量检查
        stage('Code Quality') {
            steps {
                script {
                    echo '执行代码质量检查...'
                    // TypeScript类型检查
                    sh 'npx tsc --noEmit'
                    
                    // 启用测试
                    // sh 'pnpm test'
                }
            }
        }
        
        // 阶段4: 构建项目
        stage('Build Project') {
            steps {
                script {
                    echo '构建项目...'
                    sh 'pnpm run build'
                }
            }
        }
        
        // 阶段5: 构建Docker镜像
        stage('Build Docker Image') {
            steps {
                script {
                    // 权限诊断步骤
                    // echo 'Docker权限诊断...'
                    // sh 'id'
                    // sh 'groups'
                    // sh 'ls -la /var/run/docker.sock || echo "Docker socket not found"'
                    // sh 'docker info || echo "Docker info command failed"'
                    
                    // 检查本地是否存在所需的基础镜像
                    echo '检查本地Docker镜像...'
                    // 检查Node镜像，如果不存在则尝试从本地文件加载
                    echo '导入本地node镜像'
                    sh '''
                    docker load -i "${DOCKER_IMAGE_PATH_NODE}" || echo 'Node本地镜像加载失败，将继续构建'
                    '''
                    echo '导入本地nginx镜像'
                    sh '''
                    docker load -i "${DOCKER_IMAGE_PATH_NGINX}" || echo 'Nginx本地镜像加载失败，将继续构建'
                    '''
                    
                    // 为本地基础镜像添加指定域名的标签，确保与Dockerfile一致
                    sh '''
                        if docker images | grep -q 'node:lts-jod' || docker images | grep -q 'library/node:lts-jod'; then
                            echo '为Node镜像添加指定域名标签...'
                            # 处理两种可能的镜像名称格式
                            docker tag node:lts-jod i0qlp8mg3an5h2.xuanyuan.run/library/node:lts-jod 2>/dev/null || \
                            docker tag library/node:lts-jod i0qlp8mg3an5h2.xuanyuan.run/library/node:lts-jod 2>/dev/null || \
                            echo 'Node镜像标签设置失败，但将继续构建'
                        fi
                        
                        if docker images | grep -q 'nginx:stable-perl' || docker images | grep -q 'library/nginx:stable-perl'; then
                            echo '为Nginx镜像添加指定域名标签...'
                            # 处理两种可能的镜像名称格式
                            docker tag nginx:stable-perl i0qlp8mg3an5h2.xuanyuan.run/library/nginx:stable-perl 2>/dev/null || \
                            docker tag library/nginx:stable-perl i0qlp8mg3an5h2.xuanyuan.run/library/nginx:stable-perl 2>/dev/null || \
                            echo 'Nginx镜像标签设置失败，但将继续构建'
                        fi
                    '''
                    
                    echo "构建Docker镜像，版本号：${DOCKER_IMAGE_VERSION}，优先使用本地基础镜像..."
                    // --pull=false 确保Docker不尝试拉取镜像，优先使用本地镜像
                    // --network=host 使用主机网络配置
                    // 同时标记latest和具体版本号
                    sh "docker build --network=host --pull=false -t ${DOCKER_IMAGE_NAME}:latest -t ${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_VERSION} ."
                    
                    // 显示构建的镜像信息
                    echo "构建完成，镜像信息："
                    sh "docker images ${DOCKER_IMAGE_NAME}"
                }
            }
        }
        
        // 阶段6: 部署到服务器
        stage('Deploy to Server') {
            when {
                expression { params.DEPLOY_TO_PROD }
            }
            steps {
                script {
                    echo '部署到服务器 ${DEPLOY_SERVER}:${DEPLOY_PATH}'
                    // 将Docker镜像导出为tar文件（仍然使用latest标签，符合部署要求）
                    sh 'docker save -o ${DOCKER_IMAGE_NAME}.tar ${DOCKER_IMAGE_NAME}:latest'
                    
                    // 使用SSH将tar文件和必要配置文件复制到部署服务器
                    // 添加 .env 文件凭证（需要在 Jenkins 凭证管理中上传 .env 文件，ID为 'zhaosheng-env-file'）
                    withCredentials([
                        sshUserPrivateKey(credentialsId: 'jenkins_ssh', keyFileVariable: 'SSH_KEY', passphraseVariable: 'SSH_PASSPHRASE', usernameVariable: 'SSH_USERNAME'),
                        file(credentialsId: 'zhaosheng-env-file', variable: 'ENV_FILE')
                    ]) {
                        // 使用ssh-agent自动处理密钥passphrase
                        sh '''
                            # 启动ssh-agent
                            eval $(ssh-agent -s)
                            
                            # 添加私钥到ssh-agent，使用SSH_PASSPHRASE环境变量提供密码
                            echo ${SSH_PASSPHRASE} | ssh-add ${SSH_KEY}
                            
                            # 确保部署目录和子目录存在
                            ssh -o StrictHostKeyChecking=no ${SSH_USERNAME}@${DEPLOY_SERVER} "mkdir -p ${DEPLOY_PATH}/src/lib"
                            
                            # === 复制前端相关文件 ===
                            echo '复制Docker镜像到服务器...'
                            scp -o StrictHostKeyChecking=no ${DOCKER_IMAGE_NAME}.tar ${SSH_USERNAME}@${DEPLOY_SERVER}:${DEPLOY_PATH}
                            
                            echo '复制前端配置文件到服务器...'
                            scp -o StrictHostKeyChecking=no docker-compose.yml ${SSH_USERNAME}@${DEPLOY_SERVER}:${DEPLOY_PATH}
                            scp -o StrictHostKeyChecking=no nginx.conf ${SSH_USERNAME}@${DEPLOY_SERVER}:${DEPLOY_PATH}
                            
                            # === 复制后端相关文件 ===
                            echo '复制后端代码到服务器...'
                            scp -o StrictHostKeyChecking=no server.js ${SSH_USERNAME}@${DEPLOY_SERVER}:${DEPLOY_PATH}/
                            scp -o StrictHostKeyChecking=no package.json ${SSH_USERNAME}@${DEPLOY_SERVER}:${DEPLOY_PATH}/
                            scp -o StrictHostKeyChecking=no pnpm-lock.yaml ${SSH_USERNAME}@${DEPLOY_SERVER}:${DEPLOY_PATH}/ || echo "pnpm-lock.yaml 不存在，跳过"
                            
                            # 复制 src/lib 目录（wechatOAuth.js 等依赖库）
                            echo '复制依赖库文件...'
                            scp -r -o StrictHostKeyChecking=no src/lib ${SSH_USERNAME}@${DEPLOY_SERVER}:${DEPLOY_PATH}/src/ || echo "src/lib 复制失败，跳过"
                            
                            # 复制 .env 配置文件（从 Jenkins 凭证）
                            echo '复制环境变量配置文件...'
                            scp -o StrictHostKeyChecking=no ${ENV_FILE} ${SSH_USERNAME}@${DEPLOY_SERVER}:${DEPLOY_PATH}/.env
                            
                            # 在部署服务器上加载镜像并启动服务
                            echo '在服务器上部署应用...'
                            ssh -o StrictHostKeyChecking=no ${SSH_USERNAME}@${DEPLOY_SERVER} << 'EOFMAIN'
                                echo "=========================================="
                                echo "开始部署招生项目"
                                echo "=========================================="
                                cd ${DEPLOY_PATH}
                                
                                # 设置 .env 文件安全权限
                                echo ""
                                echo "设置环境变量文件权限..."
                                chmod 600 .env
                                chown $(whoami):$(whoami) .env || true
                                echo "✓ .env 文件权限已设置为 600"
                                
                                # === 部署前端 Docker 容器 ===
                                echo ""
                                echo "=========================================="
                                echo "部署前端 Docker 容器"
                                echo "=========================================="
                                
                                # 停止并移除旧容器
                                echo '停止并移除旧容器...'
                                docker-compose down || true
                                
                                # 优先加载本地基础镜像文件
                                echo '优先加载本地基础镜像文件...'
                                # 加载Node基础镜像（适配指定域名的镜像）
                                if [ -f "${DEPLOY_PATH}/node-lts-jod.tar" ]; then
                                    echo '发现本地Node基础镜像文件，正在加载...'
                                    docker load -i "${DEPLOY_PATH}/node-lts-jod.tar" || echo 'Node基础镜像加载失败，将继续部署'
                                    
                                    # 为加载的镜像添加指定域名的标签，确保与Dockerfile一致
                                    if docker images | grep -q 'node:lts-jod' || docker images | grep -q 'library/node:lts-jod'; then
                                        echo '为Node镜像添加指定域名标签...'
                                        # 处理两种可能的镜像名称格式
                                        docker tag node:lts-jod i0qlp8mg3an5h2.xuanyuan.run/library/node:lts-jod 2>/dev/null || \
                                        docker tag library/node:lts-jod i0qlp8mg3an5h2.xuanyuan.run/library/node:lts-jod 2>/dev/null || \
                                        echo 'Node镜像标签设置失败，但将继续部署'
                                    fi
                                else
                                    echo '未发现本地Node基础镜像文件，跳过加载'
                                fi
                                  
                                # 加载Nginx基础镜像（适配指定域名的镜像）
                                if [ -f "${DEPLOY_PATH}/nginx-stable-perl.tar" ]; then
                                    echo '发现本地Nginx基础镜像文件，正在加载...'
                                    docker load -i "${DEPLOY_PATH}/nginx-stable-perl.tar" || echo 'Nginx基础镜像加载失败，将继续部署'
                                    
                                    # 为加载的镜像添加指定域名的标签，确保与Dockerfile一致
                                    if docker images | grep -q 'nginx:stable-perl' || docker images | grep -q 'library/nginx:stable-perl'; then
                                        echo '为Nginx镜像添加指定域名标签...'
                                        # 处理两种可能的镜像名称格式
                                        docker tag nginx:stable-perl i0qlp8mg3an5h2.xuanyuan.run/library/nginx:stable-perl 2>/dev/null || \
                                        docker tag library/nginx:stable-perl i0qlp8mg3an5h2.xuanyuan.run/library/nginx:stable-perl 2>/dev/null || \
                                        echo 'Nginx镜像标签设置失败，但将继续部署'
                                    fi
                                else
                                    echo '未发现本地Nginx基础镜像文件，跳过加载'
                                fi
                                
                                # 加载应用镜像
                                echo '加载应用镜像...'
                                docker load -i ${DOCKER_IMAGE_NAME}.tar
                                
                                # 启动新容器
                                echo '启动新容器...'
                                docker-compose up -d
                                
                                # 等待容器启动
                                echo '等待容器启动...'
                                sleep 5
                                
                                # 检查容器状态
                                echo "前端容器状态："
                                docker ps -f "name=${DOCKER_CONTAINER_NAME}"
                                
                                # === 部署 Node.js 后端服务 ===
                                echo ""
                                echo "=========================================="
                                echo "部署 Node.js 后端服务"
                                echo "=========================================="
                                
                                # 检查并安装/更新依赖
                                if [ ! -d "node_modules" ] || [ package.json -nt node_modules ]; then
                                    echo '安装/更新 Node.js 依赖...'
                                    if command -v pnpm &> /dev/null; then
                                        pnpm install --prod
                                    else
                                        npm install --production
                                    fi
                                    echo "✓ 依赖安装完成"
                                else
                                    echo '✓ Node.js 依赖已是最新'
                                fi
                                
                                # 使用 PM2 管理后端服务
                                if command -v pm2 &> /dev/null; then
                                    echo '使用 PM2 管理后端服务...'
                                    
                                    # 检查进程是否存在
                                    if pm2 describe ${BACKEND_SERVICE_NAME} > /dev/null 2>&1; then
                                        echo '重启现有后端服务...'
                                        pm2 restart ${BACKEND_SERVICE_NAME} --update-env
                                    else
                                        echo '首次启动后端服务...'
                                        pm2 start server.js --name ${BACKEND_SERVICE_NAME} --time
                                    fi
                                    
                                    # 保存 PM2 配置
                                    pm2 save
                                    
                                    # 显示服务状态
                                    echo ""
                                    echo "后端服务状态："
                                    pm2 describe ${BACKEND_SERVICE_NAME}
                                    
                                    echo "✓ 后端服务已启动"
                                else
                                    echo "=========================================="
                                    echo "⚠️  警告: 未检测到 PM2"
                                    echo "=========================================="
                                    echo "后端服务未自动启动！"
                                    echo ""
                                    echo "请手动安装 PM2 并启动服务："
                                    echo "  1. npm install -g pm2"
                                    echo "  2. pm2 start server.js --name ${BACKEND_SERVICE_NAME}"
                                    echo "  3. pm2 save"
                                    echo "  4. pm2 startup (设置开机自启)"
                                    echo "=========================================="
                                fi
                                
                                # 清理旧镜像
                                echo ""
                                echo '清理旧镜像...'
                                docker system prune -f
                                
                                echo ""
                                echo "=========================================="
                                echo "✓ 部署完成!"
                                echo "=========================================="
                                echo "前端访问地址: https://zswd.fzrjxy.com"
                                echo "后端服务端口: 8443 (HTTPS)"
                                echo "=========================================="
                                
                                # 最终状态检查
                                echo ""
                                echo "最终状态检查："
                                echo "----------------------------------------"
                                echo "Docker 容器:"
                                docker ps -f "name=${DOCKER_CONTAINER_NAME}" --format "  - {{.Names}}: {{.Status}}"
                                echo ""
                                echo "Node.js 后端:"
                                if command -v pm2 &> /dev/null; then
                                    pm2 describe ${BACKEND_SERVICE_NAME} 2>&1 | grep -E 'status|uptime|restarts' || echo "  - 状态: 未运行或未找到"
                                else
                                    echo "  - PM2 未安装，无法检查状态"
                                fi
                                echo "=========================================="
EOFMAIN
                        '''
                    }
                    
                    // 清理本地临时文件
                    sh 'rm -f ${DOCKER_IMAGE_NAME}.tar'
                }
            }
        }
    }
    
    // 后构建操作
    post {
        // 构建成功时
        success {
            echo '=========================================='
            echo '✓ 构建和部署成功！'
            echo '=========================================='
            echo "应用已成功部署到 ${DEPLOY_SERVER}"
            echo "前端访问: https://zswd.fzrjxy.com"
            echo "部署路径: ${DEPLOY_PATH}"
            echo '=========================================='
            // 可以添加通知，例如发送邮件或Slack消息
        }
        
        // 构建失败时
        failure {
            echo '=========================================='
            echo '✗ 构建或部署失败！'
            echo '=========================================='
            echo '请检查构建日志获取详细错误信息'
            echo '=========================================='
            // 可以添加失败通知
        }
        
        // 无论构建成功还是失败都执行
        always {
            // 清理工作空间
            cleanWs(cleanWhenNotBuilt: false, 
                   deleteDirs: true, 
                   disableDeferredWipeout: true,
                   notFailBuild: true,
                   patterns: [[pattern: 'node_modules', type: 'EXCLUDE']])
        }
    }
}