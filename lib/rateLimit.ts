// Server-only: simple per-IP rate limit, stored in the database so it works across
// Vercel functions (in-memory counters don't). The IP is never stored, only a salted hash,
// and counters are deleted automatically after 2 hours (RATE_KEEP_SECONDS).
import "server-only";
import { hashToken, store } from "@/lib/store";

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Count this request and return true if the IP made more than `limit` requests for
 * `action` in the current window. A clash between two first requests (duplicate key) is
 * allowed through; any other error (database down) is thrown, so the caller answers
 * right away instead of waiting for the database a second time.
 */
export async function tooMany(req: Request, action: string, limit: number, windowMinutes = 60): Promise<boolean> {
  const salt = process.env.RATE_LIMIT_SALT || "kq-rate";
  const windowId = Math.floor(Date.now() / (windowMinutes * 60 * 1000));
  const key = `${action}:${hashToken(`${salt}:${clientIp(req)}`).slice(0, 32)}:${windowId}`;
  try {
    return (await store().hitRate(key)) > limit;
  } catch (err) {
    if ((err as { code?: number }).code === 11000) return false;
    throw err;
  }
}
