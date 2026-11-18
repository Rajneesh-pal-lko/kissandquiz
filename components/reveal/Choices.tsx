// Big tappable option cards for reveal games. Two options get an "OR" badge between them.
import type { ReactNode } from "react";

type Props = {
  options: string[];
  /** Accessible name for the group, e.g. "What would you pick?". */
  label: string;
  /** Option the player picked for themselves (tagged "You"). */
  pick?: number | null;
  /** Option the player guessed for their partner. */
  guess?: number | null;
  /** Which one this tap sets: highlights that selection. */
  mode: "pick" | "guess" | "view";
  pickTag?: string;
  guessTag?: string;
  disabled?: boolean;
  onChoose?: (index: number, el: HTMLElement) => void;
};

export default function Choices({ options, label, pick, guess, mode, pickTag = "You", guessTag = "Your guess", disabled, onChoose }: Props) {
  const two = options.length === 2;
  const items: ReactNode[] = [];
  options.forEach((opt, i) => {
    const isPick = pick === i;
    const isGuess = guess === i;
    const selected = mode === "pick" ? isPick : mode === "guess" ? isGuess : false;
    let cls = `choice c${i % 3}`;
    if (mode === "pick" ? isPick : isPick && mode === "view") cls += " is-pick";
    if (mode === "guess" && isGuess) cls += " is-guess";
    items.push(
      <button
        key={`o${i}`}
        type="button"
        className={cls}
        role="radio"
        aria-checked={selected}
        aria-disabled={disabled || mode === "view" || undefined}
        onClick={(e) => {
          if (disabled || mode === "view") return;
          onChoose?.(i, e.currentTarget);
        }}
      >
        <span>{opt}</span>
        {(isPick || (isGuess && mode !== "pick")) && (
          <span className="choice-tags">
            {isPick && <span className="ctag">{pickTag}</span>}
            {isGuess && mode !== "pick" && <span className="ctag guess">{guessTag}</span>}
          </span>
        )}
      </button>,
    );
    if (two && i === 0) {
      items.push(
        <span key="or" className="or-badge" aria-hidden>
          OR
        </span>,
      );
    }
  });
  return (
    <div className={two ? "choices" : "choices multi"} role="radiogroup" aria-label={label}>
      {items}
    </div>
  );
}
