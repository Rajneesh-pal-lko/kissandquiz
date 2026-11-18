// Server-only helpers for optional creator accounts (email sign-in link, no passwords).
import "server-only";
import { cookies } from "next/headers";
import { SESSION_DAYS, hashToken, newSecret, store, type UserDoc } from "@/lib/store";

export const SESSION_COOKIE = "kq_session";
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;

export function cleanEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  return email.length <= 254 && EMAIL_RE.test(email) ? email : null;
}

/** Email sending is configured (production), or we're in local development (links are logged). */
export function emailAvailable(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM) || process.env.NODE_ENV !== "production";
}

/** True on Vercel preview deployments (each branch gets its own address). */
export function isPreview(): boolean {
  return process.env.VERCEL_ENV === "preview";
}

/**
 * The address put in emailed sign-in links. Production uses SITE_URL. Previews always use their
 * own address: otherwise the link opens the live site, signs you in there, and the preview stays
 * signed out (the session cookie belongs to one address only).
 */
export function siteOrigin(req: Request): string {
  const own = new URL(req.url).origin;
  return (isPreview() ? own : process.env.SITE_URL || own).replace(/\/$/, "");
}

/**
 * What's missing for accounts to work. Only sent outside production (preview / local), so the
 * "coming soon" screen can say which Vercel setting to add. Names only, never values.
 */
export function setupHint(): { env: string; missing: string[] } | undefined {
  if (process.env.VERCEL_ENV === "production") return undefined;
  if (process.env.NODE_ENV !== "production") return undefined; // local dev works without them
  const missing = ["MONGODB_URI", "RESEND_API_KEY", "EMAIL_FROM"].filter((k) => !process.env[k]);
  return { env: process.env.VERCEL_ENV || "unknown", missing };
}

export async function startSession(userId: string): Promise<void> {
  const token = newSecret();
  await store().insertSession({ _id: hashToken(token), userId, createdAt: new Date() });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await store().deleteSession(hashToken(token));
  jar.delete(SESSION_COOKIE);
}

/** The signed-in user, or null. */
export async function currentUser(): Promise<UserDoc | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await store().getSession(hashToken(token));
  return session ? store().getUser(session.userId) : null;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/**
 * Send the sign-in link. Uses Resend's HTTP API (RESEND_API_KEY, EMAIL_FROM).
 * In local development without a key, the link is printed to the server log instead.
 */
export async function sendLoginEmail(to: string, name: string, link: string): Promise<void> {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    console.log(`[dev] sign-in link for ${to}: ${link}`);
    return;
  }
  const safeName = escapeHtml(name);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [to],
      subject: "Your KissAndQuiz sign-in link 💘",
      text: `Hi ${name},\n\nTap this link to sign in to KissAndQuiz (it works once, for 15 minutes):\n${link}\n\nIf you didn't ask for this, ignore this email.`,
      html: `<p>Hi ${safeName},</p><p>Tap the button to sign in to <b>KissAndQuiz</b>. It works once, for 15 minutes.</p><p><a href="${link}" style="display:inline-block;background:#e8336f;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700">Sign in</a></p><p style="color:#7a6470;font-size:13px">If you didn't ask for this, ignore this email.</p>`,
    }),
  });
  if (!res.ok) throw new Error(`email send failed: ${res.status}`);
}
