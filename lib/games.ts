// Catalog of all KissAndQuiz games shown on the home page (the "store").
// To launch a game: build its page under app/games/<slug>/ and set status to "live".
// The first game (How Well Do You Know Me) is the featured one on the home page.

export type GameStatus = "live" | "soon";

export type Game = {
  slug: string;
  title: string;
  tagline: string;
  emoji: string;
  /** 3D emoji codepoint for the card art (file in /public/emoji/3d/). */
  icon: string;
  status: GameStatus;
  /** Category label shown on the card. */
  category: "Quiz" | "Flirty" | "Deep talk" | "Date night" | "Classic" | "Daily";
  /** Short info like "2 min" or "1 min a day". */
  time: string;
  /** Two colours for the card's top gradient. */
  colors: [string, string];
};

export const GAMES: Game[] = [
  {
    slug: "how-well-do-you-know-me",
    title: "How Well Do You Know Me?",
    tagline: "Answer 10 questions about yourself. Your partner guesses. See the score.",
    emoji: "💘",
    icon: "1f498",
    status: "live",
    category: "Quiz",
    time: "2 min",
    colors: ["#ff7aa2", "#e8336f"],
  },
  {
    slug: "would-you-rather",
    title: "Would You Rather for Couples",
    tagline: "Pick your answer, guess your partner's, and see who knows who better.",
    emoji: "🤔",
    icon: "1f914",
    status: "live",
    category: "Classic",
    time: "3 min",
    colors: ["#b9a3ff", "#e8336f"],
  },
  {
    slug: "would-you-still-love-me",
    title: "Would You Still Love Me If…",
    tagline: "Silly what-ifs. Your partner answers and you get a reaction card.",
    emoji: "🐛",
    icon: "1f41b",
    status: "soon",
    category: "Flirty",
    time: "3 min",
    colors: ["#ffb36b", "#ff6b6b"],
  },
  {
    slug: "couple-ludo",
    title: "Couple Ludo with Dares",
    tagline: "Classic Ludo for two, but every capture comes with a dare.",
    emoji: "🎲",
    icon: "1f3b2",
    status: "soon",
    category: "Classic",
    time: "15 min",
    colors: ["#7ad3ff", "#4a6cf7"],
  },
  {
    slug: "truth-or-dare",
    title: "Truth or Dare for Couples",
    tagline: "Pick your heat level, from cute to spicy.",
    emoji: "🔥",
    icon: "1f525",
    status: "soon",
    category: "Flirty",
    time: "10 min",
    colors: ["#ff8a5b", "#d6336c"],
  },
  {
    slug: "deep-questions",
    title: "Deep Questions Deck",
    tagline: "Three levels of questions that go deeper with every card.",
    emoji: "🌙",
    icon: "1f319",
    status: "soon",
    category: "Deep talk",
    time: "20 min",
    colors: ["#a68bff", "#5b3cc4"],
  },
  {
    slug: "date-night-scratch",
    title: "Date Night Scratch-off",
    tagline: "Scratch a card and get a surprise date idea for tonight.",
    emoji: "🎟️",
    icon: "1f39f",
    status: "soon",
    category: "Date night",
    time: "1 min",
    colors: ["#6ee7b7", "#14946b"],
  },
  {
    slug: "daily-question",
    title: "Daily Couple Question",
    tagline: "One question a day for both of you. Keep your streak alive.",
    emoji: "💬",
    icon: "1f4ac",
    status: "soon",
    category: "Daily",
    time: "1 min a day",
    colors: ["#ffd36b", "#f59f00"],
  },
];

/** Slug of the big featured card on the home page. */
export const FEATURED_SLUG = "how-well-do-you-know-me";

export function gameHref(game: Game): string {
  return `/games/${game.slug}/`;
}
