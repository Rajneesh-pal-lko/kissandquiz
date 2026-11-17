// Question bank for the "How Well Do You Know Me?" quiz.
//
// RULES (shared links store question indexes and option indexes):
// - Never reorder or delete questions. Add new ones at the END only.
// - Never reorder or delete options inside a question. Fix typos only.
// - To stop using a question, set `retired: true`. Old links still decode it,
//   but new quizzes will not pick it.
// - Every question must be about the creator only, so the same options work for
//   both the creator ("ask") and the partner ("guess"). Avoid "me/you" options.
//
// `ask`   is shown to the quiz creator (about themselves).
// `guess` is shown to the partner; {name} is replaced by the creator's name.
//
// Kept static for now. Later this can move to a database; the index is the stable ID.

export type Category =
  | "favourites"
  | "habits"
  | "personality"
  | "love"
  | "past"
  | "future"
  | "funny";

export type Question = {
  ask: string;
  guess: string;
  options: string[];
  category: Category;
  /** Kept only so old links still work. Not picked for new quizzes. */
  retired?: boolean;
};

function q(
  category: Category,
  ask: string,
  guess: string,
  options: string[],
  retired = false,
): Question {
  return retired ? { category, ask, guess, options, retired } : { category, ask, guess, options };
}

export const QUESTIONS: Question[] = [
  // ---- v1 bank (indexes 0–19). Text must stay as is. ----
  /* 0 */ q("love", "What's my perfect date?", "What's {name}'s perfect date?", ["Fancy dinner", "Movie night at home", "Long drive", "Street food walk"]),
  /* 1 */ q("personality", "What do I do first when I'm upset?", "What does {name} do first when upset?", ["Go quiet", "Talk it out", "Eat something", "Sleep it off"]),
  /* 2 */ q("favourites", "Which is my favourite food?", "Which is {name}'s favourite food?", ["Biryani", "Pizza", "Momos", "Chinese"], true), // retired: too few options, replaced by #20 and #29
  /* 3 */ q("love", "How do I like to be loved?", "How does {name} like to be loved?", ["Sweet words", "Quality time", "Gifts", "Hugs & cuddles"]),
  /* 4 */ q("future", "Where would I go on a dream trip?", "Where would {name} go on a dream trip?", ["Mountains", "Beach", "Big foreign city", "Road trip anywhere"]),
  /* 5 */ q("habits", "What am I most likely to be late for?", "What is {name} most likely to be late for?", ["Work", "Dates", "Family functions", "Never late!"]),
  /* 6 */ q("favourites", "Which drink is my weakness?", "Which drink is {name}'s weakness?", ["Chai", "Coffee", "Cold drink", "Juice / shake"]),
  /* 7 */ q("personality", "What's my biggest pet peeve?", "What's {name}'s biggest pet peeve?", ["Late replies", "Loud chewing", "Messy room", "Being interrupted"]),
  /* 8 */ q("favourites", "What would I binge-watch all weekend?", "What would {name} binge-watch all weekend?", ["Rom-coms", "Thrillers", "Reality shows", "Anime / cartoons"]),
  /* 9 */ q("funny", "What's my love-language emoji?", "What's {name}'s favourite emoji to send you?", ["❤️", "😘", "🥺", "😂"], true), // retired: ask and guess asked different things; replaced by #39
  /* 10 */ q("love", "When do I feel most romantic?", "When does {name} feel most romantic?", ["Late at night", "Rainy days", "After a good meal", "On trips"]),
  /* 11 */ q("personality", "What's my hidden talent?", "What's {name}'s hidden talent?", ["Singing", "Cooking", "Dancing", "Making people laugh"]),
  /* 12 */ q("habits", "Morning person or night owl?", "Is {name} a morning person or a night owl?", ["Early bird", "Night owl", "Depends on the day", "Always sleepy"]),
  /* 13 */ q("funny", "What would I spend a surprise ₹10,000 on?", "What would {name} spend a surprise ₹10,000 on?", ["Clothes / shoes", "Gadgets", "A trip", "Save it"]),
  /* 14 */ q("love", "Who says sorry first after a fight?", "According to {name}, who says sorry first after a fight?", ["Me", "You", "Whoever is hungry first", "Nobody, we just forget"], true), // retired: "Me/You" flips meaning for the partner
  /* 15 */ q("habits", "What's my comfort activity?", "What's {name}'s comfort activity?", ["Music", "Scrolling reels", "Gaming", "Calling a friend"]),
  /* 16 */ q("love", "What gift would make me happiest?", "What gift would make {name} happiest?", ["Handwritten letter", "Jewellery / watch", "Surprise trip", "Food delivery at midnight"]),
  /* 17 */ q("personality", "What scares me the most?", "What scares {name} the most?", ["Insects", "Heights", "Dark", "Being alone"]),
  /* 18 */ q("favourites", "Which season do I love?", "Which season does {name} love?", ["Summer", "Monsoon", "Winter", "Spring"]),
  /* 19 */ q("habits", "How would I spend a lazy Sunday?", "How would {name} spend a lazy Sunday?", ["Sleep till noon", "Go out with you", "Clean & organise", "Netflix all day"]),

  // ---- v2 bank (added 2026-11-17, indexes 20+) ----
  // Favourites
  /* 20 */ q("favourites", "Which cuisine could I eat every day?", "Which cuisine could {name} eat every day?", ["North Indian", "South Indian", "Chinese / Indo-Chinese", "Italian", "Something else"]),
  /* 21 */ q("favourites", "What's my favourite colour?", "What's {name}'s favourite colour?", ["Black", "White", "Pink / Red", "Blue", "Green", "Something else"]),
  /* 22 */ q("favourites", "What music do I play when I'm alone?", "What music does {name} play when alone?", ["Romantic Bollywood", "Punjabi / party songs", "English pop / rap", "Old classics", "Lo-fi / indie"]),
  /* 23 */ q("favourites", "Which movie genre do I pick first?", "Which movie genre does {name} pick first?", ["Romance", "Comedy", "Horror", "Action", "Thriller / mystery"]),
  /* 24 */ q("favourites", "What's my go-to midnight snack?", "What's {name}'s go-to midnight snack?", ["Maggi", "Chips / namkeen", "Ice cream", "Chocolate", "Leftovers from the fridge"]),
  /* 25 */ q("favourites", "Which dessert can I never say no to?", "Which dessert can {name} never say no to?", ["Gulab jamun", "Rasmalai", "Ice cream", "Chocolate cake", "Jalebi"]),
  /* 26 */ q("favourites", "Which festival do I love the most?", "Which festival does {name} love the most?", ["Diwali", "Holi", "Eid", "Christmas", "New Year's Eve"]),
  /* 27 */ q("favourites", "Which app do I open the most?", "Which app does {name} open the most?", ["Instagram", "WhatsApp", "YouTube", "A game", "Netflix / OTT"]),
  /* 28 */ q("favourites", "Which street food could I eat daily?", "Which street food could {name} eat daily?", ["Pani puri", "Momos", "Chaat", "Vada pav", "Rolls / kathi rolls"]),
  /* 29 */ q("favourites", "What's my favourite comfort meal?", "What's {name}'s favourite comfort meal?", ["Biryani", "Rajma / chole chawal", "Dal chawal", "Pizza / burger", "Maggi"]),

  // Habits
  /* 30 */ q("habits", "How long do I take to get ready?", "How long does {name} take to get ready?", ["Under 10 minutes", "15–30 minutes", "About an hour", "Depends where we're going"]),
  /* 31 */ q("habits", "How fast do I reply to messages?", "How fast does {name} reply to messages?", ["Instantly", "Within an hour", "Hours later", "Reads it and forgets"]),
  /* 32 */ q("habits", "What's the first thing I do after waking up?", "What's the first thing {name} does after waking up?", ["Check my phone", "Chai / coffee", "Snooze the alarm again", "Workout / walk", "Lie in bed thinking"]),
  /* 33 */ q("habits", "How do I sleep?", "How does {name} sleep?", ["Hugging a pillow", "Like a starfish", "Curled up small", "Wrapped like a blanket burrito"]),
  /* 34 */ q("habits", "What am I like with money?", "What is {name} like with money?", ["Big saver", "Spend it on others", "Spend it on myself", "Budget? What budget?"]),
  /* 35 */ q("habits", "How tidy is my room right now?", "How tidy is {name}'s room right now?", ["Spotless", "Mostly neat", "Organised mess", "Don't ask"]),
  /* 36 */ q("habits", "What am I on a road trip?", "What is {name} on a road trip?", ["The driver", "The DJ", "Asleep the whole way", "The snack manager", "The navigator"]),
  /* 37 */ q("habits", "How good am I at cooking?", "How good is {name} at cooking?", ["Chef level", "Can make a few dishes", "Maggi expert", "Only chai", "Kitchen? Never heard of it"]),
  /* 38 */ q("habits", "What's my phone battery usually at?", "What's {name}'s phone battery usually at?", ["Always above 80%", "Around 50%", "Living on 5%", "Always on the charger"]),
  /* 39 */ q("habits", "Which emoji do I send the most?", "Which emoji does {name} send the most?", ["😂", "❤️", "😭", "🙄", "🥺"]),
  /* 40 */ q("habits", "How do I text?", "How does {name} text?", ["Long paragraphs", "One-word replies", "Voice notes", "Memes and reels"]),

  // Personality
  /* 41 */ q("personality", "Am I an introvert or an extrovert?", "Is {name} an introvert or an extrovert?", ["Introvert", "Extrovert", "Ambivert", "Depends on the people"]),
  /* 42 */ q("personality", "What helps me relax after a bad day?", "What helps {name} relax after a bad day?", ["Music", "A long nap", "Talking it out", "Good food", "Scrolling reels"]),
  /* 43 */ q("personality", "How do I make big decisions?", "How does {name} make big decisions?", ["Follow my heart", "Think it through logically", "Ask everyone first", "Overthink for days"]),
  /* 44 */ q("personality", "What do people praise me for most?", "What do people praise {name} for most?", ["Being kind", "Being funny", "Working hard", "Being loyal", "Being smart"]),
  /* 45 */ q("personality", "What's my worst habit?", "What's {name}'s worst habit?", ["Overthinking", "Procrastinating", "Too much phone", "Being late", "Being stubborn"]),
  /* 46 */ q("personality", "What makes me cry most easily?", "What makes {name} cry most easily?", ["Sad movies", "Emotional reels", "Fights with loved ones", "Almost nothing"]),
  /* 47 */ q("personality", "What am I like when I'm angry?", "What is {name} like when angry?", ["Rarely get angry", "Quick to anger, quick to cool", "Silent treatment", "Loud, then sorry"]),
  /* 48 */ q("personality", "What am I like in an argument?", "What is {name} like in an argument?", ["Must win it", "Goes silent", "Says sorry quickly", "Brings up old stuff"]),
  /* 49 */ q("personality", "Which animal am I most like?", "Which animal is {name} most like?", ["Cat", "Dog", "Panda", "Lion", "Sloth"]),
  /* 50 */ q("personality", "What role do I play in my friend group?", "What role does {name} play in their friend group?", ["The talker", "The listener", "The joker", "The planner", "The one who's always late"]),

  // Love
  /* 51 */ q("love", "What did I notice first about my partner?", "What did {name} notice first about you?", ["Smile", "Eyes", "Voice", "Sense of humour", "Style"]),
  /* 52 */ q("love", "What's my favourite way to spend time together?", "What's {name}'s favourite way to spend time together?", ["Long talks", "Food dates", "Movies", "Travelling", "Doing nothing together"]),
  /* 53 */ q("love", "What do I love being called?", "What does {name} love being called?", ["Baby / babu", "Jaan", "My real name", "A silly nickname", "Anything but babu"]),
  /* 54 */ q("love", "Which surprise would melt my heart?", "Which surprise would melt {name}'s heart?", ["A surprise visit", "Flowers", "A handwritten note", "A planned trip", "My favourite food"]),
  /* 55 */ q("love", "How would I want to spend our anniversary?", "How would {name} want to spend your anniversary?", ["Candlelight dinner", "A short trip", "Quiet day at home", "Party with friends"]),
  /* 56 */ q("love", "How do I feel about PDA?", "How does {name} feel about PDA?", ["Love it", "Holding hands is enough", "Only in private", "Depends on the place"]),
  /* 57 */ q("love", "How do I like to stay in touch during the day?", "How does {name} like to stay in touch during the day?", ["Texting all day", "One long call at night", "A few check-ins", "Meeting beats calling"]),
  /* 58 */ q("love", "How jealous do I get?", "How jealous does {name} get?", ["Never", "A little, the cute kind", "Quite possessive", "Hides it well"]),
  /* 59 */ q("love", "What makes me feel most loved?", "What makes {name} feel most loved?", ["Being listened to", "Small things remembered", "Surprises", "Hugs and cuddles", "Time made just for me"]),

  // Past
  /* 60 */ q("past", "What did I want to be as a kid?", "What did {name} want to be as a kid?", ["Doctor", "Engineer / scientist", "Actor / singer", "Cricketer / athlete", "Teacher", "Pilot"]),
  /* 61 */ q("past", "What was my favourite subject in school?", "What was {name}'s favourite subject in school?", ["Maths", "Science", "Languages", "History / Geography", "Art", "Games period!"]),
  /* 62 */ q("past", "What was I like in school?", "What was {name} like in school?", ["Topper", "Backbencher", "Class clown", "Sports kid", "The quiet one"]),
  /* 63 */ q("past", "Which cartoon did I love as a kid?", "Which cartoon did {name} love as a kid?", ["Doraemon", "Shin-chan", "Tom & Jerry", "Pokémon", "Chhota Bheem", "Something else"]),
  /* 64 */ q("past", "What got me in trouble most as a kid?", "What got {name} in trouble most as a kid?", ["Talking too much", "Fighting with siblings", "Bad marks", "Playing outside too long", "Never got in trouble"]),

  // Future
  /* 65 */ q("future", "Where's my dream home?", "Where's {name}'s dream home?", ["Flat in a big city", "Cottage in the hills", "House by the beach", "Big family house", "A farmhouse"]),
  /* 66 */ q("future", "If money didn't matter, what would I do?", "If money didn't matter, what would {name} do?", ["Travel the world", "Open a café", "Make art / content", "Start a business", "Do absolutely nothing"]),
  /* 67 */ q("future", "Which pet would I want?", "Which pet would {name} want?", ["Dog", "Cat", "Both!", "Fish / birds", "No pets, please"]),
  /* 68 */ q("future", "Where do I see myself in 10 years?", "Where does {name} see themselves in 10 years?", ["Same city", "Abroad", "Back in my hometown", "In the hills", "Wherever life takes me"]),
  /* 69 */ q("future", "Which dream trip abroad would I pick?", "Which dream trip abroad would {name} pick?", ["Maldives", "Paris", "Switzerland", "Bali", "Japan", "Dubai"]),
  /* 70 */ q("future", "What would I do after retiring?", "What would {name} do after retiring?", ["Travel everywhere", "Live on a farm", "Spoil the grandkids", "Never retire", "Sleep. Finally."]),

  // Funny
  /* 71 */ q("funny", "Which superpower would I choose?", "Which superpower would {name} choose?", ["Invisibility", "Flying", "Reading minds", "Teleporting", "Time travel"]),
  /* 72 */ q("funny", "What would I be in a zombie apocalypse?", "What would {name} be in a zombie apocalypse?", ["First to go", "The leader", "Hiding till it's over", "The cook", "Secretly the zombie"]),
  /* 73 */ q("funny", "What would I do first if I won ₹1 crore?", "What would {name} do first if they won ₹1 crore?", ["Buy a house", "Travel the world", "Invest it", "Treat the family", "Quit my job"]),
  /* 74 */ q("funny", "What's my guilty pleasure?", "What's {name}'s guilty pleasure?", ["Reality shows", "Junk food", "Online shopping", "Sleeping in", "Cringe reels"]),
  /* 75 */ q("funny", "If I were a food, what would I be?", "If {name} were a food, what would they be?", ["Pani puri: spicy", "Gulab jamun: sweet", "Maggi: quick and easy", "Biryani: royal", "Karela: an acquired taste"]),
  /* 76 */ q("funny", "What can I never live without?", "What can {name} never live without?", ["My phone", "Chai / coffee", "Music", "Sleep", "Family"]),
  /* 77 */ q("funny", "What's my perfect rainy day?", "What's {name}'s perfect rainy day?", ["Pakode and chai", "Dancing in the rain", "Sleeping all day", "Movie under a blanket"]),
  /* 78 */ q("funny", "Which food do I hate the most?", "Which food does {name} hate the most?", ["Karela", "Baingan", "Lauki", "Mushroom", "I eat everything"]),
  /* 79 */ q("funny", "What would I never share?", "What would {name} never share?", ["My food", "My phone", "My blanket", "My charger", "I share everything"]),
  /* 80 */ q("funny", "What would I take to a desert island?", "What would {name} take to a desert island?", ["My phone", "Snacks", "Music", "My partner", "A good book"]),
];

