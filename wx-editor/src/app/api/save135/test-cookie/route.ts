import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// 设置CORS头信息
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// 处理OPTIONS请求
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * 测试135编辑器Cookie有效性的API
 * 接收Cookie，尝试访问135编辑器，确认是否已登录
 */
export async function POST(request: NextRequest) {
  try {
    // 从请求体中获取Cookie
    const body = await request.json();
    const { cookie } = body;

    if (!cookie) {
      return NextResponse.json(
        { error: '请提供Cookie' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('开始测试Cookie有效性');

    // 使用axios访问135编辑器的个人中心页面
    const response = await axios.get(
      'https://www.135editor.com/beautify_editor.html',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Cookie': cookie,
        },
        timeout: 10000, // 10秒超时
      }
    );

    // 获取响应数据
    const html = response.data;

    // 检查页面内容是否包含登录相关内容
    const isLoggedIn = typeof html === 'string' && !html.includes('登录您的账户') && !html.includes('立即登录');

    if (isLoggedIn) {
      // 尝试提取用户名
      let username = '未知用户';
      if (typeof html === 'string') {
        // 尝试匹配用户名
        const usernameMatch = html.match(/<span[^>]*class="username"[^>]*>([^<]+)<\/span>/i);
        if (usernameMatch && usernameMatch[1]) {
          username = usernameMatch[1].trim();
        }
      }

      return NextResponse.json({
        success: true,
        valid: true,
        message: `Cookie有效，已登录用户: ${username}`,
        username,
      }, { headers: corsHeaders });
    } else {
      return NextResponse.json({
        success: true,
        valid: false,
        message: 'Cookie无效或已过期，请重新登录获取',
      }, { headers: corsHeaders });
    }

  } catch (error) {
    console.error('测试Cookie失败:', error);
    
    // 确定错误状态码和消息
    let statusCode = 500;
    let errorMessage = error instanceof Error ? error.message : '未知错误';
    
    // 检查是否是网络错误或超时
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        statusCode = 504;
        errorMessage = '请求超时，请稍后再试';
      } else if (error.response) {
        statusCode = error.response.status;
        errorMessage = `服务器返回错误: ${error.response.status}`;
      } else if (error.request) {
        statusCode = 503;
        errorMessage = '无法连接到135编辑器服务器';
      }
    }
    
    // 返回错误响应
    return NextResponse.json(
      {
        error: '测试Cookie失败',
        message: errorMessage,
      },
      { status: statusCode, headers: corsHeaders }
    );
  }
} 