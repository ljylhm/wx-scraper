import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
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

// 支持GET方式
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  const selector = request.nextUrl.searchParams.get('selector') || '#fullpage';
  
  return handleScrape(url, selector);
}

// 支持POST方式
export async function POST(request: NextRequest) {
  try {
    // 从请求体中获取URL和选择器（可选）
    const body = await request.json();
    const { url, selector = '#fullpage' } = body;
    
    return handleScrape(url, selector);
  } catch (error) {
    console.error('解析请求体失败:', error);
    return NextResponse.json(
      { 
        error: '请求参数错误', 
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 400, headers: corsHeaders }
    );
  }
}

// 统一处理爬取逻辑
async function handleScrape(url: string | null, selector: string) {
  try {
    if (!url) {
      return NextResponse.json(
        { error: '请提供网页URL' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`开始爬取URL: ${url}, 使用选择器: ${selector}`);

    // 使用axios获取网页内容
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': url,
      },
      timeout: 10000, // 10秒超时
    });
    
    const html = response.data;
    console.log(`成功获取HTML内容，长度: ${html.length}`);
    
    // 使用cheerio解析HTML
    const $ = cheerio.load(html);
    
    // 尝试从脚本中提取数据
    let scriptContent: string | null = null;
    let extractedContent = null;
    
    // 查找所有script标签
    $('script').each((i, element) => {
      const content = $(element).html() || '';
      
      // 检查脚本内容是否以var data开头
      if (content.trim().startsWith('var data')) {
        scriptContent = content;
        console.log('找到以var data开头的脚本内容');
        return false; // 中断each循环
      }
    });
    
    // 如果找到了脚本内容，提取JSON数据
    if (scriptContent && typeof scriptContent === 'string') {
      try {
        // 定义正则表达式
        const regex = /var\s+data\s*=\s*\{(.+?)\};/i;
        // 执行匹配
        const matches = regex.exec(scriptContent);
        
        if (matches && matches[1]) {
          // 添加花括号，重建完整的JSON对象
          const jsonStr = '{' + matches[1] + '}';
          // 解析JSON
          const dataObj = JSON.parse(jsonStr);
          
          // 获取content字段
          if (dataObj.content) {
            extractedContent = dataObj.content;
            console.log('成功从脚本中提取出content内容，长度:', extractedContent.length);
            
            // 使用提取的content内容创建新的cheerio实例
            const $content = cheerio.load(extractedContent);
            
            // 在提取的内容中使用选择器查找元素
            const selectedContent = selector ? $content(selector).html() : null;
            
            // 如果在提取内容中找到了匹配的选择器
            if (selectedContent) {
              console.log(`在脚本内容中找到选择器 ${selector} 匹配的内容，长度:`, selectedContent.length);
              return NextResponse.json({ 
                success: true, 
                content: selectedContent,
                source: url,
                usedSource: 'script-data',
                usedSelector: selector
              }, { headers: corsHeaders });
            }
            
            // 如果没有找到匹配的选择器，返回完整的提取内容
            return NextResponse.json({ 
              success: true, 
              content: extractedContent,
              source: url,
              usedSource: 'script-data',
              usedSelector: 'none'
            }, { headers: corsHeaders });
          }
        }
      } catch (err) {
        console.error('解析脚本内容失败:', err);
      }
    }
    
    // 如果没有找到脚本数据或解析失败，返回错误信息
    console.log('未找到脚本数据或解析失败');
    
    return NextResponse.json(
      { 
        error: '未找到脚本数据',
        message: '页面中没有找到var data开头的脚本，或无法从中提取内容',
        originalUrl: url
      },
      { status: 404, headers: corsHeaders }
    );
  } catch (error) {
    console.error('爬取失败:', error);
    return NextResponse.json(
      { 
        error: '爬取网页失败', 
        message: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500, headers: corsHeaders }
    );
  }
} 