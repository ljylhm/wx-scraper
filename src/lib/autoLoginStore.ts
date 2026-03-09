import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: "https://prepared-ringtail-38825.upstash.io",
  token: "AZepAAIncDIxMWNlMDUwZjA2NzA0YjRlYjgyMjY1MmUzYmM2OTZlZnAyMzg4MjU",
});

export type AutoLoginChannel = "135" | "96";

export type AutoLoginConfig = {
  enabled: boolean;
  hour: number;
  minute: number;
  channels: AutoLoginChannel[];
  updatedAt: number;
  lastRunAt?: number;
};

export type AutoLoginHistoryItem = {
  id: number;
  trigger: "manual" | "scheduled";
  startedAt: number;
  finishedAt: number;
  success: boolean;
  results: Array<{
    channel: AutoLoginChannel;
    success: boolean;
    message: string;
  }>;
};

const CONFIG_KEY = "wx_auto_login:config";
const HISTORY_COUNTER_KEY = "wx_auto_login:history:counter";
const HISTORY_INDEX_KEY = "wx_auto_login:history:index";
const HISTORY_ITEM_PREFIX = "wx_auto_login:history:item";
const RUN_LOCK_KEY = "wx_auto_login:lock";

const DEFAULT_CONFIG: AutoLoginConfig = {
  enabled: false,
  hour: 9,
  minute: 0,
  channels: ["135", "96"],
  updatedAt: Date.now(),
};

function historyItemKey(id: number): string {
  return `${HISTORY_ITEM_PREFIX}:${id}`;
}

function normalizeConfig(input?: Partial<AutoLoginConfig>): AutoLoginConfig {
  const hour = Number(input?.hour);
  const minute = Number(input?.minute);
  const channels = Array.isArray(input?.channels)
    ? input?.channels.filter((c): c is AutoLoginChannel => c === "135" || c === "96")
    : DEFAULT_CONFIG.channels;

  return {
    enabled: Boolean(input?.enabled),
    hour: Number.isFinite(hour) ? Math.min(23, Math.max(0, Math.floor(hour))) : DEFAULT_CONFIG.hour,
    minute: Number.isFinite(minute) ? Math.min(59, Math.max(0, Math.floor(minute))) : DEFAULT_CONFIG.minute,
    channels: channels.length > 0 ? channels : DEFAULT_CONFIG.channels,
    updatedAt: typeof input?.updatedAt === "number" ? input.updatedAt : Date.now(),
    lastRunAt: typeof input?.lastRunAt === "number" ? input.lastRunAt : undefined,
  };
}

export async function getAutoLoginConfig(): Promise<AutoLoginConfig> {
  const data = await redis.get<AutoLoginConfig>(CONFIG_KEY);
  if (!data) {
    return DEFAULT_CONFIG;
  }

  return normalizeConfig(data);
}

export async function saveAutoLoginConfig(input: Partial<AutoLoginConfig>): Promise<AutoLoginConfig> {
  const current = await getAutoLoginConfig();
  const next = normalizeConfig({
    ...current,
    ...input,
    updatedAt: Date.now(),
    lastRunAt: current.lastRunAt,
  });
  await redis.set(CONFIG_KEY, next);
  return next;
}

export async function updateAutoLoginLastRun(lastRunAt: number): Promise<void> {
  const current = await getAutoLoginConfig();
  const next: AutoLoginConfig = {
    ...current,
    lastRunAt,
    updatedAt: Date.now(),
  };
  await redis.set(CONFIG_KEY, next);
}

export async function appendAutoLoginHistory(item: Omit<AutoLoginHistoryItem, "id">): Promise<AutoLoginHistoryItem> {
  const id = await redis.incr(HISTORY_COUNTER_KEY);
  const next: AutoLoginHistoryItem = { id, ...item };

  await redis.set(historyItemKey(id), next);
  await redis.lpush(HISTORY_INDEX_KEY, String(id));

  return next;
}

export async function listAutoLoginHistory(params?: {
  page?: number;
  pageSize?: number;
}): Promise<{ items: AutoLoginHistoryItem[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, Number(params?.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params?.pageSize) || 10));

  const ids = (await redis.lrange<string[]>(HISTORY_INDEX_KEY, 0, -1)) || [];
  const total = ids.length;
  if (!total) {
    return { items: [], total: 0, page, pageSize };
  }

  const start = (page - 1) * pageSize;
  const pageIds = ids.slice(start, start + pageSize);

  const items = await Promise.all(
    pageIds.map(async (idText) => {
      const id = Number(idText);
      if (!Number.isFinite(id)) {
        return null;
      }
      return redis.get<AutoLoginHistoryItem>(historyItemKey(id));
    })
  );

  return {
    items: items.filter((x): x is AutoLoginHistoryItem => x !== null),
    total,
    page,
    pageSize,
  };
}

export async function acquireAutoLoginLock(): Promise<boolean> {
  const result = await redis.set(RUN_LOCK_KEY, String(Date.now()), { nx: true, ex: 120 });
  return result === "OK";
}

export async function releaseAutoLoginLock(): Promise<void> {
  await redis.del(RUN_LOCK_KEY);
}

export function shouldRunNow(config: AutoLoginConfig, now: Date = new Date()): boolean {
  if (!config.enabled) {
    return false;
  }

  const lastRunAt = config.lastRunAt || 0;
  const nowTs = now.getTime();
  const todayRunAt = new Date(now);
  todayRunAt.setHours(config.hour, config.minute, 0, 0);

  const runTs = todayRunAt.getTime();
  if (nowTs < runTs) {
    return false;
  }

  return lastRunAt < runTs;
}
