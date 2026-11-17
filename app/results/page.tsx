"use client";

// The creator's private page: shows how their partner did on each quiz they made.
// Works from this phone's saved quizzes, or from a private link /results/?id=<id>#<token>.
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/PlayGame";
import { QUESTIONS, guessText } from "@/lib/questions";
import { QUIZ_ID_RE, type Pair } from "@/lib/quizRules";
import { addMyQuiz, listMyQuizzes, type MyQuiz } from "@/lib/myQuizzes";

type Result = { partner: string | null; guesses: (number | null)[]; score: number; total: number; createdAt: string };
type Loaded = { n: string; a: Pair[]; results: Result[] };
type Status = { kind: "loading" } | { kind: "ok"; data: Loaded } | { kind: "gone" } | { kind: "error" };

function when(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

function QuizResults({ q, open }: { q: MyQuiz; open: boolean }) {
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [expanded, setExpanded] = useState<number | null>(open ? 0 : null);

  const fetchResults = useCallback(async () => {
    setStatus({ kind: "loading" });
    try {
      const res = await fetch(`/api/quiz/${q.id}/results/`, { headers: { "x-owner-token": q.token }, cache: "no-store" });
      if (res.status === 404) return setStatus({ kind: "gone" });
      if (!res.ok) return setStatus({ kind: "error" });
      setStatus({ kind: "ok", data: (await res.json()) as Loaded });
    } catch {
      setStatus({ kind: "error" });
    }
  }, [q.id, q.token]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const shownName = status.kind === "ok" ? status.data.n : q.name;
  const title = shownName ? `${shownName}'s quiz` : "Your quiz";
  const link = typeof window !== "undefined" ? `${window.location.origin}/q/${q.id}/` : "";
  const shareText = `How well do you know me? 💘 Take my quiz and see your score: ${link}`;

  return (
    <div className="card">
      <div className="q-head">
        <h2 style={{ margin: 0 }}>{title}</h2>
        <button className="link-btn" onClick={fetchResults}>
          ↻ Refresh
        </button>
      </div>
      <p className="muted">Made {when(q.createdAt)}</p>

      {status.kind === "loading" && <p className="muted">Loading…</p>}
      {status.kind === "error" && <p className="feedback bad">Couldn't load results. Check your internet and refresh.</p>}
      {status.kind === "gone" && <p className="muted">This quiz has expired or was not found.</p>}

      {status.kind === "ok" && status.data.results.length === 0 && (
        <>
          <p>Your partner hasn't played yet. 🤞</p>
          <a
            className="btn whatsapp"
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Send the link again
          </a>
        </>
      )}

      {status.kind === "ok" &&
        status.data.results.map((r, i) => (
          <div key={r.createdAt + i} className="result-block">
            <button className="review-item" onClick={() => setExpanded(expanded === i ? null : i)} aria-expanded={expanded === i}>
              <span className="review-q">
                {r.partner || "Your partner"} · {when(r.createdAt)}
              </span>
              <span className="review-a">
                Scored {r.score}/{r.total}
              </span>
              <span className="review-edit">{expanded === i ? "Hide ▲" : "Answers ▼"}</span>
            </button>
            {expanded === i && (
              <ol className="review-list">
                {status.data.a.map(([qi, right], k) => {
                  const g = r.guesses[k];
                  const ok = g === right;
                  return (
                    <li key={qi} className="result-item">
                      <span className="review-q">
                        {ok ? "✅" : "❌"} {guessText(QUESTIONS[qi], status.data.n)}
                      </span>
                      <span className="review-a">You: {QUESTIONS[qi].options[right]}</span>
                      {!ok && (
                        <span className="muted">They guessed: {g === null ? "—" : QUESTIONS[qi].options[g]}</span>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        ))}
    </div>
  );
}

export default function ResultsPage() {
  const [quizzes, setQuizzes] = useState<MyQuiz[] | null>(null);
  const [focus, setFocus] = useState<string | null>(null);

  useEffect(() => {
    // A private results link adds that quiz to this phone's list.
    const id = new URLSearchParams(window.location.search).get("id");
    const token = window.location.hash.slice(1);
    if (id && QUIZ_ID_RE.test(id) && token) {
      const known = listMyQuizzes().find((q) => q.id === id);
      addMyQuiz({ id, token, name: known?.name ?? "", createdAt: known?.createdAt ?? new Date().toISOString() });
      setFocus(id);
      // Remove the secret from the address bar.
      window.history.replaceState(null, "", "/results/");
    }
    setQuizzes(listMyQuizzes());
  }, []);

  if (quizzes === null) return <main className="wrap" />;

  const ordered = focus ? [...quizzes].sort((x, y) => (x.id === focus ? -1 : y.id === focus ? 1 : 0)) : quizzes;

  return (
    <main className="wrap">
      <Header />
      <h1>Your quiz results 💌</h1>
      {ordered.length === 0 ? (
        <div className="card">
          <p>No quizzes on this phone yet.</p>
          <p className="muted">
            Results show up on the phone you made the quiz on, or open the private results link you saved when you made
            it.
          </p>
          <Link href="/create/" className="btn">
            Create my quiz
          </Link>
        </div>
      ) : (
        ordered.map((q, i) => <QuizResults key={q.id} q={q} open={i === 0} />)
      )}
      <p className="muted center tip">
        <Link href="/create/">Make another quiz →</Link>
      </p>
    </main>
  );
}
