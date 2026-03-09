import { NextResponse } from "next/server";
import { createExtractRecord } from "@/lib/extractRecordStore";

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return request.headers.get("x-real-ip") || "unknown";
}

function resolveSenderAccount(receiverEditorType: string): string {
  if (receiverEditorType === "135") {
    return process.env.LOGIN_135_EMAIL || "";
  }
  if (receiverEditorType === "96") {
    return process.env.LOGIN_96_PHONE || "";
  }
  return "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const receiverEditorType = String(body?.receiverEditorType || "");

    const record = await createExtractRecord({
      extractionId: String(body?.extractionId || `${Date.now()}`),
      ip: getClientIp(request),
      accessCode: String(body?.accessCode || ""),
      editorType: String(body?.editorType || ""),
      templateCode: String(body?.templateCode || ""),
      templateSourceUrl: String(body?.templateSourceUrl || ""),
      senderAccount: resolveSenderAccount(receiverEditorType),
      receiverEditorType,
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
