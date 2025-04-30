import { Redis } from '@upstash/redis';

// 初始化Redis客户端
const redis = new Redis({
  url: 'https://light-pheasant-31145.upstash.io',
  token: 'AXmpAAIjcDFkY2Y0NzAxZDc4MzA0OGYxYTE1ZjViMjVlYjczYzM0MXAxMA',
});

// cookie键名
const COOKIE_KEY = 'wx_editor_cookies';

// cookie有效期（秒）
const COOKIE_TTL = 24 * 60 * 60; // 24小时

// 存储cookie到Redis
export async function storeCookies(cookies: string[]): Promise<void> {
  if (cookies && cookies.length > 0) {
    try {
      const cookieData = {
        cookies,
        timestamp: Date.now()
      };
      
      // 存储到Redis，并设置过期时间
      await redis.set(COOKIE_KEY, JSON.stringify(cookieData));
      await redis.expire(COOKIE_KEY, COOKIE_TTL);
      
      console.log('成功将Cookie存储到Redis');
    } catch (error) {
      console.error('存储Cookie到Redis失败:', error);
    }
  }
}

// 从Redis获取cookie
export async function getCookies(): Promise<string[]> {
  try {
    // 从Redis获取数据
    const data = await redis.get<string>(COOKIE_KEY);
    
    if (!data) {
      console.log('Redis中未找到Cookie数据');
      return [];
    }
    
    const cookieData = JSON.parse(data) as { cookies: string[], timestamp: number };
    console.log("cookieData", cookieData);
    // 检查cookie是否过期（虽然Redis有TTL，这里做双重检查）
    if (Date.now() - cookieData.timestamp > COOKIE_TTL * 1000) {
      console.log('Cookie已过期，从Redis删除');
      await clearCookies();
      return [];
    }
    
    console.log('从Redis成功获取Cookie');
    return cookieData.cookies;
  } catch (error) {
    console.error('从Redis获取Cookie失败:', error);
    return [];
  }
}

// 检查是否有有效的cookie
export async function hasCookies(): Promise<boolean> {
  const cookies = await getCookies();
  return cookies.length > 0;
}

// 清除Redis中的cookie
export async function clearCookies(): Promise<void> {
  try {
    await redis.del(COOKIE_KEY);
    console.log('成功从Redis删除Cookie');
  } catch (error) {
    console.error('从Redis删除Cookie失败:', error);
  }
} 