export const QUIZ_LENGTH = 10;
/** At most this many questions from one category in a quiz, so quizzes feel varied. */
const MAX_PER_CATEGORY = 2;

/** Indexes of questions that can be used in new quizzes. */
export function activeQuestionIds(): number[] {
  return QUESTIONS.map((_, i) => i).filter((i) => !QUESTIONS[i].retired);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pick `count` random, varied question indexes. */
export function pickQuestions(count = QUIZ_LENGTH): number[] {
  const pool = shuffle(activeQuestionIds());
  const picked: number[] = [];
  const perCat: Record<string, number> = {};
  for (const id of pool) {
    if (picked.length >= count) break;
    const cat = QUESTIONS[id].category;
    if ((perCat[cat] ?? 0) >= MAX_PER_CATEGORY) continue;
    perCat[cat] = (perCat[cat] ?? 0) + 1;
    picked.push(id);
  }
  // Fill up if the category cap left us short.
  for (const id of pool) {
    if (picked.length >= count) break;
    if (!picked.includes(id)) picked.push(id);
  }
  return picked;
}

/** A random active question not in `exclude`, or null if none are left. */
export function pickReplacement(exclude: number[]): number | null {
  const options = activeQuestionIds().filter((i) => !exclude.includes(i));
  if (options.length === 0) return null;
  return options[Math.floor(Math.random() * options.length)];
}

/** Fill in the creator's name in a partner-facing question. */
export function guessText(question: Question, name: string): string {
  return question.guess.split("{name}").join(name);
}
