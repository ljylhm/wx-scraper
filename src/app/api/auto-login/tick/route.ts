import { NextResponse } from "next/server";
import { runAutoLoginScheduled } from "@/lib/autoLoginRunner";

function isCronRequest(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization") || "";
    if (auth === `Bearer ${cronSecret}`) {
      return true;
    }
  }

  const cronHeader = request.headers.get("x-vercel-cron");
  if (cronHeader === "1") {
    return true;
  }

  const userAgent = request.headers.get("user-agent") || "";
  return userAgent.toLowerCase().includes("vercel-cron");
}

export async function GET(request: Request) {
  if (!isCronRequest(request)) {
    return NextResponse.json({ success: false, error: "无权限" }, { status: 401 });
  }

  try {
    const result = await runAutoLoginScheduled(request);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "定时任务执行失败",
        message: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    );
  }
}
