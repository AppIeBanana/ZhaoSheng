// 微信服务器验证的后端处理文件
// 注意：此文件使用Node.js内置模块实现，无需安装额外依赖
import https from 'https';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { URL, URLSearchParams } from 'url';
import { Readable } from 'stream';

const port = 443;

// 尝试从配置文件导入微信验证Token
let wechatToken = 'zhaosheng2024'; // 默认值，与config.ts保持一致

try {
  // 检查是否存在配置文件
  const configPath = path.join(process.cwd(), 'src', 'lib', 'config.ts');

  if (fs.existsSync(configPath)) {
    // 读取配置文件内容
    const configContent = fs.readFileSync(configPath, 'utf8');
    // 简单的正则匹配TOKEN值
    const tokenMatch = configContent.match(/TOKEN:\s*['"]([\w\d]+)['"]/);
    if (tokenMatch && tokenMatch[1]) {
      wechatToken = tokenMatch[1];
      console.log('从配置文件读取到微信验证Token:', wechatToken);
    }
  }
} catch (error) {
  console.warn('无法读取配置文件，使用默认Token:', wechatToken, error.message);
}

// 微信验证工具类
class WechatVerify {
  static verify(signature, timestamp, nonce, echostr) {
    try {
      // 1. 将token、timestamp、nonce三个参数进行字典序排序
      const arr = [wechatToken, timestamp, nonce];
      arr.sort();

      // 2. 将三个参数字符串拼接成一个字符串进行sha1加密
      const str = arr.join('');
      const hash = crypto.createHash('sha1');
      hash.update(str);
      const result = hash.digest('hex');

      // 打印验证信息，便于调试
      console.log('微信验证详情:');
      console.log('  - 收到的signature:', signature);
      console.log('  - 计算出的signature:', result);
      console.log('  - token:', wechatToken);
      console.log('  - timestamp:', timestamp);
      console.log('  - nonce:', nonce);
      console.log('  - 排序后的数组:', arr);
      console.log('  - 拼接后的字符串:', str);

      // 3. 开发者获得加密后的字符串可与signature对比，标识该请求来源于微信
      if (result === signature) {
        console.log('✓ signature验证成功');
        return echostr;
      } else {
        console.log('✗ signature验证失败');
      }

      return null;
    } catch (error) {
      console.error('微信服务器验证失败:', error);
      return null;
    }
  }

  // 生成测试用的signature（用于本地测试）
  static generateTestSignature(timestamp = null, nonce = null) {
    // 如果没有提供timestamp或nonce，生成默认值
    const ts = timestamp || Date.now().toString();
    const nc = nonce || Math.random().toString(36).substr(2, 9);

    // 按微信算法生成signature
    const arr = [wechatToken, ts, nc];
    arr.sort();
    const str = arr.join('');
    const hash = crypto.createHash('sha1');
    hash.update(str);
    const signature = hash.digest('hex');

    console.log('生成测试用signature:');
    console.log('  - 生成的signature:', signature);
    console.log('  - timestamp:', ts);
    console.log('  - nonce:', nc);
    console.log('  - 测试URL: https://localhost:443/wechat?signature=' + signature + '&timestamp=' + ts + '&nonce=' + nc + '&echostr=test_echo');

    return { signature, timestamp: ts, nonce: nc };
  }
}

// SSL证书配置 - 基于nginx.conf中的证书路径
const privateKeyPath = process.env.NODE_ENV === 'production'
  ? '/etc/letsencrypt/live/zswd.fzrjxy.com/privkey.pem' // 生产环境私钥路径
  : path.join(process.cwd(), 'plk741023'); // 本地开发私钥文件
const certificatePath = process.env.NODE_ENV === 'production'
  ? '/etc/letsencrypt/live/zswd.fzrjxy.com/fullchain.pem' // 生产环境证书路径
  : path.join(process.cwd(), 'plk741023.pub'); // 本地开发证书文件

// 检查证书文件是否存在
if (!fs.existsSync(privateKeyPath) || !fs.existsSync(certificatePath)) {
  console.error(`错误: 找不到SSL证书文件!`);
  console.error(`私钥路径: ${privateKeyPath}`);
  console.error(`证书路径: ${certificatePath}`);

  // 如果是生产环境，退出程序
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }

  // 开发环境下提示用户
  console.warn('开发环境下请确保证书文件存在或手动创建自签名证书');
}

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

  // 在生产环境中，证书加载失败应该导致程序退出
  if (process.env.NODE_ENV === 'production') {
    console.error('在生产环境中，证书加载失败将导致程序退出');
    process.exit(1);
  } else {
    console.warn('警告: 在开发环境中，证书加载失败可能导致服务器无法正常启动');
    console.warn('请确保提供有效的SSL证书，或者修改代码使用HTTP进行开发测试');
  }
}

