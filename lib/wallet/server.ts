// Server-only Kiss Wallet logic: who is calling (wallet header), settling a finished game into
// the khata, and the wallet summary the browser shows. Rules: docs/KISS_WALLET_RULES.md.
import "server-only";
import { timingSafeEqual } from "crypto";
import { hashToken, store, type KhataDoc, type KissLogDoc, type WalletDoc } from "@/lib/store";
import type { KhataView, WalletView } from "./types";
import { DAILY_GAME_CAP, DAILY_GIFT_CAP, KHATA_MAX, WALLET_ID_RE, khataId, type Outcome } from "./rules";

/** Browser sends `x-wallet: <id>.<token>`. */
export const WALLET_HEADER = "x-wallet";
const TOKEN_RE = /^[A-Za-z0-9_-]{20,64}$/;
const DAY_MS = 24 * 60 * 60 * 1000;
const EARN_KINDS: KissLogDoc["kind"][] = ["win", "tie", "bonus"];

export function parseWalletCredential(raw: string | null | undefined): { id: string; token: string } | null {
  if (!raw || raw.length > 100) return null;
  const dot = raw.indexOf(".");
  if (dot < 0) return null;
  const id = raw.slice(0, dot);
  const token = raw.slice(dot + 1);
  return WALLET_ID_RE.test(id) && TOKEN_RE.test(token) ? { id, token } : null;
}

function sameHash(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** The caller's wallet, or null (missing, wrong token, deleted). Never throws. */
export async function walletFromRequest(req: Request): Promise<WalletDoc | null> {
  const cred = parseWalletCredential(req.headers.get(WALLET_HEADER));
  if (!cred) return null;
  try {
    const w = await store().getWallet(cred.id);
    return w && sameHash(w.tokenHash, hashToken(cred.token)) ? w : null;
  } catch (err) {
    console.error("wallet lookup failed", err);
    return null;
  }
}

/** Rule B5: both players have wallets and they are different. */
export function counts(w0: string | undefined, w1: string | undefined): boolean {
  return !!w0 && !!w1 && w0 !== w1;
}

/**
 * Add a finished game's kisses to the two players' khata (rules C2–C8).
 * Runs once per game: the first history line has a fixed ID, so a second call stops there.
 * Never throws (the game result must not fail because of the wallet).
 */
export async function settleGame(args: {
  wallets: [string | undefined, string | undefined];
  outcome: Outcome;
  game: { type: "wyr" | "quiz"; id: string };
  at?: Date;
}): Promise<void> {
  const [w0, w1] = args.wallets;
  if (!counts(w0, w1)) return;
  const at = args.at ?? new Date();
  try {
    const [a, b] = await Promise.all([store().getWallet(w0!), store().getWallet(w1!)]);
    if (!a || !b) return;
    const kid = khataId(a._id, b._id);
    await store().ensureKhata(kid, a._id < b._id ? [a._id, b._id] : [b._id, a._id], at);
    const since = new Date(at.getTime() - DAY_MS);
    for (let i = 0; i < args.outcome.earnings.length; i++) {
      const e = args.outcome.earnings[i];
      const to = e.to === 0 ? a._id : b._id;
      const by = e.to === 0 ? b._id : a._id;
      const [earnedToday, khata] = await Promise.all([
        store().sumKissLog(kid, { to }, EARN_KINDS, since),
        store().getKhata(kid),
      ]);
      const owed = khata?.owed[to] ?? 0;
      const apply = Math.max(0, Math.min(e.amount, DAILY_GAME_CAP - earnedToday, KHATA_MAX - owed));
      const inserted = await store().insertKissLog({
        _id: `${args.game.type}:${args.game.id}:${i}`,
        khata: kid,
        to,
        by,
        amount: apply,
        kind: e.kind,
        game: args.game,
        ...(apply < e.amount ? { capped: true } : {}),
        createdAt: at,
      });
      if (!inserted) return; // already settled
      if (apply > 0) await store().addOwed(kid, to, apply, at);
    }
    await Promise.all([store().updateWallet(a._id, { lastActiveAt: at }), store().updateWallet(b._id, { lastActiveAt: at })]);
  } catch (err) {
    console.error("settle game failed", err);
  }
}

export async function khataView(k: KhataDoc, me: string, partnerName: string, historyLimit = 30): Promise<KhataView> {
  const other = k.w[0] === me ? k.w[1] : k.w[0];
  const since = new Date(Date.now() - DAY_MS);
  const [log, earnedToday, giftedToday] = await Promise.all([
    store().listKissLog(k._id, historyLimit),
    store().sumKissLog(k._id, { to: me }, EARN_KINDS, since),
    store().sumKissLog(k._id, { by: me }, ["gift"], since),
  ]);
  return {
    id: k._id,
    partner: partnerName,
    owedToMe: Math.max(0, k.owed[me] ?? 0),
    iOwe: Math.max(0, k.owed[other] ?? 0),
    earnedToday,
    giftedToday,
    caps: { daily: DAILY_GAME_CAP, gift: DAILY_GIFT_CAP, khata: KHATA_MAX },
    updatedAt: k.updatedAt.toISOString(),
    history: log.map((l) => ({
      at: l.createdAt.toISOString(),
      kind: l.kind,
      amount: l.amount,
      side: l.to === me ? "mine" : "theirs",
      byMe: l.by === me && (l.kind === "gift" || l.kind === "received" || l.kind === "forgive"),
      ...(l.game ? { game: l.game.type } : {}),
      ...(l.label ? { label: l.label } : {}),
      ...(l.capped ? { capped: true } : {}),
    })),
  };
}

export async function walletView(w: WalletDoc): Promise<WalletView> {
  const khatas = await store().listKhatas(w._id);
  const views: KhataView[] = [];
  for (const k of khatas) {
    const other = k.w[0] === w._id ? k.w[1] : k.w[0];
    const partner = await store().getWallet(other);
    if (!partner) continue; // partner deleted their wallet
    views.push(await khataView(k, w._id, partner.name));
  }
  return {
    id: w._id,
    name: w.name,
    createdAt: w.createdAt.toISOString(),
    owedToMe: views.reduce((n, k) => n + k.owedToMe, 0),
    iOwe: views.reduce((n, k) => n + k.iOwe, 0),
    khatas: views,
  };
}
