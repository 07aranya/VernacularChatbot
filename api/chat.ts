import type { IncomingMessage, ServerResponse } from 'http';
import {
  consumeQuota,
  extractClientIp,
  getQuotaConfig,
  getQuotaSnapshot
} from './_lib/quota.js';
import {
  executePreparedTutorRequest,
  getServerApiKey,
  prepareTutorRequest,
  RequestValidationError,
  type ChatApiPayload
} from './_lib/geminiProxy.js';

type NodeReqWithBody = IncomingMessage & { body?: unknown };

const MAX_RAW_BODY_BYTES = 4 * 1024 * 1024; // Stay under Vercel's 4.5 MB request limit

const sendJson = (
  res: ServerResponse,
  status: number,
  payload: unknown,
  headers: Record<string, string | number> = {}
) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  for (const [k, v] of Object.entries(headers)) {
    res.setHeader(k, String(v));
  }
  res.end(JSON.stringify(payload));
};

const readJsonBody = async (req: NodeReqWithBody): Promise<unknown> => {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      return req.body ? JSON.parse(req.body) : {};
    }
    return req.body;
  }

  return await new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;

    req.on('data', (chunk: Buffer | string) => {
      const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      totalBytes += buf.length;
      if (totalBytes > MAX_RAW_BODY_BYTES) {
        reject(new RequestValidationError('Request payload is too large.', 413));
        req.destroy();
        return;
      }
      chunks.push(buf);
    });

    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new RequestValidationError('Invalid JSON request body.', 400));
      }
    });

    req.on('error', (err) => reject(err));
  });
};

const isUpstreamQuotaError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  const errObj = error as { status?: number; code?: number; message?: string };
  if (errObj.status === 429 || errObj.code === 429) return true;
  const msg = (errObj.message || '').toLowerCase();
  return msg.includes('429') || msg.includes('quota') || msg.includes('resource_exhausted');
};

/**
 * Serverless API handler for YourBuddy AI Tutor (/api/chat).
 * Keeps the Gemini API key server-side and enforces rate/quota limits.
 */
export default async function handler(req: NodeReqWithBody, res: ServerResponse) {
  const clientIp = extractClientIp(req);

  if (req.method === 'GET') {
    try {
      const snapshot = await getQuotaSnapshot(clientIp);
      return sendJson(res, 200, {
        configured: Boolean(getServerApiKey()),
        quota: snapshot
      });
    } catch (error) {
      console.error('Status check error:', error);
      return sendJson(res, 500, { error: 'Failed to read server status.' });
    }
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method Not Allowed' }, { Allow: 'GET, POST' });
  }

  if (!getServerApiKey()) {
    return sendJson(res, 503, {
      error:
        'Server Gemini API key is not configured. Set GEMINI_API_KEY in Vercel Environment Variables and redeploy.',
      code: 'API_KEY_MISSING'
    });
  }

  try {
    const body = (await readJsonBody(req)) as ChatApiPayload;
    const cfg = getQuotaConfig();
    const prepared = prepareTutorRequest(body, cfg);

    const quotaCheck = await consumeQuota(clientIp);
    const { snapshot } = quotaCheck;

    const rateHeaders: Record<string, string | number> = {
      'X-RateLimit-Limit': snapshot.perIpDailyLimit,
      'X-RateLimit-Remaining': snapshot.perIpDailyRemaining
    };

    if (!quotaCheck.allowed) {
      return sendJson(
        res,
        429,
        {
          error: quotaCheck.reason || 'Quota limit exceeded.',
          code: 'QUOTA_EXCEEDED',
          retryAfterSeconds: quotaCheck.retryAfterSeconds ?? 60,
          quota: snapshot
        },
        {
          ...rateHeaders,
          'Retry-After': quotaCheck.retryAfterSeconds ?? 60
        }
      );
    }

    const text = await executePreparedTutorRequest(prepared);
    return sendJson(res, 200, { text, quota: snapshot }, rateHeaders);
  } catch (error: unknown) {
    if (error instanceof RequestValidationError) {
      return sendJson(res, error.status, {
        error: error.message,
        code: error.status === 503 ? 'API_KEY_MISSING' : 'BAD_REQUEST'
      });
    }

    if (isUpstreamQuotaError(error)) {
      return sendJson(
        res,
        429,
        {
          error: 'Upstream Gemini API quota reached. Please wait a minute and try again.',
          code: 'UPSTREAM_QUOTA_EXCEEDED',
          retryAfterSeconds: 60
        },
        { 'Retry-After': 60 }
      );
    }

    console.error('Gemini proxy error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to generate AI response.';
    return sendJson(res, 500, { error: message, code: 'INTERNAL_ERROR' });
  }
}
