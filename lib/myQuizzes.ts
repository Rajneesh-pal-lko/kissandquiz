// Quizzes this browser created, with the secret token needed to read results.
// Stored only on the creator's phone (localStorage). Losing it means losing results access,
// so the share screen also offers a private results link.
import { load, save } from "@/lib/storage";

export type MyQuiz = { id: string; token: string; name: string; createdAt: string };

const KEY = "kq.myquizzes.v1";
const MAX = 20;

export function listMyQuizzes(): MyQuiz[] {
  const list = load<MyQuiz[]>(KEY);
  return Array.isArray(list) ? list.filter((q) => q && typeof q.id === "string" && typeof q.token === "string") : [];
}

export function addMyQuiz(q: MyQuiz): void {
  const rest = listMyQuizzes().filter((x) => x.id !== q.id);
  save(KEY, [q, ...rest].slice(0, MAX));
}

/** Private link the creator can open on any device: /results/?id=<id>#<token> (token stays out of server logs). */
export function resultsUrl(origin: string, q: { id: string; token: string }): string {
  return `${origin}/results/?id=${q.id}#${q.token}`;
}
