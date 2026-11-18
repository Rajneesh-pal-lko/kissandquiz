// Kiss Wallet in the browser. The wallet's ID + secret live on this phone (localStorage).
// A private link /wallet/#<id>.<token> opens the same wallet on another phone or browser.
// Every call here is optional: if the wallet can't be reached, games still play (rule B4).
import { load, remove, save } from "@/lib/storage";

export type LocalWallet = { id: string; token: string; name: string };

const KEY = "kq.wallet.v1";
const CACHE_KEY = "kq.wallet.cache.v1";
const ID_RE = /^[A-Za-z0-9]{12}$/;
const TOKEN_RE = /^[A-Za-z0-9_-]{20,64}$/;
/** Never make a player wait long for the wallet before a game call. */
const TIMEOUT_MS = 4000;

export function getLocalWallet(): LocalWallet | null {
  const w = load<LocalWallet>(KEY);
  return w && ID_RE.test(w.id) && TOKEN_RE.test(w.token) ? w : null;
}

export function setLocalWallet(w: LocalWallet): void {
  save(KEY, w);
  clearWalletCache();
}

/** Tell the header chip to re-read the wallet. */
function notify(): void {
  try {
    window.dispatchEvent(new Event("kq-wallet"));
  } catch {
    // Not in a browser.
  }
}

export function forgetLocalWallet(): void {
  remove(KEY);
  clearWalletCache();
}

/** Header for API calls; empty when this phone has no wallet. */
export function walletHeader(): Record<string, string> {
  const w = getLocalWallet();
  return w ? { "x-wallet": `${w.id}.${w.token}` } : {};
}

export function parseWalletLink(hash: string): { id: string; token: string } | null {
  const raw = hash.replace(/^#/, "");
  const dot = raw.indexOf(".");
  if (dot < 0) return null;
  const id = raw.slice(0, dot);
  const token = raw.slice(dot + 1);
  return ID_RE.test(id) && TOKEN_RE.test(token) ? { id, token } : null;
}

export function privateWalletUrl(origin: string, w: LocalWallet): string {
  return `${origin}/wallet/#${w.id}.${w.token}`;
}

/** Make a wallet for this phone if it has none. Returns null on any problem (never throws). */
export async function ensureWallet(name: string): Promise<LocalWallet | null> {
  const existing = getLocalWallet();
  if (existing) return existing;
  const clean = name.replace(/\s+/g, " ").trim();
  if (!clean) return null;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch("/api/wallet/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: clean }),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { id: string; token: string; wallet: { name: string } };
    const w = { id: data.id, token: data.token, name: data.wallet.name };
    setLocalWallet(w);
    return w;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// ---- Small cached summary for the header chip (avoids a database read on every page). ----
type Cache = { at: number; owedToMe: number };
const CACHE_MS = 60 * 1000;

export function clearWalletCache(): void {
  remove(CACHE_KEY, "session");
  notify();
}

export function cachedOwedToMe(): number | null {
  const c = load<Cache>(CACHE_KEY, "session");
  return c && Date.now() - c.at < CACHE_MS ? c.owedToMe : null;
}

export function cacheOwedToMe(n: number): void {
  save(CACHE_KEY, { at: Date.now(), owedToMe: n }, "session");
  notify();
}
