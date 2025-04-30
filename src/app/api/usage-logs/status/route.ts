import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 获取特定密钥的使用情况
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secretId = searchParams.get('secret_id');
    
    if (!secretId) {
      return NextResponse.json(
        { 
          code: 400,
          message: '请提供有效的密钥ID' 
        },
        { status: 400 }
      );
    }
    
    // 1. 查询密钥信息
    const secretKey = await prisma.secret_key.findUnique({
      where: { secret_content: secretId }
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
    
    // 2. 查询密钥使用记录
    const usageLogs = await prisma.secret_usage_log.findMany({
      where: { secret_id: secretKey.id },
      orderBy: { used_time: 'desc' }
    });
    
    // 3. 获取使用统计信息
    const platformStats = await prisma.$queryRaw`
      SELECT 
        platform_type,
        COUNT(*) as count,
        COUNT(DISTINCT target_account) as accounts_reached
      FROM 
        secret_usage_log
      WHERE 
        secret_id = ${secretKey.id}
      GROUP BY 
        platform_type
      ORDER BY 
        count DESC
    `;
    
    // 4. 查询最近一次使用记录
    const latestUsage = usageLogs.length > 0 ? usageLogs[0] : null;
    
    // 5. 查询使用过这个密钥的不同账户
    const uniqueAccounts: { target_account: string }[] = await prisma.$queryRaw`
      SELECT DISTINCT target_account
      FROM secret_usage_log
      WHERE secret_id = ${secretKey.id}
      ORDER BY target_account
    `;
    
    // 组装并返回结果
    return NextResponse.json({
      code: 0,
      message: '获取密钥使用状态成功',
      data: {
        secretKey: {
          id: secretKey.id,
          secret_content: secretKey.secret_content,
          created_time: secretKey.created_time,
          is_active: secretKey.is_active,
          use_count: secretKey.use_count
        },
        usage: {
          total: usageLogs.length,
          latest: latestUsage,
          platformStats: platformStats,
          uniqueAccounts: uniqueAccounts.map(account => account.target_account)
        }
      }
    });
  } catch (error) {
    console.error('获取密钥使用状态失败:', error);
    return NextResponse.json(
      { 
        code: 500,
        message: '获取密钥使用状态失败', 
        error: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    );
  }
} 