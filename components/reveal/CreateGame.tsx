"use client";

// Creator flow for reveal games (Would You Rather, …): name → for each question
// "Your pick" then "Their pick?" → review → share the /w/<id>/ link.
// The draft is saved on this phone so a refresh doesn't lose work.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatedEmoji, Emoji, WhatsAppIcon } from "@/components/Emoji";
import { confetti } from "@/components/fx";
import { SiteHeader } from "@/components/SiteChrome";
import Choices from "@/components/reveal/Choices";
import { configFor } from "@/lib/reveal/configs";
import { REMATCH_KEY, privateGameUrl, saveMyGame, type Rematch } from "@/lib/reveal/myGames";
import { NAME_MAX, fill, pickReplacement, pickRound } from "@/lib/reveal/rules";
import type { GameType, RevealConfig } from "@/lib/reveal/types";
import { load, remove, save } from "@/lib/storage";

type Step = "name" | "questions" | "review" | "share";
type Slot = { pick: number | null; guess: number | null };

type Draft = {
  type: GameType;
  step: Step;
  name: string;
  /** Partner's name when known (rematch). Empty = "your partner". */
  partner: string;
  q: number[];
  answers: Slot[];
  current: number;
  sub: "pick" | "guess";
  id?: string;
  token?: string;
};

const PICK_TO_GUESS_MS = 280;
const NEXT_MS = 320;

function draftKey(type: GameType) {
  return `kq.${type}.create.v1`;
}

function fresh(cfg: RevealConfig, name = "", partner = ""): Draft {
  const q = pickRound(cfg);
  return {
    type: cfg.type,
    step: name ? "questions" : "name",
    name,
    partner,
    q,
    answers: q.map(() => ({ pick: null, guess: null })),
    current: 0,
    sub: "pick",
  };
}

function complete(cfg: RevealConfig, s: Slot): boolean {
  return s.pick !== null && (!cfg.prediction || s.guess !== null);
}

function isValid(cfg: RevealConfig, d: Draft | null): d is Draft {
  return (
    !!d &&
    d.type === cfg.type &&
    typeof d.name === "string" &&
    typeof d.partner === "string" &&
    Array.isArray(d.q) &&
    Array.isArray(d.answers) &&
    d.q.length === cfg.rounds &&
    d.answers.length === d.q.length &&
    d.q.every((id, i) => {
      const qn = cfg.questions[id];
      const a = d.answers[i];
      const okOpt = (v: unknown) => v === null || (Number.isInteger(v) && (v as number) >= 0 && (v as number) < (qn?.options.length ?? 0));
      return !!qn && !!a && okOpt(a.pick) && okOpt(a.guess);
    })
  );
}

