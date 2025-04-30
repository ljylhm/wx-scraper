import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
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

// 支持的爬取类型
type ScrapeType = 'script-data' | 'selector' | 'auto';

// 支持GET方式
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  const selector = request.nextUrl.searchParams.get('selector') || '#fullpage';
  const type = (request.nextUrl.searchParams.get('type') || 'auto') as ScrapeType;
  
  return handleScrape(url, selector, type);
}

// 支持POST方式
export async function POST(request: NextRequest) {
  try {
    // 从请求体中获取URL、选择器（可选）和类型（可选）
    const body = await request.json();
    const { url, selector = '#fullpage', type = 'auto' } = body;
    
    return handleScrape(url, selector, type as ScrapeType);
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

/**
 * 处理图片data-src属性，将data-src的值赋给src属性
 * @param html HTML内容
 * @returns 处理后的HTML内容
 */
function processImageDataSrc(html: string): string {
  const $ = cheerio.load(html);
  let imgCount = 0;
  let processedCount = 0;
  
  // 查找所有img标签
  $('img').each((_, element) => {
    imgCount++;
    const dataSrc = $(element).attr('data-src');
    
    // 如果存在data-src属性，将其值赋给src属性
    if (dataSrc) {
      $(element).attr('src', dataSrc);
      processedCount++;
    }
  });
  
  if (processedCount > 0) {
    console.log(`处理了${processedCount}/${imgCount}个图片的data-src属性`);
  }
  
  return $.html();
}

// 统一处理爬取逻辑
async function handleScrape(url: string | null, selector: string, type: ScrapeType = 'auto') {
  try {
    if (!url) {
      return NextResponse.json(
        { error: '请提供网页URL' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`开始爬取URL: ${url}, 使用选择器: ${selector}, 爬取类型: ${type}`);

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
    
    // 如果指定了只使用选择器方式，则直接使用选择器提取内容
    if (type === 'selector') {
      const selectedContent = $(selector).html();
      if (selectedContent) {
        console.log(`使用选择器方式提取内容，长度: ${selectedContent.length}`);
        // 处理图片data-src属性
        const processedContent = processImageDataSrc(selectedContent);
        return NextResponse.json({ 
          success: true, 
          content: processedContent,
          source: url,
          usedSource: 'selector',
          usedSelector: selector
        }, { headers: corsHeaders });
      } else {
        return NextResponse.json(
          { 
            error: '未找到匹配内容',
            message: `选择器 ${selector} 未匹配到任何内容`,
            originalUrl: url
          },
          { status: 404, headers: corsHeaders }
        );
      }
    }
    
    // 尝试从脚本中提取数据（只有当type为'script-data'或'auto'时）
    if (type === 'script-data' || type === 'auto') {
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
                // 处理图片data-src属性
                const processedContent = processImageDataSrc(selectedContent);
                return NextResponse.json({ 
                  success: true, 
                  content: processedContent,
                  source: url,
                  usedSource: 'script-data',
                  usedSelector: selector
                }, { headers: corsHeaders });
              }
              
              // 如果没有找到匹配的选择器，返回完整的提取内容
              // 处理图片data-src属性
              const processedContent = processImageDataSrc(extractedContent);
              return NextResponse.json({ 
                success: true, 
                content: processedContent,
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
    }
    
    // 如果指定了只使用script-data方式但未找到，返回错误
    if (type === 'script-data') {
      return NextResponse.json(
        { 
          error: '未找到脚本数据',
          message: '页面中没有找到var data开头的脚本，或无法从中提取内容',
          originalUrl: url
        },
        { status: 404, headers: corsHeaders }
      );
    }
    
    // 自动模式下，如果脚本提取失败，尝试使用选择器
    if (type === 'auto') {
      const selectedContent = $(selector).html();
      if (selectedContent) {
        console.log(`脚本提取失败，使用选择器提取内容，长度: ${selectedContent.length}`);
        // 处理图片data-src属性
        const processedContent = processImageDataSrc(selectedContent);
        return NextResponse.json({ 
          success: true, 
          content: processedContent,
          source: url,
          usedSource: 'selector',
          usedSelector: selector
        }, { headers: corsHeaders });
      }
    }
    
    // 所有方式都失败，返回错误信息
    return NextResponse.json(
      { 
        error: '未找到内容',
        message: '无法使用脚本提取或选择器提取内容',
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