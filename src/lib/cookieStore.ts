import fs from 'fs';
import path from 'path';

// 文件路径配置
const COOKIE_DIR = path.join(process.cwd(), 'data');
const COOKIE_FILE = path.join(COOKIE_DIR, 'cookie135.json');

// cookie存储类型
interface CookieData {
  cookies: string[];
  timestamp: number;
}

// cookie有效期（毫秒）
const COOKIE_TTL = 24 * 60 * 60 * 1000; // 24小时

// 确保存储目录存在
function ensureDirectoryExists(): void {
  if (!fs.existsSync(COOKIE_DIR)) {
    try {
      fs.mkdirSync(COOKIE_DIR, { recursive: true });
    } catch (error) {
      console.error('创建cookie存储目录失败:', error);
    }
  }
}

// 从文件读取数据
function readCookieFile(): CookieData | null {
  try {
    if (!fs.existsSync(COOKIE_FILE)) {
      return null;
    }
    
    const data = fs.readFileSync(COOKIE_FILE, 'utf8');
    return JSON.parse(data) as CookieData;
  } catch (error) {
    console.error('读取cookie文件失败:', error);
    return null;
  }
}

// 将数据写入文件
function writeCookieFile(data: CookieData): boolean {
  try {
    ensureDirectoryExists();
    fs.writeFileSync(COOKIE_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('写入cookie文件失败:', error);
    return false;
  }
}

// 存储cookie到文件
export function storeCookies(cookies: string[]): void {
  if (cookies && cookies.length > 0) {
    const cookieData: CookieData = {
      cookies,
      timestamp: Date.now()
    };
    
    const success = writeCookieFile(cookieData);
    console.log('存储Cookie到文件', success ? '成功' : '失败', '文件路径:', COOKIE_FILE);
  }
}

// 从文件获取cookie
export function getCookies(): string[] {
  const cookieData = readCookieFile();
  
  // 没有存储的cookie或文件读取失败
  if (!cookieData) {
    console.log('未找到Cookie文件或读取失败:', COOKIE_FILE);
    return [];
  }
  
  // 检查cookie是否过期
  if (Date.now() - cookieData.timestamp > COOKIE_TTL) {
    console.log('Cookie已过期，删除文件');
    // cookie已过期，删除文件
    clearCookies();
    return [];
  }
  
  console.log('从文件成功读取Cookie, 文件路径:', COOKIE_FILE);
  return cookieData.cookies;
}

// 检查是否有有效的cookie
export function hasCookies(): boolean {
  return getCookies().length > 0;
}

// 清除cookie文件
export function clearCookies(): void {
  try {
    if (fs.existsSync(COOKIE_FILE)) {
      fs.unlinkSync(COOKIE_FILE);
    }
  } catch (error) {
    console.error('删除cookie文件失败:', error);
  }
} 