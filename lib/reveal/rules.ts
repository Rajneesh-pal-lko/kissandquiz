// Shared rules for reveal games: validation, scoring, picking questions and names.
// Used by the browser and the API, so the server never trusts what the browser sends.
import type { Answer, RevealConfig, Score } from "./types";

/** Same limit as quiz names (lib/quizRules.ts). Kept separate so this file doesn't pull in the quiz bank. */
export const NAME_MAX = 24;
/** Game IDs: 8 chars of [A-Za-z0-9], like quiz IDs. */
export const GAME_ID_RE = /^[A-Za-z0-9]{8}$/;

export function cleanName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .normalize("NFC");
  const cut = Array.from(name).slice(0, NAME_MAX).join("").trim();
  return cut.length > 0 ? cut : null;
}

/** Loose comparison used to ask "Are you {creator}?" before someone joins. */
export function sameName(a: string, b: string): boolean {
  const norm = (s: string) => s.normalize("NFC").replace(/\s+/g, " ").trim().toLocaleLowerCase();
  return norm(a) !== "" && norm(a) === norm(b);
}

export function isActive(cfg: RevealConfig, i: number): boolean {
  return Number.isInteger(i) && !!cfg.questions[i] && !cfg.questions[i].retired;
}

/** Exactly `rounds` active, different question indexes. */
export function cleanQuestionList(cfg: RevealConfig, raw: unknown): number[] | null {
  if (!Array.isArray(raw) || raw.length !== cfg.rounds) return null;
  const seen = new Set<number>();
  for (const i of raw) {
    if (typeof i !== "number" || !isActive(cfg, i) || seen.has(i)) return null;
    seen.add(i);
  }
  return raw as number[];
}

/** One answer for question `qi`. The guess is required when the game has a prediction step. */
export function cleanAnswer(cfg: RevealConfig, qi: number, raw: unknown): Answer | null {
  if (!raw || typeof raw !== "object") return null;
  const { pick, guess } = raw as { pick?: unknown; guess?: unknown };
  const n = cfg.questions[qi]?.options.length ?? 0;
  const ok = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 0 && v < n;
  if (!ok(pick)) return null;
  if (cfg.prediction) return ok(guess) ? { pick, guess } : null;
  return { pick, guess: null };
}

/** All rounds answered (the creator answers everything before sharing). */
export function cleanAnswers(cfg: RevealConfig, q: number[], raw: unknown): Answer[] | null {
  if (!Array.isArray(raw) || raw.length !== q.length) return null;
  const out: Answer[] = [];
  for (let i = 0; i < q.length; i++) {
    const a = cleanAnswer(cfg, q[i], raw[i]);
    if (!a) return null;
    out.push(a);
  }
  return out;
}

export function countAnswered(answers: (Answer | null)[]): number {
  return answers.filter(Boolean).length;
}

/** First round not answered yet, or -1 when all are done. */
export function nextRound(answers: (Answer | null)[]): number {
  return answers.findIndex((a) => !a);
}

/** Score for two complete answer lists (A = index 0, B = index 1). */
export function scoreOf(cfg: RevealConfig, a: (Answer | null)[], b: (Answer | null)[]): Score {
  let ca = 0;
  let cb = 0;
  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (!x || !y) continue;
    if (cfg.match(x.pick, y.pick)) matches++;
    if (cfg.prediction && x.guess === y.pick) ca++;
    if (cfg.prediction && y.guess === x.pick) cb++;
  }
  return { correct: [ca, cb], matches };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function activeIds(cfg: RevealConfig): number[] {
  return cfg.questions.map((_, i) => i).filter((i) => !cfg.questions[i].retired);
}

/** Random questions for a new game, max `maxPerCategory` from each category. */
export function pickRound(cfg: RevealConfig): number[] {
  const pool = shuffle(activeIds(cfg));
  const picked: number[] = [];
  const perCat: Record<string, number> = {};
  for (const id of pool) {
    if (picked.length >= cfg.rounds) break;
    const cat = cfg.questions[id].category;
    if ((perCat[cat] ?? 0) >= cfg.maxPerCategory) continue;
    perCat[cat] = (perCat[cat] ?? 0) + 1;
    picked.push(id);
  }
  for (const id of pool) {
    if (picked.length >= cfg.rounds) break;
    if (!picked.includes(id)) picked.push(id);
  }
  return picked;
}

/** A different question for slot `index`, keeping the category mix when possible. */
export function pickReplacement(cfg: RevealConfig, current: number[], index: number): number | null {
  const perCat: Record<string, number> = {};
  current.forEach((id, i) => {
    if (i === index) return;
    const c = cfg.questions[id]?.category;
    if (c) perCat[c] = (perCat[c] ?? 0) + 1;
  });
  const free = activeIds(cfg).filter((i) => !current.includes(i));
  if (free.length === 0) return null;
  const keepsMix = free.filter((i) => (perCat[cfg.questions[i].category] ?? 0) < cfg.maxPerCategory);
  const pool = keepsMix.length ? keepsMix : free;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Fill {A}, {B} and {partner} in a label. */
export function fill(text: string, names: { A?: string | null; B?: string | null; partner?: string | null }): string {
  return text
    .split("{A}")
    .join(names.A || "Player 1")
    .split("{B}")
    .join(names.B || "your partner")
    .split("{partner}")
    .join(names.partner || "your partner");
}

/** First letter of a name for avatars (works for Hindi and emoji too). */
export function initial(name: string | null | undefined): string {
  return Array.from(name || "?")[0]?.toLocaleUpperCase() ?? "?";
}

/** "Ghar ka khana forever" → "ghar ka khana forever", for use mid-sentence (keeps "IPL", "I"). */
export function lcFirst(s: string): string {
  const first = s.split(" ")[0];
  if (first === "I" || (first.length > 1 && first === first.toUpperCase())) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}
