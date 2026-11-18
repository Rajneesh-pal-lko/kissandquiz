// Question bank for "Would You Rather for Couples".
//
// RULES (game links store question indexes, and saved answers store option indexes 0/1):
// - Never reorder or delete questions. Add new ones at the END only.
// - Never swap `a` and `b` inside a question. Fix typos only.
// - To stop using a question, set `retired: true`. Old games still show it,
//   but new games will not pick it.
// - Both partners answer for themselves and guess the other, so options must read the
//   same for both. No "me / you / my partner" labels; "our", "together" and
//   "each other" are fine because they mean the couple either way.
// - No sexual content here. Spicy questions belong to the 18+ zone later.
//
// The index is the stable ID.

export type WyrCategory = "funny" | "romantic" | "foodtravel" | "desi" | "future" | "deep";

export type WyrQuestion = {
  a: string;
  b: string;
  category: WyrCategory;
  /** Kept only so old games still show it. Not picked for new games. */
  retired?: boolean;
};

function w(category: WyrCategory, a: string, b: string, retired = false): WyrQuestion {
  return retired ? { a, b, category, retired } : { a, b, category };
}

export const WYR_CATEGORY_UI: Record<WyrCategory, { label: string; icon: string }> = {
  funny: { label: "Funny", icon: "1f92a" },
  romantic: { label: "Romantic", icon: "1f339" },
  foodtravel: { label: "Food & Travel", icon: "2708" },
  desi: { label: "Desi / Bollywood", icon: "1fa94" },
  future: { label: "Future & Life", icon: "1f52e" },
  deep: { label: "Deep", icon: "1f319" },
};

