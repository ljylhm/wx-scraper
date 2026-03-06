import { NextResponse } from "next/server";
import { updateExtractRecord } from "@/lib/extractRecordStore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = Number(body?.id);
    const status = body?.status as "processing" | "success" | "failed";

    if (!Number.isFinite(id)) {
      return NextResponse.json({ success: false, error: "记录ID无效" }, { status: 400 });
    }

    if (!["processing", "success", "failed"].includes(status)) {
      return NextResponse.json({ success: false, error: "状态无效" }, { status: 400 });
    }

    const record = await updateExtractRecord({
      id,
      status,
      resultTemplateId: body?.resultTemplateId ? String(body.resultTemplateId) : undefined,
      errorMessage: body?.errorMessage ? String(body.errorMessage) : undefined,
    });

    if (!record) {
      return NextResponse.json({ success: false, error: "记录不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "更新提取记录失败",
        message: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    );
  }
}
