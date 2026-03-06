import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: "https://prepared-ringtail-38825.upstash.io",
  token: "AZepAAIncDIxMWNlMDUwZjA2NzA0YjRlYjgyMjY1MmUzYmM2OTZlZnAyMzg4MjU",
});

const CODE_PREFIX = "wx_access_code";
const DEFAULT_MAX_USES = 2;
const CODE_INDEX_KEY = `${CODE_PREFIX}:index`;

export type AccessCodeMeta = {
  code: string;
  maxUses: number;
  createdAt: number;
  disabled: boolean;
  isPermanent: boolean;
};

export type AccessCodeStatus = AccessCodeMeta & {
  remainingUses: number;
  usedCount: number;
};

function generateTemporaryCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const randomChunk = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `TMP-${randomChunk()}-${randomChunk()}`;
}

function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase();
}

function metaKey(code: string): string {
  return `${CODE_PREFIX}:meta:${code}`;
}

function remainingKey(code: string): string {
  return `${CODE_PREFIX}:remaining:${code}`;
}

function usedCountKey(code: string): string {
  return `${CODE_PREFIX}:used:${code}`;
}

function normalizeMeta(meta: AccessCodeMeta | (Partial<AccessCodeMeta> & { code: string })): AccessCodeMeta {
  return {
    code: meta.code,
    maxUses: typeof meta.maxUses === "number" ? meta.maxUses : DEFAULT_MAX_USES,
    createdAt: typeof meta.createdAt === "number" ? meta.createdAt : Date.now(),
    disabled: Boolean(meta.disabled),
    isPermanent: Boolean(meta.isPermanent),
  };
}

function buildStatus(meta: AccessCodeMeta, remainingRaw: number): AccessCodeStatus {
  const remainingUses = meta.isPermanent ? -1 : Math.max(remainingRaw, 0);

  return {
    ...meta,
    remainingUses,
    usedCount: 0,
  };
}

async function getUsedCount(code: string, meta: AccessCodeMeta, remainingRaw: number): Promise<number> {
  const storedUsedCount = await redis.get<number>(usedCountKey(code));

  if (typeof storedUsedCount === "number") {
    return Math.max(0, storedUsedCount);
  }

  if (meta.isPermanent) {
    return 0;
  }

  const inferredUsed = meta.maxUses - Math.max(remainingRaw, 0);
  return Math.min(meta.maxUses, Math.max(0, inferredUsed));
}

export async function createAccessCode(input: {
  code?: string;
  maxUses?: number;
  disabled?: boolean;
  isPermanent?: boolean;
}): Promise<{ ok: true; status: AccessCodeStatus } | { ok: false; reason: string }> {
  let code = normalizeCode(input.code || "");
  const isPermanent = Boolean(input.isPermanent);
  const maxUses = Number.isFinite(input.maxUses) && (input.maxUses as number) > 0
    ? Math.floor(input.maxUses as number)
    : DEFAULT_MAX_USES;

  if (!code) {
    let generated = "";
    for (let i = 0; i < 12; i += 1) {
      const candidate = generateTemporaryCode();
      const existing = await redis.get<AccessCodeMeta>(metaKey(candidate));
      if (!existing) {
        generated = candidate;
        break;
      }
    }

    if (!generated) {
      return { ok: false, reason: "自动生成访问码失败，请重试" };
    }

    code = generated;
  }

  const existingMeta = await redis.get<AccessCodeMeta>(metaKey(code));
  if (existingMeta) {
    const remaining = (await redis.get<number>(remainingKey(code))) ?? 0;
    return { ok: false, reason: `访问码已存在，剩余 ${Math.max(remaining, 0)} 次` };
  }

  const meta: AccessCodeMeta = {
    code,
    maxUses,
    createdAt: Date.now(),
    disabled: Boolean(input.disabled),
    isPermanent,
  };

  await redis.set(metaKey(code), meta);
  await redis.set(remainingKey(code), isPermanent ? -1 : maxUses);
  await redis.set(usedCountKey(code), 0);
  await redis.sadd(CODE_INDEX_KEY, code);

  const status = buildStatus(meta, isPermanent ? -1 : maxUses);
  status.usedCount = 0;

  return {
    ok: true,
    status,
  };
}

