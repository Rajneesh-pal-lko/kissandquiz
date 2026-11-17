"use client";

// Landing page for the emailed sign-in link: /account/verify/#<token>.
// The token is in the hash (never sent to servers or logs) and is only used when the
// person taps the button, so email link-scanners can't use it up.
import Link from "next/link";
import { useEffect, useState } from "react";
import { Header } from "@/components/PlayGame";

export default function VerifyPage() {
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<"ready" | "working" | "bad">("ready");

  useEffect(() => {
    const t = window.location.hash.slice(1);
    setToken(t);
    if (!t) setState("bad");
  }, []);

  async function signIn() {
    if (!token) return;
    setState("working");
    try {
      const res = await fetch("/api/auth/verify/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ t: token }),
      });
      if (res.ok) {
        window.history.replaceState(null, "", "/account/verify/");
        window.location.assign("/account/");
        return;
      }
      setState("bad");
    } catch {
      setState("ready");
      window.alert("Couldn't connect. Check your internet and try again.");
    }
  }

  if (token === null) return <main className="wrap" />;

  return (
    <main className="wrap">
      <Header />
      <div className="card center">
        {state === "bad" ? (
          <>
            <h2>This link has expired 😕</h2>
            <p className="muted">Sign-in links work once, for 15 minutes. Ask for a new one.</p>
            <Link href="/account/" className="btn">
              Get a new link
            </Link>
          </>
        ) : (
          <>
            <h2>Sign in to KissAndQuiz 💘</h2>
            <button className="btn" onClick={signIn} disabled={state === "working"}>
              {state === "working" ? "Signing in…" : "Tap to sign in"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
