// Game configs for the reveal engine. To add a game: add its type to GameType, write its
// question bank (append-only, stable indexes) and add a config here.
import { WYR_CATEGORY_UI, WYR_QUESTIONS } from "@/lib/wyrQuestions";
import type { GameType, RevealConfig } from "./types";

export const WYR: RevealConfig = {
  type: "wyr",
  title: "Would You Rather",
  landing: "/games/would-you-rather/",
  start: "/games/would-you-rather/start/",
  linkPrefix: "/w/",
  rounds: 10,
  maxPerCategory: 2,
  prediction: true,
  scoring: true,
  reveal: "full",
  questions: WYR_QUESTIONS.map((q) => ({
    prompt: "Would you rather…",
    options: [q.a, q.b],
    category: q.category,
    retired: q.retired,
  })),
  categories: WYR_CATEGORY_UI,
  match: (a, b) => a === b,
  text: { pick: "What would you pick?", guess: "What will {partner} pick?" },
};

const CONFIGS: Record<GameType, RevealConfig> = { wyr: WYR };

export function configFor(type: unknown): RevealConfig | null {
  return typeof type === "string" && Object.prototype.hasOwnProperty.call(CONFIGS, type)
    ? CONFIGS[type as GameType]
    : null;
}
