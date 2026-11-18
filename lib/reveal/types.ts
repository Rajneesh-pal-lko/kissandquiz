// The "private answer → reveal" engine, shared by two-player games:
// Would You Rather (now), and later Most Likely To, Never Have I Ever and Yes / No / Maybe.
//
// How it works: player A (the creator) answers every round, then shares a link. The first
// person who joins takes slot B and answers round by round. Each player only ever receives
// the other's answer for a round after submitting that round themselves (enforced on the
// server in lib/reveal/view.ts). A game type is just a config (see lib/reveal/configs.ts).

export type GameType = "wyr";

/**
 * "full": after both answered a round, each sees the other's pick and guess.
 * "matches-only": only whether the round matched is revealed; the other's pick never
 * leaves the server (Yes / No / Maybe: a "No" must stay private).
 */
export type RevealPolicy = "full" | "matches-only";

export type RevealQuestion = {
  /** Shown above the options, e.g. "Would you rather…". */
  prompt: string;
  /** Option labels. May contain {A} and {B} (the two players' names), never "me / you". */
  options: string[];
  category: string;
  retired?: boolean;
};

/** One player's answer for one round. `guess` is null when the game has no prediction step. */
export type Answer = { pick: number; guess: number | null };

export type RevealConfig = {
  type: GameType;
  /** Display name, e.g. "Would You Rather". */
  title: string;
  /** Landing page and creator flow. */
  landing: string;
  start: string;
  /** Short link prefix, e.g. "/w/". */
  linkPrefix: string;
  rounds: number;
  /** Max questions per category when picking a game. */
  maxPerCategory: number;
  /** Ask each player to guess the other's pick. */
  prediction: boolean;
  /** Count correct guesses and pick a winner. */
  scoring: boolean;
  reveal: RevealPolicy;
  questions: RevealQuestion[];
  categories: Record<string, { label: string; icon: string }>;
  /** Do two picks count as a match? Default for most games: same option. */
  match: (a: number, b: number) => boolean;
  /** Step labels. {partner} = the other player's name (or "your partner"). */
  text: { pick: string; guess: string };
};

export type Score = {
  /** correct[i] = how many of the other player's picks player i guessed right. */
  correct: [number, number];
  /** Rounds where both picks matched. */
  matches: number;
};

/**
 * Everything the API ever sends about a game. Built only by viewFor() on the server.
 * Strangers (no valid token) get just the creator's name and whether the game is full.
 */
export type GameView = {
  id: string;
  type: GameType;
  /** 0 = creator (A), 1 = partner (B), null = not a player. */
  me: 0 | 1 | null;
  creator: string;
  full: boolean;
  rounds: number;
  /** Kisses the game is played for (Kiss Wallet). */
  stake: number;
  /** The game maker has a Kiss Wallet, so kisses can count (false on older games). */
  kiss: boolean;
  // Players only:
  partner?: string | null;
  q?: number[];
  /** Rounds answered by A and by B. */
  progress?: [number, number];
  mine?: (Answer | null)[];
  /** "full" policy only: the other player's answers for rounds both have submitted. */
  theirs?: (Answer | null)[];
  /** Per round: did the picks match? Null until both submitted that round. */
  matched?: (boolean | null)[];
  done?: boolean;
  /** Only when both finished. */
  score?: Score;
  /** Both players have different Kiss Wallets, so this game's kisses are counted. */
  walletCounted?: boolean;
};
