// GET /api/game/<id>/state   header x-player-token (optional)  →  { game }
// Players get their own view (see lib/reveal/view.ts). Without a valid token you only learn
// the creator's name and whether the game already has two players.
import { NextResponse } from "next/server";
import { GAME_ID_RE } from "@/lib/reveal/rules";
import { playerFor, viewFor } from "@/lib/reveal/view";
import { store, storeAvailable } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!GAME_ID_RE.test(id)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!storeAvailable()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  try {
    const game = await store().getGame(id);
    if (!game) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const me = playerFor(game, req.headers.get("x-player-token"));
    return NextResponse.json({ game: viewFor(game, me) }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("load game failed", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
