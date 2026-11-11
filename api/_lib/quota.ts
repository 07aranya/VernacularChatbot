import type { IncomingMessage } from 'http';

export interface QuotaConfig {
  dailyLimit: number;
  perIpDailyLimit: number;
  perIpMinuteLimit: number;
  maxOutputTokens: number;
  maxHistoryMessages: number;
  maxMessageChars: number;
  maxImageBytes: number;
}

export interface QuotaSnapshot {
  dailyLimit: number;
  dailyUsed: number;
  dailyRemaining: number;
  perIpDailyLimit: number;
  perIpDailyUsed: number;
  perIpDailyRemaining: number;
  perIpMinuteLimit: number;
  perIpMinuteRemaining: number;
  maxOutputTokens: number;
  distributed: boolean;
  resetAtUtc: string;
}

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  retryAfterSeconds?: number;
  snapshot: QuotaSnapshot;
}

const parsePositiveInt = (raw: string | undefined, fallback: number): number => {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const getQuotaConfig = (): QuotaConfig => ({
  dailyLimit: parsePositiveInt(process.env.QUOTA_DAILY_LIMIT, 200),
  perIpDailyLimit: parsePositiveInt(process.env.QUOTA_PER_IP_DAILY_LIMIT, 40),
  perIpMinuteLimit: parsePositiveInt(process.env.QUOTA_PER_IP_MINUTE_LIMIT, 10),
  maxOutputTokens: parsePositiveInt(process.env.MAX_OUTPUT_TOKENS, 1024),
  maxHistoryMessages: parsePositiveInt(process.env.MAX_HISTORY_MESSAGES, 12),
  maxMessageChars: parsePositiveInt(process.env.MAX_MESSAGE_CHARS, 2000),
  maxImageBytes: parsePositiveInt(process.env.MAX_IMAGE_BYTES, 2 * 1024 * 1024)
});

const getUtcDayKey = (now = new Date()): string => now.toISOString().slice(0, 10);

const getUtcMinuteKey = (now = new Date()): string => now.toISOString().slice(0, 16);

const getNextUtcMidnightIso = (now = new Date()): string => {
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0)
  );
  return next.toISOString();
};

const getSecondsUntilUtcMidnight = (now = new Date()): number => {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0);
  return Math.max(1, Math.ceil((next - now.getTime()) / 1000));
};

const getSecondsUntilNextMinute = (now = new Date()): number => {
  return Math.max(1, 60 - now.getUTCSeconds());
};

export const extractClientIp = (req: IncomingMessage): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].split(',')[0].trim();
  }
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }
  return req.socket?.remoteAddress || 'unknown';
};

// --- In-memory fallback store (per warm serverless instance / local dev) ---
interface CounterEntry {
  count: number;
  expiresAt: number;
}

const memoryCounters = new Map<string, CounterEntry>();

const pruneMemoryCounters = (nowMs: number) => {
  if (memoryCounters.size < 500) return;
  for (const [k, v] of memoryCounters.entries()) {
    if (v.expiresAt <= nowMs) {
      memoryCounters.delete(k);
    }
  }
};

const getMemoryCount = (key: string, nowMs: number): number => {
  const entry = memoryCounters.get(key);
  if (!entry || entry.expiresAt <= nowMs) {
    if (entry) memoryCounters.delete(key);
    return 0;
  }
  return entry.count;
};

const incrMemoryCount = (key: string, ttlSeconds: number, nowMs: number): number => {
  pruneMemoryCounters(nowMs);
  const existing = memoryCounters.get(key);
  if (!existing || existing.expiresAt <= nowMs) {
    const next = { count: 1, expiresAt: nowMs + ttlSeconds * 1000 };
    memoryCounters.set(key, next);
    return 1;
  }
  existing.count += 1;
  return existing.count;
};

// --- Optional distributed Upstash / Vercel Redis REST support ---
const getRedisCredentials = (): { url: string; token: string } | null => {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) {
    return { url: url.replace(/\/$/, ''), token };
  }
  return null;
};

