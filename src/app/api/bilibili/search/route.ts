import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

import {
  type BilibiliSearchResult,
  normalizeSearchResponse,
  parseSearchParams,
} from "@/lib/bilibili";
import {
  BILIBILI_USER_AGENT,
  getBilibiliVisitorCookie,
} from "@/lib/bilibiliVisitor";

export const runtime = "nodejs";
export const maxDuration = 15;

const BILIBILI_SEARCH_ENDPOINT =
  "https://api.bilibili.com/x/web-interface/search/type";
const SEARCH_CACHE_TTL = 2 * 60 * 1_000;

interface CacheEntry {
  expiresAt: number;
  data: BilibiliSearchResult;
}

const searchCache = new Map<string, CacheEntry>();

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { success: false, error: message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

function successResponse(
  keyword: string,
  data: BilibiliSearchResult,
) {
  return NextResponse.json(
    { success: true, keyword, ...data },
    {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
      },
    },
  );
}

async function requestBilibili(
  keyword: string,
  page: number,
  pageSize: number,
  forceVisitorRefresh = false,
) {
  const cookie = await getBilibiliVisitorCookie(forceVisitorRefresh);

  return axios.get(BILIBILI_SEARCH_ENDPOINT, {
    params: {
      search_type: "video",
      keyword,
      page,
      page_size: pageSize,
      order: "totalrank",
    },
    headers: {
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.7",
      Cookie: cookie,
      Referer: "https://search.bilibili.com/",
      "User-Agent": BILIBILI_USER_AGENT,
    },
    timeout: 8_000,
  });
}

export async function GET(request: NextRequest) {
  let search;

  try {
    search = parseSearchParams(request.nextUrl.searchParams);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "搜索参数有误",
      400,
    );
  }

  const cacheKey = `${search.keyword}:${search.page}:${search.pageSize}`;
  const cached = searchCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return successResponse(search.keyword, cached.data);
  }

  try {
    let response;
    try {
      response = await requestBilibili(
        search.keyword,
        search.page,
        search.pageSize,
      );
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 412) {
        response = await requestBilibili(
          search.keyword,
          search.page,
          search.pageSize,
          true,
        );
      } else {
        throw error;
      }
    }

    const data = normalizeSearchResponse(
      response.data,
      search.page,
      search.pageSize,
    );

    if (searchCache.size >= 100) searchCache.clear();
    searchCache.set(cacheKey, {
      data,
      expiresAt: Date.now() + SEARCH_CACHE_TTL,
    });

    return successResponse(search.keyword, data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.code === "ECONNABORTED") {
      return errorResponse("Bilibili 响应超时，请稍后重试", 504);
    }

    console.error("Bilibili search failed", error);
    if (axios.isAxiosError(error) && error.response) {
      return errorResponse("Bilibili 搜索服务暂时无法访问，请稍后再试", 502);
    }
    return errorResponse(
      error instanceof Error && error.message
        ? `搜索失败：${error.message}`
        : "搜索暂时不可用，请稍后重试",
      502,
    );
  }
}
