// Jenkinsfile for React TypeScript Project CI/CD Pipeline
pipeline {
    agent any
    
    // 环境变量定义
    environment {
        // Docker相关配置
        DOCKER_IMAGE_NAME = "fzrjxy-zhaosheng-chatbot"
        DOCKER_CONTAINER_NAME = "fzrjxy-zhaosheng-chatbot"
        // 部署服务器配置
        DEPLOY_SERVER = "175.42.63.9"
        DEPLOY_PATH = "/path/to/deployment"
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
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: "*/${params.BRANCH}"]],
                    doGenerateSubmoduleConfigurations: false,
                    extensions: [],
                    submoduleCfg: [],
                    userRemoteConfigs: [[
                        url: '您的GitLab仓库URL',
                        credentialsId: 'gitlab-credentials' // 在Jenkins中配置的GitLab凭证ID
                    ]]
                ])
            }
        }
        
        // 阶段2: 安装依赖
        stage('Install Dependencies') {
            steps {
                script {
                    // 检查是否安装了pnpm，如果没有则安装
                    sh '''
                        if ! command -v pnpm &> /dev/null
                        then
                            echo "pnpm not found, installing..."
                            npm install -g pnpm
                        else
                            echo "pnpm already installed"
                        fi
                        
                        // 使用淘宝镜像加速下载
                        npm config set registry https://registry.npmmirror.com
                        pnpm config set registry https://registry.npmmirror.com
                        
                        // 安装项目依赖
                        pnpm install
                    '''
                }
            }
        }
        
        // 阶段3: 代码质量检查和测试
        stage('Code Quality & Test') {
            steps {
                script {
                    // 可以根据项目需求添加TypeScript类型检查、ESLint等
                    sh 'npx tsc --noEmit'
                    
                    // 如果有测试，取消下面的注释
                    // sh 'pnpm test'
                }
            }
        }
        
        // 阶段4: 构建项目
        stage('Build Project') {
            steps {
                script {
                    sh 'pnpm run build'
                }
            }
        }
        
        // 阶段5: 构建Docker镜像
        stage('Build Docker Image') {
            steps {
                script {
                    // 构建Docker镜像
                    sh "docker build -t ${DOCKER_IMAGE_NAME}:${BUILD_NUMBER} ."
                    sh "docker tag ${DOCKER_IMAGE_NAME}:${BUILD_NUMBER} ${DOCKER_IMAGE_NAME}:latest"
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
                    // 将Docker镜像导出为tar文件
                    sh "docker save -o ${DOCKER_IMAGE_NAME}.tar ${DOCKER_IMAGE_NAME}:latest"
                    
                    // 使用SSH将tar文件和docker-compose.yml复制到部署服务器
                    withCredentials([sshUserPrivateKey(credentialsId: 'deploy-server-credentials', keyFileVariable: 'SSH_KEY')]) {
                        // 复制Docker镜像
                        sh "scp -i ${SSH_KEY} -o StrictHostKeyChecking=no ${DOCKER_IMAGE_NAME}.tar ${DEPLOY_SERVER}:${DEPLOY_PATH}"
                        
                        // 复制docker-compose.yml文件
                        sh "scp -i ${SSH_KEY} -o StrictHostKeyChecking=no docker-compose.yml ${DEPLOY_SERVER}:${DEPLOY_PATH}"
                        
                        // 复制nginx.conf文件
                        sh "scp -i ${SSH_KEY} -o StrictHostKeyChecking=no nginx.conf ${DEPLOY_SERVER}:${DEPLOY_PATH}"
                        
                        // 在部署服务器上加载镜像并启动服务
                        sh """
                            ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${DEPLOY_SERVER} << 'EOF'
                                # 停止并移除旧容器
                                cd ${DEPLOY_PATH}
                                docker-compose down || true
                                
                                # 加载新镜像
                                docker load -i ${DOCKER_IMAGE_NAME}.tar
                                
                                # 启动新容器
                                docker-compose up -d
                                
                                # 清理旧镜像
                                docker system prune -f
                                
                                # 重启nginx以确保配置生效
                                docker exec -it ${DOCKER_CONTAINER_NAME} nginx -s reload || true
                            EOF
                        """
                    }
                    
                    // 清理本地临时文件
                    sh "rm -f ${DOCKER_IMAGE_NAME}.tar"
                }
            }
        }
    }
    
    // 后构建操作
    post {
        // 构建成功时
        success {
            echo '构建成功！'
            // 可以添加通知，例如发送邮件或Slack消息
        }
        
        // 构建失败时
        failure {
            echo '构建失败！'
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