// POST /api/game/<id>/round   header x-player-token   { round, pick, guess }  →  { game }
// Saves one round. Rounds go in order, once each, and are locked after saving (the reply
// reveals the other player's answer for that round, so it must not be changeable).
import { NextResponse } from "next/server";
import { configFor } from "@/lib/reveal/configs";
import { GAME_ID_RE, cleanAnswer, nextRound, scoreOf } from "@/lib/reveal/rules";
import { playerFor, viewFor } from "@/lib/reveal/view";
import { hashToken, store, storeAvailable, type GameDoc } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!GAME_ID_RE.test(id)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!storeAvailable()) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  let body: { round?: unknown; pick?: unknown; guess?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const token = req.headers.get("x-player-token");

  try {
    const game = await store().getGame(id);
    const cfg = game ? configFor(game.type) : null;
    const me = game ? playerFor(game, token) : null;
    // Same answer for "no game" and "wrong token", so IDs and tokens can't be probed.
    if (!game || !cfg || me === null) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const round = body.round;
    const mine = game.players[me].answers;
    const expected = nextRound(mine);
    if (expected === -1) return NextResponse.json({ error: "done", game: viewFor(game, me) }, { status: 409, headers: NO_STORE });
    if (round !== expected) {
      // Already answered (locked) or out of order: send the current state so the browser can catch up.
      return NextResponse.json({ error: "order", game: viewFor(game, me) }, { status: 409, headers: NO_STORE });
    }
    const answer = cleanAnswer(cfg, game.q[expected], { pick: body.pick, guess: body.guess });
    if (!answer) return NextResponse.json({ error: "invalid" }, { status: 400 });

    // Work out the new state locally, so we can score the game when this was the last round.
    const next: GameDoc = structuredClone(game);
    next.players[me].answers[expected] = answer;
    const other = next.players[me === 0 ? 1 : 0];
    const finished =
      !!other && next.players.every((p) => p.answers.every(Boolean)) && next.players.length === 2;
    const now = new Date();
    const finish = finished ? { at: now, score: scoreOf(cfg, next.players[0].answers, next.players[1].answers) } : undefined;
    if (!(await store().saveRound(id, me, hashToken(token as string), expected, answer, finish))) {
      const fresh = await store().getGame(id);
      return NextResponse.json({ error: "order", game: fresh ? viewFor(fresh, me) : null }, { status: 409, headers: NO_STORE });
    }
    if (finish) {
      next.finishedAt = now;
      next.players[me].finishedAt = now;
    }
    return NextResponse.json({ game: viewFor(next, me) }, { headers: NO_STORE });
  } catch (err) {
    console.error("save round failed", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