export default function CreateGame({ type }: { type: GameType }) {
  const cfg = configFor(type) as RevealConfig;
  const [d, setD] = useState<Draft | null>(null);
  const [fromReview, setFromReview] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<"" | "link" | "private">("");
  const [canShare, setCanShare] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const rematch = load<Rematch>(REMATCH_KEY);
    if (rematch && rematch.type === type) {
      const name = typeof rematch.name === "string" ? rematch.name.slice(0, NAME_MAX) : "";
      const partner = typeof rematch.partner === "string" ? rematch.partner.slice(0, NAME_MAX) : "";
      const draft = fresh(cfg, name, partner);
      // Save the new draft before clearing the hint, so a second run of this effect
      // (React dev mode, or a quick refresh) loads the same draft instead of a blank one.
      save(draftKey(type), draft);
      remove(REMATCH_KEY);
      setD(draft);
    } else {
      const saved = load<Draft>(draftKey(type));
      if (isValid(cfg, saved)) {
        const current = Math.min(Math.max(Number(saved.current) || 0, 0), saved.q.length - 1);
        const step = saved.step === "share" && !(saved.id && saved.token) ? "review" : saved.step;
        setD({ ...saved, current, step, sub: saved.sub === "guess" ? "guess" : "pick" });
      } else setD(fresh(cfg));
    }
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  useEffect(() => {
    if (d) save(draftKey(type), d);
  }, [d, type]);

  // Scroll to top on step change; confetti when the link is made.
  const lastStep = useRef<Step | null>(null);
  const step = d?.step ?? null;
  useEffect(() => {
    if (step === "share" && lastStep.current === "review") confetti();
    if (lastStep.current !== null && step !== lastStep.current) window.scrollTo({ top: 0 });
    lastStep.current = step;
  }, [step]);

  if (!d)
    return (
      <>
        <SiteHeader hideCta />
        <main className="wrap" />
      </>
    );

  const total = d.q.length;
  const doneCount = d.answers.filter((a) => complete(cfg, a)).length;
  const allDone = doneCount === total;
  const trimmedName = d.name.trim();
  const partnerLabel = d.partner || "your partner";

  function update(patch: Partial<Draft>) {
    setD((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function cancelTimer() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }

  /** Move on from a finished question (or back to review when editing from there). */
  function advance(prev: Draft, viaReview: boolean): Draft {
    const finished = prev.answers.every((a) => complete(cfg, a));
    if (viaReview && finished) return { ...prev, step: "review", sub: "pick" };
    if (prev.current + 1 < prev.q.length) return { ...prev, current: prev.current + 1, sub: "pick" };
    if (finished) return { ...prev, step: "review", sub: "pick" };
    const firstOpen = prev.answers.findIndex((a) => !complete(cfg, a));
    return { ...prev, current: firstOpen, sub: "pick" };
  }

  function choose(i: number) {
    if (!d) return;
    cancelTimer();
    setError("");
    const answers = d.answers.map((a, k) => (k === d.current ? { ...a, [d.sub]: i } : a));
    update({ answers, id: undefined, token: undefined });
    const viaReview = fromReview;
    timer.current = setTimeout(() => {
      timer.current = null;
      setD((prev) => {
        if (!prev || prev.step !== "questions") return prev;
        if (prev.sub === "pick" && cfg.prediction) return { ...prev, sub: "guess" };
        return advance(prev, viaReview);
      });
      if (viaReview && (d.sub === "guess" || !cfg.prediction)) setFromReview(false);
    }, d.sub === "pick" ? PICK_TO_GUESS_MS : NEXT_MS);
  }

  function next() {
    if (!d) return;
    cancelTimer();
    const slot = d.answers[d.current];
    if (d.sub === "pick") {
      if (slot.pick === null) return;
      if (cfg.prediction) return update({ sub: "guess" });
    } else if (slot.guess === null) return;
    const viaReview = fromReview;
    setFromReview(false);
    setD((prev) => (prev ? advance(prev, viaReview) : prev));
  }

  function back() {
    if (!d) return;
    cancelTimer();
    if (d.sub === "guess") return update({ sub: "pick" });
    if (fromReview) {
      setFromReview(false);
      return update({ step: allDone ? "review" : "questions" });
    }
    if (d.current === 0) return update({ step: "name" });
    update({ current: d.current - 1, sub: "pick" });
  }

  function swap() {
    if (!d) return;
    cancelTimer();
    const r = pickReplacement(cfg, d.q, d.current);
    if (r === null) return;
    const q = [...d.q];
    q[d.current] = r;
    const answers = d.answers.map((a, k) => (k === d.current ? { pick: null, guess: null } : a));
    update({ q, answers, sub: "pick", id: undefined, token: undefined });
  }

  function start() {
    if (!trimmedName) return;
    update({ name: trimmedName, step: allDone ? "review" : "questions" });
  }

  function edit(i: number) {
    cancelTimer();
    setFromReview(true);
    update({ step: "questions", current: i, sub: "pick" });
  }

  async function createLink() {
    if (!d || !allDone || !trimmedName || creating) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/game/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, name: trimmedName, q: d.q, answers: d.answers }),
      });
      if (res.status === 429) throw new Error("too_many");
      if (!res.ok) throw new Error(`status ${res.status}`);
      const { id, token } = (await res.json()) as { id: string; token: string };
      saveMyGame({ id, type, token, role: 0, name: trimmedName, partner: d.partner || null, createdAt: new Date().toISOString() });
      update({ id, token, step: "share" });
    } catch (err) {
      setError(
        (err as Error).message === "too_many"
          ? "Lots of games were just made from this network. Please try again in a little while."
          : "Couldn't create your game right now. Check your internet and try again.",
      );
    } finally {
      setCreating(false);
    }
  }

  function startOver() {
    if (!window.confirm("Start a new game? Your current answers will be cleared.")) return;
    cancelTimer();
    setFromReview(false);
    remove(draftKey(type));
    setD(fresh(cfg, trimmedName, d?.partner ?? ""));
  }

  async function copy(text: string, which: "link" | "private") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      // Clipboard can be blocked; the link is visible on screen.
    }
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = d.id ? `${origin}${cfg.linkPrefix}${d.id}/` : "";
  const shareText = `Would you rather…? 💞 I picked my answers and guessed yours. Your turn, it takes 3 minutes: ${link}`;

  async function nativeShare() {
    try {
      await navigator.share({ title: `${cfg.title} 💞`, text: "I picked my answers and guessed yours. Your turn:", url: link });
    } catch {
      // Cancelled.
    }
  }

  return (
    <>
      <SiteHeader back={{ href: cfg.landing, label: "About this game" }} hideCta />
      <main className="wrap flow">
        {d.step === "name" && (
          <div className="card flow-card slide-in">
            <div className="name-hero">
              <Emoji code="1f44b" size={72} eager />
            </div>
            <h2 className="center">First, what&apos;s your name?</h2>
            <p className="muted center">
              Your partner will see it. Then pick your answer for {total} questions and guess what{" "}
              {d.partner || "they"} would pick.
            </p>
            <input
              type="text"
              placeholder="e.g. Riya"
              value={d.name}
              maxLength={NAME_MAX}
              onChange={(e) => update({ name: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && start()}
              autoFocus
              autoComplete="given-name"
              aria-label="Your name"
            />
            <button className="btn" onClick={start} disabled={!trimmedName}>
              {doneCount > 0 ? "Continue →" : "Let's go →"}
            </button>
          </div>
        )}

        {d.step === "questions" &&
          (() => {
            const qn = cfg.questions[d.q[d.current]];
            const cat = cfg.categories[qn.category];
            const slot = d.answers[d.current];
            const options = qn.options.map((o) => fill(o, { A: trimmedName, B: d.partner }));
            const guessing = d.sub === "guess";
            const ask = guessing ? fill(cfg.text.guess, { partner: d.partner }) : cfg.text.pick;
            const askCap = ask.charAt(0).toUpperCase() + ask.slice(1);
            return (
              <div className="card flow-card">
                <div className="q-top">
                  <span className="q-count">
                    {d.current + 1} <span>/ {total}</span>
                  </span>
                  <button className="chip-btn" onClick={swap} title="Get a different question">
                    <Emoji code="1f504" size={18} className="spin" /> Swap question
                  </button>
                </div>
                <div className="progress" aria-hidden>
                  <div style={{ width: `${Math.max(4, ((doneCount + (slot.pick !== null && !complete(cfg, slot) ? 0.5 : 0)) / total) * 100)}%` }} />
                </div>
                <div key={`${d.q[d.current]}-${d.sub}`} className="slide-in">
                  {cat && (
                    <span className="q-cat">
                      <Emoji code={cat.icon} size={18} /> {cat.label}
                    </span>
                  )}
                  {cfg.prediction && (
                    <div className="steps2" aria-hidden>
                      <span className={guessing ? "st done" : "st on"}>
                        <b>{guessing ? "✓" : "1"}</b> Your pick
                      </span>
                      <span className="arrow">→</span>
                      <span className={guessing ? "st on" : "st"}>
                        <b>2</b> {d.partner ? `${d.partner}'s pick?` : "Their pick?"}
                      </span>
                    </div>
                  )}
                  <h2 className="wyr-prompt">{qn.prompt}</h2>
                  <p className="wyr-ask">{askCap}</p>
                  <Choices
                    options={options}
                    label={askCap}
                    pick={slot.pick}
                    guess={slot.guess}
                    mode={guessing ? "guess" : "pick"}
                    guessTag={d.partner ? `${d.partner}?` : "Their pick?"}
                    onChoose={(i) => choose(i)}
                  />
                </div>
                <div className="btn-row">
                  <button className="btn ghost" onClick={back}>
                    {guessing ? "← My pick" : "← Back"}
                  </button>
                  <button className="btn" onClick={next} disabled={guessing ? slot.guess === null : slot.pick === null}>
                    {fromReview && allDone && (guessing || !cfg.prediction)
                      ? "Done"
                      : !guessing && cfg.prediction
                        ? "Next →"
                        : d.current + 1 === total
                          ? "Review →"
                          : "Next →"}
                  </button>
                </div>
                {guessing && (
                  <p className="muted center tip">Guess what {partnerLabel} would really pick, not what you want them to pick 😉</p>
                )}
              </div>
            );
          })()}

        {d.step === "review" && (
          <div className="card flow-card slide-in">
            <div className="name-hero">
              <Emoji code="1f4cb" size={60} eager />
            </div>
            <h2 className="center">Check your answers</h2>
            <p className="muted center">Tap any question to change it. {d.partner || "Your partner"} won&apos;t see these until they answer.</p>
            <ol className="review-list">
              {d.q.map((id, i) => {
                const qn = cfg.questions[id];
                const a = d.answers[i];
                const opt = (k: number | null) => (k === null ? "—" : fill(qn.options[k], { A: trimmedName, B: d.partner }));
                return (
                  <li key={id}>
                    <button className="review-item" onClick={() => edit(i)}>
                      <span className="rv-num">{i + 1}</span>
                      <span className="review-q">
                        {qn.options.map((o) => fill(o, { A: trimmedName, B: d.partner })).join(" or ")}?
                      </span>
                      <span className="review-a">
                        You: {opt(a.pick)}
                        {cfg.prediction && ` · Guess: ${opt(a.guess)}`}
                      </span>
                      <span className="review-edit">Edit</span>
                    </button>
                  </li>
                );
              })}
            </ol>
            {error && (
              <p className="feedback bad" role="alert">
                <Emoji code="1f914" size={28} /> {error}
              </p>
            )}
            <button className="btn" onClick={createLink} disabled={!allDone || creating} style={{ marginTop: error ? 14 : 0 }}>
              {creating ? "Creating your link…" : error ? "Try again" : "Create my game link"}
              {!creating && <Emoji code="1f49e" size={26} />}
            </button>
            <div className="btn-row">
              <button className="btn ghost sm" onClick={() => update({ step: "name" })}>
                Change name
              </button>
              <button className="btn ghost sm" onClick={() => edit(total - 1)}>
                ← Back
              </button>
            </div>
          </div>
        )}

        {d.step === "share" && d.id && d.token && (
          <div className="card flow-card slide-in">
            <div className="share-hero">
              <AnimatedEmoji name="party_popper" code="1f389" size={96} eager />
              <h2>Your game is ready, {trimmedName}!</h2>
              <p className="muted">
                Send this link to {d.partner || "your partner"}. They pick their answers and guess yours, then you both see who
                knows who better.
              </p>
            </div>
            <div className="linkbox">
              <code>{link}</code>
              <button className="chip-btn" onClick={() => copy(link, "link")}>
                {copied === "link" ? "Copied ✓" : "Copy"}
              </button>
            </div>
            <a className="btn whatsapp" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon /> Send on WhatsApp
            </a>
            {canShare && (
              <button className="btn" onClick={nativeShare}>
                Share to Instagram, Telegram…
              </button>
            )}
            <div className="private-box">
              <div className="ph">
                <Emoji code="1f440" size={40} />
                <p>
                  <strong>See the reveal</strong>
                  <br />
                  <span className="muted">Open your link on this phone any time. It shows every answer once they finish.</span>
                </p>
              </div>
              <Link href={`${cfg.linkPrefix}${d.id}/`} className="btn plum">
                Open my game
              </Link>
              <p className="muted">
                Opening the link inside WhatsApp or on another phone? Use your private link there (don&apos;t share it):
              </p>
              <button className="link-btn" onClick={() => copy(privateGameUrl(origin, cfg.linkPrefix, { id: d.id!, token: d.token! }), "private")}>
                <Emoji code="1f512" size={18} /> {copied === "private" ? "Private link copied ✓" : "Copy my private link"}
              </button>
            </div>
            <div className="btn-row">
              <button className="btn ghost sm" onClick={() => update({ step: "review", id: undefined, token: undefined })}>
                Edit (new link)
              </button>
              <button className="btn ghost sm" onClick={startOver}>
                New game
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
