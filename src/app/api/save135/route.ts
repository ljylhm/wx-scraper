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
 * 获取登录cookie
 * 如果已有cookie则直接返回，否则调用登录接口获取新cookie
 */
async function getLoginCookies() {
  // 尝试获取已有cookie
  let cookieStrings = await getCookies("135");
  
  // 如果没有cookie，调用登录接口
  if (!cookieStrings || cookieStrings.length === 0) {
    console.log('Cookie不存在，自动调用登录接口');
    try {
      // 调用登录接口
      const response = await axios.get(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/login135`);
      
      if (response.data && response.data.success && response.data.cookies) {
        console.log('自动登录成功');
        cookieStrings = response.data.cookies;
      } else {
        console.error('自动登录失败:', response.data?.error || '未知错误');
      }
    } catch (error) {
      console.error('调用登录API失败:', error);
    }
  }
  
  return cookieStrings;
}

/**
 * 保存文章到135编辑器的API
 * 接收内容和标题，将其发送到135编辑器进行保存
 */
export async function POST(request: NextRequest) {
  try {
    // 从请求体中获取内容和标题
    const body = await request.json();
    const { content, title } = body;

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

    // 获取cookie，如果没有则自动登录
    const cookieStrings = await getLoginCookies();
    
    if (!cookieStrings || cookieStrings.length === 0) {
      return NextResponse.json(
        { 
          error: '无法获取登录状态', 
          message: '自动登录失败，请先手动登录',
          needLogin: true 
        },
        { status: 401, headers: corsHeaders }
      );
    }

    // 提取所有cookie，简化为name=value格式
    const simplifiedCookies = cookieStrings.map(cookieStr => {
      // 提取所有cookie字段，不仅仅是第一个name=value
      return cookieStr.split(';')
        .map(part => part.trim())
        .filter(part => part.includes('='))
        .join('; ');
    }).join('; ');

    console.log(`开始保存文章: ${title}, 内容长度: ${content.length}, Cookie长度: ${simplifiedCookies.length}`);

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
          'Cookie': simplifiedCookies, // 使用从缓存获取的cookie
        },
        timeout: 15000, // 15秒超时
      }
    );

    // 获取响应数据
    const responseData = response.data;
    // console.log('保存文章响应:', responseData);

    // 检查响应中是否包含登录页面内容
    if (typeof responseData === 'string' && (
      responseData.includes('登录您的账户') || 
      responseData.includes('login-submit') ||
      responseData.includes('UserEmail')
    )) {
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


    // 返回成功响应，包含文章ID
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