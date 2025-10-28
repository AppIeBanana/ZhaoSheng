/** WARNING: DON'T EDIT THIS FILE - 已修改以支持子路径部署 */
/** 为支持在 /projects/ZhaoSheng 路径下部署，添加了 base 配置 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

function getPlugins() {
  const plugins = [react(), tsconfigPaths()];
  return plugins;
}

export default defineConfig(({ mode }) => ({
  plugins: getPlugins(),
  // 添加 base 配置以支持在子路径 /projects/ZhaoSheng 下部署
  base: process.env.NODE_ENV === 'production' ? '/projects/ZhaoSheng/' : '/',
  // 确保构建输出目录与 package.json 中的 build 脚本一致
  build: {
    outDir: 'dist/static',
    // 确保资源路径正确
    assetsDir: 'assets',
    // 确保生成的文件名称稳定，便于缓存
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  // 环境变量前缀，Vite会将其注入到应用中
  envPrefix: 'VITE_',
}));
