// POST /api/game/<id>/join  { name }  →  { token, game }
// The first person to join takes slot B. Anyone after that gets 409 "full".
import { NextResponse } from "next/server";
import { tooMany } from "@/lib/rateLimit";
import { GAME_ID_RE, cleanName } from "@/lib/reveal/rules";
import { viewFor } from "@/lib/reveal/view";
import { hashToken, newSecret, store, storeAvailable, type GamePlayer } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JOIN_LIMIT = 60;

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!GAME_ID_RE.test(id)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!storeAvailable()) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  let body: { name?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const name = cleanName(body.name);
  if (!name) return NextResponse.json({ error: "invalid" }, { status: 400 });

  try {
    if (await tooMany(req, "game-join", JOIN_LIMIT)) {
      return NextResponse.json({ error: "too_many" }, { status: 429 });
    }
    const game = await store().getGame(id);
    if (!game) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (game.players.length >= 2) return NextResponse.json({ error: "full" }, { status: 409 });

    const token = newSecret();
    const now = new Date();
    const player: GamePlayer = { name, tokenHash: hashToken(token), answers: game.q.map(() => null), joinedAt: now };
    if (!(await store().joinGame(id, player, now))) {
      return NextResponse.json({ error: "full" }, { status: 409 }); // someone joined a moment earlier
    }
    const joined = { ...game, players: [game.players[0], player], joinedAt: now };
    return NextResponse.json({ token, game: viewFor(joined, 1) }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("join game failed", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
