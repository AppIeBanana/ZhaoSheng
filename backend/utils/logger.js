// 日志记录模块
const fs = require('fs');
const path = require('path');

// 日志级别
const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

// 日志配置
class Logger {
  constructor(logType = 'system') {
    this.logType = logType; // system, mongodb, redis
    // 优先从配置文件加载日志路径，否则使用默认路径
    // 在生产环境中，可以通过Jenkins设置环境变量LOG_DIR为标准日志目录
    // 例如：Linux系统通常设置为 /var/log/your-app/
    const config = require('../config/configLoader').default;
    this.logDir = config.LOG_DIR || path.join(__dirname, '../logs');
    this.ensureLogDirExists();
  }

  // 确保日志目录存在
  ensureLogDirExists() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  // 获取当前日志文件名（按日期）
  getLogFileName() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return path.join(this.logDir, `${this.logType}-${year}-${month}-${day}.log`);
  }

  // 格式化日志消息
  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    let formattedMessage = `[${timestamp}] [${level.toUpperCase()}] [${this.logType}] ${message}`;
    
    if (data) {
      formattedMessage += ' ' + JSON.stringify(data);
    }
    
    return formattedMessage;
  }

  // 写入日志文件
  writeToFile(message) {
    const logFile = this.getLogFileName();
    fs.appendFile(logFile, message + '\n', (err) => {
      if (err) {
        console.error('写入日志文件失败:', err);
      }
    });
  }

  // 记录错误日志
  error(message, data = null) {
    const formattedMessage = this.formatMessage(LOG_LEVELS.ERROR, message, data);
    console.error(formattedMessage);
    this.writeToFile(formattedMessage);
  }

  // 记录警告日志
  warn(message, data = null) {
    const formattedMessage = this.formatMessage(LOG_LEVELS.WARN, message, data);
    console.warn(formattedMessage);
    this.writeToFile(formattedMessage);
  }

  // 记录信息日志
  info(message, data = null) {
    const formattedMessage = this.formatMessage(LOG_LEVELS.INFO, message, data);
    console.info(formattedMessage);
    this.writeToFile(formattedMessage);
  }

  // 记录调试日志
  debug(message, data = null) {
    const formattedMessage = this.formatMessage(LOG_LEVELS.DEBUG, message, data);
    console.debug(formattedMessage);
    this.writeToFile(formattedMessage);
  }
}

// 创建不同类型的日志实例
const systemLogger = new Logger('system');
const mongodbLogger = new Logger('mongodb');
const redisLogger = new Logger('redis');

module.exports = {
  systemLogger,
  mongodbLogger,
  redisLogger,
  Logger // 导出类，允许创建自定义日志器
};