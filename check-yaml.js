import fs from 'fs';
import yaml from 'js-yaml';

try {
  // 读取文件内容
  const content = fs.readFileSync('.gitlab-ci.yml', 'utf8');
  
  // 解析YAML
  const config = yaml.load(content);
  
  console.log('YAML解析成功！');
  
  console.log('\nGitLab CI配置检查:');
  
  // 检查install_dependencies作业的配置
  if (config.install_dependencies) {
    console.log('\ninstall_dependencies作业检查:');
    console.log('- 存在artifacts配置:', config.install_dependencies.artifacts ? '是' : '否');
    console.log('- 存在cache配置:', config.install_dependencies.cache ? '是' : '否');
    console.log('- cache是否在正确位置:', config.install_dependencies.cache && !config.install_dependencies.artifacts?.cache ? '是' : '否');
  } else {
    console.log('未找到install_dependencies作业');
  }
  
  // 检查checkout_code作业
  if (config.checkout_code && config.checkout_code.script) {
    console.log('\ncheckout_code作业检查:');
    console.log('- script类型:', Array.isArray(config.checkout_code.script) ? '数组' : typeof config.checkout_code.script);
  }
  
  // 列出所有作业
  console.log('\n所有定义的作业:');
  const stages = config.stages || [];
  Object.keys(config).forEach(key => {
    // 排除非作业配置项
    if (!['variables', 'stages', 'default'].includes(key) && typeof config[key] === 'object') {
      console.log(`- ${key}`);
    }
  });
  
} catch (error) {
  console.error('YAML解析错误:', error.message);
  console.error('错误位置:', error.mark ? `第${error.mark.line}行，第${error.mark.column}列` : '未知');
}

// 验证script格式是否为字符串或最多10层嵌套的字符串数组
function validateScriptFormat(script, depth) {
  if (depth > 10) return false;
  
  if (typeof script === 'string') {
    return true;
  } else if (Array.isArray(script)) {
    return script.every(item => validateScriptFormat(item, depth + 1));
  }
  
  return false;
}