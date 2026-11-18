// Kiss Wallet (docs/KISS_WALLET_RULES.md). No sign-up: the browser keeps `<id>.<token>` and
// sends it as the x-wallet header. Only the token's hash is stored.
//   POST   { name }   → { id, token, wallet }   create
//   GET               → { wallet }              summary with every khata
//   PATCH  { name }   → { wallet }              rename
//   DELETE            → { ok }                  delete wallet, its khatas and history (rule F3)
import { NextResponse } from "next/server";
import { tooMany } from "@/lib/rateLimit";
import { cleanName } from "@/lib/reveal/rules";
import { hashToken, newSecret, newWalletId, store, storeAvailable } from "@/lib/store";
import { walletFromRequest, walletView } from "@/lib/wallet/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
const CREATE_LIMIT = 30;

async function readName(req: Request): Promise<string | null> {
  try {
    const body = (await req.json()) as { name?: unknown };
    return cleanName(body.name);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  if (!storeAvailable()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const name = await readName(req);
  if (!name) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    if (await tooMany(req, "wallet-create", CREATE_LIMIT)) return NextResponse.json({ error: "too_many" }, { status: 429 });
    const token = newSecret();
    const now = new Date();
    for (let attempt = 0; attempt < 3; attempt++) {
      const id = newWalletId();
      try {
        const doc = { _id: id, name, tokenHash: hashToken(token), createdAt: now, lastActiveAt: now };
        await store().insertWallet(doc);
        return NextResponse.json({ id, token, wallet: await walletView(doc) }, { status: 201, headers: NO_STORE });
      } catch (err) {
        if ((err as { code?: number }).code === 11000) continue;
        throw err;
      }
    }
    return NextResponse.json({ error: "server" }, { status: 500 });
  } catch (err) {
    console.error("create wallet failed", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  if (!storeAvailable()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  try {
    const w = await walletFromRequest(req);
    if (!w) return NextResponse.json({ error: "not_found" }, { status: 404, headers: NO_STORE });
    // Keep an active wallet from expiring (rule F4); at most one write per hour.
    if (Date.now() - w.lastActiveAt.getTime() > 60 * 60 * 1000) await store().updateWallet(w._id, { lastActiveAt: new Date() });
    return NextResponse.json({ wallet: await walletView(w) }, { headers: NO_STORE });
  } catch (err) {
    console.error("load wallet failed", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!storeAvailable()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const name = await readName(req);
  if (!name) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const w = await walletFromRequest(req);
    if (!w) return NextResponse.json({ error: "not_found" }, { status: 404 });
    await store().updateWallet(w._id, { name, lastActiveAt: new Date() });
    return NextResponse.json({ wallet: await walletView({ ...w, name }) }, { headers: NO_STORE });
  } catch (err) {
    console.error("rename wallet failed", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!storeAvailable()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  try {
    const w = await walletFromRequest(req);
    if (!w) return NextResponse.json({ error: "not_found" }, { status: 404 });
    await store().deleteWalletCascade(w._id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("delete wallet failed", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
