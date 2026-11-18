// Reveal games this browser plays in, with each player's secret token.
// Stored only on this phone (localStorage). The token is what lets you resume a game or see
// the reveal. The creator also gets a private link (/w/<id>/#<token>) to open it elsewhere.
import { load, remove, save } from "@/lib/storage";
import type { GameType } from "./types";

export type MyGame = {
  id: string;
  type: GameType;
  token: string;
  /** 0 = made the game, 1 = joined it. */
  role: 0 | 1;
  name: string;
  /** The other player's name, once known. */
  partner?: string | null;
  createdAt: string;
};

const KEY = "kq.games.v1";
const MAX = 30;

export function listMyGames(): MyGame[] {
  const list = load<MyGame[]>(KEY);
  return Array.isArray(list)
    ? list.filter((g) => g && typeof g.id === "string" && typeof g.token === "string" && (g.role === 0 || g.role === 1))
    : [];
}

export function getMyGame(id: string): MyGame | null {
  return listMyGames().find((g) => g.id === id) ?? null;
}

export function saveMyGame(g: MyGame): void {
  const rest = listMyGames().filter((x) => x.id !== g.id);
  save(KEY, [g, ...rest].slice(0, MAX));
}

export function updateMyGame(id: string, patch: Partial<MyGame>): void {
  const g = getMyGame(id);
  if (g) saveMyGame({ ...g, ...patch });
}

export function forgetMyGame(id: string): void {
  const rest = listMyGames().filter((x) => x.id !== id);
  if (rest.length) save(KEY, rest);
  else remove(KEY);
}

/** Private creator link: opens the game as its creator on any device (token stays in the #hash). */
export function privateGameUrl(origin: string, prefix: string, g: { id: string; token: string }): string {
  return `${origin}${prefix}${g.id}/#${g.token}`;
}

/** Handed from a finished game's "Play again" to the creator flow (names only). */
export const REMATCH_KEY = "kq.reveal.rematch.v1";
export type Rematch = { type: GameType; name: string; partner: string };
