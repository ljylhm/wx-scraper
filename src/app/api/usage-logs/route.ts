import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// 获取使用日志记录
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secretId = searchParams.get('secretId');
    const platformType = searchParams.get('platformType');
    
    // 构建查询条件
    const where: Prisma.secret_usage_logWhereInput = {};
    if (secretId && !isNaN(Number(secretId))) {
      where.secret_id = Number(secretId);
    }
    if (platformType) {
      where.platform_type = platformType;
    }
    
    const logs = await prisma.secret_usage_log.findMany({
      where,
      include: {
        secret_key: {
          select: {
            id: true,
            secret_content: true,
            is_active: true
          }
        }
      },
      orderBy: {
        used_time: 'desc'
      }
    });
    
    return NextResponse.json({
      code: 0,
      message: '获取使用日志成功',
      data: logs
    });
  } catch (error) {
    console.error('获取使用日志失败:', error);
    return NextResponse.json(
      { 
        code: 500,
        message: '获取使用日志失败', 
        error: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    );
  }
}

// 创建使用日志记录
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { secretId, platformType, content, targetAccount } = body;
    
    // 验证必填字段
    if (!secretId || !platformType || !content || !targetAccount) {
      return NextResponse.json(
        { 
          code: 400,
          message: '缺少必要参数' 
        },
        { status: 400 }
      );
    }
    
    // 检查密钥是否存在且有效
    const secretKey = await prisma.secret_key.findUnique({
      where: { id: Number(secretId) }
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
    
    if (!secretKey.is_active) {
      return NextResponse.json(
        { 
          code: 403,
          message: '密钥已被禁用' 
        },
        { status: 403 }
      );
    }
    
    // 使用事务保证数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 创建使用记录
      const newLog = await tx.secret_usage_log.create({
        data: {
          secret_id: Number(secretId),
          platform_type: platformType,
          content,
          target_account: targetAccount
        }
      });
      
      // 更新密钥使用次数
      await tx.secret_key.update({
        where: { id: Number(secretId) },
        data: { 
          use_count: { increment: 1 }
        }
      });
      
      return newLog;
    });
    
    return NextResponse.json({
      code: 0,
      message: '记录使用日志成功',
      data: result
    }, { status: 201 });
  } catch (error) {
    console.error('记录使用日志失败:', error);
    return NextResponse.json(
      { 
        code: 500,
        message: '记录使用日志失败', 
        error: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    );
  }
}

