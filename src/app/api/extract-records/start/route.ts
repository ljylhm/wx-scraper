import { NextResponse } from "next/server";
import { createExtractRecord } from "@/lib/extractRecordStore";

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const record = await createExtractRecord({
      extractionId: String(body?.extractionId || `${Date.now()}`),
      ip: getClientIp(request),
      accessCode: String(body?.accessCode || ""),
      editorType: String(body?.editorType || ""),
      templateCode: String(body?.templateCode || ""),
      receiverEditorType: String(body?.receiverEditorType || ""),
      receiverId: String(body?.receiverId || ""),
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "创建提取记录失败",
        message: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    );
  }
}
