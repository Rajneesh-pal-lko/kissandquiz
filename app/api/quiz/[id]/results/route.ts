// GET /api/quiz/<id>/results   header: x-owner-token: <token>
// Only the creator (who holds the secret token) can read the partner's results.
import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { QUIZ_ID_RE } from "@/lib/quizRules";
import { hashToken, store, storeAvailable } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sameHash(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const token = req.headers.get("x-owner-token") ?? "";
  if (!QUIZ_ID_RE.test(id) || !token) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!storeAvailable()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  try {
    const quiz = await store().getQuiz(id);
    // Same response for "no quiz" and "wrong token", so IDs can't be probed.
    if (!quiz || !sameHash(quiz.ownerHash, hashToken(token))) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const results = await store().listResults(id);
    return NextResponse.json(
      {
        n: quiz.n,
        a: quiz.a,
        createdAt: quiz.createdAt,
        results: results.map((r) => ({
          partner: r.partner,
          guesses: r.guesses,
          score: r.score,
          total: r.total,
          createdAt: r.createdAt,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("list results failed", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
