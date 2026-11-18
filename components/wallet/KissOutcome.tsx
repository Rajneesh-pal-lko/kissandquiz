"use client";

// Result card on a finished game's screen: who earned how many kisses (rules C2–C5).
// The numbers shown come from the same rules the server uses; the wallet has the final say
// (daily and khata limits, rules C7–C8).
import Link from "next/link";
import { useEffect } from "react";
import { Emoji } from "@/components/Emoji";
import { clearWalletCache } from "@/lib/wallet/client";
import { kisses, totals, type Outcome } from "@/lib/wallet/rules";

type Props = {
  outcome: Outcome;
  /** Which player index is viewing (0 = game maker, 1 = partner). */
  me: 0 | 1;
  otherName: string;
  counted: boolean;
};

export default function KissOutcome({ outcome, me, otherName, counted }: Props) {
  const t = totals(outcome);
  const mine = t[me];
  const theirs = t[me === 0 ? 1 : 0];
  const bonus = outcome.earnings.some((e) => e.kind === "bonus" && e.to === me);

  // The balance just changed: let the header chip fetch it again.
  useEffect(() => {
    if (counted) clearWalletCache();
  }, [counted]);

  let title: string;
  let line: string;
  if (outcome.winner === "tie") {
    title = `Tie! You both win ${kisses(mine)}`;
    line = `Kiss each other when you meet 😘`;
  } else if (outcome.winner === me) {
    title = `You win ${kisses(mine)} 💋`;
    line = `${otherName} owes you ${kisses(mine)}. Collect when you meet.`;
  } else {
    title = `${otherName} wins ${kisses(theirs)}`;
    line = `You owe ${otherName} ${kisses(theirs)} 😏 Pay up when you meet, or win them back.`;
  }

  return (
    <div className="kiss-out">
      <Emoji code={outcome.winner === me || outcome.winner === "tie" ? "1f48b" : "1f60f"} size={44} />
      <div>
        <strong>{title}</strong>
        <span>{line}</span>
        {bonus && <span className="kiss-bonus">+1 bonus kiss for a perfect score ✨</span>}
        {counted ? (
          <Link href="/wallet/" className="kiss-link">
            <Emoji code="1f45b" size={18} /> Open my Kiss Wallet →
          </Link>
        ) : (
          <span className="kiss-off">Not added to a Kiss Wallet this time (one of you has no wallet on this phone).</span>
        )}
      </div>
    </div>
  );
}
