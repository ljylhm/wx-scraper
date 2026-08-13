export const BILIBILI_SEARCH_PAGE_SIZE = 12;
export const BILIBILI_SEARCH_MAX_PAGE_SIZE = 20;
export const BILIBILI_SEARCH_MAX_KEYWORD_LENGTH = 80;

export interface BilibiliVideo {
  bvid: string;
  title: string;
  author: string;
  cover: string;
  duration: string;
  views: number;
  publishedAt: number;
  category: string;
  url: string;
}

export interface BilibiliSearchResult {
  items: BilibiliVideo[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface BilibiliSearchParams {
  keyword: string;
  page: number;
  pageSize: number;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toInteger(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function toString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function cleanTitle(title: string): string {
  return title
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeImageUrl(url: string): string {
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("http://")) return `https://${url.slice(7)}`;
  return url;
}

export function parseSearchParams(
  searchParams: URLSearchParams,
): BilibiliSearchParams {
  const keyword = (searchParams.get("keyword") ?? "").trim();

  if (!keyword) {
    throw new Error("请输入音乐关键词");
  }

  if (keyword.length > BILIBILI_SEARCH_MAX_KEYWORD_LENGTH) {
    throw new Error(
      `音乐关键词不能超过 ${BILIBILI_SEARCH_MAX_KEYWORD_LENGTH} 个字符`,
    );
  }

  const requestedPage = toInteger(searchParams.get("page"), 1);
  const requestedPageSize = toInteger(
    searchParams.get("pageSize"),
    BILIBILI_SEARCH_PAGE_SIZE,
  );

  return {
    keyword,
    page: Math.max(1, requestedPage),
    pageSize: Math.min(
      BILIBILI_SEARCH_MAX_PAGE_SIZE,
      Math.max(1, requestedPageSize),
    ),
  };
}

export function normalizeSearchResponse(
  payload: unknown,
  page: number,
  pageSize: number,
): BilibiliSearchResult {
  if (!isRecord(payload)) {
    throw new Error("Bilibili 返回了无法识别的数据");
  }

  const code = toInteger(payload.code, -1);
  if (code !== 0) {
    const message = toString(payload.message, "Bilibili 搜索暂时不可用");
    throw new Error(message || "Bilibili 搜索暂时不可用");
  }

  const data = isRecord(payload.data) ? payload.data : {};
  const rawItems = Array.isArray(data.result) ? data.result : [];
  const items = rawItems.flatMap<BilibiliVideo>((rawItem) => {
    if (!isRecord(rawItem)) return [];

    const bvid = toString(rawItem.bvid).trim();
    const title = cleanTitle(toString(rawItem.title));
    if (!bvid || !title) return [];

    return [
      {
        bvid,
        title,
        author: toString(rawItem.author, "未知 UP 主"),
        cover: normalizeImageUrl(toString(rawItem.pic)),
        duration: toString(rawItem.duration, "--:--"),
        views: Math.max(0, toInteger(rawItem.play)),
        publishedAt: Math.max(0, toInteger(rawItem.pubdate)),
        category: toString(rawItem.typename, "视频"),
        url: `https://www.bilibili.com/video/${encodeURIComponent(bvid)}`,
      },
    ];
  });

  const total = Math.max(0, toInteger(data.numResults, items.length));
  const totalPages = Math.max(
    0,
    toInteger(data.numPages, total > 0 ? Math.ceil(total / pageSize) : 0),
  );

  return {
    items,
    page,
    pageSize,
    total,
    totalPages,
    hasMore: page < totalPages,
  };
}