// 创建HTTPS服务器
let server;
if (credentials) {
  console.log('创建HTTPS服务器...');
  server = https.createServer(credentials, (req, res) => {
    const parsedUrl = new URL(req.url, `https://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    // 处理微信验证和消息推送
    if (pathname === '/wechat') {
      if (req.method === 'GET') {
        // 微信服务器验证请求
        const { signature, timestamp, nonce, echostr } = Object.fromEntries(parsedUrl.searchParams);

        console.log('收到微信服务器验证请求:', {
          signature,
          timestamp,
          nonce,
          echostr
        });

        // 验证请求
        const verifiedEchostr = WechatVerify.verify(
          signature,
          timestamp,
          nonce,
          echostr
        );

        if (verifiedEchostr) {
          console.log('微信服务器验证成功');
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end(verifiedEchostr);
        } else {
          console.log('微信服务器验证失败');
          res.writeHead(403, { 'Content-Type': 'text/plain' });
          res.end('验证失败');
        }
      } else if (req.method === 'POST') {
        // 微信消息推送
        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });
        req.on('end', () => {
          console.log('收到微信消息推送:', body);

          // 返回success响应
          res.writeHead(200, { 'Content-Type': 'application/xml' });
          res.end('<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>');
        });
      }
    } else {
      // 简单的静态文件服务和404处理
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });
} else {
  console.error('无法创建HTTPS服务器: SSL凭证未正确加载');
  console.error('请检查证书文件是否存在且格式正确');

  // 在生产环境中，无法创建服务器应该退出
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

// 启动服务器
try {
  server.listen(port, () => {
    console.log(`=== 微信服务器验证服务启动成功 ===`);
    console.log(`监听端口: ${port}`);
    console.log(`服务地址: https://localhost:${port}`);
    console.log(`生产地址: https://zswd.fzrjxy.com`);
    console.log(`微信验证路径: /wechat`);
    console.log(`微信验证Token: ${wechatToken}`);
    console.log(`运行环境: ${process.env.NODE_ENV || 'development'}`);

    // 生成测试用的signature和URL
    console.log('\n=== 本地测试信息 ===');
    console.log('微信使用的签名加密算法：');
    console.log('1. 将token、timestamp、nonce三个参数按字典序排序');
    console.log('2. 将排序后的三个参数拼接成一个字符串');
    console.log('3. 对拼接后的字符串进行SHA1加密');
    console.log('4. 将加密后的字符串作为signature参数');

    // 显示证书信息
    console.log('\n=== 证书信息 ===');
    console.log(`私钥路径: ${privateKeyPath}`);
    console.log(`证书路径: ${certificatePath}`);
    console.log(`证书状态: 已加载`);

    console.log('\n生成的测试URL（已包含正确的signature）:');
    const testData = WechatVerify.generateTestSignature();
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

    // 在生产环境中，尝试优雅退出
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

    // 设置超时强制退出
    setTimeout(() => {
      console.error('服务器关闭超时，强制退出');
      process.exit(1);
    }, 5000);
  };

  // 监听退出信号
  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);

} catch (error) {
  console.error(`=== 启动服务器时发生异常 ===`);
  console.error(error);
  process.exit(1);
}

console.log('\n=== 微信公众平台配置信息 ===');
console.log('1. 填写服务器配置:');
console.log('   - 服务器地址(URL): https://zswd.fzrjxy.com/wechat');
console.log(`   - Token: ${wechatToken}`);
console.log('   - 消息加解密方式: 明文模式');
console.log('   - 编码格式: UTF-8');
console.log('\n2. 验证服务器地址的有效性:');
console.log('   - 配置完成后点击"提交"按钮');
console.log('   - 微信服务器会发送GET请求到您的服务器地址');
console.log('   - 本服务会自动验证请求并返回正确的echostr');
console.log('\n3. 配置完成后:');
console.log('   - 您的服务器将能够接收微信用户消息');
console.log('   - 可以通过POST /wechat端点处理微信消息推送');
console.log('   - 确保服务器24小时在线以接收微信消息');