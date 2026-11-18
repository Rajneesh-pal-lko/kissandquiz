"use client";

// The partner's side of "How Well Do You Know Me?". Used by both the old long links
// (/play/#…) and the new short links (/q/<id>/).
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatedEmoji, Emoji, WhatsAppIcon } from "@/components/Emoji";
import { confetti, heartBurst } from "@/components/fx";
import ScoreRing from "@/components/ScoreRing";
import { SiteHeader } from "@/components/SiteChrome";
import { QUESTIONS, guessText } from "@/lib/questions";
import type { QuizData } from "@/lib/quizLink";
import { NAME_MAX, scoreOf } from "@/lib/quizRules";
import { load, save } from "@/lib/storage";
import { CATEGORY_UI, LETTERS, scoreMood } from "@/lib/ui";
import KissOutcome from "@/components/wallet/KissOutcome";
import { kisses, quizOutcome } from "@/lib/wallet/rules";

type State = "intro" | "playing" | "done";

type Progress = {
  state: State;
  current: number;
  guesses: (number | null)[];
  partner: string;
  /** True once the result was handed to onFinish, so refreshes/replays don't save twice. */
  submitted: boolean;
  /** Kiss Wallet: did the saved result add kisses? Undefined while saving. */
  kissCounted?: boolean;
};

/** Kept for older imports; the site header now lives in SiteChrome. */
export function Header() {
  return <SiteHeader />;
}

