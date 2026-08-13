import axios from "axios";

export const BILIBILI_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const BILIBILI_VISITOR_ENDPOINT =
  "https://api.bilibili.com/x/frontend/finger/spi";
const VISITOR_COOKIE_TTL = 12 * 60 * 60 * 1_000;

let visitorCookie = "";
let visitorCookieExpiresAt = 0;
let visitorCookieRequest: Promise<string> | null = null;

export async function getBilibiliVisitorCookie(
  forceRefresh = false,
): Promise<string> {
  if (!forceRefresh && visitorCookie && Date.now() < visitorCookieExpiresAt) {
    return visitorCookie;
  }

  if (!forceRefresh && visitorCookieRequest) return visitorCookieRequest;

  visitorCookieRequest = axios
    .get(BILIBILI_VISITOR_ENDPOINT, {
      timeout: 5_000,
      headers: {
        Accept: "application/json",
        "User-Agent": BILIBILI_USER_AGENT,
      },
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
