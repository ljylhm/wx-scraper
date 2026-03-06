import { NextResponse } from "next/server";
import { createAccessCode } from "@/lib/accessCodeStore";
import { isAdminRequest } from "@/lib/adminAuth";

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "无权限" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { code, maxUses, disabled, isPermanent } = body || {};

    const result = await createAccessCode({ code, maxUses, disabled, isPermanent });

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.reason }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.status });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "创建访问码失败",
        message: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    );
  }
}
