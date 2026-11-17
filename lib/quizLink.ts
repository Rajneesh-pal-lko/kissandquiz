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

export function decodeQuiz(code: string): QuizData | null {
  try {
    const data = JSON.parse(fromBase64Url(code)) as QuizData;
    if (typeof data.n !== "string" || !Array.isArray(data.a) || data.a.length === 0) return null;
    return data;
  } catch {
    return null;
  }
}

export function buildPlayUrl(origin: string, data: QuizData): string {
  return `${origin}/play/#${encodeQuiz(data)}`;
}
