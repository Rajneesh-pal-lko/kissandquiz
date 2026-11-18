# Kiss Wallet — Standard Rules (v1, 2026-11-18)

These are the rules every KissAndQuiz game follows when it adds or removes kisses.
The numbers live in `lib/wallet/rules.ts`. Change them there and here together.

**One line:** every player gets a free wallet; when you play a game with your partner, the winner
earns kisses that the other one owes; kisses are paid in person, when you meet.

---

## A. What a kiss is

| # | Rule | Why |
|---|------|-----|
| A1 | A kiss is a playful promise between two partners, paid **in person**. | The whole point: "pay when we meet". |
| A2 | Kisses have **no money value**. They can never be bought, sold, moved to someone else, or swapped for anything (no coins, no discounts, no prizes). The paid Couple Pass may unlock games, **never kisses**. | India's Online Gaming Act 2025 bans online money games, where a player puts in money or "other stakes" (credits, coins, tokens, real or virtual, bought with money or convertible to money) hoping to win. Free, non-convertible kisses keep us an "online social game", which needs no registration under the 2026 Rules. |
| A3 | We say "**play for 2 kisses**", never "bet" or "wager". | The Online Gaming Authority classifies games partly by betting/staking features. Keep the wording clean. |

## B. The wallet

| # | Rule | Why |
|---|------|-----|
| B1 | Every person has **one wallet**, free, no sign-up. It is made automatically the first time you play, with the name you typed. | Wallet must never add friction to the one-tap join. |
| B2 | Inside the wallet there is one **khata** per partner, with two numbers: **"{Partner} owes you"** and **"You owe {Partner}"**. They are not netted against each other. | Kissing goes both ways; netting would cancel the fun ("you owe 3, I owe 2" → "you owe 1"). |
| B3 | The wallet lives on this phone. A **private wallet link** opens it on another phone or browser. Lose the phone/clear the browser without the link = the wallet is gone. | No login. WhatsApp's in-app browser keeps separate storage, so the link is the bridge. |
| B4 | The wallet **never blocks a game**. If it can't be reached, the game still plays; kisses just aren't counted for that game. | Games come first. |
| B5 | A game counts only when **both players have wallets and they are different wallets**. Playing both sides yourself is practice, no kisses. | Stops self-farming. |

## C. Earning kisses (in)

| # | Rule | Why |
|---|------|-----|
| C1 | **Stake:** the person who starts a game picks "Play for **1, 2, 3 or 5** kisses" (default **1**). The partner sees it before playing. | Small stakes: losses feel about twice as strong as equal gains (loss aversion), so big stakes sting. |
| C2 | **Two-player games** (Would You Rather and later Most Likely To etc.): whoever guessed more of the other's answers **wins the stake** from the other. | Clear winner, skill-based. |
| C3 | **Tie = both win the stake** ("kiss each other"). | Nobody loses on a draw; it ends on a sweet note. |
| C4 | **Perfect bonus:** guessing every answer right (e.g. 10/10) earns **+1 bonus kiss**. | A small extra for a big moment. |
| C5 | **Couple quiz** (How Well Do You Know Me): the partner's score decides. **70%+ (7–10 of 10): partner wins the stake. 40–69% (4–6): tie, both win. Under 40% (0–3): the quiz maker wins** ("you don't know me!"). 10/10 = +1 bonus. | The quiz is one-way, so the score sets the winner. |
| C6 | **Each game counts once** — the first time it finishes. Replays, refreshes, and later attempts on the same quiz never count again. | No farming one link. |
| C7 | **Daily limit:** at most **15 kisses per day** from games, per person, per partner (rolling 24 hours). More games still play; they just show "today's kiss limit reached". | Too many "faucets" make a currency worthless (game-economy inflation). Keeps kisses special. |
| C8 | **Khata limit:** one person can be owed at most **99** kisses by the same partner. Above that, new kisses aren't added until some are paid. | A debt that grows forever stops being fun; this pushes couples to "settle up". |
| C9 | **Gift kisses:** you can add 1–5 kisses to what **you** owe your partner, any time ("just because"). Max **10 gifted per day**. | Keeps it loving (communal), not only a trade (exchange). |

