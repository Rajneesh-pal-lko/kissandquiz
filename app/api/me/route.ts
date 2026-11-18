// GET    /api/me/  →  { user, quizzes }   (401 if signed out)
// PATCH  /api/me/  { name }               (rename)
// DELETE /api/me/                          (delete account, its quizzes and results)
import { NextResponse } from "next/server";
import { currentUser, endSession, emailAvailable, setupHint } from "@/lib/auth";
import { cleanName } from "@/lib/quizRules";
import { store, storeAvailable } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  if (!storeAvailable()) return NextResponse.json({ error: "unavailable", setup: setupHint() }, { status: 503, headers: noStore });
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "signed_out", accounts: emailAvailable(), ...(emailAvailable() ? {} : { setup: setupHint() }) },
        { status: 401, headers: noStore },
      );
    }
    const quizzes = await store().listQuizzesByOwner(user._id);
    const withResults = await Promise.all(
      quizzes.map(async (q) => {
        const results = await store().listResults(q._id);
        return {
          id: q._id,
          n: q.n,
          createdAt: q.createdAt,
          plays: results.length,
          last: results[0] ? { score: results[0].score, total: results[0].total, partner: results[0].partner } : null,
        };
      }),
    );
    return NextResponse.json(
      { user: { name: user.name, email: user.email, createdAt: user.createdAt }, quizzes: withResults },
      { headers: noStore },
    );
  } catch (err) {
    console.error("me failed", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "signed_out" }, { status: 401 });
    const name = cleanName((await req.json()).name);
    if (!name) return NextResponse.json({ error: "name" }, { status: 400 });
    await store().updateUser(user._id, { name });
    return NextResponse.json({ ok: true, name });
  } catch (err) {
    console.error("rename failed", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "signed_out" }, { status: 401 });
    await store().deleteUserCascade(user._id);
    await endSession();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("delete account failed", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
