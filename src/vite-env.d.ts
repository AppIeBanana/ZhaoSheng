/// <reference types="vite/client" />

// 声明CSS模块类型，解决TypeScript无法识别CSS文件的问题
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

// 可选：添加其他样式文件类型声明
declare module '*.scss' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.sass' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.less' {
  const content: Record<string, string>;
  export default content;
}