export const WYR_QUESTIONS: WyrQuestion[] = [
  // ---- Funny (0–19) ----
  /* 0 */ w("funny", "Share one phone for a week", "Share one toothbrush for a week"),
  /* 1 */ w("funny", "Get matching tattoos of each other's names", "Wear matching outfits every day for a month"),
  /* 2 */ w("funny", "Have every argument commentated like a cricket match", "Have every date narrated like a wildlife documentary"),
  /* 3 */ w("funny", "Only talk in rhymes on every date", "Only talk in whispers on every date"),
  /* 4 */ w("funny", "Hear a laugh track after every joke at home", "Hear dramatic music during every argument"),
  /* 5 */ w("funny", "Go viral for an embarrassing couple video", "Never go viral, ever"),
  /* 6 */ w("funny", "Live with a parrot that repeats everything said at home", "Live with a cat that silently judges every decision"),
  /* 7 */ w("funny", "Always have spinach stuck in the teeth on dates", "Always wear one squeaky shoe on dates"),
  /* 8 */ w("funny", "Post a cheesy couple reel every week", "Post a cheesy couple selfie every single day"),
  /* 9 */ w("funny", "Get stuck in a lift together for 3 hours", "Get stuck in traffic together for 6 hours"),
  /* 10 */ w("funny", "Laugh uncontrollably in every serious talk", "Cry at every single ad on TV"),
  /* 11 */ w("funny", "Settle every argument with a coin toss", "Settle every argument with a dance-off"),
  /* 12 */ w("funny", "Text only in voice notes forever", "Text only in GIFs forever"),
  /* 13 */ w("funny", "Let each other pick every phone wallpaper", "Let each other pick every ringtone"),
  /* 14 */ w("funny", "Accidentally send a love message to the family group", "Accidentally like a 5-year-old photo while scrolling"),
  /* 15 */ w("funny", "Have a pet goat that follows the two of us everywhere", "Have a pet duck that quacks at every kiss"),
  /* 16 */ w("funny", "Swap phones for a whole day", "Swap wardrobes for a whole day"),
  /* 17 */ w("funny", "Hiccup every time someone says \"I love you\"", "Sneeze every time someone says \"sorry\""),
  /* 18 */ w("funny", "Lose the TV remote forever", "Lose the phone charger every single week"),
  /* 19 */ w("funny", "Wake up to a rooster every morning", "Wake up to the neighbour's pressure cooker every morning"),

  // ---- Romantic (20–39) ----
  /* 20 */ w("romantic", "Slow dance in the kitchen at midnight", "Watch the sunrise together from a rooftop"),
  /* 21 */ w("romantic", "Get a handwritten love letter", "Get a playlist made with love"),
  /* 22 */ w("romantic", "Relive our first date", "Skip ahead to see our 50th anniversary"),
  /* 23 */ w("romantic", "A candle-light dinner at home", "A fancy dinner at a rooftop restaurant"),
  /* 24 */ w("romantic", "Get flowers every week", "Get one big surprise every year"),
  /* 25 */ w("romantic", "Hold hands everywhere we go", "Cuddle every night, no matter what"),
  /* 26 */ w("romantic", "Hear \"I love you\" every morning", "Get a long hug every evening"),
  /* 27 */ w("romantic", "A long drive with old love songs", "Stargazing on a quiet beach"),
  /* 28 */ w("romantic", "Have a song written about our love story", "Have a poem written about our love story"),
  /* 29 */ w("romantic", "Plan every surprise", "Be surprised every time"),
  /* 30 */ w("romantic", "A rainy day with chai and pakode together", "A winter night with a blanket and a movie together"),
  /* 31 */ w("romantic", "Wear matching rings", "Have a secret handshake only the two of us know"),
  /* 32 */ w("romantic", "Find little love notes hidden in pockets", "Get a good-morning voice note every day"),
  /* 33 */ w("romantic", "A big party on every anniversary", "A quiet trip for two on every anniversary"),
  /* 34 */ w("romantic", "Be the big spoon forever", "Be the little spoon forever"),
  /* 35 */ w("romantic", "Spend a whole day with no phones, just the two of us", "Spend a whole day doing only what the other one wants"),
  /* 36 */ w("romantic", "Write our love story as a book", "Turn our love story into a short film"),
  /* 37 */ w("romantic", "Dance together in front of everyone at a sangeet", "Sing a duet together at a karaoke night"),
  /* 38 */ w("romantic", "Recreate our first meeting every year", "Visit a brand-new place every anniversary"),
  /* 39 */ w("romantic", "A cake at midnight on every birthday", "A surprise party with all our friends on every birthday"),

  // ---- Food & Travel (40–59) ----
  /* 40 */ w("foodtravel", "Ghar ka khana forever", "Restaurant food every night"),
  /* 41 */ w("foodtravel", "A beach holiday in Goa", "A snow holiday in Manali"),
  /* 42 */ w("foodtravel", "A street food tour in Delhi", "Fine dining in Paris"),
  /* 43 */ w("foodtravel", "A road trip with no plan at all", "A trip with every hotel booked in advance"),
  /* 44 */ w("foodtravel", "Never eat Maggi again", "Never eat pizza again"),
  /* 45 */ w("foodtravel", "Travel the world on a tight budget", "Take one super-luxury trip in India"),
  /* 46 */ w("foodtravel", "Cook dinner together every night", "Order in every night"),
  /* 47 */ w("foodtravel", "Fly business class, sitting apart", "Fly economy, sitting side by side"),
  /* 48 */ w("foodtravel", "Live in the mountains", "Live by the sea"),
  /* 49 */ w("foodtravel", "Chai for the rest of our lives", "Coffee for the rest of our lives"),
  /* 50 */ w("foodtravel", "Eat only sweet food for a month", "Eat only spicy food for a month"),
  /* 51 */ w("foodtravel", "A 10-day train journey across India", "A 10-day cruise at sea"),
  /* 52 */ w("foodtravel", "Share every dessert", "A full dessert each, no sharing ever"),
  /* 53 */ w("foodtravel", "Wake up early for every sunrise on holiday", "Sleep in on every holiday"),
  /* 54 */ w("foodtravel", "Backpack across Europe", "Explore every state of India"),
  /* 55 */ w("foodtravel", "Get lost in a new city without maps", "Follow a strict plan with a tour guide"),
  /* 56 */ w("foodtravel", "A golgappa challenge on every date", "Ice cream on every date"),
  /* 57 */ w("foodtravel", "Camp in a tent under the stars", "Stay in a five-star hotel with room service"),
  /* 58 */ w("foodtravel", "A short getaway every month", "One long vacation every year"),
  /* 59 */ w("foodtravel", "Breakfast in bed every Sunday", "Dinner on the terrace every Saturday"),

  // ---- Desi / Bollywood (60–79) ----
  /* 60 */ w("desi", "A love story like a 90s Bollywood film", "A love story like a modern rom-com"),
  /* 61 */ w("desi", "A 5-day big fat Indian wedding", "A small court marriage and a world trip"),
  /* 62 */ w("desi", "Sing antakshari at every family dinner", "Dance at every family function"),
  /* 63 */ w("desi", "Live in a joint family", "Live on our own, far from family"),
  /* 64 */ w("desi", "Let both mummies plan every date", "Let both papas plan every holiday"),
  /* 65 */ w("desi", "Celebrate Diwali at home with family", "Celebrate Diwali on a trip for two"),
  /* 66 */ w("desi", "A filmy proposal in the rain", "A simple proposal at home over chai"),
  /* 67 */ w("desi", "Watch a 3-hour Bollywood movie every weekend", "Watch a full IPL match together every weekend"),
  /* 68 */ w("desi", "Play Holi with the whole mohalla", "Play Holi with just the two of us"),
  /* 69 */ w("desi", "A romantic scooty ride through the city", "A romantic shikara ride in Kashmir"),
  /* 70 */ w("desi", "Let every rishta aunty know our love story", "Keep our love story secret from all relatives"),
  /* 71 */ w("desi", "Dance in a Swiss field like an old Bollywood song", "Sing in the rain like a 90s movie"),
  /* 72 */ w("desi", "Have our first date at a cricket match", "Have our first date at a family wedding"),
  /* 73 */ w("desi", "Win ₹1 crore on a quiz show together", "Win a dance reality show together"),
  /* 74 */ w("desi", "Celebrate every single festival", "Celebrate only birthdays and anniversaries"),
  /* 75 */ w("desi", "Live in Mumbai: sea views and traffic", "Live in Bengaluru: great weather and traffic"),
  /* 76 */ w("desi", "Antakshari on every road trip", "Old 90s songs on every road trip"),
  /* 77 */ w("desi", "Get blessings from every relative at a shaadi", "Get the best food at every shaadi"),
  /* 78 */ w("desi", "Matching outfits at every family function", "A surprise dance at every family function"),
  /* 79 */ w("desi", "Shopping at Sarojini Nagar together", "Shopping at a fancy mall, separately"),

  // ---- Future & Life (80–99) ----
  /* 80 */ w("future", "Live in a big city", "Live in a small, peaceful town"),
  /* 81 */ w("future", "Work from home together", "Work in the same office"),
  /* 82 */ w("future", "Retire at 45 with less money", "Work till 60 and retire rich"),
  /* 83 */ w("future", "Have a dog", "Have a cat"),
  /* 84 */ w("future", "Build our own house from scratch", "Buy a ready flat in a big society"),
  /* 85 */ w("future", "A house full of kids", "A house full of pets"),
  /* 86 */ w("future", "Move abroad", "Stay close to family in India"),
  /* 87 */ w("future", "Start a business together", "Have stable jobs with fixed salaries"),
  /* 88 */ w("future", "Save a lot and live simply", "Spend on experiences and save less"),
  /* 89 */ w("future", "Know where we'll be in 10 years", "Be surprised by life"),
  /* 90 */ w("future", "A big house far from the city", "A small flat in the heart of the city"),
  /* 91 */ w("future", "Take a year off to travel the world", "Use that year to save for a dream home"),
  /* 92 */ w("future", "One shared bank account", "Separate money, split the bills"),
  /* 93 */ w("future", "Grow old in the hills", "Grow old by the beach"),
  /* 94 */ w("future", "A farmhouse with a kitchen garden", "A penthouse with a city view"),
  /* 95 */ w("future", "Learn a new language together", "Learn a new dance form together"),
  /* 96 */ w("future", "Buy a car first", "Get a pet first"),
  /* 97 */ w("future", "Live next door to our best friends", "Live next door to family"),
  /* 98 */ w("future", "Celebrate our 25th anniversary with a world trip", "Renew our vows in front of everyone on our 25th"),
  /* 99 */ w("future", "Become famous together", "Stay private and happy together"),

  // ---- Deep (100–119) ----
  /* 100 */ w("deep", "Always know what the other is feeling", "Always know what the other is thinking"),
  /* 101 */ w("deep", "Talk through every fight the same night", "Sleep on it and talk in the morning"),
  /* 102 */ w("deep", "Always hear the honest truth, even when it hurts", "Be spared small truths that would hurt"),
  /* 103 */ w("deep", "Relive our happiest day once a year", "Erase our worst fight from memory"),
  /* 104 */ w("deep", "Have more time together", "Have more money together"),
  /* 105 */ w("deep", "Be the one who loves more", "Be the one who is loved more"),
  /* 106 */ w("deep", "Know how our story ends", "Never know and enjoy the ride"),
  /* 107 */ w("deep", "Big romantic gestures once in a while", "Small sweet gestures every day"),
  /* 108 */ w("deep", "Get a letter from our future selves", "Send a letter to our past selves"),
  /* 109 */ w("deep", "Always be the first to say sorry", "Always be the first to forgive"),
  /* 110 */ w("deep", "Share every single secret", "Keep a few small secrets"),
  /* 111 */ w("deep", "Be understood without words", "Hear everything said out loud"),
  /* 112 */ w("deep", "Small fights often", "Rare fights, but big ones"),
  /* 113 */ w("deep", "A love that feels calm and safe", "A love that feels exciting and wild"),
  /* 114 */ w("deep", "Be best friends first", "Fall in love at first sight"),
  /* 115 */ w("deep", "Endless deep talks", "Comfortable silences"),
  /* 116 */ w("deep", "Make one new memory every day", "Never forget a single old memory"),
  /* 117 */ w("deep", "Change one thing about our past", "Know one thing about our future"),
  /* 118 */ w("deep", "Be completely understood", "Be completely accepted"),
  /* 119 */ w("deep", "Always say exactly what's on the mind", "Always pick words carefully"),
];

/** Fixed sample shown as text on the landing page (real content for search engines). */
export const WYR_SAMPLE_IDS = [40, 0, 20, 60, 80, 100, 47, 2, 30, 64, 92, 105, 41, 11, 34, 66, 85, 113, 56, 13];
