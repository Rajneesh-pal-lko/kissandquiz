// Small UI helpers shared by pages: category labels/icons and score moods.
import type { AnimName } from "@/components/Emoji";
import type { Category } from "@/lib/questions";

export const CATEGORY_UI: Record<Category, { label: string; icon: string }> = {
  favourites: { label: "Favourites", icon: "2b50" },
  habits: { label: "Habits", icon: "2615" },
  personality: { label: "Personality", icon: "1f9e0" },
  love: { label: "Love", icon: "1f495" },
  past: { label: "Memories", icon: "1f4f8" },
  future: { label: "Future", icon: "1f52e" },
  funny: { label: "Just for fun", icon: "1f92a" },
};

/** Letter shown on each answer option (A, B, C…). */
export const LETTERS = "ABCDEFGH";

export type Mood = { anim: AnimName; code: string; verdict: string };

/** Reaction shown on the score screen, by percentage. */
export function scoreMood(pct: number): Mood {
  if (pct === 100) return { anim: "partying_face", code: "1f973", verdict: "Soulmates. Nobody knows them better!" };
  if (pct >= 80) return { anim: "smiling_face_with_hearts", code: "1f970", verdict: "You really pay attention. Cute!" };
  if (pct >= 50) return { anim: "face_blowing_a_kiss", code: "1f618", verdict: "Not bad, but there's more to learn" };
  if (pct >= 20) return { anim: "grimacing_face", code: "1f62c", verdict: "Hmm… time for a long date night" };
  return { anim: "loudly_crying_face", code: "1f62d", verdict: "Do you even know them?!" };
}
