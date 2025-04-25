import { NextResponse } from 'next/server';
import path from 'path';

export async function GET() {
  try {
    // 获取项目根目录
    const cwd = process.cwd();
    
    // cookie文件保存路径
    const cookiePath = path.join(cwd, 'data', 'cookie135.json');
    
    // 只返回相对路径，避免泄露完整服务器路径
    const relativePath = path.relative(cwd, cookiePath);
    
    return NextResponse.json({
      path: relativePath,
      cwd: cwd.split(path.sep).slice(-2).join(path.sep) // 只显示最后两级目录
    });
  } catch (error) {
    console.error('获取Cookie路径失败:', error);
    return NextResponse.json(
      { error: '获取Cookie路径失败' },
      { status: 500 }
    );
  }
} 