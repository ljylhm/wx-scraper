import { NextResponse } from "next/server";
import { checkAccessCode } from "@/lib/accessCodeStore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = body?.code;

    const result = await checkAccessCode(code);
    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          error: result.reason,
          data: result.status,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "访问码有效",
      data: result.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "访问码校验失败",
        message: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    );
  }
}
