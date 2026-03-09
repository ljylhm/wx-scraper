import { NextResponse } from "next/server";
import { listCookieDetails } from "@/lib/cookieStore";
import { isAdminRequest } from "@/lib/adminAuth";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ success: false, error: "无权限" }, { status: 401 });
  }

  try {
    const details = await listCookieDetails(["135", "96"]);
    const data = details.map((item) => ({
      channel: item.channel,
      cookieCount: item.cookies.length,
      timestamp: item.timestamp,
      cookiePreview: item.cookies.join("; ").slice(0, 180),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "查询当前Cookie失败",
        message: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    );
  }
}
