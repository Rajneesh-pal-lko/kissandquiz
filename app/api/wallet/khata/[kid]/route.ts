// POST /api/wallet/khata/<kid>   header x-wallet   → { khata }
//   { action: "received", item: "peck" | "hug" | "ten" | "movie" }   rule D1–D2 (only the person owed)
//   { action: "forgive", amount: 1 | "all" }                          rule D3 (only the person owed)
//   { action: "gift", amount: 1 | 2 | 3 | 5 }                         rule C9 (adds to what I owe)
// You can only lower what is owed to you, and only raise what you owe.
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { tooMany } from "@/lib/rateLimit";
import { store, storeAvailable } from "@/lib/store";
import { DAILY_GIFT_CAP, GIFT_STEPS, KHATA_ID_RE, KHATA_MAX, RATE_CARD } from "@/lib/wallet/rules";
import { khataView, walletFromRequest } from "@/lib/wallet/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTION_LIMIT = 120;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function POST(req: Request, ctx: { params: Promise<{ kid: string }> }) {
  const { kid } = await ctx.params;
  if (!KHATA_ID_RE.test(kid)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!storeAvailable()) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  let body: { action?: unknown; item?: unknown; amount?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  try {
    if (await tooMany(req, "wallet-action", ACTION_LIMIT)) return NextResponse.json({ error: "too_many" }, { status: 429 });
    const me = await walletFromRequest(req);
    const khata = me ? await store().getKhata(kid) : null;
    if (!me || !khata || !khata.w.includes(me._id)) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const otherId = khata.w[0] === me._id ? khata.w[1] : khata.w[0];
    const partner = await store().getWallet(otherId);
    if (!partner) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const now = new Date();
    const logId = () => `x:${randomBytes(9).toString("base64url")}`;
    const owedToMe = khata.owed[me._id] ?? 0;

    if (body.action === "received" || body.action === "forgive") {
      let amount: number;
      let label: string | undefined;
      if (body.action === "received") {
        const item = RATE_CARD.find((r) => r.key === body.item);
        if (!item) return NextResponse.json({ error: "invalid" }, { status: 400 });
        amount = item.value;
        label = item.label;
      } else if (body.amount === "all") {
        amount = owedToMe;
      } else if (body.amount === 1) {
        amount = 1;
      } else {
        return NextResponse.json({ error: "invalid" }, { status: 400 });
      }
      if (amount <= 0 || amount > owedToMe) return NextResponse.json({ error: "not_enough" }, { status: 409 });
      if (!(await store().takeOwed(kid, me._id, amount, now))) return NextResponse.json({ error: "not_enough" }, { status: 409 });
      await store().insertKissLog({
        _id: logId(),
        khata: kid,
        to: me._id,
        by: me._id,
        amount: -amount,
        kind: body.action,
        ...(label ? { label } : {}),
        createdAt: now,
      });
    } else if (body.action === "gift") {
      const amount = body.amount;
      if (typeof amount !== "number" || !(GIFT_STEPS as readonly number[]).includes(amount)) {
        return NextResponse.json({ error: "invalid" }, { status: 400 });
      }
      const gifted = await store().sumKissLog(kid, { by: me._id }, ["gift"], new Date(now.getTime() - DAY_MS));
      if (gifted + amount > DAILY_GIFT_CAP) return NextResponse.json({ error: "gift_cap" }, { status: 429 });
      if ((khata.owed[otherId] ?? 0) + amount > KHATA_MAX) return NextResponse.json({ error: "khata_full" }, { status: 409 });
      await store().addOwed(kid, otherId, amount, now);
      await store().insertKissLog({ _id: logId(), khata: kid, to: otherId, by: me._id, amount, kind: "gift", createdAt: now });
    } else {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }

    await store().updateWallet(me._id, { lastActiveAt: now });
    const fresh = await store().getKhata(kid);
    return NextResponse.json(
      { khata: fresh ? await khataView(fresh, me._id, partner.name) : null },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("wallet action failed", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
