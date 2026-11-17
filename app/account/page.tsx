"use client";

// Optional creator account: name + email, one profile per email, sign in with an email link.
// Playing a quiz never needs an account.
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/PlayGame";
import { listMyQuizzes } from "@/lib/myQuizzes";
import { NAME_MAX } from "@/lib/quizRules";

type Me = {
  user: { name: string; email: string; createdAt: string };
  quizzes: { id: string; n: string; createdAt: string; plays: number; last: { score: number; total: number; partner: string | null } | null }[];
};
type View = { kind: "loading" } | { kind: "out"; accounts: boolean } | { kind: "in"; me: Me } | { kind: "error" };

const day = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
};

/** Move quizzes made on this phone into the account (only ones not already owned). */
async function claimLocalQuizzes(): Promise<number> {
  const local = listMyQuizzes().map(({ id, token }) => ({ id, token }));
  if (local.length === 0) return 0;
  try {
    const res = await fetch("/api/me/claim/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizzes: local }),
    });
    return res.ok ? ((await res.json()).claimed as number) : 0;
  } catch {
    return 0;
  }
}

function SignInForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const [devLink, setDevLink] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setState("sending");
    try {
      const res = await fetch("/api/auth/start/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, consent }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDevLink(data.devLink ?? "");
        setState("sent");
        return;
      }
      setState("idle");
      setError(
        data.error === "email"
          ? "Please enter a valid email."
          : data.error === "name"
            ? "Please enter your name."
            : data.error === "consent"
              ? "Please tick the box to continue."
              : data.error === "too_many"
                ? "Too many links sent. Please wait 15 minutes and try again."
                : "Something went wrong. Please try again.",
      );
    } catch {
      setState("idle");
      setError("Couldn't connect. Check your internet and try again.");
    }
  }

  if (state === "sent") {
    return (
      <div className="card">
        <h2>Check your inbox 📬</h2>
        <p>
          We sent a sign-in link to <strong>{email.trim().toLowerCase()}</strong>. It works once, for 15 minutes.
        </p>
        <p className="muted">Can't find it? Check spam or promotions.</p>
        {devLink && (
          <p className="muted">
            Local development: <a href={devLink}>open sign-in link</a>
          </p>
        )}
        <button className="btn ghost" onClick={() => setState("idle")}>
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form className="card" onSubmit={submit}>
      <h2>Save your quizzes to an account</h2>
      <p className="muted">
        See your partner's scores on any phone and keep all your quizzes in one place. No password: we email you a
        sign-in link. Optional; playing never needs an account.
      </p>
      <input
        type="text"
        placeholder="Your name"
        aria-label="Your name"
        value={name}
        maxLength={NAME_MAX}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        type="email"
        placeholder="you@example.com"
        aria-label="Email"
        value={email}
        maxLength={254}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
      />
      <label className="check">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>
          I agree that KissAndQuiz stores my name and email to run my account, as described in the{" "}
          <Link href="/privacy/">privacy policy</Link>.
        </span>
      </label>
      {error && <p className="feedback bad">{error}</p>}
      <button className="btn" type="submit" disabled={state === "sending" || !consent}>
        {state === "sending" ? "Sending…" : "Email me a sign-in link"}
      </button>
      <p className="muted center tip">Already have an account? Same form: enter your email.</p>
    </form>
  );
}

function Profile({ me, reload }: { me: Me; reload: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(me.user.name);
  const [busy, setBusy] = useState(false);

  async function rename() {
    setBusy(true);
    const res = await fetch("/api/me/", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      setEditing(false);
      reload();
    }
  }

  async function logout() {
    await fetch("/api/auth/logout/", { method: "POST" }).catch(() => null);
    reload();
  }

  async function deleteAccount() {
    if (!window.confirm("Delete your account? This also deletes all quizzes saved in it and their results. This can't be undone.")) return;
    setBusy(true);
    const res = await fetch("/api/me/", { method: "DELETE" }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      try {
        window.localStorage.removeItem("kq.myquizzes.v1");
      } catch {
        // Ignore.
      }
      reload();
    } else {
      window.alert("Couldn't delete right now. Please try again.");
    }
  }

  return (
    <>
      <div className="card">
        {editing ? (
          <>
            <input type="text" aria-label="Your name" value={name} maxLength={NAME_MAX} onChange={(e) => setName(e.target.value)} />
            <div className="nav-row">
              <button className="btn ghost" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button className="btn" onClick={rename} disabled={busy || !name.trim()}>
                Save
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="q-head">
              <h2 style={{ margin: 0 }}>Hi, {me.user.name} 👋</h2>
              <button className="link-btn" onClick={() => setEditing(true)}>
                Edit name
              </button>
            </div>
            <p className="muted">{me.user.email}</p>
          </>
        )}
      </div>

      <div className="card">
        <h2>Your quizzes</h2>
        {me.quizzes.length === 0 ? (
          <p className="muted">No quizzes yet. Quizzes you make while signed in are saved here.</p>
        ) : (
          <ul className="review-list">
            {me.quizzes.map((q) => (
              <li key={q.id}>
                <Link href="/results/" className="review-item">
                  <span className="review-q">Made {day(q.createdAt)}</span>
                  <span className="review-a">
                    {q.last ? `${q.last.partner || "Partner"} scored ${q.last.score}/${q.last.total}` : "Not played yet"}
                  </span>
                  <span className="review-edit">Results →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link href="/create/" className="btn">
          Make a new quiz
        </Link>
      </div>

      <div className="nav-row">
        <button className="btn ghost" onClick={logout} disabled={busy}>
          Log out
        </button>
        <button className="btn ghost danger" onClick={deleteAccount} disabled={busy}>
          Delete account
        </button>
      </div>
    </>
  );
}

export default function AccountPage() {
  const [view, setView] = useState<View>({ kind: "loading" });

  const load = useCallback(async () => {
    try {
      let res = await fetch("/api/me/", { cache: "no-store" });
      if (res.status === 401) {
        const data = await res.json().catch(() => ({}));
        return setView({ kind: "out", accounts: data.accounts !== false });
      }
      if (res.status === 503) return setView({ kind: "out", accounts: false });
      if (!res.ok) return setView({ kind: "error" });
      // Signed in: pull in quizzes made on this phone, then show the up-to-date list.
      if ((await claimLocalQuizzes()) > 0) res = await fetch("/api/me/", { cache: "no-store" });
      setView({ kind: "in", me: (await res.json()) as Me });
    } catch {
      setView({ kind: "error" });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="wrap">
      <Header />
      <h1>My account</h1>
      {view.kind === "loading" && <p className="muted">Loading…</p>}
      {view.kind === "error" && (
        <div className="card">
          <p>Couldn't load your account. Check your internet.</p>
          <button className="btn" onClick={load}>
            Try again
          </button>
        </div>
      )}
      {view.kind === "out" &&
        (view.accounts ? (
          <SignInForm />
        ) : (
          <div className="card">
            <h2>Accounts are coming soon 💌</h2>
            <p className="muted">For now, results are saved on the phone you made your quiz on.</p>
            <Link href="/results/" className="btn">
              My results
            </Link>
          </div>
        ))}
      {view.kind === "in" && <Profile me={view.me} reload={load} />}
    </main>
  );
}
