import { NextResponse } from "next/server";
import { hasAdminPasswordConfigured, isAdminRequest } from "@/lib/adminAuth";

export async function GET(request: Request) {
  if (!hasAdminPasswordConfigured()) {
    return NextResponse.json(
      { success: false, authenticated: false, error: "未配置管理员密码" },
      { status: 500 }
    );
  }

  if (!isAdminRequest(request)) {
    return NextResponse.json({ success: true, authenticated: false }, { status: 200 });
  }

  return NextResponse.json({ success: true, authenticated: true });
}
