import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

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
 * 保存文章到135编辑器的API
 * 接收内容和标题，将其发送到135编辑器进行保存
 */
export async function POST(request: NextRequest) {
  try {
    // 从请求体中获取内容和标题
    const body = await request.json();
    const { content, title, cookie } = body;

    if (!content) {
      return NextResponse.json(
        { error: '请提供文章内容' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: '请提供文章标题' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 判断是否提供了cookie
    if (!cookie) {
      return NextResponse.json(
        { 
          error: '需要登录后才能保存文章', 
          message: '请提供135编辑器的登录Cookie', 
          needLogin: true 
        },
        { status: 401, headers: corsHeaders }
      );
    }

    console.log(`开始保存文章: ${title}, 内容长度: ${content.length}`);

    // 创建URLSearchParams对象模拟表单数据
    const formData = new URLSearchParams();
    formData.append('data[WxMsg][content]', content);
    formData.append('data[WxMsg][name]', title);

    // 使用axios发送POST请求到135编辑器
    const response = await axios.post(
      'https://www.135editor.com/wx_msgs/save/?nosync=1&inajax=1&team_id=0&mid=&idx=&inajax=1',
      formData.toString(), // 转换为表单字符串
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Origin': 'https://www.135editor.com',
          'Referer': 'https://www.135editor.com/editor_styles/wxeditor',
          'Cookie': cookie, // 使用传入的cookie
        },
        timeout: 10000, // 10秒超时
      }
    );

    // 获取响应数据
    const responseData = response.data;
    console.log('保存文章响应:', responseData);

    // 检查响应中是否包含登录页面内容
    if (typeof responseData === 'string' && responseData.includes('登录您的账户')) {
      return NextResponse.json(
        { 
          error: '保存失败，需要登录', 
          message: 'Cookie已过期或无效，请重新登录135编辑器',
          needLogin: true 
        },
        { status: 401, headers: corsHeaders }
      );
    }

    // 检查响应是否成功
    if (response.status !== 200 || (typeof responseData === 'object' && responseData.ret !== 0)) {
      return NextResponse.json(
        { 
          error: '保存文章失败', 
          message: typeof responseData === 'object' ? responseData.msg || '未知错误' : '服务器返回非预期响应' 
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // 返回成功响应
    return NextResponse.json({
      success: true,
      message: '文章保存成功',
      data: responseData,
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('保存文章失败:', error);
    
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
        error: '保存文章失败',
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: statusCode, headers: corsHeaders }
    );
  }
} 