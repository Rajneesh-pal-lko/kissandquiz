// Shared validation for quiz data, used by both the browser and the API.
import { QUESTIONS } from "@/lib/questions";

export const NAME_MAX = 24;
export const MAX_QUESTIONS = 30;
/** Short quiz IDs: 8 chars of [A-Za-z0-9]. */
export const QUIZ_ID_RE = /^[A-Za-z0-9]{8}$/;

export type Pair = [number, number];

export function cleanName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.replace(/\s+/g, " ").trim().slice(0, NAME_MAX);
  return name.length > 0 ? name : null;
}

/** Keep only [question, option] pairs that point at a real question/option, no duplicates. */
export function cleanPairs(raw: unknown): Pair[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<number>();
  const out: Pair[] = [];
  for (const p of raw) {
    if (!Array.isArray(p) || p.length !== 2) continue;
    const [q, opt] = p;
    if (!Number.isInteger(q) || !Number.isInteger(opt) || seen.has(q)) continue;
    if (!QUESTIONS[q] || QUESTIONS[q].options[opt] === undefined) continue;
    seen.add(q);
    out.push([q, opt]);
    if (out.length >= MAX_QUESTIONS) break;
  }
  return out;
}

/** Guesses must be one entry per question: an option index, or null if skipped. */
export function cleanGuesses(raw: unknown, pairs: Pair[]): (number | null)[] | null {
  if (!Array.isArray(raw) || raw.length !== pairs.length) return null;
  const out: (number | null)[] = [];
  for (let i = 0; i < pairs.length; i++) {
    const g = raw[i];
    if (g === null) out.push(null);
    else if (Number.isInteger(g) && QUESTIONS[pairs[i][0]].options[g] !== undefined) out.push(g);
    else return null;
  }
  return out;
}

export function scoreOf(pairs: Pair[], guesses: (number | null)[]): number {
  return pairs.reduce((s, [, right], i) => (guesses[i] === right ? s + 1 : s), 0);
}
