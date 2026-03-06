import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: "https://prepared-ringtail-38825.upstash.io",
  token: "AZepAAIncDIxMWNlMDUwZjA2NzA0YjRlYjgyMjY1MmUzYmM2OTZlZnAyMzg4MjU",
});

const RECORD_PREFIX = "wx_extract_record";
const RECORD_COUNTER_KEY = `${RECORD_PREFIX}:counter`;
const RECORD_INDEX_KEY = `${RECORD_PREFIX}:index`;

export type ExtractRecordStatus = "processing" | "success" | "failed";

export type ExtractRecord = {
  id: number;
  extractionId: string;
  createdAt: number;
  updatedAt: number;
  ip: string;
  accessCode: string;
  editorType: string;
  templateCode: string;
  receiverEditorType: string;
  receiverId: string;
  status: ExtractRecordStatus;
  resultTemplateId?: string;
  errorMessage?: string;
};

export type ExtractRecordListParams = {
  page?: number;
  pageSize?: number;
  accessCode?: string;
  templateCode?: string;
  receiverId?: string;
  status?: string;
  ip?: string;
  dateFrom?: string;
  dateTo?: string;
};

function recordKey(id: number): string {
  return `${RECORD_PREFIX}:item:${id}`;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function parseDateStart(value?: string): number | null {
  if (!value) {
    return null;
  }
  const ms = Date.parse(`${value}T00:00:00`);
  return Number.isNaN(ms) ? null : ms;
}

function parseDateEnd(value?: string): number | null {
  if (!value) {
    return null;
  }
  const ms = Date.parse(`${value}T23:59:59.999`);
  return Number.isNaN(ms) ? null : ms;
}

export async function createExtractRecord(input: {
  extractionId: string;
  ip: string;
  accessCode: string;
  editorType: string;
  templateCode: string;
  receiverEditorType: string;
  receiverId: string;
}): Promise<ExtractRecord> {
  const id = await redis.incr(RECORD_COUNTER_KEY);
  const now = Date.now();

  const record: ExtractRecord = {
    id,
    extractionId: input.extractionId,
    createdAt: now,
    updatedAt: now,
    ip: input.ip,
    accessCode: input.accessCode.trim().toUpperCase(),
    editorType: input.editorType,
    templateCode: input.templateCode,
    receiverEditorType: input.receiverEditorType,
    receiverId: input.receiverId,
    status: "processing",
  };

  await redis.set(recordKey(id), record);
  await redis.lpush(RECORD_INDEX_KEY, id.toString());

  return record;
}

export async function updateExtractRecord(input: {
  id: number;
  status: ExtractRecordStatus;
  resultTemplateId?: string;
  errorMessage?: string;
}): Promise<ExtractRecord | null> {
  const existing = await redis.get<ExtractRecord>(recordKey(input.id));
  if (!existing) {
    return null;
  }

  const next: ExtractRecord = {
    ...existing,
    status: input.status,
    updatedAt: Date.now(),
    resultTemplateId: input.resultTemplateId || existing.resultTemplateId,
    errorMessage: input.errorMessage || (input.status === "failed" ? existing.errorMessage : undefined),
  };

  if (input.status === "success") {
    next.errorMessage = undefined;
  }

  await redis.set(recordKey(input.id), next);
  return next;
}

function matchesFilter(record: ExtractRecord, params: ExtractRecordListParams): boolean {
  if (params.accessCode && !normalize(record.accessCode).includes(normalize(params.accessCode))) {
    return false;
  }
  if (params.templateCode && !normalize(record.templateCode).includes(normalize(params.templateCode))) {
    return false;
  }
  if (params.receiverId && !normalize(record.receiverId).includes(normalize(params.receiverId))) {
    return false;
  }
  if (params.status && normalize(record.status) !== normalize(params.status)) {
    return false;
  }
  if (params.ip && !normalize(record.ip).includes(normalize(params.ip))) {
    return false;
  }

  const fromTs = parseDateStart(params.dateFrom);
  if (fromTs !== null && record.createdAt < fromTs) {
    return false;
  }

  const toTs = parseDateEnd(params.dateTo);
  if (toTs !== null && record.createdAt > toTs) {
    return false;
  }

  return true;
}

export async function listExtractRecords(params: ExtractRecordListParams): Promise<{
  items: ExtractRecord[];
  page: number;
  pageSize: number;
  total: number;
}> {
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 10));

  const ids = (await redis.lrange<string[]>(RECORD_INDEX_KEY, 0, -1)) || [];
  if (ids.length === 0) {
    return { items: [], page, pageSize, total: 0 };
  }

  const records = await Promise.all(
    ids.map(async (idStr) => {
      const id = Number(idStr);
      if (!Number.isFinite(id)) {
        return null;
      }
      return redis.get<ExtractRecord>(recordKey(id));
    })
  );

  const validRecords = records.filter((item): item is ExtractRecord => item !== null);
  const filtered = validRecords.filter((item) => matchesFilter(item, params));

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    items: filtered.slice(start, end),
    page,
    pageSize,
    total,
  };
}