export function BrokenLink({ reason = "broken" }: { reason?: "broken" | "expired" | "offline" }) {
  return (
    <>
      <SiteHeader />
      <main className="wrap flow">
        <div className="card flow-card center slide-in">
          <div className="name-hero">
            <Emoji code={reason === "offline" ? "1f914" : "1f494"} size={80} eager />
          </div>
          {reason === "offline" ? (
            <>
              <h2>Couldn&apos;t load this quiz</h2>
              <p className="muted">Check your internet and try again.</p>
              <button className="btn" onClick={() => window.location.reload()}>
                Try again
              </button>
            </>
          ) : (
            <>
              <h2>{reason === "expired" ? "This quiz has expired" : "This quiz link looks broken"}</h2>
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
    </>
  );
}

type Props = {
  quiz: QuizData;
  /** sessionStorage key for resuming after a refresh. */
  progressKey: string;
  /** Short-link mode: ask the partner's name and save the result for the creator. */
  /** Resolves to true when the result was added to both Kiss Wallets. */
  onFinish?: (guesses: (number | null)[], partner: string) => Promise<boolean> | void;
  /** Kisses the quiz is played for (short links only). */
  stake?: number;
};

export default function PlayGame({ quiz, progressKey, onFinish, stake }: Props) {
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
  const [bump, setBump] = useState(0);
  const celebrated = useRef(false);

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

  // Confetti once when the score screen opens with a good score.
  const isDone = p?.state === "done";
  const goodScore = p ? scoreOf(quiz.a, p.guesses) / total >= 0.5 : false;
  useEffect(() => {
    if (!isDone) {
      celebrated.current = false;
      return;
    }
    if (celebrated.current) return;
    celebrated.current = true;
    window.scrollTo({ top: 0 });
    if (goodScore) {
      const t = window.setTimeout(() => confetti(), 900);
      return () => window.clearTimeout(t);
    }
  }, [isDone, goodScore]);

  if (!p)
    return (
      <>
        <SiteHeader />
        <main className="wrap" />
      </>
    );

  const name = quiz.n;
  const score = scoreOf(quiz.a, p.guesses);
  const answered = p.guesses.filter((g) => g !== null).length;
  const update = (patch: Partial<Progress>) => setP((prev) => (prev ? { ...prev, ...patch } : prev));

  if (p.state === "intro") {
    return (
      <>
        <SiteHeader hideCta />
        <main className="wrap flow">
          <section className="flow-hero">
            <div className="intro-avatar rise">
              <div className="initial" aria-hidden>
                {Array.from(name)[0]?.toUpperCase() ?? "?"}
              </div>
              <AnimatedEmoji name="heart_with_arrow" code="1f498" size={64} eager />
            </div>
            <h1 className="rise d1">
              How well do you know <span className="hl">{name}</span>?
            </h1>
            <p className="lead rise d2">
              {name} answered {total} {total === 1 ? "question" : "questions"} about themselves. Guess their answers and
              see your score.
            </p>
            {stake !== undefined && (
              <p className="stake-badge rise d2">
                <Emoji code="1f48b" size={22} /> Playing for {kisses(stake)} · 7+ right and you win them
              </p>
            )}
          </section>
          <div className="card flow-card rise d3">
            {onFinish && (
              <input
                type="text"
                placeholder={stake ? "Your name (for your Kiss Wallet)" : "Your name (optional)"}
                aria-label="Your name"
                autoComplete="given-name"
                value={p.partner}
                maxLength={NAME_MAX}
                onChange={(e) => update({ partner: e.target.value })}
              />
            )}
            <button className="btn" onClick={() => update({ state: "playing" })}>
              Start guessing →
            </button>
            <p className="muted center tip">
              No app, no login. Takes about 2 minutes.
              {onFinish && ` ${name} will see your score.`}
            </p>
          </div>
        </main>
      </>
    );
  }

  if (p.state === "playing") {
    const [qIndex, rightAnswer] = quiz.a[p.current];
    const q = QUESTIONS[qIndex];
    const cat = CATEGORY_UI[q.category];
    const picked = p.guesses[p.current];
    const isLast = p.current + 1 === total;
    const title = guessText(q, name);

    function choose(i: number, el: HTMLElement) {
      if (!p || picked !== null) return; // One guess per question; locked after the reveal.
      const guesses = [...p.guesses];
      guesses[p.current] = i;
      update({ guesses });
      if (i === rightAnswer) {
        heartBurst(el, "+1");
        setBump((b) => b + 1);
      }
      if (typeof navigator.vibrate === "function") navigator.vibrate(i === rightAnswer ? 18 : [12, 40, 12]);
    }

    function finish() {
      if (!p) return;
      if (onFinish && !p.submitted) {
        Promise.resolve(onFinish(p.guesses, p.partner.trim()))
          .then((counted) => update({ kissCounted: counted === true }))
          .catch(() => update({ kissCounted: false }));
      }
      update({ state: "done", submitted: true });
    }

    return (
      <>
        <SiteHeader hideCta />
        <main className="wrap flow">
          <div className="card flow-card">
            <div className="q-top">
              <span className="q-count">
                {p.current + 1} <span>/ {total}</span>
              </span>
              <span key={bump} className={bump ? "score-pill bump" : "score-pill"}>
                <Emoji code="1f496" size={18} /> Score {score}
              </span>
            </div>
            <div className="progress" aria-hidden>
              <div style={{ width: `${Math.max(4, (answered / total) * 100)}%` }} />
            </div>
            <div key={qIndex} className="slide-in">
              <span className="q-cat">
                <Emoji code={cat.icon} size={18} /> {cat.label}
              </span>
              <h2 className="q-title">{title}</h2>
              <div className="options" role="radiogroup" aria-label={title}>
                {q.options.map((opt, i) => {
                  let cls = "option";
                  if (picked !== null && i === rightAnswer) cls += picked === i ? " right picked" : " right";
                  else if (picked === i) cls += " wrong";
                  const mark = picked !== null && i === rightAnswer ? "✓" : picked === i ? "✕" : LETTERS[i];
                  return (
                    <button
                      key={`${qIndex}-${i}`}
                      className={cls}
                      role="radio"
                      aria-checked={picked === i}
                      aria-disabled={picked !== null}
                      onClick={(e) => choose(i, e.currentTarget)}
                    >
                      <span className="key" aria-hidden>
                        {mark}
                      </span>
                      {opt}
                      {picked !== null && i === rightAnswer && <span className="tag">{name}&apos;s answer</span>}
                    </button>
                  );
                })}
              </div>

              {picked !== null && (
                <p className={picked === rightAnswer ? "feedback ok" : "feedback bad"} role="status">
                  <Emoji code={picked === rightAnswer ? "1f60d" : "1f62c"} size={30} />
                  {picked === rightAnswer ? "Correct! You know them." : `Not quite. ${name} picked “${q.options[rightAnswer]}”.`}
                </p>
              )}
            </div>

            <div className="btn-row">
              <button className="btn ghost" onClick={() => update({ current: p.current - 1 })} disabled={p.current === 0}>
                ← Back
              </button>
              <button
                className="btn"
                disabled={picked === null}
                onClick={() => (isLast ? finish() : update({ current: p.current + 1 }))}
              >
                {isLast ? "See my score" : "Next →"}
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  // done
  const pct = Math.round((score / total) * 100);
  const mood = scoreMood(pct);
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
    <>
      <SiteHeader />
      <main className="wrap flow">
        <div className="card flow-card center slide-in">
          <p className="muted" style={{ margin: 0 }}>
            You know {name}…
          </p>
          <ScoreRing score={score} total={total}>
            <AnimatedEmoji name={mood.anim} code={mood.code} size={84} className="mood" />
          </ScoreRing>
          <h2 className="verdict">{mood.verdict}</h2>
          {stake !== undefined && (
            <KissOutcome outcome={quizOutcome(score, total, stake)} me={1} otherName={name} counted={p.kissCounted !== false} />
          )}
          {onFinish && p.submitted && (
            <p className="saved-note">
              <Emoji code="2705" size={18} /> {name} can see your score
            </p>
          )}
          <a
            className="btn whatsapp"
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginTop: 14 }}
          >
            <WhatsAppIcon /> Send my score to {name}
          </a>
          {canShare && (
            <button className="btn ghost" onClick={nativeShare}>
              Share my score…
            </button>
          )}
          <div className="loop-box">
            <Emoji code="1f60f" size={46} />
            <h3>Your turn now</h3>
            <p>Make your own quiz and see how well {name} knows you.</p>
            <Link href="/create/" className="btn light">
              Make my quiz →
            </Link>
          </div>
        </div>

        <div className="card">
          <button className="link-btn full" onClick={() => setShowAnswers(!showAnswers)} aria-expanded={showAnswers}>
            {showAnswers ? "Hide answers ▲" : "See all answers ▼"}
          </button>
          {showAnswers && (
            <ol className="review-list slide-in">
              {quiz.a.map(([qi, right], i) => {
                const g = p.guesses[i];
                const ok = g === right;
                return (
                  <li key={qi} className="result-item">
                    <span className="review-q">
                      <Emoji code={ok ? "2705" : "274c"} size={16} /> {guessText(QUESTIONS[qi], name)}
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
    </>
  );
}
