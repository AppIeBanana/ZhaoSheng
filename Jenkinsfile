// Jenkinsfile for 招生前端开发项目 CI/CD Pipeline
pipeline {
    agent any
    
    // 工具定义，用于指定NodeJS版本
    tools {
        nodejs 'NodeJS 22.20.0' // 使用在Jenkins中已配置的NodeJS工具名称
    }
    
    // 环境变量定义
    environment {
        // Docker相关配置
        DOCKER_IMAGE_NAME = 'zhaosheng-web'
        DOCKER_CONTAINER_NAME = 'zhaosheng-web'
        // 部署服务器配置
        DEPLOY_SERVER = '175.42.63.9'
        DEPLOY_PATH = '/projects/ZhaoSheng'
        GITLAB_REPO = 'http://172.21.9.233:18080/Wanzhong/zhaosheng.git'
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
                    // 使用npm安装依赖
                    sh '''
                        # 使用淘宝镜像加速下载
                        npm config set registry https://registry.npmmirror.com
                        
                        # 安装项目依赖
                        npm install
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
                    
                    // 如果有测试，可以启用
                    // sh 'pnpm test'
                }
            }
        }
        
        // 阶段4: 构建项目
        stage('Build Project') {
            steps {
                script {
                    echo '构建项目...'
                    sh 'npm run build'
                }
            }
        }
        
        // 阶段5: 构建Docker镜像
        stage('Build Docker Image') {
            steps {
                script {
                    echo '构建Docker镜像: ${DOCKER_IMAGE_NAME}:${BUILD_NUMBER}'
                    // 构建Docker镜像
                    sh 'docker build -t ${DOCKER_IMAGE_NAME}:${BUILD_NUMBER} .'
                    sh 'docker tag ${DOCKER_IMAGE_NAME}:${BUILD_NUMBER} ${DOCKER_IMAGE_NAME}:latest'
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
                    // 将Docker镜像导出为tar文件
                    sh 'docker save -o ${DOCKER_IMAGE_NAME}.tar ${DOCKER_IMAGE_NAME}:latest'
                    
                    // 使用SSH将tar文件和必要配置文件复制到部署服务器
                    withCredentials([sshUserPrivateKey(credentialsId: 'deploy-server-credentials', keyFileVariable: 'SSH_KEY')]) {
                        // 确保部署目录存在
                        sh 'ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${DEPLOY_SERVER} \'mkdir -p ${DEPLOY_PATH}\''
                        
                        // 复制Docker镜像
                        echo '复制Docker镜像到服务器...'
                        sh 'scp -i ${SSH_KEY} -o StrictHostKeyChecking=no ${DOCKER_IMAGE_NAME}.tar ${DEPLOY_SERVER}:${DEPLOY_PATH}'
                        
                        // 复制必要的配置文件
                        echo '复制配置文件到服务器...'
                        sh 'scp -i ${SSH_KEY} -o StrictHostKeyChecking=no docker-compose.yml ${DEPLOY_SERVER}:${DEPLOY_PATH}'
                        sh 'scp -i ${SSH_KEY} -o StrictHostKeyChecking=no nginx.conf ${DEPLOY_SERVER}:${DEPLOY_PATH}'
                        
                        // 在部署服务器上加载镜像并启动服务
                        echo '在服务器上部署应用...'
                        sh '''
                            ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${DEPLOY_SERVER} << 'EOF'
                                echo '开始部署应用...'
                                # 进入部署目录
                                cd ${DEPLOY_PATH}
                                 
                                # 停止并移除旧容器
                                echo '停止并移除旧容器...'
                                docker-compose down || true
                                
                                # 加载新镜像
                                echo '加载新镜像...'
                                docker load -i ${DOCKER_IMAGE_NAME}.tar
                                
                                # 启动新容器
                                echo '启动新容器...'
                                docker-compose up -d
                                
                                # 等待容器启动
                                echo '等待容器启动...'
                                sleep 5
                                
                                # 检查容器状态
                                echo '检查容器状态...'
                                docker ps -f 'name=${DOCKER_CONTAINER_NAME}'
                                
                                # 清理旧镜像
                                echo '清理旧镜像...'
                                docker system prune -f
                                
                                # 验证部署
                                CONTAINER_RUNNING=$(docker ps | grep -c '${DOCKER_CONTAINER_NAME}')
                                if [ '$CONTAINER_RUNNING' -eq 1 ]; then
                                    echo '部署成功! ${DOCKER_CONTAINER_NAME} 容器正在运行'
                                else
                                    echo '部署失败! ${DOCKER_CONTAINER_NAME} 容器未正常启动'
                                    exit 1
                                fi
                            EOF
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
            echo '构建和部署成功！'
            echo '应用已成功部署到 http://${DEPLOY_SERVER}:${DEPLOY_PATH}'
            // 可以添加通知，例如发送邮件或Slack消息
        }
        
        // 构建失败时
        failure {
            echo '构建或部署失败！'
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