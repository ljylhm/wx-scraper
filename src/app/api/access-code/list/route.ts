import { NextResponse } from "next/server";
import { listAccessCodes } from "@/lib/accessCodeStore";
import { isAdminRequest } from "@/lib/adminAuth";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ success: false, error: "无权限" }, { status: 401 });
  }

  try {
    const data = await listAccessCodes();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "查询访问码列表失败",
        message: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    );
  }
}