const redisPipeline = async (
  creds: { url: string; token: string },
  commands: (string | number)[][]
): Promise<Array<{ result: unknown }>> => {
  const res = await fetch(`${creds.url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${creds.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(commands)
  });
  if (!res.ok) {
    throw new Error(`Redis pipeline failed with status ${res.status}`);
  }
  return (await res.json()) as Array<{ result: unknown }>;
};

const readRedisCounts = async (
  creds: { url: string; token: string },
  keys: string[]
): Promise<number[]> => {
  const results = await redisPipeline(
    creds,
    keys.map((k) => ['GET', k])
  );
  return results.map((r) => {
    const n = Number(r?.result ?? 0);
    return Number.isFinite(n) ? n : 0;
  });
};

const incrRedisKey = async (
  creds: { url: string; token: string },
  key: string,
  ttlSeconds: number
): Promise<number> => {
  const results = await redisPipeline(creds, [
    ['INCR', key],
    ['TTL', key]
  ]);
  const count = Number(results[0]?.result ?? 0);
  const ttl = Number(results[1]?.result ?? -1);
  if (ttl < 0) {
    await redisPipeline(creds, [['EXPIRE', key, ttlSeconds]]);
  }
  return count;
};

const buildSnapshot = (
  cfg: QuotaConfig,
  dailyUsed: number,
  ipDailyUsed: number,
  ipMinuteUsed: number,
  distributed: boolean,
  now: Date
): QuotaSnapshot => ({
  dailyLimit: cfg.dailyLimit,
  dailyUsed,
  dailyRemaining: Math.max(0, cfg.dailyLimit - dailyUsed),
  perIpDailyLimit: cfg.perIpDailyLimit,
  perIpDailyUsed: ipDailyUsed,
  perIpDailyRemaining: Math.max(0, cfg.perIpDailyLimit - ipDailyUsed),
  perIpMinuteLimit: cfg.perIpMinuteLimit,
  perIpMinuteRemaining: Math.max(0, cfg.perIpMinuteLimit - ipMinuteUsed),
  maxOutputTokens: cfg.maxOutputTokens,
  distributed,
  resetAtUtc: getNextUtcMidnightIso(now)
});

/**
 * Reads current quota usage without incrementing counters (used by GET /api/chat).
 */
export const getQuotaSnapshot = async (ip: string): Promise<QuotaSnapshot> => {
  const cfg = getQuotaConfig();
  const now = new Date();
  const nowMs = now.getTime();
  const dayKey = `yb:quota:global:${getUtcDayKey(now)}`;
  const ipDayKey = `yb:quota:ipday:${ip}:${getUtcDayKey(now)}`;
  const ipMinKey = `yb:quota:ipmin:${ip}:${getUtcMinuteKey(now)}`;

  const redis = getRedisCredentials();
  if (redis) {
    try {
      const [dailyUsed, ipDailyUsed, ipMinuteUsed] = await readRedisCounts(redis, [
        dayKey,
        ipDayKey,
        ipMinKey
      ]);
      return buildSnapshot(cfg, dailyUsed, ipDailyUsed, ipMinuteUsed, true, now);
    } catch (err) {
      console.warn('Redis quota read failed, falling back to memory:', err);
    }
  }

  return buildSnapshot(
    cfg,
    getMemoryCount(dayKey, nowMs),
    getMemoryCount(ipDayKey, nowMs),
    getMemoryCount(ipMinKey, nowMs),
    false,
    now
  );
};

/**
 * Checks and consumes one unit of quota for the incoming request.
 * Checks limits before incrementing when possible so rejected requests do not burn daily quota.
 */
export const consumeQuota = async (ip: string): Promise<QuotaCheckResult> => {
  const cfg = getQuotaConfig();
  const now = new Date();
  const nowMs = now.getTime();
  const dayKey = `yb:quota:global:${getUtcDayKey(now)}`;
  const ipDayKey = `yb:quota:ipday:${ip}:${getUtcDayKey(now)}`;
  const ipMinKey = `yb:quota:ipmin:${ip}:${getUtcMinuteKey(now)}`;
  const dayTtl = getSecondsUntilUtcMidnight(now);
  const minTtl = getSecondsUntilNextMinute(now);

  const redis = getRedisCredentials();
  if (redis) {
    try {
      const [curGlobal, curIpDay, curIpMin] = await readRedisCounts(redis, [
        dayKey,
        ipDayKey,
        ipMinKey
      ]);

      const preCheck = evaluateLimits(cfg, curGlobal, curIpDay, curIpMin, true, now);
      if (!preCheck.allowed) return preCheck;

      const [nextGlobal, nextIpDay, nextIpMin] = await Promise.all([
        incrRedisKey(redis, dayKey, dayTtl),
        incrRedisKey(redis, ipDayKey, dayTtl),
        incrRedisKey(redis, ipMinKey, minTtl)
      ]);

      return {
        allowed: true,
        snapshot: buildSnapshot(cfg, nextGlobal, nextIpDay, nextIpMin, true, now)
      };
    } catch (err) {
      console.warn('Redis quota check failed, falling back to memory:', err);
    }
  }

  const curGlobal = getMemoryCount(dayKey, nowMs);
  const curIpDay = getMemoryCount(ipDayKey, nowMs);
  const curIpMin = getMemoryCount(ipMinKey, nowMs);

  const preCheck = evaluateLimits(cfg, curGlobal, curIpDay, curIpMin, false, now);
  if (!preCheck.allowed) return preCheck;

  const nextGlobal = incrMemoryCount(dayKey, dayTtl, nowMs);
  const nextIpDay = incrMemoryCount(ipDayKey, dayTtl, nowMs);
  const nextIpMin = incrMemoryCount(ipMinKey, minTtl, nowMs);

  return {
    allowed: true,
    snapshot: buildSnapshot(cfg, nextGlobal, nextIpDay, nextIpMin, false, now)
  };
};

const evaluateLimits = (
  cfg: QuotaConfig,
  dailyUsed: number,
  ipDailyUsed: number,
  ipMinuteUsed: number,
  distributed: boolean,
  now: Date
): QuotaCheckResult => {
  const snapshot = buildSnapshot(cfg, dailyUsed, ipDailyUsed, ipMinuteUsed, distributed, now);

  if (dailyUsed >= cfg.dailyLimit) {
    return {
      allowed: false,
      reason: `Daily site quota reached (${cfg.dailyLimit} requests/day). Resets at ${snapshot.resetAtUtc}.`,
      retryAfterSeconds: getSecondsUntilUtcMidnight(now),
      snapshot
    };
  }

  if (ipDailyUsed >= cfg.perIpDailyLimit) {
    return {
      allowed: false,
      reason: `Your daily limit reached (${cfg.perIpDailyLimit} requests/day). Please try again after UTC midnight.`,
      retryAfterSeconds: getSecondsUntilUtcMidnight(now),
      snapshot
    };
  }

  if (ipMinuteUsed >= cfg.perIpMinuteLimit) {
    return {
      allowed: false,
      reason: `Too many requests in a short time (limit ${cfg.perIpMinuteLimit}/min). Please wait a moment.`,
      retryAfterSeconds: getSecondsUntilNextMinute(now),
      snapshot
    };
  }

  return { allowed: true, snapshot };
};
