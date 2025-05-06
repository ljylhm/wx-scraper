import { NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';
import { getCookies } from '@/lib/cookieStore';

export async function POST(request: Request) {
  try {
    // 从请求体获取content和title参数
    const body = await request.json();
    const { content, title, to_user } = body;

    if (!content) {
      return NextResponse.json({ error: '内容不能为空' }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: '标题不能为空' }, { status: 400 });
    }

    // 从Redis获取96平台的cookies
    const cookies = await getCookies('96');
    console.log("cookies", cookies);
    
    // 如果没有cookie，尝试使用默认cookie（仅用于测试）
    const cookieString = cookies && cookies.length > 0 
      ? cookies.join('; ')
      : 'Hm_lvt_f677b3c87a55ab5f76e62b412244a2cd=1746498889; HMACCOUNT=97EF80D6B09E3BB9; vip_Notification=1; device_info={"platform":"MacIntel","language":"zh-CN","width":1512,"height":982,"system":"Mac OS 10.15.7","ip":"61.169.45.*"}; notCloseMsg=0; 96weixin_User_id=200755871; 96weixin_User_vip=1; 96weixin_User_token=1264684b6fe7de91bd3eee504ee55e43; 96weixin_client_code=63e75d426cb52ec6b862b3dcdb7ec4c4; 96weixin_client_token=d6dcc0a6def5582f8d3a9f7f2addb88b; 96weixin_User_logindate=20250506; 96weixin_personal_User_name=15850225218; Hm_lpvt_f677b3c87a55ab5f76e62b412244a2cd=1746529862';
    
    if (!cookieString) {
      return NextResponse.json({ error: '未找到有效的登录凭证，请先登录' }, { status: 401 });
    }

    // 创建要发送的数据
    const formData = new URLSearchParams();
    formData.append('cate_id', '0');
    formData.append('id', '');
    formData.append('name', title);
    formData.append('summary', '');
    formData.append('thumbnail', '');
    formData.append('link', '');
    formData.append('author', '');
    formData.append('artcover', '0');
    formData.append('original', 'false');
    formData.append('need_open_comment', '0');
    formData.append('only_fans_can_comment', '0');
    formData.append('save_to_user', '1');
    formData.append('to_user', to_user || '');
    formData.append('content', content);

    // 发送请求 - 严格按照curl的头信息配置
    const response = await axios.post(
      'https://bj.96weixin.com/indexajax/saveart',
      formData.toString(), // 使用toString()方法，确保数据格式正确
      {
        headers: {
          'accept': '*/*',
          'accept-language': 'zh-CN,zh;q=0.9',
          'cache-control': 'no-cache',
          'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'origin': 'https://bj.96weixin.com',
          'pragma': 'no-cache',
          'priority': 'u=1, i',
          'referer': 'https://bj.96weixin.com/',
          'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
          'x-requested-with': 'XMLHttpRequest',
          'Cookie': cookieString
        }
      }
    );

    console.log("响应状态:", response.status);
    console.log("响应数据:", response.data);

    // 处理响应
    if (response.status !== 200) {
      return NextResponse.json({ 
        success: false,
        error: '保存失败', 
        message: '服务器返回非200状态码',
        statusCode: response.status
      }, { status: response.status });
    }

    const responseData = response.data;
    
    // 判断保存是否成功
    if (!responseData || responseData.status !== 1) {
      return NextResponse.json({ 
        success: false,
        error: '保存失败', 
        message: responseData?.info || '未知错误',
        data: responseData
      }, { status: 400 });
    }

    // 返回成功结果
    return NextResponse.json({
      success: true,
      message: "保存成功",
      data: responseData
    });
  } catch (error: unknown) {
    console.error('保存96文章失败:', error);
    
    // 提取详细错误信息
    let errorMessage = '未知错误';
    let responseData = undefined;
    let statusCode = 500;
    
    if (error instanceof AxiosError) {
      errorMessage = error.message;
      responseData = error.response?.data;
      statusCode = error.response?.status || 500;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ 
      success: false,
      error: '保存96文章失败', 
      message: errorMessage,
      statusCode,
      responseData
    }, {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
