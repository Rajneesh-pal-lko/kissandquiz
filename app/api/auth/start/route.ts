// POST /api/auth/start/  { name, email, consent: true }  →  { ok: true }
// Emails a one-time sign-in link. One profile per email: an existing account keeps its name.
// Always answers the same way, so nobody can check whether an email has an account.
import { NextResponse } from "next/server";
import { cleanEmail, emailAvailable, sendLoginEmail, siteOrigin } from "@/lib/auth";
import { cleanName } from "@/lib/quizRules";
import { MAX_LOGIN_EMAILS, hashToken, newSecret, store, storeAvailable } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!storeAvailable() || !emailAvailable()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  let body: { name?: unknown; email?: unknown; consent?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }
  const email = cleanEmail(body.email);
  const name = cleanName(body.name);
  if (!email) return NextResponse.json({ error: "email" }, { status: 400 });
  if (!name) return NextResponse.json({ error: "name" }, { status: 400 });
  if (body.consent !== true) return NextResponse.json({ error: "consent" }, { status: 400 });

  try {
    if ((await store().countRecentLoginTokens(email)) >= MAX_LOGIN_EMAILS) {
      return NextResponse.json({ error: "too_many" }, { status: 429 });
    }
    const token = newSecret();
    await store().insertLoginToken({ _id: hashToken(token), email, name, createdAt: new Date() });
    const link = `${siteOrigin(req)}/account/verify/#${token}`;
    await sendLoginEmail(email, name, link);
    // Local development only: hand the link back so it can be tested without email.
    const dev = process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY ? { devLink: link } : {};
    return NextResponse.json({ ok: true, ...dev });
  } catch (err) {
    console.error("auth start failed", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
