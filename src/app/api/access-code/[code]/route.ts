import { NextResponse } from "next/server";
import { deleteAccessCode, getAccessCodeStatus, setAccessCodePermanent } from "@/lib/accessCodeStore";
import { isAdminRequest } from "@/lib/adminAuth";

export async function GET(
  request: Request,
  context: { params: Promise<{ code: string }> }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "无权限" }, { status: 401 });
  }

  try {
    const { code } = await context.params;
    const status = await getAccessCodeStatus(code);

    if (!status) {
      return NextResponse.json({ success: false, error: "访问码不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: status });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "查询访问码失败",
        message: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ code: string }> }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ success: false, error: "无权限" }, { status: 401 });
  }

  try {
    const { code } = await context.params;
    const result = await deleteAccessCode(code);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.reason }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "删除成功" });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "删除访问码失败",
        message: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ code: string }> }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ success: false, error: "无权限" }, { status: 401 });
  }

  try {
    const { code } = await context.params;
    const body = await request.json();
    const isPermanent = Boolean(body?.isPermanent);

    const result = await setAccessCodePermanent(code, isPermanent);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.reason }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.status });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "更新访问码失败",
        message: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    );
  }
}
