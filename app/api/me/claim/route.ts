// POST /api/me/claim/  { quizzes: [{ id, token }] }  →  { claimed }
// Moves quizzes made on this phone (before signing in) into the account.
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { QUIZ_ID_RE } from "@/lib/quizRules";
import { hashToken, store } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "signed_out" }, { status: 401 });
    const list = (await req.json()).quizzes;
    if (!Array.isArray(list)) return NextResponse.json({ error: "invalid" }, { status: 400 });
    let claimed = 0;
    for (const q of list.slice(0, 50)) {
      if (!q || typeof q.id !== "string" || typeof q.token !== "string" || !QUIZ_ID_RE.test(q.id)) continue;
      if (await store().claimQuiz(q.id, hashToken(q.token), user._id)) claimed++;
    }
    return NextResponse.json({ claimed });
  } catch (err) {
    console.error("claim failed", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
