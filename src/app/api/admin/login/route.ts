import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  getAdminSessionToken,
  hasAdminPasswordConfigured,
  verifyAdminPassword,
} from "@/lib/adminAuth";

export async function POST(request: Request) {
  if (!hasAdminPasswordConfigured()) {
    return NextResponse.json({ success: false, error: "未配置管理员密码" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const password = String(body?.password || "");

    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ success: false, error: "密码错误" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, message: "登录成功" });
    response.cookies.set({
      name: ADMIN_SESSION_COOKIE,
      value: getAdminSessionToken(),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "登录失败",
        message: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    );
  }
}
