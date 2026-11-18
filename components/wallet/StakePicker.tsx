"use client";

// "Play for 1 / 2 / 3 / 5 kisses" (Kiss Wallet rule C1). Shown before the game link is made.
import { Emoji } from "@/components/Emoji";
import { STAKES } from "@/lib/wallet/rules";

export default function StakePicker({ value, onChange, partner }: { value: number; onChange: (n: number) => void; partner?: string }) {
  return (
    <div className="stake">
      <p className="stake-title">
        <Emoji code="1f48b" size={22} /> Play for how many kisses?
      </p>
      <div className="stake-row" role="radiogroup" aria-label="Kisses this game is played for">
        {STAKES.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            className={value === n ? "stake-opt on" : "stake-opt"}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="muted stake-note">
        The winner earns {value === 1 ? "1 kiss" : `${value} kisses`} from {partner || "the other"}, paid when you meet. Tie: you both
        win.
      </p>
    </div>
  );
}
