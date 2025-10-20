pipeline {
    agent any
    stages {
        stage('传输构建产物到远程服务器') {
            steps {
                sshPublisher(publishers: [
                    sshPublisherDesc(
                        configName: '智规处项目部署服务器', 
                        transfers: [
                            sshTransfer(
                                cleanRemote: false, 
                                excludes: '', 
                                execCommand: '', 
                                execTimeout: 120000, 
                                flatten: false, 
                                makeEmptyDirs: false, 
                                noDefaultExcludes: false, 
                                patternSeparator: '[, ]+', 
                                remoteDirectory: '/ZhaoSheng/build/', 
                                remoteDirectorySDF: false, 
                                removePrefix: 'dist/static', 
                                sourceFiles: 'dist/static/**'
                            )
                        ]
                    )
                ])
            }
        }
        stage('在远程服务器构建并运行Docker容器') {
            steps {
                sshPublisher(publishers: [
                    sshPublisherDesc(
                        configName: '智规处项目部署服务器', 
                        transfers: [
                            sshTransfer(
                                cleanRemote: false, 
                                excludes: 'nginx.conf', 
                                execCommand: '', 
                                execTimeout: 120000, 
                                flatten: false, 
                                makeEmptyDirs: false, 
                                noDefaultExcludes: false, 
                                patternSeparator: '[, ]+', 
                                remoteDirectory: '/ZhaoSheng/build/', 
                                remoteDirectorySDF: false, 
                                removePrefix: '', 
                                sourceFiles: 'nginx.conf'
                            )
                        ],
                        execCommand: 'cd /ZhaoSheng/build && docker build -t zhaosheng-web. && docker run -d -p 82:82 -p 443:443 zhaosheng-web'
                    )
                ])
            }
        }
    }
}