// 微信OAuth服务后端处理文件
// 首先加载环境变量
import dotenv from 'dotenv';
dotenv.config();

import https from 'https';
import fs from 'fs';
import path from 'path';
import { URL } from 'url';

// 微信OAuth模块引用（将在启动时动态导入）
let wechatOAuth;
let WechatOAuth;

// 从443端口更改为8443端口，避免与现有服务冲突并使用非特权端口
const port = 8443;

// 用户数据存储路径
const USER_DATA_FILE = path.join(process.cwd(), 'wechat_users.json');

// 保存用户信息到文件
function saveUserData(dialogId, openid, unionid, userInfo) {
  let users = {};
  
  // 读取现有数据
  if (fs.existsSync(USER_DATA_FILE)) {
    try {
      const data = fs.readFileSync(USER_DATA_FILE, 'utf8');
      users = JSON.parse(data);
    } catch (error) {
      console.error('读取用户数据文件失败:', error);
    }
  }
  
  // 添加或更新用户数据
  users[dialogId] = {
    openid,
    unionid,
    nickname: userInfo.nickname || '',
    headimgurl: userInfo.headimgurl || '',
    createdAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString()
  };
  
  // 如果已存在该openid，更新其信息
  if (!users[dialogId].firstAuthAt) {
    users[dialogId].firstAuthAt = new Date().toISOString();
  }
  
  // 写入文件
  try {
    fs.writeFileSync(USER_DATA_FILE, JSON.stringify(users, null, 2), 'utf8');
    console.log(`用户数据已保存: dialogId=${dialogId}, openid=${openid}, unionid=${unionid}`);
  } catch (error) {
    console.error('保存用户数据失败:', error);
  }
}

// SSL证书配置 - 从环境变量读取证书路径
const privateKeyPath = process.env.SSL_KEY_PATH; // 私钥路径
const certificatePath = process.env.SSL_CERT_PATH; // 证书路径

// 读取SSL证书和私钥
let privateKey, certificate, credentials;
try {
  // 尝试读取私钥文件
  console.log(`尝试读取私钥文件: ${privateKeyPath}`);
  privateKey = fs.readFileSync(privateKeyPath, 'utf8');
  console.log('✓ 私钥文件读取成功');

  // 尝试读取证书文件
  console.log(`尝试读取证书文件: ${certificatePath}`);
  certificate = fs.readFileSync(certificatePath, 'utf8');
  console.log('✓ 证书文件读取成功');

  // 创建凭证对象
  credentials = { key: privateKey, cert: certificate };
  console.log('✓ SSL凭证创建成功');
} catch (error) {
  console.error('=== SSL证书加载失败 ===');

  if (error.code === 'ENOENT') {
    console.error(`错误: 找不到证书文件`);
    console.error(`私钥路径: ${privateKeyPath}`);
    console.error(`证书路径: ${certificatePath}`);
    console.error(`请确保这些文件存在并且具有正确的读取权限`);
  } else if (error.code === 'EACCES') {
    console.error(`错误: 没有权限读取证书文件`);
    console.error(`请确保运行程序的用户有权限访问这些文件`);
  } else {
    console.error(`错误详情:`, error);
  }

  // 无论环境如何，证书加载失败都应提示用户，但只在生产环境中强制退出
  console.error('=== SSL证书加载失败 ===');
  console.error(`请确保证书文件存在且有权限访问: ${privateKeyPath} 和 ${certificatePath}`);

  if (process.env.NODE_ENV === 'production') {
    console.error('在生产环境中，证书加载失败将导致程序退出');
    process.exit(1);
  }
}

