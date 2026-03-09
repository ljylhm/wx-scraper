import { NextResponse } from "next/server";
import { getAutoLoginConfig, saveAutoLoginConfig } from "@/lib/autoLoginStore";
import { isAdminRequest } from "@/lib/adminAuth";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ success: false, error: "无权限" }, { status: 401 });
  }

  const config = await getAutoLoginConfig();
  return NextResponse.json({ success: true, data: config });
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ success: false, error: "无权限" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const config = await saveAutoLoginConfig({
      enabled: Boolean(body?.enabled),
      hour: Number(body?.hour),
      minute: Number(body?.minute),
      channels: Array.isArray(body?.channels) ? body.channels : undefined,
    });

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "保存定时配置失败",
        message: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    );
  }
}
