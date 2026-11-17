// POST /api/quiz  { n, a }  →  { id, token }
// Creates a quiz. `token` is the creator's secret for reading results; only its hash is stored.
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { cleanName, cleanPairs } from "@/lib/quizRules";
import { hashToken, newOwnerToken, newQuizId, store, storeAvailable } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!storeAvailable()) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  let body: { n?: unknown; a?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const name = cleanName(body.n);
  const pairs = cleanPairs(body.a);
  if (!name || pairs.length === 0) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const user = await currentUser().catch(() => null);
  const token = newOwnerToken();
  for (let attempt = 0; attempt < 3; attempt++) {
    const id = newQuizId();
    try {
      await store().insertQuiz({ _id: id, n: name, a: pairs, ownerHash: hashToken(token), ...(user ? { ownerUserId: user._id } : {}), createdAt: new Date() });
      return NextResponse.json({ id, token }, { status: 201 });
    } catch (err) {
      if ((err as { code?: number }).code === 11000) continue; // ID clash, try another
      console.error("create quiz failed", err);
      return NextResponse.json({ error: "server" }, { status: 500 });
    }
  }
  return NextResponse.json({ error: "server" }, { status: 500 });
}
