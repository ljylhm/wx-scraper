import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getCookies } from '@/lib/cookieStore';

// 设置CORS头信息
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// 处理OPTIONS请求
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * 将135编辑器模板传递给其他用户的API
 * 接收模板ID和目标用户ID，调用135编辑器的传递接口
 */
export async function POST(request: NextRequest) {
  try {
    // 从请求体中获取模板ID和目标用户ID
    const body = await request.json();
    const { id, creator } = body;

    if (!id) {
      return NextResponse.json(
        { error: '请提供模板ID' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!creator) {
      return NextResponse.json(
        { error: '请提供目标用户ID' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 从缓存获取cookie
    const cookieStrings = await getCookies();
    
    if (cookieStrings.length === 0) {
      return NextResponse.json(
        { error: '未登录或登录已过期，请先登录135编辑器' },
        { status: 401, headers: corsHeaders }
      );
    }

    // 合并cookie字符串为单个cookie字符串
    const cookieString = cookieStrings.join('; ');

    console.log(`开始传递模板: ID=${id}, 目标用户=${creator}, Cookie长度: ${cookieString.length}`);

    // 创建URLSearchParams对象模拟表单数据
    const formData = new URLSearchParams();
    formData.append('id', id);
    formData.append('creator', creator);

    // 发送请求到135编辑器的传递接口
    const response = await axios.post(
      'https://www.135editor.com/wx_msgs/contr_wxmsg?team_id=0',
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookieString,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Referer': 'https://www.135editor.com/',
          'Origin': 'https://www.135editor.com'
        },
        timeout: 30000, // 30秒超时
        maxRedirects: 5
      }
    );

    // 检查响应状态
    if (response.status >= 200 && response.status < 300) {
      console.log('模板传递成功', response.data);
      
      return NextResponse.json({
        success: true,
        message: '模板传递成功',
        data: response.data
      }, { headers: corsHeaders });
    } else {
      console.error('模板传递失败', response.status, response.statusText);
      
      return NextResponse.json({
        success: false,
        error: '模板传递失败',
        status: response.status,
        statusText: response.statusText
      }, { status: response.status, headers: corsHeaders });
    }
  } catch (error) {
    console.error('模板传递失败:', error);
    
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
        
        // 尝试从响应中提取更详细的错误信息
        if (error.response.data) {
          console.error('错误响应数据:', error.response.data);
        }
      } else if (error.request) {
        statusCode = 503;
        errorMessage = '无法连接到135编辑器服务器';
      }
    }
    
    // 返回错误响应
    return NextResponse.json(
      {
        success: false,
        error: '模板传递失败',
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: statusCode, headers: corsHeaders }
    );
  }
}