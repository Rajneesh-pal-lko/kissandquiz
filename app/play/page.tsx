"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { QUESTIONS, guessText } from "@/lib/questions";
import { decodeQuiz, type QuizData } from "@/lib/quizLink";
import { load, save } from "@/lib/storage";

type State = "loading" | "invalid" | "intro" | "playing" | "done";

type Progress = { state: "playing" | "done"; current: number; guesses: (number | null)[] };

function verdict(pct: number): string {
  if (pct === 100) return "Soulmates. Nobody knows them better! 💍";
  if (pct >= 80) return "You really pay attention. Cute! 😍";
  if (pct >= 50) return "Not bad, but there's more to learn 😉";
  if (pct >= 20) return "Hmm… time for a long date night 🙈";
  return "Do you even know them?! 😂";
}

/** Keep only pairs that point at a real question and option. */
function validQuiz(hash: string): QuizData | null {
  const data = decodeQuiz(hash);
  if (!data) return null;
  const a = data.a.filter(([q, opt]) => QUESTIONS[q] !== undefined && QUESTIONS[q].options[opt] !== undefined);
  return a.length > 0 ? { n: data.n, a } : null;
}

export default function PlayPage() {
  const [state, setState] = useState<State>("loading");
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [hash, setHash] = useState("");
  const [current, setCurrent] = useState(0);
  const [guesses, setGuesses] = useState<(number | null)[]>([]);
  const [showAnswers, setShowAnswers] = useState(false);
  const [canShare, setCanShare] = useState(false);

  // Read the quiz from the URL hash. Also re-read if a new link is pasted in the same tab.
  useEffect(() => {
    function read() {
      const h = window.location.hash.slice(1);
      const data = validQuiz(h);
      setHash(h);
      setShowAnswers(false);
      if (!data) {
        setQuiz(null);
        setState("invalid");
        return;
      }
      setQuiz(data);
      // Resume if this tab was refreshed mid-quiz.
      const saved = load<Progress>(`kq.play.${h}`, "session");
      if (saved && Array.isArray(saved.guesses) && saved.guesses.length === data.a.length) {
        setGuesses(saved.guesses);
        setCurrent(Math.min(Math.max(0, saved.current), data.a.length - 1));
        setState(saved.state);
      } else {
        setGuesses(data.a.map(() => null));
        setCurrent(0);
        setState("intro");
      }
    }
    read();
    setCanShare(typeof navigator.share === "function");
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  useEffect(() => {
    if (quiz && (state === "playing" || state === "done")) {
      save(`kq.play.${hash}`, { state, current, guesses } satisfies Progress, "session");
    }
  }, [quiz, hash, state, current, guesses]);

  if (state === "loading") return <main className="wrap" />;

  const header = (
    <header className="topbar">
      <Link href="/" className="logo">
        Kiss<span>And</span>Quiz
      </Link>
    </header>
  );

  if (state === "invalid" || !quiz) {
    return (
      <main className="wrap">
        {header}
        <div className="card">
          <h2>This quiz link looks broken 💔</h2>
          <p className="muted">
            WhatsApp sometimes cuts long links. Ask your partner to send the full link again, or make your own quiz.
          </p>
          <Link href="/create/" className="btn">
            Create my quiz
          </Link>
          <Link href="/" className="btn ghost">
            See all games
          </Link>
        </div>
      </main>
    );
  }

  const name = quiz.n;
  const total = quiz.a.length;
  const score = guesses.reduce<number>((s, g, i) => (g !== null && g === quiz.a[i][1] ? s + 1 : s), 0);
  const answered = guesses.filter((g) => g !== null).length;

  if (state === "intro") {
    return (
      <main className="wrap">
        {header}
        <h1>How well do you know {name}? 💘</h1>
        <p className="lead">
          {name} answered {total} {total === 1 ? "question" : "questions"} about themselves. Guess their answers and see your score.
        </p>
        <button className="btn" onClick={() => setState("playing")}>
          Start the quiz
        </button>
        <p className="muted center tip">No app, no login. Takes about 2 minutes.</p>
      </main>
    );
  }

  if (state === "playing") {
    const [qIndex, rightAnswer] = quiz.a[current];
    const q = QUESTIONS[qIndex];
    const picked = guesses[current];
    const isLast = current + 1 === total;

    function choose(i: number) {
      if (picked !== null) return; // One guess per question; no changing after the reveal.
      const next = [...guesses];
      next[current] = i;
      setGuesses(next);
    }

    return (
      <main className="wrap">
        {header}
        <div className="card">
          <div className="progress" aria-hidden>
            <div style={{ width: `${(answered / total) * 100}%` }} />
          </div>
          <p className="muted">
            Question {current + 1} of {total} · Score {score}
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
              {picked === rightAnswer
                ? "✅ Correct!"
                : `❌ Not quite. ${name} picked “${q.options[rightAnswer]}”.`}
            </p>
          )}

          <div className="nav-row">
            <button className="btn ghost" onClick={() => setCurrent(current - 1)} disabled={current === 0}>
              ← Back
            </button>
            <button
              className="btn"
              disabled={picked === null}
              onClick={() => (isLast ? setState("done") : setCurrent(current + 1))}
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
      await navigator.share({ text: `I scored ${score}/${total} on ${name}'s couple quiz 💘 Make your own:`, url: `${origin}/create/` });
    } catch {
      // Cancelled.
    }
  }

  function playAgain() {
    setGuesses(quiz!.a.map(() => null));
    setCurrent(0);
    setShowAnswers(false);
    setState("playing");
  }

  return (
    <main className="wrap">
      {header}
      <div className="card center">
        <p className="muted">You know {name}…</p>
        <div className="score">
          {score}/{total}
        </div>
        <h2>{verdict(pct)}</h2>
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
              const g = guesses[i];
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
        <button className="btn ghost" onClick={playAgain}>
          Play again
        </button>
      </div>

      <p className="muted center tip">
        <Link href="/">More couple games →</Link>
      </p>
    </main>
  );
}
