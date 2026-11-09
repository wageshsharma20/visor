import { MemoryStore, Store } from './store';
import { PgStore } from './pgStore';

let store: Store | null = null;

/** Postgres when DATABASE_URL is set, otherwise an in-memory store. */
export function getStore(): Store {
  if (!store) {
    const url = process.env.DATABASE_URL;
    store = url ? new PgStore(url) : new MemoryStore();
  }
  return store;
}

/** Test hook: replace the store. */
export function setStore(s: Store | null): void {
  store = s;
}

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

export function error(status: number, message: string): Response {
  return json({ error: message }, status);
}

/** Constant-time string compare. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Write endpoints require `Authorization: Bearer <VISOR_API_KEY>`.
 * If the key is not configured, writes are refused (fail closed).
 */
export function requireKey(req: Request): Response | null {
  const key = process.env.VISOR_API_KEY;
  if (!key) return error(503, 'VISOR_API_KEY is not configured on the server');
  const header = req.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token || !safeEqual(token, key)) return error(401, 'missing or invalid API key');
  return null;
}

export const MAX_BODY_BYTES = 256 * 1024;

export async function readJson(req: Request): Promise<{ ok: true; value: unknown } | { ok: false; res: Response }> {
  const len = Number(req.headers.get('content-length') ?? 0);
  if (len > MAX_BODY_BYTES) return { ok: false, res: error(413, 'body too large') };
  const text = await req.text();
  if (text.length > MAX_BODY_BYTES) return { ok: false, res: error(413, 'body too large') };
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, res: error(400, 'body is not valid JSON') };
  }
}

/** Wrap a handler so unexpected failures return JSON 500 without leaking details. */
export function handle(fn: (req: Request) => Promise<Response>): (req: Request) => Promise<Response> {
  return async (req) => {
    try {
      return await fn(req);
    } catch (e) {
      console.error('[visor api]', e);
      return error(500, 'internal error');
    }
  };
}
