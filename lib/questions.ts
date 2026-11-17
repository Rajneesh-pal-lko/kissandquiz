// Question bank for the "How Well Do You Know Me?" quiz.
// `ask` is shown to the quiz creator (about themselves).
// `guess` is shown to the partner, with {name} replaced by the creator's name.
// Never reorder or delete existing questions: shared links store question indexes.
// Add new questions at the END of the list only.

export type Question = {
  ask: string;
  guess: string;
  options: string[];
};

export const QUESTIONS: Question[] = [
  {
    ask: "What's my perfect date?",
    guess: "What's {name}'s perfect date?",
    options: ["Fancy dinner", "Movie night at home", "Long drive", "Street food walk"],
  },
  {
    ask: "What do I do first when I'm upset?",
    guess: "What does {name} do first when upset?",
    options: ["Go quiet", "Talk it out", "Eat something", "Sleep it off"],
  },
  {
    ask: "Which is my favourite food?",
    guess: "Which is {name}'s favourite food?",
    options: ["Biryani", "Pizza", "Momos", "Chinese"],
  },
  {
    ask: "How do I like to be loved?",
    guess: "How does {name} like to be loved?",
    options: ["Sweet words", "Quality time", "Gifts", "Hugs & cuddles"],
  },
  {
    ask: "Where would I go on a dream trip?",
    guess: "Where would {name} go on a dream trip?",
    options: ["Mountains", "Beach", "Big foreign city", "Road trip anywhere"],
  },
  {
    ask: "What am I most likely to be late for?",
    guess: "What is {name} most likely to be late for?",
    options: ["Work", "Dates", "Family functions", "Never late!"],
  },
  {
    ask: "Which drink is my weakness?",
    guess: "Which drink is {name}'s weakness?",
    options: ["Chai", "Coffee", "Cold drink", "Juice / shake"],
  },
  {
    ask: "What's my biggest pet peeve?",
    guess: "What's {name}'s biggest pet peeve?",
    options: ["Late replies", "Loud chewing", "Messy room", "Being interrupted"],
  },
  {
    ask: "What would I binge-watch all weekend?",
    guess: "What would {name} binge-watch all weekend?",
    options: ["Rom-coms", "Thrillers", "Reality shows", "Anime / cartoons"],
  },
  {
    ask: "What's my love-language emoji?",
    guess: "What's {name}'s favourite emoji to send you?",
    options: ["❤️", "😘", "🥺", "😂"],
  },
  {
    ask: "When do I feel most romantic?",
    guess: "When does {name} feel most romantic?",
    options: ["Late at night", "Rainy days", "After a good meal", "On trips"],
  },
  {
    ask: "What's my hidden talent?",
    guess: "What's {name}'s hidden talent?",
    options: ["Singing", "Cooking", "Dancing", "Making people laugh"],
  },
  {
    ask: "Morning person or night owl?",
    guess: "Is {name} a morning person or a night owl?",
    options: ["Early bird", "Night owl", "Depends on the day", "Always sleepy"],
  },
  {
    ask: "What would I spend a surprise ₹10,000 on?",
    guess: "What would {name} spend a surprise ₹10,000 on?",
    options: ["Clothes / shoes", "Gadgets", "A trip", "Save it"],
  },
  {
    ask: "Who says sorry first after a fight?",
    guess: "According to {name}, who says sorry first after a fight?",
    options: ["Me", "You", "Whoever is hungry first", "Nobody, we just forget"],
  },
  {
    ask: "What's my comfort activity?",
    guess: "What's {name}'s comfort activity?",
    options: ["Music", "Scrolling reels", "Gaming", "Calling a friend"],
  },
  {
    ask: "What gift would make me happiest?",
    guess: "What gift would make {name} happiest?",
    options: ["Handwritten letter", "Jewellery / watch", "Surprise trip", "Food delivery at midnight"],
  },
  {
    ask: "What scares me the most?",
    guess: "What scares {name} the most?",
    options: ["Insects", "Heights", "Dark", "Being alone"],
  },
  {
    ask: "Which season do I love?",
    guess: "Which season does {name} love?",
    options: ["Summer", "Monsoon", "Winter", "Spring"],
  },
  {
    ask: "How would I spend a lazy Sunday?",
    guess: "How would {name} spend a lazy Sunday?",
    options: ["Sleep till noon", "Go out with you", "Clean & organise", "Netflix all day"],
  },
];

export const QUIZ_LENGTH = 10;

/** Pick `count` random question indexes. */
export function pickQuestions(count = QUIZ_LENGTH): number[] {
  const idx = QUESTIONS.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, count);
}
