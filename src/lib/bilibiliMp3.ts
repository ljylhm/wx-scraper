export const MAX_MP3_DURATION_SECONDS = 10 * 60;

export interface BilibiliMp3Target {
  bvid: string;
  cid: number;
  title: string;
  duration: number;
  partCount: number;
  isFirstPartOnly: boolean;
}

export interface BilibiliAudioSource {
  url: string;
  bandwidth: number;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asPositiveInteger(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : 0;
}

function assertSuccessfulPayload(payload: unknown, fallbackMessage: string) {
  if (!isRecord(payload)) throw new Error(fallbackMessage);
  const code = typeof payload.code === "number" ? payload.code : -1;
  if (code !== 0) {
    throw new Error(asString(payload.message) || fallbackMessage);
  }
  return isRecord(payload.data) ? payload.data : null;
}

export function normalizeBvid(input: string | null | undefined): string {
  const bvid = (input ?? "").trim();
  if (!/^BV[0-9A-Za-z]{10}$/.test(bvid)) {
    throw new Error("请提供有效的 Bilibili BV 号");
  }
  return bvid;
}

export function parseVideoTarget(payload: unknown): BilibiliMp3Target {
  const data = assertSuccessfulPayload(payload, "无法读取 Bilibili 视频信息");
  if (!data) throw new Error("Bilibili 视频信息不完整");

  const bvid = normalizeBvid(asString(data.bvid));
  const videoTitle = asString(data.title) || "bilibili-audio";
  const pages = Array.isArray(data.pages) ? data.pages.filter(isRecord) : [];
  const firstPage = pages[0];

  if (!firstPage) throw new Error("该视频没有可处理的分 P");

  const cid = asPositiveInteger(firstPage.cid);
  const duration = asPositiveInteger(firstPage.duration);
  if (!cid || !duration) throw new Error("该视频的音轨信息不完整");
  if (duration > MAX_MP3_DURATION_SECONDS) {
    throw new Error("第一版仅支持 10 分钟以内的视频或分 P");
  }

  const isFirstPartOnly = pages.length > 1;
  const partTitle = asString(firstPage.part);

  return {
    bvid,
    cid,
    title: isFirstPartOnly && partTitle ? partTitle : videoTitle,
    duration,
    partCount: pages.length,
    isFirstPartOnly,
  };
}

export function selectBestAudio(payload: unknown): BilibiliAudioSource {
  const data = assertSuccessfulPayload(payload, "无法读取 Bilibili 播放信息");
  const dash = data && isRecord(data.dash) ? data.dash : null;
  const rawAudio = dash && Array.isArray(dash.audio) ? dash.audio : [];

  const candidates = rawAudio.flatMap<BilibiliAudioSource>((raw) => {
    if (!isRecord(raw)) return [];
    const rawUrl = asString(raw.baseUrl) || asString(raw.base_url);
    const bandwidth = asPositiveInteger(raw.bandwidth);

    try {
      const url = new URL(rawUrl);
      if (url.protocol !== "https:" || !bandwidth) return [];
      return [{ url: url.toString(), bandwidth }];
    } catch {
      return [];
    }
  });

  const best = candidates.sort((a, b) => b.bandwidth - a.bandwidth)[0];
  if (!best) throw new Error("该视频没有可用的 DASH 音轨");
  return best;
}

export function sanitizeMp3Filename(title: string): string {
  const safeTitle = title
    .normalize("NFKC")
    .replace(/[<>:"/\\|?*\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[. ]+|[. ]+$/g, "")
    .slice(0, 100)
    .trim();

  return `${safeTitle || "bilibili-audio"}.mp3`;
}
