"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { QUESTIONS, pickQuestions, pickReplacement } from "@/lib/questions";
import { NAME_MAX, buildPlayUrl } from "@/lib/quizLink";
import { load, remove, save } from "@/lib/storage";
import { addMyQuiz, resultsUrl } from "@/lib/myQuizzes";

type Step = "name" | "questions" | "review" | "share";

type Draft = {
  step: Step;
  name: string;
  qIds: number[];
  answers: (number | null)[];
  current: number;
  link: string;
  /** Set when the link is a short /q/<id>/ link saved on the server. */
  quizId?: string;
  token?: string;
};

const DRAFT_KEY = "kq.create.v1";
const AUTO_NEXT_MS = 300;

function isValidDraft(d: Draft | null): d is Draft {
  return (
    !!d &&
    typeof d.name === "string" &&
    Array.isArray(d.qIds) &&
    Array.isArray(d.answers) &&
    d.qIds.length > 0 &&
    d.qIds.length === d.answers.length &&
    d.qIds.every((id, i) => {
      const q = QUESTIONS[id];
      const a = d.answers[i];
      return !!q && (a === null || (Number.isInteger(a) && a >= 0 && a < q.options.length));
    })
  );
}

function freshDraft(): Draft {
  const qIds = pickQuestions();
  return { step: "name", name: "", qIds, answers: qIds.map(() => null), current: 0, link: "" };
}

