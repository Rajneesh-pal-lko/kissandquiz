"use client";

// Reveal for one round: both picks side by side, both guesses with ✅/❌,
// and a small celebration when the picks match or a guess is right.
import { useEffect, useRef } from "react";
import { Emoji } from "@/components/Emoji";
import { confetti, heartBurst } from "@/components/fx";
import { fill, initial } from "@/lib/reveal/rules";
import type { Answer, RevealConfig } from "@/lib/reveal/types";

type Props = {
  cfg: RevealConfig;
  qIndex: number;
  round: number;
  total: number;
  mine: Answer;
  theirs: Answer;
  /** Names for {A}/{B} in option labels. */
  names: { A: string; B: string | null };
  myName: string;
  otherName: string;
  /** Correct guesses so far: [me, them]. */
  tally: [number, number];
  /** I'm the creator (A) → my avatar uses the A colour. */
  meIsA: boolean;
  onNext: () => void;
};

export default function RoundReveal({ cfg, qIndex, round, total, mine, theirs, names, myName, otherName, tally, meIsA, onNext }: Props) {
  const qn = cfg.questions[qIndex];
  const opt = (i: number | null) => (i === null ? "—" : fill(qn.options[i] ?? "—", names));
  const same = cfg.match(mine.pick, theirs.pick);
  const myGuessOk = cfg.prediction && mine.guess === theirs.pick;
  const theirGuessOk = cfg.prediction && theirs.guess === mine.pick;
  const sameRef = useRef<HTMLParagraphElement>(null);
  const myGuessRef = useRef<HTMLParagraphElement>(null);
  const isLast = round + 1 === total;

  useEffect(() => {
    const timers: number[] = [];
    if (same) {
      timers.push(window.setTimeout(() => heartBurst(sameRef.current), 250));
      timers.push(window.setTimeout(() => confetti(36), 350));
    }
    if (myGuessOk) timers.push(window.setTimeout(() => heartBurst(myGuessRef.current, "+1"), 550));
    if (typeof navigator.vibrate === "function") navigator.vibrate(same || myGuessOk ? 18 : [12, 40, 12]);
    return () => timers.forEach((t) => window.clearTimeout(t));
    // Run once per round.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  return (
    <div className="card flow-card" key={round}>
      <div className="q-top">
        <span className="q-count">
          {round + 1} <span>/ {total}</span>
        </span>
        {cfg.scoring && (
          <span className="tally">
            <span className="score-pill">
              <Emoji code="1f3af" size={18} /> You {tally[0]}
            </span>
            <span className="score-pill">
              {otherName} {tally[1]}
            </span>
          </span>
        )}
      </div>
      <div className="slide-in">
        <p className="reveal-q">
          {qn.prompt} {opt(0)} or {opt(1)}?
        </p>
        {same && (
          <p className="same-banner" ref={sameRef}>
            <Emoji code="1f49e" size={30} /> Same pick!
          </p>
        )}
        <div className={same ? "pair same" : "pair"}>
          <div className="side">
            <div className="who">
              <span className={meIsA ? "ava" : "ava b"}>{initial(myName)}</span>
              <span>You</span>
            </div>
            <p className="pick">{opt(mine.pick)}</p>
          </div>
          <div className="side">
            <div className="who">
              <span className={meIsA ? "ava b" : "ava"}>{initial(otherName)}</span>
              <span>{otherName}</span>
            </div>
            <p className="pick">{opt(theirs.pick)}</p>
          </div>
        </div>
        {cfg.prediction && (
          <div className="guesses">
            <p className={myGuessOk ? "guess-line ok" : "guess-line bad"} ref={myGuessRef}>
              <Emoji code={myGuessOk ? "2705" : "274c"} size={22} />
              <span>
                {myGuessOk ? `You guessed ${otherName} right!` : `You guessed ${otherName} would pick “${opt(mine.guess)}”.`}
              </span>
            </p>
            <p className={theirGuessOk ? "guess-line ok" : "guess-line bad"}>
              <Emoji code={theirGuessOk ? "2705" : "274c"} size={22} />
              <span>{theirGuessOk ? `${otherName} guessed you right!` : `${otherName} guessed you'd pick “${opt(theirs.guess)}”.`}</span>
            </p>
          </div>
        )}
      </div>
      <button className="btn" onClick={onNext} style={{ marginTop: 18 }} autoFocus>
        {isLast ? "See who won →" : "Next round →"}
      </button>
    </div>
  );
}
