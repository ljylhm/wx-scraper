import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET() {
  try {
    // 在这里执行定时任务的逻辑
    console.log('执行定时任务', new Date().toISOString());
    
    // 示例：执行一些数据处理、清理或同步操作
    const result = await performScheduledTask();
    
    return NextResponse.json({ 
      success: true, 
      message: '定时任务执行成功', 
      time: new Date().toISOString(),
      result 
    });
  } catch (error) {
    console.error('定时任务执行失败:', error);
    return NextResponse.json(
      { success: false, error: '定时任务执行失败' },
      { status: 500 }
    );
  }
}

// 模拟定时任务的函数
async function performScheduledTask() {
  // 这里放置实际的定时任务逻辑
  return { processed: true };
} 