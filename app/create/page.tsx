"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { QUESTIONS, pickQuestions } from "@/lib/questions";
import { buildPlayUrl } from "@/lib/quizLink";

type Step = "name" | "questions" | "share";

export default function CreatePage() {
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [qIds, setQIds] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<[number, number][]>([]);
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);

  // Pick questions on the client only, so server and browser renders match.
  useEffect(() => {
    setQIds(pickQuestions());
  }, []);

  function start() {
    if (name.trim().length === 0) return;
    setStep("questions");
  }

  function answer(optionIndex: number) {
    const next: [number, number][] = [...answers, [qIds[current], optionIndex]];
    setAnswers(next);
    if (current + 1 < qIds.length) {
      setCurrent(current + 1);
    } else {
      setLink(buildPlayUrl(window.location.origin, { n: name.trim(), a: next }));
      setStep("share");
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the link is visible on screen to copy by hand.
    }
  }

  const shareText = `How well do you know me? 💘 Take my quiz and see your score: ${link}`;

  return (
    <main className="wrap">
      <Link href="/" className="logo">
        Kiss<span>And</span>Quiz
      </Link>

      {step === "name" && (
        <div className="card">
          <h2>First, what's your name?</h2>
          <input
            type="text"
            placeholder="e.g. Riya"
            value={name}
            maxLength={24}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && start()}
            autoFocus
          />
          <button className="btn" onClick={start} disabled={name.trim().length === 0 || qIds.length === 0}>
            Start →
          </button>
          <p className="muted">Your partner will see this name.</p>
        </div>
      )}

      {step === "questions" && qIds.length > 0 && (
        <div className="card">
          <div className="progress">
            <div style={{ width: `${(current / qIds.length) * 100}%` }} />
          </div>
          <p className="muted">
            Question {current + 1} of {qIds.length} · answer about yourself
          </p>
          <h2>{QUESTIONS[qIds[current]].ask}</h2>
          <div className="options">
            {QUESTIONS[qIds[current]].options.map((opt, i) => (
              <button key={i} className="option" onClick={() => answer(i)}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "share" && (
        <div className="card">
          <h2>Your quiz is ready, {name.trim()}! 🎉</h2>
          <p className="muted">Send this link to your partner. They'll guess your answers.</p>
          <div className="linkbox">{link}</div>
          <a
            className="btn whatsapp"
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Send on WhatsApp
          </a>
          <button className="btn ghost" onClick={copy}>
            {copied ? "Copied ✓" : "Copy link"}
          </button>
        </div>
      )}
    </main>
  );
}
