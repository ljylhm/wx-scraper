import {
  acquireAutoLoginLock,
  appendAutoLoginHistory,
  getAutoLoginConfig,
  releaseAutoLoginLock,
  shouldRunNow,
  updateAutoLoginLastRun,
  type AutoLoginChannel,
} from "@/lib/autoLoginStore";

type RunTrigger = "manual" | "scheduled";

function resolveOrigin(request: Request): string {
  const url = new URL(request.url);
  if (url.origin && url.origin !== "null") {
    return url.origin;
  }

  if (process.env.VERCEL_URL) {
    return process.env.VERCEL_URL.startsWith("http")
      ? process.env.VERCEL_URL
      : `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

async function runSingleChannel(origin: string, channel: AutoLoginChannel): Promise<{ channel: AutoLoginChannel; success: boolean; message: string }> {
  const path = channel === "135" ? "/api/login135" : "/api/login96";

  try {
    const response = await fetch(new URL(path, origin), {
      method: "GET",
      headers: {
        "x-auto-login": "1",
      },
    });

    let message = `HTTP ${response.status}`;
    let success = response.ok;

    try {
      const data = await response.json();
      if (typeof data?.message === "string") {
        message = data.message;
      }
      if (typeof data?.success === "boolean") {
        success = success && data.success;
      }
      if (!success && typeof data?.error === "string") {
        message = data.error;
      }
    } catch {
      // ignore json parse error
    }

    return { channel, success, message };
  } catch (error) {
    return {
      channel,
      success: false,
      message: error instanceof Error ? error.message : "请求失败",
    };
  }
}

async function runWithConfig(request: Request, trigger: RunTrigger, forceRun: boolean) {
  const hasLock = await acquireAutoLoginLock();
  if (!hasLock) {
    return {
      skipped: true,
      reason: "已有任务执行中",
    };
  }

  try {
    const config = await getAutoLoginConfig();
    if (!forceRun && !shouldRunNow(config)) {
      return {
        skipped: true,
        reason: "未到执行时间或任务未启用",
        config,
      };
    }

    const origin = resolveOrigin(request);
    const startedAt = Date.now();

    const results = await Promise.all(config.channels.map((channel) => runSingleChannel(origin, channel)));
    const success = results.every((item) => item.success);
    const finishedAt = Date.now();

    await appendAutoLoginHistory({
      trigger,
      startedAt,
      finishedAt,
      success,
      results,
    });

    await updateAutoLoginLastRun(finishedAt);

    return {
      skipped: false,
      success,
      startedAt,
      finishedAt,
      results,
    };
  } finally {
    await releaseAutoLoginLock();
  }
}

export async function runAutoLoginManual(request: Request) {
  return runWithConfig(request, "manual", true);
}

export async function runAutoLoginScheduled(request: Request) {
  return runWithConfig(request, "scheduled", false);
}
