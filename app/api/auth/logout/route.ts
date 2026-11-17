// POST /api/auth/logout/
import { NextResponse } from "next/server";
import { endSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await endSession();
  } catch (err) {
    console.error("logout failed", err);
  }
  return NextResponse.json({ ok: true });
}
