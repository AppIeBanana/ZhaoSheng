// 这个脚本用于简单检查App组件的导入
console.log('尝试导入App组件...');
try {
  // 使用动态导入来检查App组件
  import('./src/App.tsx').then(module => {
    console.log('App组件导入成功！');
    console.log('App组件类型:', typeof module.default);
  }).catch(error => {
    console.error('导入App组件时出错:', error);
  });
} catch (error) {
  console.error('动态导入语法不支持，请使用Node.js 14+版本');
  console.error('错误:', error);
}