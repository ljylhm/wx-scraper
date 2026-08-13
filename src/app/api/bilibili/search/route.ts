import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

import {
  type BilibiliSearchResult,
  normalizeSearchResponse,
  parseSearchParams,
} from "@/lib/bilibili";

export const runtime = "nodejs";
export const maxDuration = 15;

const BILIBILI_SEARCH_ENDPOINT =
  "https://api.bilibili.com/x/web-interface/search/type";
const BILIBILI_VISITOR_ENDPOINT =
  "https://api.bilibili.com/x/frontend/finger/spi";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const SEARCH_CACHE_TTL = 2 * 60 * 1_000;
const VISITOR_COOKIE_TTL = 12 * 60 * 60 * 1_000;

interface CacheEntry {
  expiresAt: number;
  data: BilibiliSearchResult;
}

let visitorCookie = "";
let visitorCookieExpiresAt = 0;
let visitorCookieRequest: Promise<string> | null = null;
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

async function getVisitorCookie(forceRefresh = false): Promise<string> {
  if (!forceRefresh && visitorCookie && Date.now() < visitorCookieExpiresAt) {
    return visitorCookie;
  }

  if (!forceRefresh && visitorCookieRequest) return visitorCookieRequest;

  visitorCookieRequest = axios
    .get(BILIBILI_VISITOR_ENDPOINT, {
      timeout: 5_000,
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    })
    .then((response) => {
      const b3 = response.data?.data?.b_3;
      const b4 = response.data?.data?.b_4;

      if (typeof b3 !== "string" || typeof b4 !== "string") {
        throw new Error("无法获取 Bilibili 访客标识");
      }

      visitorCookie = `buvid3=${b3}; buvid4=${b4}`;
      visitorCookieExpiresAt = Date.now() + VISITOR_COOKIE_TTL;
      return visitorCookie;
    })
    .finally(() => {
      visitorCookieRequest = null;
    });

  return visitorCookieRequest;
}

async function requestBilibili(
  keyword: string,
  page: number,
  pageSize: number,
  forceVisitorRefresh = false,
) {
  const cookie = await getVisitorCookie(forceVisitorRefresh);

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
      "User-Agent": USER_AGENT,
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
