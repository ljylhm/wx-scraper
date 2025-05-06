import { NextResponse } from 'next/server';
import { storeCookies } from '@/lib/cookieStore';

export async function GET() {
  try {
    const url = 'https://bj.96weixin.com/login/phone';
    
    const formData = new URLSearchParams();
    formData.append('phone', '15850225218');
    formData.append('password', '123456');
    formData.append('remember', '1');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://bj.96weixin.com/'
      },
      body: formData,
    });
    
    const responseData = await response.text();
    // 检查响应数据中是否包含"登录成功"字样
    const isLoginSuccess = responseData.includes('登录成功');
    
    // 如果登录成功，记录日志
    if (isLoginSuccess) {
      console.log('96微信编辑器登录成功');
    } else {
      console.log('96微信编辑器登录失败，响应中未包含"登录成功"字样');
    }
    

    console.log("responseData",responseData);
    // 获取所有的 Set-Cookie 头
    const cookieHeader = response.headers.get('set-cookie');

    // 处理cookie，移除expires、max-age等无关信息
    let processedCookie = '';
    if (cookieHeader) {
      // 将cookie字符串分割成单独的cookie
      const cookies = cookieHeader.split(',');
      const essentialCookies = [];
      
      for (const cookie of cookies) {
        // 提取cookie的名称和值部分，忽略expires、max-age等
        const cookieParts = cookie.split(';');
        if (cookieParts.length > 0) {
          const nameValuePart = cookieParts[0].trim();
          // 检查是否包含日期时间格式（如01-Jan-1970 00:00:01）以及忽略xxx=deleted的cookie
          if (!nameValuePart.match(/\d{2}-[A-Za-z]{3}-\d{4} \d{2}:\d{2}:\d{2}/) && 
              !nameValuePart.includes('=deleted')) {
            // 只保留cookie的名称和值，且不包含日期时间格式和deleted标记
            essentialCookies.push(nameValuePart);
          }
        }
      }
      
      // 将处理后的cookie重新组合
      processedCookie = essentialCookies.join('; ');
      // 使用cookieStore保存cookie
      storeCookies(essentialCookies, '96');
    }
 
    // 将cookie和响应数据一起返回
    const data = {
      cookies: processedCookie
    };
    
    return NextResponse.json({
        success: true,
        message: "登录成功",
        data: data
    },{
      status: response.status,
      headers: {
        'Content-Type': 'application/json'
      },
    });
  } catch (error) {
    console.error('登录请求失败:', error);
    return NextResponse.json({ error: '登录请求失败' }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}