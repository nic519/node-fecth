#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';

async function cleanBuild() {
  console.log('🧹 正在清理构建产物...');
  
  try {
    const publicDir = path.resolve('./public');
    await fs.remove(publicDir);
    console.log('✅ 构建产物清理完成！');
  } catch (error) {
    console.error('❌ 清理失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  cleanBuild();
}

export default cleanBuild; 