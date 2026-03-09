import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { runAutoLoginManual } from "@/lib/autoLoginRunner";

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ success: false, error: "无权限" }, { status: 401 });
  }

  try {
    const result = await runAutoLoginManual(request);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "执行定时登录失败",
        message: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    );
  }
}
