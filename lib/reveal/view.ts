// Server-only: the single place that decides what a player may see.
// Every /api/game response is built here, so the privacy rules live in one function:
// - Strangers (no valid token) get the creator's name and whether the game is full. Nothing else.
// - A player gets the other player's answer for a round only after submitting that round
//   themselves, and only if the game's reveal policy is "full".
// - "matches-only" games never send the other player's answers at all, just match / no match.
import "server-only";
import { timingSafeEqual } from "crypto";
import { hashToken, type GameDoc } from "@/lib/store";
import { configFor } from "./configs";
import { countAnswered, scoreOf } from "./rules";
import type { Answer, GameView } from "./types";

function sameHash(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Which player owns this token: 0 (creator), 1 (partner) or null. */
export function playerFor(game: GameDoc, token: string | null | undefined): 0 | 1 | null {
  if (!token || token.length > 200) return null;
  const h = hashToken(token);
  if (game.players[0] && sameHash(game.players[0].tokenHash, h)) return 0;
  if (game.players[1] && sameHash(game.players[1].tokenHash, h)) return 1;
  return null;
}

export function isDone(game: GameDoc): boolean {
  return game.players.length === 2 && game.players.every((p) => countAnswered(p.answers) === game.q.length);
}

export function viewFor(game: GameDoc, me: 0 | 1 | null): GameView {
  const cfg = configFor(game.type);
  const base: GameView = {
    id: game._id,
    type: game.type,
    me,
    creator: game.players[0]?.name ?? "",
    full: game.players.length >= 2,
    rounds: game.q.length,
  };
  if (me === null || !cfg || !game.players[me]) return { ...base, me: null };

  const mine = game.players[me].answers;
  const other = game.players[me === 0 ? 1 : 0];
  const both = (r: number): [Answer, Answer] | null => {
    const x = mine[r];
    const y = other?.answers[r];
    return x && y ? [x, y] : null;
  };
  const done = isDone(game);

  const view: GameView = {
    ...base,
    partner: game.players[1]?.name ?? null,
    q: game.q,
    progress: [countAnswered(game.players[0].answers), game.players[1] ? countAnswered(game.players[1].answers) : 0],
    mine: mine.map((a) => (a ? { pick: a.pick, guess: a.guess } : null)),
    matched: game.q.map((_, r) => {
      const pair = both(r);
      return pair ? cfg.match(pair[0].pick, pair[1].pick) : null;
    }),
    done,
  };

  if (cfg.reveal === "full") {
    view.theirs = game.q.map((_, r) => {
      const pair = both(r);
      return pair ? { pick: pair[1].pick, guess: pair[1].guess } : null;
    });
    if (done && cfg.scoring) view.score = scoreOf(cfg, game.players[0].answers, game.players[1].answers);
  } else if (done) {
    // Matches-only: guesses would reveal the other's answers, so only the match count is shared.
    view.score = { correct: [0, 0], matches: view.matched!.filter(Boolean).length };
  }
  return view;
}
