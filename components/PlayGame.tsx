"use client";

// The partner's side of "How Well Do You Know Me?". Used by both the old long links
// (/play/#…) and the new short links (/q/<id>/).
import Link from "next/link";
import { useEffect, useState } from "react";
import { QUESTIONS, guessText } from "@/lib/questions";
import type { QuizData } from "@/lib/quizLink";
import { NAME_MAX, scoreOf } from "@/lib/quizRules";
import { load, save } from "@/lib/storage";

type State = "intro" | "playing" | "done";

type Progress = {
  state: State;
  current: number;
  guesses: (number | null)[];
  partner: string;
  /** True once the result was handed to onFinish, so refreshes/replays don't save twice. */
  submitted: boolean;
};

function verdict(pct: number): string {
  if (pct === 100) return "Soulmates. Nobody knows them better! 💍";
  if (pct >= 80) return "You really pay attention. Cute! 😍";
  if (pct >= 50) return "Not bad, but there's more to learn 😉";
  if (pct >= 20) return "Hmm… time for a long date night 🙈";
  return "Do you even know them?! 😂";
}

export function Header() {
  return (
    <header className="topbar">
      <Link href="/" className="logo">
        Kiss<span>And</span>Quiz
      </Link>
    </header>
  );
}

export function BrokenLink({ reason = "broken" }: { reason?: "broken" | "expired" | "offline" }) {
  return (
    <main className="wrap">
      <Header />
      <div className="card">
        {reason === "offline" ? (
          <>
            <h2>Couldn't load this quiz 😕</h2>
            <p className="muted">Check your internet and try again.</p>
            <button className="btn" onClick={() => window.location.reload()}>
              Try again
            </button>
          </>
        ) : (
          <>
            <h2>{reason === "expired" ? "This quiz has expired 💔" : "This quiz link looks broken 💔"}</h2>
            <p className="muted">
              {reason === "expired"
                ? "Quizzes are deleted after 6 months. Ask your partner to make a new one, or make your own."
                : "WhatsApp sometimes cuts long links. Ask your partner to send the full link again, or make your own quiz."}
            </p>
            <Link href="/create/" className="btn">
              Create my quiz
            </Link>
          </>
        )}
        <Link href="/" className="btn ghost">
          See all games
        </Link>
      </div>
    </main>
  );
}

type Props = {
  quiz: QuizData;
  /** sessionStorage key for resuming after a refresh. */
  progressKey: string;
  /** Short-link mode: ask the partner's name and save the result for the creator. */
  onFinish?: (guesses: (number | null)[], partner: string) => void;
};