export default function CreatePage() {
  const [d, setD] = useState<Draft | null>(null);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [fromReview, setFromReview] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedPrivate, setCopiedPrivate] = useState(false);
  const autoNext = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load a saved draft (so a refresh doesn't lose work), or start fresh.
  // Runs on the client only, so server and browser renders match.
  useEffect(() => {
    const saved = load<Draft>(DRAFT_KEY);
    setD(isValidDraft(saved) ? { ...saved, current: Math.min(saved.current, saved.qIds.length - 1) } : freshDraft());
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
    return () => {
      if (autoNext.current) clearTimeout(autoNext.current);
    };
  }, []);

  useEffect(() => {
    if (d) save(DRAFT_KEY, d);
  }, [d]);

  if (!d) return <main className="wrap" />;

  const total = d.qIds.length;
  const answeredCount = d.answers.filter((a) => a !== null).length;
  const allAnswered = answeredCount === total;
  const trimmedName = d.name.trim();

  function update(patch: Partial<Draft>) {
    setD((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function cancelAutoNext() {
    if (autoNext.current) {
      clearTimeout(autoNext.current);
      autoNext.current = null;
    }
  }

  function start() {
    if (!trimmedName) return;
    update({ name: trimmedName, step: allAnswered ? "review" : "questions" });
  }

  function goTo(index: number) {
    cancelAutoNext();
    update({ current: index, step: "questions" });
  }

  function next() {
    cancelAutoNext();
    if (!d || d.answers[d.current] === null) return;
    if (fromReview && allAnswered) {
      setFromReview(false);
      update({ step: "review" });
      return;
    }
    if (d.current + 1 < total) {
      update({ current: d.current + 1 });
    } else {
      // Last question: go to review, or to the first unanswered one.
      const firstEmpty = d.answers.findIndex((a) => a === null);
      if (firstEmpty === -1) update({ step: "review" });
      else update({ current: firstEmpty });
    }
  }

  function back() {
    cancelAutoNext();
    if (!d) return;
    if (fromReview) {
      setFromReview(false);
      update({ step: allAnswered ? "review" : "questions" });
      return;
    }
    if (d.current === 0) update({ step: "name" });
    else update({ current: d.current - 1 });
  }

  function choose(optionIndex: number) {
    if (!d) return;
    const answers = [...d.answers];
    answers[d.current] = optionIndex;
    update({ answers, link: "" });
    // Move on automatically after a short moment, so the tap feels confirmed.
    cancelAutoNext();
    autoNext.current = setTimeout(() => {
      autoNext.current = null;
      setD((prev) => {
        if (!prev || prev.step !== "questions") return prev;
        const done = prev.answers.every((a) => a !== null);
        if (fromReview && done) return { ...prev, step: "review" };
        if (prev.current + 1 < prev.qIds.length) return { ...prev, current: prev.current + 1 };
        if (done) return { ...prev, step: "review" };
        const firstEmpty = prev.answers.findIndex((a) => a === null);
        return { ...prev, current: firstEmpty };
      });
      if (fromReview) setFromReview(false);
    }, AUTO_NEXT_MS);
  }

  function swap() {
    cancelAutoNext();
    if (!d) return;
    const replacement = pickReplacement(d.qIds);
    if (replacement === null) return;
    const qIds = [...d.qIds];
    const answers = [...d.answers];
    qIds[d.current] = replacement;
    answers[d.current] = null;
    update({ qIds, answers, link: "" });
  }

  async function makeLink() {
    if (!d || !allAnswered || !trimmedName || creating) return;
    const pairs = d.qIds.map((id, i) => [id, d.answers[i] as number] as [number, number]);
    const origin = window.location.origin;
    setCreating(true);
    try {
      // Short link saved on the server, so the creator can see the partner's result.
      const res = await fetch("/api/quiz/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ n: trimmedName, a: pairs }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const { id, token } = (await res.json()) as { id: string; token: string };
      addMyQuiz({ id, token, name: trimmedName, createdAt: new Date().toISOString() });
      update({ link: `${origin}/q/${id}/`, quizId: id, token, step: "share" });
    } catch {
      // Server not reachable: fall back to the old long link (no results tracking).
      update({ link: buildPlayUrl(origin, { n: trimmedName, a: pairs }), quizId: undefined, token: undefined, step: "share" });
    } finally {
      setCreating(false);
    }
  }

  async function copyPrivate() {
    if (!d?.quizId || !d.token) return;
    try {
      await navigator.clipboard.writeText(resultsUrl(window.location.origin, { id: d.quizId, token: d.token }));
      setCopiedPrivate(true);
      setTimeout(() => setCopiedPrivate(false), 2000);
    } catch {
      // Ignore.
    }
  }

  function startOver() {
    if (!window.confirm("Start a new quiz? Your current answers will be cleared.")) return;
    cancelAutoNext();
    setFromReview(false);
    remove(DRAFT_KEY);
    setD(freshDraft());
  }

  async function copy() {
    if (!d) return;
    try {
      await navigator.clipboard.writeText(d.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the link is visible on screen to copy by hand.
    }
  }

  const shareText = `How well do you know me? 💘 Take my quiz and see your score: ${d.link}`;

  async function nativeShare() {
    if (!d) return;
    try {
      await navigator.share({ title: "How well do you know me? 💘", text: "Take my quiz and see your score:", url: d.link });
    } catch {
      // User cancelled or share failed; nothing to do.
    }
  }

  return (
    <main className="wrap">
      <header className="topbar">
        <Link href="/" className="logo">
          Kiss<span>And</span>Quiz
        </Link>
        <Link href="/games/how-well-do-you-know-me/" className="back">
          About this game
        </Link>
      </header>

      {d.step === "name" && (
        <div className="card">
          <h2>First, what's your name?</h2>
          <input
            type="text"
            placeholder="e.g. Riya"
            value={d.name}
            maxLength={NAME_MAX}
            onChange={(e) => update({ name: e.target.value, link: "" })}
            onKeyDown={(e) => e.key === "Enter" && start()}
            autoFocus
            aria-label="Your name"
          />
          <button className="btn" onClick={start} disabled={!trimmedName}>
            {answeredCount > 0 ? "Continue →" : "Start →"}
          </button>
          <p className="muted">Your partner will see this name. You'll answer {total} quick questions about yourself.</p>
        </div>
      )}

      {d.step === "questions" && (() => {
        const q = QUESTIONS[d.qIds[d.current]];
        const selected = d.answers[d.current];
        return (
          <div className="card">
            <div className="progress" aria-hidden>
              <div style={{ width: `${(answeredCount / total) * 100}%` }} />
            </div>
            <div className="q-head">
              <p className="muted">
                Question {d.current + 1} of {total} · about you
              </p>
              <button className="link-btn" onClick={swap} title="Get a different question">
                🔄 Swap question
              </button>
            </div>
            <h2>{q.ask}</h2>
            <div className="options" role="radiogroup" aria-label={q.ask}>
              {q.options.map((opt, i) => (
                <button
                  key={`${d.qIds[d.current]}-${i}`}
                  className={selected === i ? "option selected" : "option"}
                  role="radio"
                  aria-checked={selected === i}
                  onClick={() => choose(i)}
                >
                  {opt}
                </button>
              ))}
            </div>
            <div className="nav-row">
              <button className="btn ghost" onClick={back}>
                ← Back
              </button>
              <button className="btn" onClick={next} disabled={selected === null}>
                {fromReview && allAnswered ? "Done" : d.current + 1 === total ? "Review →" : "Next →"}
              </button>
            </div>
          </div>
        );
      })()}

      {d.step === "review" && (
        <div className="card">
          <h2>Check your answers</h2>
          <p className="muted">
            Tap any answer to change it. Your partner will guess these, {trimmedName}.
          </p>
          <ol className="review-list">
            {d.qIds.map((id, i) => {
              const a = d.answers[i];
              return (
                <li key={id}>
                  <button
                    className="review-item"
                    onClick={() => {
                      setFromReview(true);
                      goTo(i);
                    }}
                  >
                    <span className="review-q">{QUESTIONS[id].ask}</span>
                    <span className="review-a">{a === null ? "Not answered" : QUESTIONS[id].options[a]}</span>
                    <span className="review-edit">Edit</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <button className="btn" onClick={makeLink} disabled={!allAnswered || creating}>
            {creating ? "Creating your link…" : "Create my quiz link 💘"}
          </button>
          <div className="nav-row">
            <button className="btn ghost" onClick={() => update({ step: "name" })}>
              Change name
            </button>
            <button className="btn ghost" onClick={() => goTo(total - 1)}>
              ← Back
            </button>
          </div>
        </div>
      )}

      {d.step === "share" && (
        <div className="card">
          <h2>Your quiz is ready, {trimmedName}! 🎉</h2>
          <p className="muted">Send this link to your partner. They'll guess your answers and see their score.</p>
          <div className="linkbox">{d.link}</div>
          <a
            className="btn whatsapp"
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Send on WhatsApp
          </a>
          {canShare && (
            <button className="btn" onClick={nativeShare}>
              Share to Instagram, Telegram…
            </button>
          )}
          <button className="btn ghost" onClick={copy}>
            {copied ? "Copied ✓" : "Copy link"}
          </button>
          {d.quizId && d.token ? (
            <div className="private-box">
              <p>
                <strong>See your partner's score</strong> once they play.
              </p>
              <Link href="/results/" className="btn">
                My results 💌
              </Link>
              <p className="muted">
                Results are saved on this phone. To check from another phone, save this private link (don't share it):
              </p>
              <button className="link-btn" onClick={copyPrivate}>
                {copiedPrivate ? "Private link copied ✓" : "Copy my private results link"}
              </button>
            </div>
          ) : (
            <p className="muted center tip">Tip: the link is saved on this phone, so you can come back here to copy it again.</p>
          )}
          <div className="nav-row">
            <button className="btn ghost" onClick={() => update({ step: "review" })}>
              {d.quizId ? "Edit (new link)" : "Edit answers"}
            </button>
            <button className="btn ghost" onClick={startOver}>
              New quiz
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
