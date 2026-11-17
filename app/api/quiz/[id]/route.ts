// GET /api/quiz/<id>  →  { n, a }
// Note: answers are sent to the browser so the game can reveal them instantly (same as the
// old long links). This is a fun game, not a secure test.
import { NextResponse } from "next/server";
import { QUIZ_ID_RE } from "@/lib/quizRules";
import { store, storeAvailable } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!QUIZ_ID_RE.test(id)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!storeAvailable()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  try {
    const quiz = await store().getQuiz(id);
    if (!quiz) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ n: quiz.n, a: quiz.a });
  } catch (err) {
    console.error("get quiz failed", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
