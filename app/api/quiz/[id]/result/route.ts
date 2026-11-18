// POST /api/quiz/<id>/result  { guesses, partner? }  →  { score, total, walletCounted }
// Optional header x-wallet: the partner's Kiss Wallet. The first attempt with a wallet settles kisses.
// Saves the partner's attempt. The score is computed here, not trusted from the browser.
import { NextResponse } from "next/server";
import { QUIZ_ID_RE, cleanGuesses, cleanName, scoreOf } from "@/lib/quizRules";
import { MAX_RESULTS_PER_QUIZ, store, storeAvailable } from "@/lib/store";
import { quizOutcome } from "@/lib/wallet/rules";
import { counts, settleGame, walletFromRequest } from "@/lib/wallet/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!QUIZ_ID_RE.test(id)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!storeAvailable()) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  let body: { guesses?: unknown; partner?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  try {
    const quiz = await store().getQuiz(id);
    if (!quiz) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const guesses = cleanGuesses(body.guesses, quiz.a);
    if (!guesses) return NextResponse.json({ error: "invalid" }, { status: 400 });
    if ((await store().countResults(id)) >= MAX_RESULTS_PER_QUIZ) {
      return NextResponse.json({ error: "full" }, { status: 429 });
    }
    const score = scoreOf(quiz.a, guesses);
    await store().insertResult({
      quizId: id,
      partner: cleanName(body.partner),
      guesses,
      score,
      total: quiz.a.length,
      createdAt: new Date(),
    });
    const wallet = await walletFromRequest(req);
    const walletCounted = counts(quiz.walletId, wallet?._id);
    if (walletCounted) {
      await settleGame({
        wallets: [quiz.walletId, wallet!._id],
        outcome: quizOutcome(score, quiz.a.length, quiz.stake ?? 1),
        game: { type: "quiz", id },
      });
    }
    return NextResponse.json({ score, total: quiz.a.length, walletCounted }, { status: 201 });
  } catch (err) {
    console.error("save result failed", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
