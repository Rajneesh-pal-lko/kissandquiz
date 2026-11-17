"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { QUESTIONS } from "@/lib/questions";
import { decodeQuiz, type QuizData } from "@/lib/quizLink";

type State = "loading" | "invalid" | "intro" | "playing" | "done";

function verdict(pct: number): string {
  if (pct === 100) return "Soulmates. Nobody knows them better! 💍";
  if (pct >= 80) return "You really pay attention. Cute! 😍";
  if (pct >= 50) return "Not bad, but there's more to learn 😉";
  if (pct >= 20) return "Hmm… time for a long date night 🙈";
  return "Do you even know them?! 😂";
}

export default function PlayPage() {
  const [state, setState] = useState<State>("loading");
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [current, setCurrent] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const data = decodeQuiz(window.location.hash.slice(1));
    // Drop any pair that points at a question or option that doesn't exist.
    const valid = data
      ? {
          ...data,
          a: data.a.filter(
            ([q, opt]) => QUESTIONS[q] !== undefined && QUESTIONS[q].options[opt] !== undefined,
          ),
        }
      : null;
    if (valid && valid.a.length > 0) {
      setQuiz(valid);
      setState("intro");
    } else {
      setState("invalid");
    }
  }, []);

  function choose(optionIndex: number) {
    if (!quiz || picked !== null) return;
    setPicked(optionIndex);
    const correct = quiz.a[current][1] === optionIndex;
    if (correct) setScore((s) => s + 1);
    setTimeout(() => {
      setPicked(null);
      if (current + 1 < quiz.a.length) setCurrent(current + 1);
      else setState("done");
    }, 900);
  }

  if (state === "loading") return <main className="wrap" />;

  if (state === "invalid" || !quiz) {
    return (
      <main className="wrap">
        <Link href="/" className="logo">
          Kiss<span>And</span>Quiz
        </Link>
        <div className="card">
          <h2>This quiz link looks broken 💔</h2>
          <p className="muted">Ask your partner to send the full link again, or make your own quiz.</p>
          <Link href="/create/" className="btn">
            Create my quiz
          </Link>
        </div>
      </main>
    );
  }

  const name = quiz.n;
  const total = quiz.a.length;

  if (state === "intro") {
    return (
      <main className="wrap">
        <Link href="/" className="logo">
          Kiss<span>And</span>Quiz
        </Link>
        <h1>How well do you know {name}? 💘</h1>
        <p className="lead">
          {name} answered {total} questions about themselves. Guess their answers and see your score.
        </p>
        <button className="btn" onClick={() => setState("playing")}>
          Start the quiz
        </button>
      </main>
    );
  }

  if (state === "playing") {
    const [qIndex, rightAnswer] = quiz.a[current];
    const q = QUESTIONS[qIndex];
    return (
      <main className="wrap">
        <Link href="/" className="logo">
          Kiss<span>And</span>Quiz
        </Link>
        <div className="card">
          <div className="progress">
            <div style={{ width: `${(current / total) * 100}%` }} />
          </div>
          <p className="muted">
            Question {current + 1} of {total} · Score {score}
          </p>
          <h2>{q.guess.replace("{name}", name)}</h2>
          <div className="options">
            {q.options.map((opt, i) => {
              let cls = "option";
              if (picked !== null && i === rightAnswer) cls += " right";
              else if (picked === i) cls += " wrong";
              return (
                <button key={i} className={cls} onClick={() => choose(i)}>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      </main>
    );
  }

  // done
  const pct = Math.round((score / total) * 100);
  const shareText = `I scored ${score}/${total} on ${name}'s couple quiz 💘 Make your own: ${
    typeof window !== "undefined" ? window.location.origin : ""
  }/create/`;

  return (
    <main className="wrap">
      <Link href="/" className="logo">
        Kiss<span>And</span>Quiz
      </Link>
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
        <Link href="/create/" className="btn ghost">
          Now make your own quiz
        </Link>
      </div>
    </main>
  );
}
