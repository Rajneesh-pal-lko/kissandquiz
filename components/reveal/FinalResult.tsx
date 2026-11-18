"use client";

// Final screen of a reveal game: who guessed more, how often the picks matched,
// send the result on WhatsApp, play again (the viral loop) and see every answer.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatedEmoji, Emoji, WhatsAppIcon } from "@/components/Emoji";
import { confetti } from "@/components/fx";
import { fill, initial, lcFirst } from "@/lib/reveal/rules";
import type { Answer, RevealConfig, Score } from "@/lib/reveal/types";

type Props = {
  cfg: RevealConfig;
  me: 0 | 1;
  q: number[];
  mine: (Answer | null)[];
  theirs: (Answer | null)[];
  score: Score;
  names: { A: string; B: string | null };
  link: string;
  onPlayAgain: () => void;
};

export default function FinalResult({ cfg, me, q, mine, theirs, score, names, link, onPlayAgain }: Props) {
  const [showAll, setShowAll] = useState(false);
  const fired = useRef(false);
  const other = me === 0 ? 1 : 0;
  const myName = (me === 0 ? names.A : names.B) || "You";
  const otherName = (me === 0 ? names.B : names.A) || "your partner";
  const total = q.length;
  const myCorrect = score.correct[me];
  const theirCorrect = score.correct[other];
  const result = myCorrect > theirCorrect ? "me" : myCorrect < theirCorrect ? "them" : "tie";

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    window.scrollTo({ top: 0 });
    const t = window.setTimeout(() => confetti(result === "them" ? 40 : 80), 600);
    return () => window.clearTimeout(t);
  }, [result]);

  const opt = (qi: number, i: number | null | undefined) =>
    i === null || i === undefined ? "—" : fill(cfg.questions[qi]?.options[i] ?? "—", names);

  const winnerLine = result === "me" ? "You win 💘" : result === "them" ? `${otherName} wins 💘` : "It's a tie 💞";
  const sendWinner = result === "me" ? "I win 😎" : result === "them" ? "You win this time 😏" : "It's a tie 💞";
  const shareText = cfg.scoring
    ? `${otherName}, I guessed ${myCorrect}/${total} of your ${cfg.title} picks and you guessed ${theirCorrect}/${total} of mine. ${sendWinner} We picked the same thing ${score.matches}/${total} times. See all our answers: ${link}`
    : `We picked the same thing ${score.matches}/${total} times on ${cfg.title} 💞 See all our answers: ${link}`;

  return (
    <>
      <div className="card flow-card center slide-in">
        <AnimatedEmoji
          name={result === "them" ? "face_blowing_a_kiss" : "partying_face"}
          code={result === "them" ? "1f618" : "1f973"}
          size={88}
          eager
          className="mood"
        />
        {cfg.scoring && (
          <>
            <h2 className="winner">{winnerLine}</h2>
            <div className="vs" aria-hidden>
              <div className={result === "me" ? "vs-side win" : "vs-side"}>
                <span className={me === 0 ? "ava" : "ava b"}>{initial(myName)}</span>
                <span className="nm">You</span>
                <span className="vs-num">
                  {myCorrect}
                  <small>/{total}</small>
                </span>
                <span className="lbl">guessed right</span>
              </div>
              <Emoji code="1f19a" size={44} />
              <div className={result === "them" ? "vs-side win" : "vs-side"}>
                <span className={me === 0 ? "ava b" : "ava"}>{initial(otherName)}</span>
                <span className="nm">{otherName}</span>
                <span className="vs-num">
                  {theirCorrect}
                  <small>/{total}</small>
                </span>
                <span className="lbl">guessed right</span>
              </div>
            </div>
            <p className="score-lines">
              {otherName} guessed {theirCorrect}/{total} of your picks · You guessed {myCorrect}/{total} of theirs
            </p>
          </>
        )}
        <p className="same-count">
          <Emoji code="1f49e" size={22} /> You picked the same thing {score.matches}/{total} times
        </p>
        <a
          className="btn whatsapp"
          href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginTop: 18 }}
        >
          <WhatsAppIcon /> Send the result to {otherName}
        </a>
        <div className="loop-box">
          <Emoji code="1f60f" size={46} />
          <h3>Rematch?</h3>
          <p>Play again with 10 new questions. You start this time and send the link to {otherName}.</p>
          <button className="btn light" onClick={onPlayAgain}>
            Play again with new questions →
          </button>
        </div>
      </div>

      <div className="card">
        <button className="link-btn full" onClick={() => setShowAll(!showAll)} aria-expanded={showAll}>
          {showAll ? "Hide answers ▲" : "See all answers ▼"}
        </button>
        {showAll && (
          <ol className="review-list slide-in">
            {q.map((qi, r) => {
              const a = mine[r];
              const b = theirs[r];
              if (!a || !b) return null;
              const same = cfg.match(a.pick, b.pick);
              const myOk = a.guess === b.pick;
              const theirOk = b.guess === a.pick;
              return (
                <li key={qi} className="result-item">
                  <span className="ans-q">
                    {r + 1}. {opt(qi, 0)} or {lcFirst(opt(qi, 1))}?
                  </span>
                  <span className="ans-line">
                    {same && <Emoji code="1f49e" size={16} />} You: <b>{opt(qi, a.pick)}</b> · {otherName}: <b>{opt(qi, b.pick)}</b>
                  </span>
                  {cfg.prediction && (
                    <>
                      <span className="ans-line">
                        <Emoji code={myOk ? "2705" : "274c"} size={16} /> You guessed {otherName}: {opt(qi, a.guess)}
                      </span>
                      <span className="ans-line">
                        <Emoji code={theirOk ? "2705" : "274c"} size={16} /> {otherName} guessed you: {opt(qi, b.guess)}
                      </span>
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <p className="muted center tip">
        <Link href="/">More couple games →</Link>
      </p>
    </>
  );
}
