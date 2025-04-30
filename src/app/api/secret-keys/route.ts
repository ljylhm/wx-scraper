import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { randomBytes } from 'crypto';

const DEFAULT_USE_COUNT = 2

// 生成随机密钥
function generateSecretKey(length = 32) {
  return randomBytes(length).toString('hex');
}

// 获取所有密钥
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const isActive = searchParams.get('isActive');
    
    // 构建查询条件
    const where: Record<string, unknown> = {};
    if (isActive !== null) {
      where.is_active = isActive === 'true';
    }
    
    const secretKeys = await prisma.secret_key.findMany({
      where,
      select: {
        id: true,
        secret_content: true,
        created_time: true,
        is_active: true,
        use_count: true,
        _count: {
          select: {
            secret_usage_log: true
          }
        }
      },
      orderBy: {
        created_time: 'desc'
      }
    });
    
    return NextResponse.json({
      code: 0,
      message: '获取密钥列表成功',
      data: secretKeys
    });
  } catch (error) {
    console.error('获取密钥失败:', error);
    return NextResponse.json(
      { 
        code: 500,
        message: '获取密钥列表失败', 
        error: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    );
  }
}

// 创建新密钥
export async function POST() {
  try {
    // 自动生成一个密钥内容
    const secretContent = generateSecretKey();
    
    // 检查密钥是否已存在
    const existingKey = await prisma.secret_key.findUnique({
      where: { secret_content: secretContent }
    });
    
    if (existingKey) {
      return NextResponse.json(
        { 
          code: 400,
          message: '该密钥已存在' 
        },
        { status: 400 }
      );
    }
    
    // 创建新密钥
    const newSecretKey = await prisma.secret_key.create({
      data: {
        secret_content: secretContent,
        is_active: true,
        use_count: DEFAULT_USE_COUNT
      }
    });
    
    return NextResponse.json({
      code: 0,
      message: '创建密钥成功',
      data: newSecretKey
    }, { status: 201 });
  } catch (error) {
    console.error('创建密钥失败:', error);
    return NextResponse.json(
      { 
        code: 500,
        message: '创建密钥失败', 
        error: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    );
  }
}

// 更新密钥状态（启用/禁用）
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, isActive } = body;
    
    if (!id || isActive === undefined) {
      return NextResponse.json(
        { 
          code: 400,
          message: '缺少必要参数' 
        },
        { status: 400 }
      );
    }
    
    // 检查密钥是否存在
    const secretKey = await prisma.secret_key.findUnique({
      where: { id: Number(id) }
    });
    
    if (!secretKey) {
      return NextResponse.json(
        { 
          code: 404,
          message: '密钥不存在' 
        },
        { status: 404 }
      );
    }
    
    // 更新密钥状态
    const updatedSecretKey = await prisma.secret_key.update({
      where: { id: Number(id) },
      data: { 
        is_active: Boolean(isActive)
      }
    });
    
    return NextResponse.json({
      code: 0,
      message: '更新密钥状态成功',
      data: updatedSecretKey
    });
  } catch (error) {
    console.error('更新密钥状态失败:', error);
    return NextResponse.json(
      { 
        code: 500,
        message: '更新密钥状态失败', 
        error: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    );
  }
} 