export default function PlayGame({ quiz, progressKey, onFinish }: Props) {
  const total = quiz.a.length;
  const fresh = (): Progress => ({
    state: "intro",
    current: 0,
    guesses: quiz.a.map(() => null),
    partner: "",
    submitted: false,
  });

  const [p, setP] = useState<Progress | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [canShare, setCanShare] = useState(false);

  // Resume if this tab was refreshed mid-quiz.
  useEffect(() => {
    const saved = load<Progress>(progressKey, "session");
    setP(saved && Array.isArray(saved.guesses) && saved.guesses.length === total ? saved : fresh());
    setShowAnswers(false);
    setCanShare(typeof navigator.share === "function");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressKey, total]);

  useEffect(() => {
    if (p && p.state !== "intro") save(progressKey, p, "session");
  }, [p, progressKey]);

  if (!p) return <main className="wrap" />;

  const name = quiz.n;
  const score = scoreOf(quiz.a, p.guesses);
  const answered = p.guesses.filter((g) => g !== null).length;
  const update = (patch: Partial<Progress>) => setP((prev) => (prev ? { ...prev, ...patch } : prev));

  if (p.state === "intro") {
    return (
      <main className="wrap">
        <Header />
        <h1>How well do you know {name}? 💘</h1>
        <p className="lead">
          {name} answered {total} {total === 1 ? "question" : "questions"} about themselves. Guess their answers and see
          your score.
        </p>
        {onFinish && (
          <input
            type="text"
            placeholder="Your name (optional)"
            aria-label="Your name (optional)"
            value={p.partner}
            maxLength={NAME_MAX}
            onChange={(e) => update({ partner: e.target.value })}
          />
        )}
        <button className="btn" onClick={() => update({ state: "playing" })}>
          Start the quiz
        </button>
        <p className="muted center tip">
          No app, no login. Takes about 2 minutes.
          {onFinish && ` ${name} will see your score.`}
        </p>
      </main>
    );
  }

  if (p.state === "playing") {
    const [qIndex, rightAnswer] = quiz.a[p.current];
    const q = QUESTIONS[qIndex];
    const picked = p.guesses[p.current];
    const isLast = p.current + 1 === total;

    function choose(i: number) {
      if (!p || picked !== null) return; // One guess per question; locked after the reveal.
      const guesses = [...p.guesses];
      guesses[p.current] = i;
      update({ guesses });
    }

    function finish() {
      if (!p) return;
      if (onFinish && !p.submitted) onFinish(p.guesses, p.partner.trim());
      update({ state: "done", submitted: true });
    }

    return (
      <main className="wrap">
        <Header />
        <div className="card">
          <div className="progress" aria-hidden>
            <div style={{ width: `${(answered / total) * 100}%` }} />
          </div>
          <p className="muted">
            Question {p.current + 1} of {total} · Score {score}
          </p>
          <h2>{guessText(q, name)}</h2>
          <div className="options" role="radiogroup" aria-label={guessText(q, name)}>
            {q.options.map((opt, i) => {
              let cls = "option";
              if (picked !== null && i === rightAnswer) cls += " right";
              else if (picked === i) cls += " wrong";
              return (
                <button
                  key={`${qIndex}-${i}`}
                  className={cls}
                  role="radio"
                  aria-checked={picked === i}
                  aria-disabled={picked !== null}
                  onClick={() => choose(i)}
                >
                  {opt}
                  {picked !== null && i === rightAnswer && <span className="tag">{name}'s answer</span>}
                </button>
              );
            })}
          </div>

          {picked !== null && (
            <p className={picked === rightAnswer ? "feedback ok" : "feedback bad"} role="status">
              {picked === rightAnswer ? "✅ Correct!" : `❌ Not quite. ${name} picked “${q.options[rightAnswer]}”.`}
            </p>
          )}

          <div className="nav-row">
            <button className="btn ghost" onClick={() => update({ current: p.current - 1 })} disabled={p.current === 0}>
              ← Back
            </button>
            <button
              className="btn"
              disabled={picked === null}
              onClick={() => (isLast ? finish() : update({ current: p.current + 1 }))}
            >
              {isLast ? "See my score 🎉" : "Next →"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // done
  const pct = Math.round((score / total) * 100);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareText = `I scored ${score}/${total} on ${name}'s couple quiz 💘 Make your own: ${origin}/create/`;

  async function nativeShare() {
    try {
      await navigator.share({
        text: `I scored ${score}/${total} on ${name}'s couple quiz 💘 Make your own:`,
        url: `${origin}/create/`,
      });
    } catch {
      // Cancelled.
    }
  }

  return (
    <main className="wrap">
      <Header />
      <div className="card center">
        <p className="muted">You know {name}…</p>
        <div className="score">
          {score}/{total}
        </div>
        <h2>{verdict(pct)}</h2>
        {onFinish && p.submitted && <p className="muted">✓ {name} can see your score.</p>}
        <a
          className="btn whatsapp"
          href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Send my score to {name}
        </a>
        {canShare && (
          <button className="btn" onClick={nativeShare}>
            Share my score…
          </button>
        )}
        <Link href="/create/" className="btn ghost">
          Now make your own quiz
        </Link>
      </div>

      <div className="card">
        <button className="link-btn full" onClick={() => setShowAnswers(!showAnswers)} aria-expanded={showAnswers}>
          {showAnswers ? "Hide answers ▲" : "See all answers ▼"}
        </button>
        {showAnswers && (
          <ol className="review-list">
            {quiz.a.map(([qi, right], i) => {
              const g = p.guesses[i];
              const ok = g === right;
              return (
                <li key={qi} className="result-item">
                  <span className="review-q">
                    {ok ? "✅" : "❌"} {guessText(QUESTIONS[qi], name)}
                  </span>
                  <span className="review-a">
                    {name}: {QUESTIONS[qi].options[right]}
                  </span>
                  {!ok && <span className="muted">You guessed: {g === null ? "—" : QUESTIONS[qi].options[g]}</span>}
                </li>
              );
            })}
          </ol>
        )}
        <button
          className="btn ghost"
          onClick={() => {
            setShowAnswers(false);
            // Keep `submitted` so a replay is not saved as a second attempt.
            update({ state: "playing", current: 0, guesses: quiz.a.map(() => null) });
          }}
        >
          Play again
        </button>
      </div>

      <p className="muted center tip">
        <Link href="/">More couple games →</Link>
      </p>
    </main>
  );
}
