import { NextResponse } from 'next/server';
import { storeCookies } from '@/lib/cookieStore';

export async function GET() {
  try { 
    // 登录URL
    const loginUrl = 'https://www.135editor.com/users/login?&inajax=1&team_id=0';
    
    // 固定的登录参数
    const formData = new URLSearchParams();
    formData.append('type', 'html');
    formData.append('state', 'postmsg');
    formData.append('data[User][referer]', 'https://www.135editor.com/');
    formData.append('data[User][email]', '15850225218');
    formData.append('data[User][password]', '123456');
    formData.append('data[User][remember_me]', '604800');
    
    // 发送登录请求
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      body: formData.toString(),
      redirect: 'manual'
    });
    
    // 获取响应头中的Set-Cookie
    const setCookieHeader = response.headers.get('set-cookie');
    console.log('原始Set-Cookie:', setCookieHeader);
    
    // 提取重要的cookie字段
    const cookies = [];
    
    // 初始化变量
    let phpSessionId = null;
    let serverId = null;
    let auth = null;
    let phpSessionMatch = null;
    let serverIdMatch = null;
    let authMatch = null;
    
    if (setCookieHeader) {
      // 提取PHPSESSID
      phpSessionMatch = setCookieHeader.match(/PHPSESSID=([^;]+)/);
      phpSessionId = phpSessionMatch ? phpSessionMatch[1] : null;
      
      // 提取SERVERID
      serverIdMatch = setCookieHeader.match(/SERVERID=([^;]+)/);
      serverId = serverIdMatch ? serverIdMatch[1] : null;
      
      // 提取MIAOCMS2[Auth]
      authMatch = setCookieHeader.match(/MIAOCMS2\[Auth\]=([^;]+)/);
      auth = authMatch ? authMatch[1] : null;
      
      console.log('提取的字段:', { phpSessionId, serverId, auth });
      
      // 组合成一个新的cookie字符串
      let combinedCookie = '';
      
      if (phpSessionId) {
        combinedCookie += `PHPSESSID=${phpSessionId};`;
      }
      
      if (serverId) {
        combinedCookie += `SERVERID=${serverId};`;
      }
      
      if (auth) {
        combinedCookie += `MIAOCMS2[Auth]=${auth};`;
      }
      
      if (combinedCookie) {
        cookies.push(combinedCookie);
        console.log('组合后的cookie:', combinedCookie);
      } else {
        // 如果没有提取到重要字段，使用完整的setCookieHeader
        cookies.push(setCookieHeader);
        console.log('未能提取重要字段，使用完整cookie');
      }
    }
    
    // 存储cookie到全局缓存
    if (cookies.length > 0) {
      storeCookies(cookies);
      console.log('cookie已存储到缓存');
    } else {
      console.warn('没有获取到cookie');
    }
    
    // 获取响应内容
    const responseText = await response.text();
    
    return NextResponse.json({
      success: true,
      cookies,
      isCached: false,
      responseStatus: response.status,
      responseStatusText: response.statusText,
      extractedFields: {
        phpSessionId,
        serverId,
        auth
      },
      responseBody: responseText.substring(0, 500) // 只返回部分响应内容，避免过大
    });
  } catch (error) {
    console.error('登录失败:', error);
    return NextResponse.json(
      { success: false, error: '登录请求失败' },
      { status: 500 }
    );
  }
}

// 添加一个清除cookie缓存的接口
export async function DELETE() {
  try {
    // 清除缓存的cookie
    const { clearCookies } = await import('@/lib/cookieStore');
    clearCookies();
    
    return NextResponse.json({
      success: true,
      message: '已清除缓存的cookie'
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '清除cookie失败';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 