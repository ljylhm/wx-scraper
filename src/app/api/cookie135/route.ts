import { NextResponse } from 'next/server';
import { getUserCookie, isCookieValid } from '@/lib/135user';

// 设置CORS头信息
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// 处理OPTIONS请求
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * 获取135编辑器cookie信息的API
 */
export async function GET() {
  try {
    // 从查询参数中获取API密钥（可选的安全措施）
    // 如果需要API密钥验证，取消下面的注释并实现逻辑
    /* 
    const apiKey = request.nextUrl.searchParams.get('key');
    if (apiKey !== process.env.API_KEY) {
      return NextResponse.json(
        { error: '无效的API密钥' },
        { status: 401, headers: corsHeaders }
      );
    }
    */
    
    // 获取cookie信息
    const cookieInfo = getUserCookie();
    const isValid = isCookieValid();
    
    // 返回cookie信息
    return NextResponse.json({
      success: true,
      data: {
        cookie: cookieInfo.cookie,
        username: cookieInfo.username,
        lastUpdated: cookieInfo.lastUpdated,
        lastUpdatedTime: new Date(cookieInfo.lastUpdated).toLocaleString(),
        isValid
      }
    }, { headers: corsHeaders });
    
  } catch (error) {
    console.error('获取cookie信息失败:', error);
    return NextResponse.json(
      { 
        error: '获取cookie信息失败', 
        message: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500, headers: corsHeaders }
    );
  }
} 