// 创建HTTPS服务器
let server;
if (credentials) {
  console.log('创建HTTPS服务器...');
  server = https.createServer(credentials, (req, res) => {
    const startTime = Date.now();
    const parsedUrl = new URL(req.url, `https://${req.headers.host}`);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    // 记录所有接收到的请求
    console.log(`=== 收到请求 ===`);
    console.log(`时间: ${new Date().toISOString()}`);
    console.log(`方法: ${method}`);
    console.log(`路径: ${pathname}`);
    console.log(`客户端IP: ${req.socket.remoteAddress}`);

    // 重写res.writeHead方法以记录响应状态码
    const originalWriteHead = res.writeHead;
    res.writeHead = function (statusCode, headers) {
      const processingTime = Date.now() - startTime;
      console.log(`=== 响应信息 ===`);
      console.log(`状态码: ${statusCode}`);
      console.log(`处理时间: ${processingTime}ms`);
      return originalWriteHead.apply(this, arguments);
    };

    // 微信OAuth授权URL生成端点
    if (pathname === '/api/wechat/auth-url' && method === 'GET') {
      const dialogId = parsedUrl.searchParams.get('dialogId');

      if (!dialogId) {
        console.warn('缺少dialogId参数');
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '缺少dialogId参数' }));
        return;
      }

      try {
        // 检查wechatOAuth模块是否已加载
        if (!wechatOAuth || !WechatOAuth) {
          console.error('生成授权URL失败: 微信OAuth服务暂不可用');
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '微信OAuth服务暂不可用' }));
          return;
        }

        if (!wechatOAuth) {
          // 如果wechatOAuth未初始化，创建一个新实例
          wechatOAuth = new WechatOAuth();
        }

        const authUrl = wechatOAuth.generateAuthUrl(dialogId);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ authUrl }));

        console.log(`成功生成微信授权URL，dialogId: ${dialogId}`);
      } catch (error) {
        console.error('生成授权URL失败:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '生成授权URL失败', message: error.message }));
      }
      return;
    }
    else if (pathname === '/api/wechat/callback' && method === 'GET') {
      // 处理微信授权回调的端点
      const code = parsedUrl.searchParams.get('code');
      const state = parsedUrl.searchParams.get('state');

      if (!code || !state) {
        console.warn('缺少code或state参数');
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '缺少code或state参数' }));
        return;
      }

      // 检查wechatOAuth模块是否已加载
      if (!wechatOAuth || !WechatOAuth) {
        console.error('处理微信授权回调失败: 微信OAuth服务暂不可用');
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '微信OAuth服务暂不可用' }));
        return;
      }

      // 使用异步处理回调逻辑
      const handleOAuthCallback = async () => {
        try {
          if (!wechatOAuth) {
            // 如果wechatOAuth未初始化，创建一个新实例
            wechatOAuth = new WechatOAuth();
          }

          // 验证state参数
          const stateInfo = wechatOAuth.verifyState(state);
          if (!stateInfo) {
            console.warn('state验证失败');
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '无效的授权请求' }));
            return;
          }

          const { dialogId } = stateInfo;

          // 获取access_token
          const tokenInfo = await wechatOAuth.getAccessToken(code);
          console.log('微信返回的token信息:', {
            openid: tokenInfo.openid,
            unionid: tokenInfo.unionid,
            access_token: tokenInfo.access_token ? '已获取' : '未获取',
            expires_in: tokenInfo.expires_in
          });

          // 获取用户信息
          const userInfo = await wechatOAuth.getUserInfo(tokenInfo.access_token, tokenInfo.openid);
          console.log('微信返回的用户信息:', {
            openid: userInfo.openid,
            nickname: userInfo.nickname,
            unionid: userInfo.unionid
          });

          // 保存用户信息（优先使用userInfo中的unionid，如果没有则使用tokenInfo中的）
          const openid = tokenInfo.openid || userInfo.openid;
          const unionid = userInfo.unionid || tokenInfo.unionid;
          
          saveUserData(dialogId, openid, unionid, userInfo);

          // 生成授权成功后的重定向URL，带上必要的参数，跳转到QA页面
          const frontendRedirectUrl = `https://zswd.fzrjxy.com/qa?dialogId=${dialogId}&wechat_authorized=true&openid=${encodeURIComponent(openid)}`;

          // 重定向到前端页面
          res.writeHead(302, { 'Location': frontendRedirectUrl });
          res.end();

        } catch (error) {
          console.error('处理微信授权回调失败:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '处理授权回调失败', message: error.message }));
        }
      };

      // 立即执行异步回调处理
      handleOAuthCallback();
      return;
    }
    
    else if (pathname === '/api/wechat/user-info' && method === 'GET') {
      // 获取用户信息的API端点
      const dialogId = parsedUrl.searchParams.get('dialogId');
      
      if (!dialogId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '缺少dialogId参数' }));
        return;
      }
      
      // 读取用户数据
      let users = {};
      if (fs.existsSync(USER_DATA_FILE)) {
        try {
          const data = fs.readFileSync(USER_DATA_FILE, 'utf8');
          users = JSON.parse(data);
        } catch (error) {
          console.error('读取用户数据文件失败:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '读取用户数据失败' }));
          return;
        }
      }
      
      // 查找用户
      const userData = users[dialogId];
      if (!userData) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '未找到用户数据' }));
        return;
      }
      
      // 返回用户数据
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        openid: userData.openid,
        unionid: userData.unionid,
        nickname: userData.nickname,
        headimgurl: userData.headimgurl,
        createdAt: userData.createdAt
      }));
      return;
    }



    // 404处理
    console.log(`路径 ${pathname} 不存在，返回404`);
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  });
} else {
  console.error('无法创建HTTPS服务器: SSL凭证未正确加载');
  console.error('请检查证书文件是否存在且格式正确');

  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

// 启动服务器
try {
  if (!server) {
    console.error('=== 服务器启动失败 ===');
    console.error('原因: SSL凭证未正确加载，无法创建HTTPS服务器');
    console.error('请检查证书文件是否存在且格式正确:', privateKeyPath, certificatePath);

    if (process.env.NODE_ENV !== 'production') {
      console.warn('在开发环境中，您可以修改server.js中的证书路径以使用测试证书');
    }

    process.exit(1);
  }

  // 动态导入微信OAuth模块
  const loadWechatOAuth = async () => {
    try {
      const modulePath = path.join(process.cwd(), 'src', 'lib', 'wechatOAuth.js');
      if (fs.existsSync(modulePath)) {
        console.log('尝试导入微信OAuth模块...');
        const module = await import(modulePath);
        wechatOAuth = module.default;
        WechatOAuth = module.WechatOAuth;
        console.log('微信OAuth模块导入成功');
      } else {
        console.warn('微信OAuth模块不存在，跳过导入');
      }
    } catch (error) {
      console.error('导入微信OAuth模块失败:', error.message);
    }
  };

  // 先加载微信OAuth模块，然后启动服务器
  loadWechatOAuth().then(() => {
    server.listen(port, () => {
      console.log(`=== 微信OAuth服务启动成功 ===`);
      console.log(`监听端口: ${port}`);
      console.log(`服务类型: HTTPS`);
      console.log(`服务地址: https://localhost:${port}`);
      console.log(`运行环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`\n可用API端点:`);
      console.log(`- GET /api/wechat/auth-url?dialogId=xxx - 获取微信授权URL`);
      console.log(`- GET /api/wechat/callback - 微信授权回调处理`);
    });
  });

  // 处理端口占用等错误
  server.on('error', (error) => {
    console.error(`=== 服务器启动错误 ===`);

    if (error.code === 'EACCES') {
      console.error(`错误: 需要管理员权限来监听端口 ${port}`);
      console.error(`解决方案: 在Linux/Mac上使用sudo，在Windows上以管理员身份运行命令行`);
    } else if (error.code === 'EADDRINUSE') {
      console.error(`错误: 端口 ${port} 已被占用`);
      console.error(`解决方案: 检查是否有其他进程占用该端口，或修改端口配置`);
    } else {
      console.error(`错误详情:`, error);
    }

    if (process.env.NODE_ENV === 'production') {
      console.error('在生产环境中遇到启动错误，程序将退出');
      process.exit(1);
    }
  });

  // 优雅关闭处理
  const gracefulShutdown = () => {
    console.log('\n=== 正在关闭服务器... ===');
    server.close(() => {
      console.log('服务器已成功关闭');
      process.exit(0);
    });

    setTimeout(() => {
      console.error('服务器关闭超时，强制退出');
      process.exit(1);
    }, 5000);
  };

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);

} catch (error) {
  console.error(`=== 启动服务器时发生异常 ===`);
  console.error(error);
  process.exit(1);
}