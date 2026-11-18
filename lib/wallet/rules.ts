// Kiss Wallet rules (docs/KISS_WALLET_RULES.md). Pure functions and constants, shared by the
// browser (to show "you win 2 kisses") and the server (which alone decides what is saved).

/** C1: kisses a game can be played for. */
export const STAKES = [1, 2, 3, 5] as const;
export const DEFAULT_STAKE = 1;
/** C4/C5: extra kiss for guessing everything right. */
export const PERFECT_BONUS = 1;
/** C7: max kisses one person can earn from games, per partner, per rolling 24 h. */
export const DAILY_GAME_CAP = 15;
/** C8: max kisses one person can be owed by the same partner. */
export const KHATA_MAX = 99;
/** C9: gifts. */
export const GIFT_STEPS = [1, 2, 3, 5] as const;
export const DAILY_GIFT_CAP = 10;
/** C5: quiz score bands (share of answers guessed right). */
export const QUIZ_WIN_AT = 0.7;
export const QUIZ_TIE_AT = 0.4;

/** D2: kiss rate card used when marking kisses as received. */
export const RATE_CARD = [
  { key: "peck", label: "Peck", value: 1, code: "1f48b" },
  { key: "hug", label: "Hug + kiss", value: 3, code: "1f917" },
  { key: "ten", label: "10-second kiss", value: 5, code: "23f1" },
  { key: "movie", label: "Movie kiss", value: 10, code: "1f3ac" },
] as const;
export type RateKey = (typeof RATE_CARD)[number]["key"];

/** Wallet IDs: 12 chars [A-Za-z0-9]. Khata IDs: two wallet IDs joined by "_", sorted. */
export const WALLET_ID_RE = /^[A-Za-z0-9]{12}$/;
export const KHATA_ID_RE = /^[A-Za-z0-9]{12}_[A-Za-z0-9]{12}$/;

export function cleanStake(raw: unknown): number {
  return typeof raw === "number" && (STAKES as readonly number[]).includes(raw) ? raw : DEFAULT_STAKE;
}

export function khataId(a: string, b: string): string {
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

/** One line of what a finished game gives. `to` = player index (0 = game maker, 1 = partner). */
export type Earning = { to: 0 | 1; amount: number; kind: "win" | "tie" | "bonus" };
export type Outcome = { winner: 0 | 1 | "tie"; earnings: Earning[] };

/** C2–C4: two-player games. correct[i] = how many of the other's answers player i guessed. */
export function revealOutcome(correct: [number, number], rounds: number, stake: number): Outcome {
  const s = cleanStake(stake);
  const winner: Outcome["winner"] = correct[0] > correct[1] ? 0 : correct[1] > correct[0] ? 1 : "tie";
  const earnings: Earning[] = [];
  if (winner === "tie") {
    earnings.push({ to: 0, amount: s, kind: "tie" }, { to: 1, amount: s, kind: "tie" });
  } else {
    earnings.push({ to: winner, amount: s, kind: "win" });
  }
  ([0, 1] as const).forEach((i) => {
    if (rounds > 0 && correct[i] === rounds) earnings.push({ to: i, amount: PERFECT_BONUS, kind: "bonus" });
  });
  return { winner, earnings };
}

/** C5: couple quiz. Player 0 = quiz maker, 1 = partner who guessed. */
export function quizOutcome(score: number, total: number, stake: number): Outcome {
  const s = cleanStake(stake);
  const share = total > 0 ? score / total : 0;
  if (share >= QUIZ_WIN_AT) {
    const earnings: Earning[] = [{ to: 1, amount: s, kind: "win" }];
    if (score === total) earnings.push({ to: 1, amount: PERFECT_BONUS, kind: "bonus" });
    return { winner: 1, earnings };
  }
  if (share >= QUIZ_TIE_AT) {
    return { winner: "tie", earnings: [{ to: 0, amount: s, kind: "tie" }, { to: 1, amount: s, kind: "tie" }] };
  }
  return { winner: 0, earnings: [{ to: 0, amount: s, kind: "win" }] };
}

/** Total kisses each player gets from an outcome. */
export function totals(o: Outcome): [number, number] {
  const t: [number, number] = [0, 0];
  for (const e of o.earnings) t[e.to] += e.amount;
  return t;
}

export function kisses(n: number): string {
  return `${n} ${n === 1 ? "kiss" : "kisses"}`;
}

const PLURAL: Record<RateKey, string> = {
  peck: "pecks",
  hug: "hugs + kisses",
  ten: "10-second kisses",
  movie: "movie kisses",
};

/** Biggest rate-card items that fit in `n`, e.g. 23 → "2 movie kisses + 1 hug + kiss". */
export function rateCardSplit(n: number): string {
  if (n <= 0) return "";
  const parts: string[] = [];
  let left = n;
  for (const item of [...RATE_CARD].reverse()) {
    const k = Math.floor(left / item.value);
    if (k > 0) {
      parts.push(`${k} ${k === 1 ? item.label.toLowerCase() : PLURAL[item.key]}`);
      left -= k * item.value;
    }
  }
  return parts.join(" + ");
}
