import { Redis } from '@upstash/redis';

// 初始化Redis客户端
const redis = new Redis({
  // url: 'https://light-pheasant-31145.upstash.io',
  url: 'https://steady-seahorse-10111.upstash.io',
  // token: 'AXmpAAIjcDFkY2Y0NzAxZDc4MzA0OGYxYTE1ZjViMjVlYjczYzM0MXAxMA',
  token: 'ASd_AAIjcDE1OGQ5Y2MxMzI5MDM0N2M3ODRhY2YwOWY2YzQ4Nzc2YXAxMA',
});

// 定义渠道类型
export type Channel = '135' | '96' | 'xiumi';

// 获取cookie键名
const getCookieKey = (channel: Channel): string => `wx_editor_cookies_${channel}`;

// cookie有效期（秒）
const COOKIE_TTL = 24 * 60 * 60; // 24小时

// 存储cookie到Redis
export async function storeCookies(cookies: string[], channel: Channel = '135'): Promise<void> {
  if (cookies && cookies.length > 0) {
    try {
      const cookieData = {
        cookies,
        timestamp: Date.now()
      };
      
      const key = getCookieKey(channel);
      
      // 存储到Redis，并设置过期时间
      await redis.set(key, cookieData);
      await redis.expire(key, COOKIE_TTL);
      
      console.log(`成功将${channel}的Cookie存储到Redis`);
    } catch (error) {
      console.error(`存储${channel}的Cookie到Redis失败:`, error);
    }
  }
}

// 从Redis获取cookie
export async function getCookies(channel: Channel = '135'): Promise<string[]> {
  try {
    const key = getCookieKey(channel);
    
    // 从Redis获取数据
    const data = await redis.get<{
      cookies: string[];
      timestamp: number;
    }>(key);
    
    if (!data) {
      console.log(`Redis中未找到${channel}的Cookie数据`);
      return [];
    }
    const cookieData = data
    console.log("cookieData", cookieData);
    // 检查cookie是否过期（虽然Redis有TTL，这里做双重检查）
    if (Date.now() - cookieData.timestamp > COOKIE_TTL * 1000) {
      console.log(`${channel}的Cookie已过期，从Redis删除`);
      await clearCookies(channel);
      return [];
    }
    
    console.log(`从Redis成功获取${channel}的Cookie`);
    return cookieData.cookies;
  } catch (error) {
    console.error(`从Redis获取${channel}的Cookie失败:`, error);
    return [];
  }
}

// 检查是否有有效的cookie
export async function hasCookies(channel: Channel = '135'): Promise<boolean> {
  const cookies = await getCookies(channel);
  return cookies.length > 0;
}

// 清除Redis中的cookie
export async function clearCookies(channel: Channel = '135'): Promise<void> {
  try {
    const key = getCookieKey(channel);
    await redis.del(key);
    console.log(`成功从Redis删除${channel}的Cookie`);
  } catch (error) {
    console.error(`从Redis删除${channel}的Cookie失败:`, error);
  }
}

// 清除所有渠道的Cookie
export async function clearAllCookies(): Promise<void> {
  try {
    const channels: Channel[] = ['135', '96', 'xiumi'];
    for (const channel of channels) {
      await clearCookies(channel);
    }
    console.log('成功从Redis删除所有渠道的Cookie');
  } catch (error) {
    console.error('从Redis删除所有Cookie失败:', error);
  }
}