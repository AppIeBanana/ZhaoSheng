// 项目环境检查脚本
// 用于验证项目依赖和配置是否正确

import fs from 'fs';
import path from 'path';

console.log('=====================================');
console.log('福州软件职业技术学院AI招生系统 - 环境检查');
console.log('=====================================');
console.log('');

// 检查Node.js版本
console.log('1. 检查Node.js版本:');
const nodeVersion = process.version;
console.log(`   当前版本: ${nodeVersion}`);
const versionParts = nodeVersion.substring(1).split('.');
const majorVersion = parseInt(versionParts[0]);
if (majorVersion >= 16) {
    console.log('   ✓ Node.js版本符合要求 (>=16)');
} else {
    console.log('   ✗ 警告: Node.js版本过低，建议升级到16.x或更高版本');
}
console.log('');

// 检查项目目录
console.log('2. 检查项目目录:');
const currentDir = process.cwd();
console.log(`   当前目录: ${currentDir}`);

// 检查package.json文件
console.log('3. 检查package.json文件:');
const packageJsonPath = path.join(currentDir, 'package.json');
if (fs.existsSync(packageJsonPath)) {
    console.log('   ✓ package.json文件存在');
    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        console.log(`   项目名称: ${packageJson.name}`);
        console.log(`   项目版本: ${packageJson.version}`);
        console.log(`   脚本命令: ${Object.keys(packageJson.scripts).join(', ')}`);
    } catch (error) {
        console.log('   ✗ 错误: 无法解析package.json文件');
    }
} else {
    console.log('   ✗ 错误: package.json文件不存在');
    console.log('   请确认您在正确的项目目录中');
}
console.log('');

// 检查node_modules目录
console.log('4. 检查node_modules目录:');
const nodeModulesPath = path.join(currentDir, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
    console.log('   ✓ node_modules目录存在');
    // 检查关键依赖
    const keyDeps = ['react', 'react-dom', 'react-router-dom', 'vite'];
    keyDeps.forEach(dep => {
        const depPath = path.join(nodeModulesPath, dep);
        if (fs.existsSync(depPath)) {
            console.log(`   ✓ ${dep} 依赖已安装`);
        } else {
            console.log(`   ✗ ${dep} 依赖未安装`);
        }
    });
} else {
    console.log('   ✗ 错误: node_modules目录不存在');
    console.log('   请先运行: npm install 或 pnpm install');
}
console.log('');

// 检查源代码目录
console.log('5. 检查源代码目录:');
const srcPath = path.join(currentDir, 'src');
if (fs.existsSync(srcPath)) {
    console.log('   ✓ src目录存在');
    // 检查关键文件
    const keyFiles = ['main.tsx', 'App.tsx', 'pages/Home.tsx'];
    keyFiles.forEach(file => {
        const filePath = path.join(srcPath, file);
        if (fs.existsSync(filePath)) {
            console.log(`   ✓ ${file} 文件存在`);
        } else {
            console.log(`   ✗ ${file} 文件不存在`);
        }
    });
} else {
    console.log('   ✗ 错误: src目录不存在');
}
console.log('');

// 检查启动脚本
console.log('6. 检查启动脚本:');
const startScripts = ['start-project.bat', 'start-direct.bat'];
startScripts.forEach(script => {
    const scriptPath = path.join(currentDir, script);
    if (fs.existsSync(scriptPath)) {
        console.log(`   ✓ ${script} 脚本存在`);
    } else {
        console.log(`   ✗ ${script} 脚本不存在`);
    }
});
console.log('');

console.log('=====================================');
console.log('环境检查完成');
console.log('');
console.log('推荐操作:');
console.log('1. 如果依赖未安装，请先运行: npm install');
console.log('2. 如果PowerShell执行策略限制，请使用: start-direct.bat');
console.log('3. 查看 SOLUTION_POWERSHELL_RESTRICTIONS.md 获取详细解决方案');