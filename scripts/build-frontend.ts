#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

async function buildFrontend() {
  console.log('🚀 开始构建前端...');
  
  try {
    // 1. 构建前端
    console.log('📦 正在构建前端应用...');
    execSync('cd frontend && yarn build', { stdio: 'inherit' });
    
    // 2. 清理旧的 public 目录
    console.log('🧹 清理构建目录...');
    const publicDir = path.resolve('./public');
    await fs.remove(publicDir);
    
    // 3. 创建新的 public 目录
    await fs.ensureDir(publicDir);
    
    // 4. 复制构建产物
    console.log('📂 复制构建产物...');
    const frontendDistDir = path.resolve('./frontend/dist');
    await fs.copy(frontendDistDir, publicDir);
    
    // 5. 复制配置文件
    console.log('⚙️ 复制配置文件...');
    const routesSource = path.resolve('./frontend/public/_routes.json');
    const routesTarget = path.resolve('./public/_routes.json');
    await fs.copy(routesSource, routesTarget);
    
    console.log('✅ 前端构建完成！');
  } catch (error) {
    console.error('❌ 构建失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  buildFrontend();
}

export default buildFrontend; 