export async function listAccessCodes(): Promise<AccessCodeStatus[]> {
  const codes = (await redis.smembers<string[]>(CODE_INDEX_KEY)) || [];
  if (!codes.length) {
    return [];
  }

  const statuses = await Promise.all(codes.map((code) => getAccessCodeStatus(code)));
  return statuses
    .filter((item): item is AccessCodeStatus => item !== null)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function getAccessCodeStatus(rawCode: string): Promise<AccessCodeStatus | null> {
  const code = normalizeCode(rawCode || "");
  if (!code) {
    return null;
  }

  const metaRaw = await redis.get<AccessCodeMeta>(metaKey(code));
  if (!metaRaw) {
    return null;
  }
  const meta = normalizeMeta(metaRaw);

  const remaining = (await redis.get<number>(remainingKey(code))) ?? 0;
  const status = buildStatus(meta, remaining);
  status.usedCount = await getUsedCount(code, meta, remaining);
  return status;
}

export async function checkAccessCode(rawCode: string): Promise<
  | { ok: true; status: AccessCodeStatus }
  | { ok: false; reason: string; status?: AccessCodeStatus }
> {
  const code = normalizeCode(rawCode || "");
  if (!code) {
    return { ok: false, reason: "访问码不能为空" };
  }

  const status = await getAccessCodeStatus(code);
  if (!status) {
    return { ok: false, reason: "访问码不存在" };
  }

  if (status.disabled) {
    return { ok: false, reason: "访问码已被禁用", status };
  }

  if (!status.isPermanent && status.remainingUses <= 0) {
    return { ok: false, reason: "访问码已失效（使用次数已用完）", status };
  }

  return { ok: true, status };
}

export async function consumeAccessCode(rawCode: string): Promise<
  | { ok: true; status: AccessCodeStatus }
  | { ok: false; reason: string; status?: AccessCodeStatus }
> {
  const code = normalizeCode(rawCode || "");
  if (!code) {
    return { ok: false, reason: "访问码不能为空" };
  }

  const meta = await redis.get<AccessCodeMeta>(metaKey(code));
  if (!meta) {
    return { ok: false, reason: "访问码不存在" };
  }
  const normalizedMeta = normalizeMeta(meta);

  const currentRemaining = (await redis.get<number>(remainingKey(code))) ?? 0;

  if (normalizedMeta.disabled) {
    const status = buildStatus(normalizedMeta, currentRemaining);
    status.usedCount = await getUsedCount(code, normalizedMeta, currentRemaining);
    return {
      ok: false,
      reason: "访问码已被禁用",
      status,
    };
  }

  if (normalizedMeta.isPermanent) {
    const newUsedCount = await redis.incr(usedCountKey(code));
    const status = buildStatus(normalizedMeta, -1);
    status.usedCount = Math.max(0, newUsedCount);
    return {
      ok: true,
      status,
    };
  }

  const remainingAfterConsume = await redis.decr(remainingKey(code));

  if (remainingAfterConsume < 0) {
    const status = buildStatus(normalizedMeta, remainingAfterConsume);
    status.usedCount = await getUsedCount(code, normalizedMeta, remainingAfterConsume);
    return {
      ok: false,
      reason: "访问码已失效（使用次数已用完）",
      status,
    };
  }

  const newUsedCount = await redis.incr(usedCountKey(code));
  const status = buildStatus(normalizedMeta, remainingAfterConsume);
  status.usedCount = Math.max(0, newUsedCount);

  return {
    ok: true,
    status,
  };
}

export async function deleteAccessCode(rawCode: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const code = normalizeCode(rawCode || "");
  if (!code) {
    return { ok: false, reason: "访问码不能为空" };
  }

  const meta = await redis.get<AccessCodeMeta>(metaKey(code));
  if (!meta) {
    return { ok: false, reason: "访问码不存在" };
  }

  await redis.del(metaKey(code));
  await redis.del(remainingKey(code));
  await redis.del(usedCountKey(code));
  await redis.srem(CODE_INDEX_KEY, code);

  return { ok: true };
}

export async function setAccessCodePermanent(
  rawCode: string,
  isPermanent: boolean
): Promise<{ ok: true; status: AccessCodeStatus } | { ok: false; reason: string }> {
  const code = normalizeCode(rawCode || "");
  if (!code) {
    return { ok: false, reason: "访问码不能为空" };
  }

  const metaRaw = await redis.get<AccessCodeMeta>(metaKey(code));
  if (!metaRaw) {
    return { ok: false, reason: "访问码不存在" };
  }

  const meta = normalizeMeta(metaRaw);
  meta.isPermanent = isPermanent;

  if (!isPermanent && meta.maxUses <= 0) {
    meta.maxUses = DEFAULT_MAX_USES;
  }

  await redis.set(metaKey(code), meta);

  if (isPermanent) {
    await redis.set(remainingKey(code), -1);
  } else {
    const existingRemaining = (await redis.get<number>(remainingKey(code))) ?? meta.maxUses;
    const nextRemaining = existingRemaining < 0 ? meta.maxUses : Math.max(0, existingRemaining);
    await redis.set(remainingKey(code), nextRemaining);
  }

  const status = await getAccessCodeStatus(code);
  if (!status) {
    return { ok: false, reason: "更新后读取失败" };
  }

  return { ok: true, status };
}