## D. Paying and clearing (out)

| # | Rule | Why |
|---|------|-----|
| D1 | Kisses are paid **in person**. **Only the person who is owed** can mark kisses as received. The one who owes can never wipe their own debt. | The simplest anti-cheat: you can only lower what is owed *to you* and only raise what *you* owe. |
| D2 | **Kiss rate card** for marking received: **Peck = 1, Hug + kiss = 3, 10-second kiss = 5, Movie kiss = 10.** You can't mark more than you're owed. | Makes paying a fun choice instead of a number. |
| D3 | **Forgive:** the person who is owed can forgive 1 kiss or **clear the whole khata** at any time. | Easy exit if it ever feels like a debt. |
| D4 | No interest, no penalties, no expiry dates, no "you still owe" push messages. A reminder is only sent when a person chooses to tap "Remind on WhatsApp". | Fear-based mechanics (streak anxiety, loss pressure) raise engagement short-term but cause burnout and churn. |

## E. Respect and consent

| # | Rule | Why |
|---|------|-----|
| E1 | Owed kisses are a **playful reminder, never a duty**. Either partner can say "not now"; nothing bad happens if a kiss isn't paid. | Rewards that feel controlling reduce the joy of the activity (Deci, Koestner & Ryan 1999); sex/affection given to avoid a partner's disappointment lowers satisfaction (Impett et al.). |
| E2 | The main wallet holds **only kisses**. Anything spicier will live only in the future 18+ area, only for items **both** partners marked "Yes", and can always be skipped for free. | Session 7/10 decisions. |
| E3 | Copy on the site never shames ("you lost", "pay up or else"). Losing copy is teasing and warm. | Tone. |

## F. Privacy

| # | Rule | Why |
|---|------|-----|
| F1 | Stored: the wallet's name, a random wallet ID, a **hash** of its secret, and per khata the balances and a history (game, amounts, dates). No email, phone, photos or location. | Data minimisation (DPDP Act). |
| F2 | Only the two people in a khata can see it. | Private by default. |
| F3 | **Delete wallet** removes the wallet, all its khatas and their history (the partner's view of that khata goes too, since it is shared). | Right to erasure. |
| F4 | Unused data is deleted automatically: a wallet or khata with **no activity for 180 days**, and history lines older than 180 days. | Same retention as quizzes and games. |

## G. Integrity

| # | Rule | Why |
|---|------|-----|
| G1 | Scores, winners and kisses are **worked out on the server**. The browser can't send "I won". | Can't be faked. |
| G2 | Each wallet action is rate-limited per network. | Spam protection. |

---

## Sources
- Promotion and Regulation of Online Gaming Act, 2025 — definitions of "online money game" and "other stakes" (virtual tokens bought with money or convertible to money); Online Gaming Rules 2026 in force 1 May 2026, registration optional for most non-money social games (Mondaq, Bar & Bench, The Quint, ThePrint, Legal 500 summaries, checked 2026-11-18).
- Loss aversion ≈ 2× (Kahneman & Tversky; GDC talk by Geoff Engelstein); Octalysis "Core Drive 8" warning that loss/fear mechanics cause burnout (Yu-kai Chou).
- Game economy "faucets and sinks" and inflation control (Adrian Crook, 1kx, Unity economy guide).
- Relationship research already in CONTEXT.md section 5 (Clark & Mills communal vs exchange; Deci, Koestner & Ryan 1999; Impett et al.; Aron et al. 2000; Proyer).
- Competitors with task → points → coupons: Kyupid, Favour, Cutest Couple, BetweenUs, Couple Coupons (all app installs).

## Open questions for Raj
1. 18+ tick on the wallet? (Kisses are mild; today only the future spicy area has an 18+ gate.)
2. Merge two wallets of the same person (e.g. WhatsApp browser + Chrome) via sign-in — later, with accounts.
