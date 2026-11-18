// POST /api/game  { type, name, q, answers: [{pick, guess}, …], stake? }  →  { id, token }
// Optional header x-wallet links the creator's Kiss Wallet (never required).
// Creates a two-player reveal game (Would You Rather, …). The creator answers every round
// up front. `token` is the creator's secret; only its hash is stored.
import { NextResponse } from "next/server";
import { tooMany } from "@/lib/rateLimit";
import { configFor } from "@/lib/reveal/configs";
import { cleanAnswers, cleanName, cleanQuestionList } from "@/lib/reveal/rules";
import { hashToken, newQuizId, newSecret, store, storeAvailable } from "@/lib/store";
import { cleanStake } from "@/lib/wallet/rules";
import { walletFromRequest } from "@/lib/wallet/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** New games per IP per hour. Generous, because many phones in India share an IP. */
const CREATE_LIMIT = 30;

export async function POST(req: Request) {
  if (!storeAvailable()) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  let body: { type?: unknown; name?: unknown; q?: unknown; answers?: unknown; stake?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const cfg = configFor(body.type);
  const name = cleanName(body.name);
  const q = cfg ? cleanQuestionList(cfg, body.q) : null;
  const answers = cfg && q ? cleanAnswers(cfg, q, body.answers) : null;
  if (!cfg || !name || !q || !answers) return NextResponse.json({ error: "invalid" }, { status: 400 });

  try {
    if (await tooMany(req, "game-create", CREATE_LIMIT)) {
      return NextResponse.json({ error: "too_many" }, { status: 429 });
    }
  } catch (err) {
    console.error("create game failed", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }

  const wallet = await walletFromRequest(req);
  const token = newSecret();
  const now = new Date();
  for (let attempt = 0; attempt < 3; attempt++) {
    const id = newQuizId();
    try {
      await store().insertGame({
        _id: id,
        type: cfg.type,
        q,
        players: [
          { name, tokenHash: hashToken(token), answers, joinedAt: now, finishedAt: now, ...(wallet ? { walletId: wallet._id } : {}) },
        ],
        stake: cleanStake(body.stake),
        createdAt: now,
      });
      return NextResponse.json({ id, token }, { status: 201 });
    } catch (err) {
      if ((err as { code?: number }).code === 11000) continue; // ID clash, try another
      console.error("create game failed", err);
      return NextResponse.json({ error: "server" }, { status: 500 });
    }
  }
  return NextResponse.json({ error: "server" }, { status: 500 });
}
