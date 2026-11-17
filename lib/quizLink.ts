// Encodes a finished quiz into the URL hash, so no server or database is needed.
// The hash (#...) is never sent to the server, so answers stay out of server logs.
// Note: this is light obfuscation, not security. A curious partner could decode it.

export type QuizData = {
  /** Creator's display name */
  n: string;
  /** Pairs of [questionIndex, answerIndex] */
  a: [number, number][];
};

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(code: string): string {
  const b64 = code.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "===".slice((b64.length + 3) % 4));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeQuiz(data: QuizData): string {
  return toBase64Url(JSON.stringify(data));
}

export const NAME_MAX = 24;
const MAX_QUESTIONS = 30;

/** Decode a link and clean it. Returns null if nothing usable is left. */
export function decodeQuiz(code: string): QuizData | null {
  try {
    const raw = JSON.parse(fromBase64Url(code)) as Partial<QuizData>;
    if (typeof raw.n !== "string" || !Array.isArray(raw.a)) return null;
    const name = raw.n.trim().slice(0, NAME_MAX);
    if (!name) return null;
    const seen = new Set<number>();
    const pairs: [number, number][] = [];
    for (const p of raw.a) {
      if (!Array.isArray(p) || p.length !== 2) continue;
      const [q, opt] = p;
      if (!Number.isInteger(q) || !Number.isInteger(opt) || q < 0 || opt < 0 || seen.has(q)) continue;
      seen.add(q);
      pairs.push([q, opt]);
      if (pairs.length >= MAX_QUESTIONS) break;
    }
    return pairs.length > 0 ? { n: name, a: pairs } : null;
  } catch {
    return null;
  }
}

export function buildPlayUrl(origin: string, data: QuizData): string {
  return `${origin}/play/#${encodeQuiz(data)}`;
}
