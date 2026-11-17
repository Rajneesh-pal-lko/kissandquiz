# KissAndQuiz — Project Context

Living document. Update it at the end of every working session (see "Progress log").
Last updated: 2026-11-17

---

## 1. What we're building
**KissAndQuiz** (kissandquiz.com): a website of free, AI-powered couple games that partners play by sharing a link. No app, no login. India-first, but global in tone and brand.

**Why this shape:** our research found that viral couple trends are all two-person tests filmed for the reaction, and the top complaint about paid couple apps is the paywall. No free web product does partner-vs-partner games well. The second partner is the key user: joining must take one tap from a link.

**Owner:** Raj (developer in India; Salesforce background). Side project, built evenings and weekends.

---

## 2. Brand decisions
| Decision | Status |
| --- | --- |
| Brand name: **KissAndQuiz** | Decided |
| Main domain: **kissandquiz.com** | Decided (buy it); optional redirect **kissnquiz.com** |
| Global, flirty brand (no need to be "family-safe") | Decided by Raj |
| Rejected names: KissAndFun (weaker recall, vague), Couply / Nuzzle / Twine / Twogether / Twosome / DuoPlay / Luvly / Saath (already used by existing apps or brands), Jodi (betting spam in India), Flirtle (reads as a dating app), TwoTango (a "Tango" couples app already exists) | Rejected |
| Alternatives considered: Kissmet, Smooch, Nok Jhok, Aapas | Not chosen |

To verify still: domain purchase, Instagram/YouTube/X handles (`kissandquiz`), trademark search (India IP office, USPTO).

---

## 3. Code and hosting
- **Repo:** https://github.com/Rajneesh-pal-lko/kissandquiz (branch `main`). Claude has push access via the Claude GitHub App.
- **Stack:** Next.js 15 (App Router) + React 19 + TypeScript, **static export** (`output: "export"`), plain CSS (`app/globals.css`), no backend, no database.
- **Hosting plan:** Vercel (free), with the custom domain kissandquiz.com. Raj already hosts happynewyear2027.in on Vercel (domain from GoDaddy).
- **Commands:** `npm install`, `npm run dev` (localhost:3000), `npm run build` (output in `./out`).

### Current files
| Path | Purpose |
| --- | --- |
| `app/page.tsx` | Home page, with a "Create my quiz" call to action |
| `app/create/page.tsx` | Creator enters a name, answers 10 random questions about themselves, gets a share link plus WhatsApp and copy buttons |
| `app/play/page.tsx` | Partner opens the link, guesses each answer (right/wrong shown), gets a score and verdict, can send the score on WhatsApp and make their own quiz |
| `lib/questions.ts` | Bank of 20 questions, 4 options each, Indian-flavoured. **Only append; never reorder or delete** (links store question indexes) |
| `lib/quizLink.ts` | Encodes `{n: name, a: [[questionIdx, answerIdx], …]}` as base64url in the URL **hash** (`/play/#…`). UTF-8 safe (Hindi and emoji tested). Light obfuscation, not security |
| `app/layout.tsx` | Metadata and Open Graph tags |
| `README.md` | Run, build and deploy steps |

### Game 1: "How Well Do You Know Me?" (built, 2026-11-17)
Flow: create, then share the link, then the partner plays, then sees the score, then sends it back and makes their own quiz. That last step is the viral loop.

---

## 4. Research summary (2026-11-17)
Full reports are in three Claude Docs:
- Niche report (demand, competitors, monetization, India): https://claude.ai/artifact/6cboEcVYDnpjxnrvpCfyy3
- Couple games research (viral games, paid games, gaps, master list of 14 ideas): https://claude.ai/artifact/T7J74X5xqXZd54Eo1hLF1d
- Brand name check: https://claude.ai/artifact/Qe6UbUUrKYRJo26TckbQnL

Key facts:
- **Search demand:** "love letter" about 201K/month globally (301K in Feb); "date night" about 110K/month (+22% in a year); "truth or dare questions spicy" about 26K/month in the US; "conversation starters for couples" about 9.9K/month in the US.
- **Viral proof:** orange peel theory hashtag 47M–111M TikTok views; "12 questions" quiz trend; "send this to your partner" videos at 1M+ views; We're Not Really Strangers Couples Edition sold 1M+ copies.
- **Competitors:** Paired (12M+ downloads, about $200K/month estimated, from $14.99/month); Agapé (€55.99/yr; partner answer sync is premium); Couple Joy (5M installs); Love8 (8.6M installs); Couple Zone (small free web site with couple games).
- **Biggest gap:** a free daily question with partner sync on the web (Agapé and Paired charge for it). The #1 complaint in negative reviews (28%) is everything being locked behind a paywall.
- **India angles not yet served:** Antakshari for two, Couple Ludo with dares (Ludo King has 1B+ downloads, about 80% from India), and a wedding "shoe game" / "who knows the couple best" kit.
- **Risks:** Google AI Overviews cut clicks to the top result by about 58%; demand is seasonal (Valentine's spike); one-time use (revenue of indie couple apps fades after launch spikes); Indian ad revenue per view is very low.
- **Monetization direction:** viral free games first, then a paid tier or one-off purchases (premium packs priced in rupees, printable decks), not ads alone.

---

## 5. Roadmap (priority order)
**Viral picks:** (1) How Well Do You Know Me (done), (2) "Would You Still Love Me If…" hypotheticals with a reaction card, (3) Couple Ludo with dares.
**SEO picks:** truth or dare for couples; a deep-question deck with levels; a scratch-off date night generator.
**Retention:** a partner-synced daily question with streaks (the clearest gap).
**Deadline to aim for:** Valentine's Week, Feb 7–14, 2027.

---

## 6. Next steps
1. Buy kissandquiz.com (plus kissnquiz.com as a redirect); reserve the `kissandquiz` handle on Instagram, YouTube and X.
2. Deploy the repo on Vercel and connect the domain; test the full flow on two phones.
3. Add a share image (Open Graph) so WhatsApp and Instagram links show a nice preview card.
4. Add a Hindi/Hinglish question pack and an option to choose the language.
5. Build game 2: "Would You Still Love Me If…".
6. Add simple analytics (e.g. Vercel Analytics or Plausible) to track: share rate, partner completion rate, and how many partners make their own quiz.
7. Validation test: post 20–30 Shorts/Reels before Valentine's Week. Target at least 30% of creators sending the link, and at least 10% returning in week 2.

---

## 7. Progress log
### 2026-11-17
- Researched the niche, couple games and brand names (three Claude Docs above).
- Chose the brand **KissAndQuiz**, domain **kissandquiz.com**.
- Created the GitHub repo and pushed the starter site with game 1 ("How Well Do You Know Me?"). Build passes; quiz link round-trip tested, including Hindi and emoji.
- Next: buy the domain, deploy on Vercel, add the share image.
