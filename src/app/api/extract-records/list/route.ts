import { NextResponse } from "next/server";
import { listExtractRecords } from "@/lib/extractRecordStore";
import { isAdminRequest } from "@/lib/adminAuth";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ success: false, error: "无权限" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const data = await listExtractRecords({
      page: Number(url.searchParams.get("page") || 1),
      pageSize: Number(url.searchParams.get("pageSize") || 10),
      accessCode: url.searchParams.get("accessCode") || undefined,
      templateCode: url.searchParams.get("templateCode") || undefined,
      receiverId: url.searchParams.get("receiverId") || undefined,
      status: url.searchParams.get("status") || undefined,
      ip: url.searchParams.get("ip") || undefined,
      dateFrom: url.searchParams.get("dateFrom") || undefined,
      dateTo: url.searchParams.get("dateTo") || undefined,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "查询提取记录失败",
        message: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 }
    );
  }
}
