// POST /api/auth/verify/  { t }  →  { ok: true, name }
// Uses the one-time link token, creates the account if this email is new, and signs in.
// (A POST from the page, not a GET from the email, so email scanners can't use up the link.)
import { NextResponse } from "next/server";
import { startSession } from "@/lib/auth";
import { hashToken, newUserId, store, storeAvailable } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!storeAvailable()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  let t: unknown;
  try {
    t = (await req.json()).t;
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  if (typeof t !== "string" || t.length < 20 || t.length > 100) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  try {
    const login = await store().takeLoginToken(hashToken(t));
    if (!login) return NextResponse.json({ error: "expired" }, { status: 400 });
    const now = new Date();
    const user = await store().upsertUserByEmail({
      _id: newUserId(),
      email: login.email,
      name: login.name,
      createdAt: now,
      lastLoginAt: now,
    });
    await store().updateUser(user._id, { lastLoginAt: now });
    await startSession(user._id);
    return NextResponse.json({ ok: true, name: user.name });
  } catch (err) {
    console.error("auth verify failed", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
