import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { PassThrough, Readable } from "node:stream";

import axios from "axios";
import ffmpegPath from "ffmpeg-static";
import { NextRequest, NextResponse } from "next/server";

import {
  normalizeBvid,
  parseVideoTarget,
  sanitizeMp3Filename,
  selectBestAudio,
} from "@/lib/bilibiliMp3";
import {
  BILIBILI_USER_AGENT,
  getBilibiliVisitorCookie,
} from "@/lib/bilibiliVisitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BILIBILI_VIEW_ENDPOINT =
  "https://api.bilibili.com/x/web-interface/view";
const BILIBILI_PLAY_ENDPOINT =
  "https://api.bilibili.com/x/player/playurl";
const MAX_CONCURRENT_CONVERSIONS = 2;

let activeConversions = 0;

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { success: false, error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function contentDisposition(filename: string): string {
  const encoded = encodeURIComponent(filename).replace(/['()]/g, escape);
  return `attachment; filename="bilibili-audio.mp3"; filename*=UTF-8''${encoded}`;
}

async function getVideoTarget(bvid: string, cookie: string) {
  const response = await axios.get(BILIBILI_VIEW_ENDPOINT, {
    params: { bvid },
    timeout: 8_000,
    headers: {
      Accept: "application/json",
      Cookie: cookie,
      Referer: `https://www.bilibili.com/video/${bvid}`,
      "User-Agent": BILIBILI_USER_AGENT,
    },
  });
  return parseVideoTarget(response.data);
}

async function getAudioSource(bvid: string, cid: number, cookie: string) {
  const response = await axios.get(BILIBILI_PLAY_ENDPOINT, {
    params: {
      bvid,
      cid,
      fnval: 16,
      fnver: 0,
      fourk: 1,
      qn: 127,
    },
    timeout: 8_000,
    headers: {
      Accept: "application/json",
      Cookie: cookie,
      Referer: `https://www.bilibili.com/video/${bvid}`,
      "User-Agent": BILIBILI_USER_AGENT,
    },
  });
  return selectBestAudio(response.data);
}

async function waitForSpawn(
  process: ReturnType<typeof spawn>,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    process.once("spawn", resolve);
    process.once("error", reject);
  });
}

export async function GET(request: NextRequest) {
  let bvid: string;
  try {
    bvid = normalizeBvid(request.nextUrl.searchParams.get("bvid"));
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "BV 号有误", 400);
  }

  if (activeConversions >= MAX_CONCURRENT_CONVERSIONS) {
    return jsonError("当前转换任务较多，请稍后再试", 429);
  }

  let sourceStream: Readable | null = null;
  let ffmpeg: ReturnType<typeof spawn> | null = null;
  let conversionClaimed = false;
  let released = false;

  const release = () => {
    if (released) return;
    released = true;
    if (conversionClaimed) activeConversions = Math.max(0, activeConversions - 1);
  };

  try {
    if (!ffmpegPath) throw new Error("当前运行环境没有可用的 FFmpeg");
    await access(ffmpegPath);

    const cookie = await getBilibiliVisitorCookie();
    const target = await getVideoTarget(bvid, cookie);
    const audio = await getAudioSource(bvid, target.cid, cookie);

    const audioResponse = await axios.get<Readable>(audio.url, {
      responseType: "stream",
      timeout: 15_000,
      headers: {
        Accept: "*/*",
        Cookie: cookie,
        Origin: "https://www.bilibili.com",
        Referer: `https://www.bilibili.com/video/${bvid}`,
        "User-Agent": BILIBILI_USER_AGENT,
      },
    });
    sourceStream = audioResponse.data;

    activeConversions += 1;
    conversionClaimed = true;

    const transcoder = spawn(ffmpegPath, [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      "pipe:0",
      "-vn",
      "-map_metadata",
      "-1",
      "-codec:a",
      "libmp3lame",
      "-b:a",
      "192k",
      "-f",
      "mp3",
      "pipe:1",
    ], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    ffmpeg = transcoder;
    await waitForSpawn(transcoder);

    const output = new PassThrough();
    let stderr = "";
    let canceled = false;
    transcoder.stderr.setEncoding("utf8");
    transcoder.stderr.on("data", (chunk: string) => {
      stderr = `${stderr}${chunk}`.slice(-2_000);
    });
    transcoder.stdin.on("error", () => {
      // EPIPE is expected when FFmpeg exits before the upstream stream ends.
    });
    sourceStream.on("error", (error) => {
      transcoder.stdin.destroy(error);
    });
    transcoder.stdout.pipe(output, { end: false });
    sourceStream.pipe(transcoder.stdin);

    transcoder.once("close", (code) => {
      sourceStream?.destroy();
      if (canceled) {
        output.destroy();
      } else if (code === 0) {
        output.end();
      } else {
        console.error("FFmpeg conversion failed", { bvid, code, stderr });
        output.destroy(new Error("FFmpeg 转换失败"));
      }
      release();
    });

    const cancel = () => {
      canceled = true;
      sourceStream?.destroy();
      if (ffmpeg && !ffmpeg.killed) ffmpeg.kill("SIGKILL");
      release();
    };
    request.signal.addEventListener("abort", cancel, { once: true });
    output.once("close", () => {
      request.signal.removeEventListener("abort", cancel);
    });

    const filename = sanitizeMp3Filename(target.title);
    const responseBody = Readable.toWeb(output) as ReadableStream<Uint8Array>;

    return new Response(responseBody, {
      headers: {
        "Cache-Control": "no-store, no-transform",
        "Content-Disposition": contentDisposition(filename),
        "Content-Type": "audio/mpeg",
        "X-Bilibili-First-Part-Only": String(target.isFirstPartOnly),
        "X-Bilibili-Part-Count": String(target.partCount),
        "X-Content-Type-Options": "nosniff",
        "X-Music-Filename": encodeURIComponent(filename),
      },
    });
  } catch (error) {
    sourceStream?.destroy();
    if (ffmpeg && !ffmpeg.killed) ffmpeg.kill("SIGKILL");
    release();

    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") {
        return jsonError("Bilibili 音轨响应超时，请稍后重试", 504);
      }
      if (error.response?.status === 412) {
        return jsonError("Bilibili 暂时限制了访问，请稍后重试", 502);
      }
      return jsonError("暂时无法读取 Bilibili 音轨", 502);
    }

    console.error("Bilibili MP3 preparation failed", error);
    return jsonError(
      error instanceof Error ? error.message : "MP3 转换准备失败",
      error instanceof Error && error.message.includes("10 分钟") ? 422 : 500,
    );
  }
}
