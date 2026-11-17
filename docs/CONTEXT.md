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
- **Stack:** Next.js 15 (App Router, pinned 15.5.29) + React 19 (19.2.9) + TypeScript, **static export** (`output: "export"`), plain CSS (`app/globals.css`), no backend, no database.
- **Hosting plan:** Vercel (free), with the custom domain kissandquiz.com. Raj already hosts happynewyear2027.in on Vercel (domain from GoDaddy).
- **Commands:** `npm install`, `npm run dev` (localhost:3000), `npm run build` (output in `./out`).

### Current files
| Path | Purpose |
| --- | --- |
| `app/page.tsx` | Home page = **game store**: hero + "Play now" and "Coming soon" card grids, built from `lib/games.ts` |
| `lib/games.ts` | Game catalog (slug, title, tagline, emoji, status live/soon, category, time, card colours). To launch a game: add its page under `app/games/<slug>/` and set status to `live` |
| `app/games/how-well-do-you-know-me/page.tsx` | Game 1 intro page (old home content) with its own SEO title, links to `/create/` |
| `app/create/page.tsx` | Creator flow: name → 10 questions (Back/Next, auto-advance on tap, 🔄 swap question) → review screen (tap to edit, change name) → share (WhatsApp, native share, copy, edit answers, new quiz). Draft saved in localStorage (`kq.create.v1`) so refresh doesn't lose work |
| `app/create/layout.tsx` | Share/SEO metadata for `/create/` |
| `app/play/page.tsx` | Partner flow: intro → guess each question (one guess, locked after reveal, shows creator's answer) with Back/Next → score + verdict → "See all answers" review, send score on WhatsApp / native share, play again, make own quiz. Progress saved in sessionStorage per link; reloads on hash change |
| `app/play/layout.tsx` | Share preview title "How well do you know me? 💘"; `noindex` (quiz links are personal) |
| `lib/questions.ts` | **81 questions (78 active)** in 7 categories (favourites, habits, personality, love, past, future, funny), 4–6 options each. Index = stable ID. **Only append; never reorder or delete questions or options.** Use `retired: true` to stop picking a question (old links still decode). Picker takes max 2 per category. Static for now; can move to a DB later keeping the index as ID |
| `lib/storage.ts` | Safe localStorage/sessionStorage wrappers (never throw) |
| `lib/quizLink.ts` | Encodes `{n: name, a: [[questionIdx, answerIdx], …]}` as base64url in the URL **hash** (`/play/#…`). UTF-8 safe (Hindi and emoji tested). Light obfuscation, not security. Decoder cleans input: name max 24 chars, max 30 pairs, drops duplicates and bad pairs |
| `app/layout.tsx` | Site-wide metadata ("Free Games for Couples") and Open Graph tags |
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

### Research 2 (2026-11-17): is game 1 designed right? What should the platform be?
**Game 1 verdict:** the core loop (creator answers about self → link → partner guesses → score) is the proven "BuddyMeter / Bestie Quiz" format. Keep it. Gaps vs. the winners, by impact:
1. **Creator never sees results.** Friendship-quiz sites link every taker's score back to the creator's scoreboard/leaderboard, which the creator keeps refreshing. Ours depends on the partner manually sending the score. Needs a tiny backend.
2. **No shareable score-card image** (competitors generate one for WhatsApp/Stories). Doable static with canvas.
3. **Link preview can't be personal.** Quiz data is in the URL hash, which crawlers never see, so WhatsApp can't show "How well do you know Riya?". WhatsApp also drops og:images over ~300–600 KB. Fix: short links (`/q/<id>`) + server-rendered meta.
4. **Long links** (WhatsApp sometimes cuts them). Short IDs fix this too.
5. **No custom questions** (competitors let creators write their own).
6. **One taker per link.** Friendship quizzes get many takers per link (leaderboard drama); a couple quiz gets one. Options: let friends play too ("who knows me best"), and/or a couple-only **Mirror mode** (both answer, then compare, like Paired's "answer to unlock your partner's answer").

**What couples search for (clusters):** (A) games to play together — viral, weak SEO; (B) fun "tests" — love calculator, FLAMES (huge in India), compatibility, love language; (C) words to send — wishes, shayari, quotes, captions, love letters (huge but saturated, AI-Overview-prone, low RPM); (D) plans — date ideas, gift ideas, Valentine Week (Feb 7–14, a big India search moment); (E) talk prompts — questions to ask, truth or dare, would you rather.
**Strategy:** build interactive **tools and games, not article lists**. AI Overviews cut organic clicks (Pew: 15% → 8%); interactive/transactional pages hold up better. Each tool gets an SEO landing page and a "send this to your partner" share step.
**Money:** India entertainment AdSense RPM ≈ ₹40–165 per 1,000 pageviews, so ads alone won't pay. Mix: ads + gift affiliate links + premium packs later.
**Hosting risk:** Vercel Hobby is **non-commercial only** (ads/affiliate not allowed). Cloudflare Pages free tier allows commercial use, unlimited bandwidth, and has Workers + D1 for a small backend. Supabase free pauses after 7 days idle (bad for quiz links opened weeks later).
**Privacy:** storing names/answers brings India's DPDP Act into play (full compliance due May 2027). Keep data minimal, add a privacy notice, auto-delete old quizzes.

---

## 5. Roadmap (priority order)
**Viral picks:** (1) How Well Do You Know Me (done), (2) "Would You Still Love Me If…" hypotheticals with a reaction card, (3) Couple Ludo with dares.
**SEO picks:** truth or dare for couples; a deep-question deck with levels; a scratch-off date night generator.
**Retention:** a partner-synced daily question with streaks (the clearest gap).
**Deadline to aim for:** Valentine's Week, Feb 7–14, 2027.

---

## 6. Next steps
Proposed order after Research 2:
1. Test the current flows on two real phones (WhatsApp and Instagram in-app browsers, Chrome, Safari).
2. Buy kissandquiz.com (+ kissnquiz.com redirect); reserve the `kissandquiz` handles.
3. Hosting: **stay on Vercel Hobby for now** (decided 2026-11-17). Before turning on ads, affiliate links or payments, either upgrade to Vercel Pro or move to Cloudflare Pages. Keep code portable (no Vercel-only features) so a move stays cheap.
4. Default share image (OG, 1200×630, under 300 KB) + **score-card image** the partner can share.
5. Backend (proposed 2026-11-18, waiting for Raj's go-ahead): **Next.js API routes on Vercel + MongoDB Atlas Free** for short links `/q/<id>`, a "who took my quiz" results page for the creator (partner only, no leaderboard), and personalised link previews. Needs removing `output: "export"`. Mongo notes: cache the client between calls; Atlas must allow 0.0.0.0/0 (Vercel IPs are dynamic) so use a strong DB password; Free cluster pauses after 30 days with zero connections; TTL index to auto-delete old quizzes. Old `/play/#…` links must keep working.
6. Free analytics (Cloudflare Web Analytics): share rate, partner completion, partners who make their own quiz.
7. Love Calculator + FLAMES (Hinglish, shareable result, funnels into game 1). India SEO magnet.
8. Game 2: "Would You Still Love Me If…".
9. Hindi/Hinglish question pack.
10. Valentine Week hub (Feb 7–14, 2027): one mini game or tool per day. Must be live by early Feb.
11. Later: Mirror mode (both partners answer), custom questions, AI love letter / shayari generator (API cost → premium), daily question with streaks, date-idea scratch card with gift affiliate links.

---

## 7. Progress log
### 2026-11-18
- Decision (Raj): **partner only** plays a quiz. No friends leaderboard. (Supersedes the "let friends play" option in Research 2, gap 6.) Mirror mode stays on the later list.
- Raj asked about backend platform and MongoDB. Recommendation: keep backend on Vercel (Next.js API routes), MongoDB Atlas Free is fine for this data. Waiting for go-ahead.
- Next: on go-ahead, build short links + creator results page.

### 2026-11-17 (session 5)
- Deep research: how quiz-by-link games are designed (BuddyMeter-style friendship quiz sites, couple quiz tools, Paired), what couples search for, AI Overview impact, India ad RPM, hosting terms, DPDP Act. Findings in section 4 → "Research 2".
- Verdict: game 1's core loop is right; biggest gaps are creator-side results, score-card image, personalised/short links, custom questions, one taker per link.
- Platform direction (proposed): interactive tools and games, not article lists; India hooks (Love Calculator/FLAMES, Valentine Week, Hinglish).
- Flagged risk: Vercel Hobby forbids commercial use; Cloudflare Pages recommended.
- Pending decisions for Raj: (1) move to Cloudflare Pages, (2) add a small backend for short links + creator results, (3) partner-only vs. friends-can-play leaderboard.
- Decision (Raj, same day): **stay on Vercel** for now; buy Vercel Pro later if needed. Fine while the site makes no money. Revisit before any ads/affiliate/payments. Decision (1) closed; (2) and (3) still open.
- Next: Raj decides; then OG + score-card image, then backend.

### 2026-11-17 (session 4)
- Audited game 1 end to end and fixed everything found:
  - Create: added Back/Next, 🔄 swap question, review screen with tap-to-edit and change name, saved draft across refresh, native share button (Instagram/Telegram), "Edit answers" and "New quiz" on the share screen, progress bar now reaches 100%.
  - Play: replaced the 0.9s auto-jump with explicit Next/Back; one guess per question, locked after reveal; shows "{name}'s answer" and "{name} picked X"; results page has "See all answers" review, native share and "Play again"; refresh resumes; pasting a new link in the same tab loads it; `{name}` replaced everywhere.
  - Links: stricter decoding (name cap, dedupe, invalid pairs dropped); pluralisation fix.
  - SEO/share: `/play/` has its own share title and is `noindex`; `/create/` has its own title.
- Question bank: researched popular "how well do you know me" lists (The Knot, Paired, Bonobology, Marriage.com, AhaSlides, MyHeartCraft). Common themes: favourites, habits, personality, love, childhood, future, funny what-ifs. Wrote **61 new multiple-choice questions** (indexes 20–80), India-flavoured but global. Added a `category` to every question.
- Decision: retired 3 old questions instead of deleting them (old links still work): #2 favourite food (too few options; replaced by #20 cuisine and #29 comfort meal), #9 emoji (creator and partner were asked different things; replaced by #39), #14 who says sorry first ("Me/You" flips meaning for the partner). Rule added: every question must be about the creator only, no "me/you" options.
- Decision: keep questions static in code for now. If we add a database later, the array index stays the question ID.
- Verified: the 20 old questions are unchanged; 2,000 random picks were valid; browser test of both flows on mobile, old-format links with retired questions, tampered and broken links — no console errors. Pushed as `7c8f515`.
- Idea for later: let creators write one custom question of their own (e.g. "Where did we first meet?"), which needs the free-text answer stored in the link.
- Next: test on real phones, buy the domain, add the share image.

### 2026-11-17 (session 3)
- First Vercel deploy is live.
- Decision (Raj): KissAndQuiz is a **store of many couple games**, not one quiz. Home page redesigned as a game store: responsive card grid (1/2/3 columns), "Play now" section (game 1) and "Coming soon" section (Would You Still Love Me If…, Couple Ludo with Dares, Truth or Dare, Deep Questions Deck, Date Night Scratch-off, Daily Couple Question).
- Game 1 moved to its own page `/games/how-well-do-you-know-me/`. URL convention for new games: `/games/<slug>/`. `/create/` and `/play/` were not moved, so old shared links still work.
- Coming-soon cards are not clickable yet (no "notify me", since we have no backend).
- Build passes; checked on desktop and mobile. Pushed as `71ee823`.
- Next: test on two phones, buy the domain, add the share image.

### 2026-11-17 (session 2)
- First Vercel deploy was blocked: Next.js 15.5.6 has a security vulnerability (CVE-2025-66478).
- Upgraded to next 15.5.29 and react/react-dom 19.2.9 (exact versions), ran `npm audit fix`. Build passes. Pushed as `1908ed3`.
- Decision: stay on Next.js 15 (latest backport patch) for now, not 16, to avoid breaking changes. Remaining `npm audit` warnings (PostCSS inside Next, sharp) are build-time only and don't ship in the static site; revisit when moving to Next 16.
- Next: confirm deploy, test on two phones, buy the domain, add the share image.

### 2026-11-17
- Researched the niche, couple games and brand names (three Claude Docs above).
- Chose the brand **KissAndQuiz**, domain **kissandquiz.com**.
- Created the GitHub repo and pushed the starter site with game 1 ("How Well Do You Know Me?"). Build passes; quiz link round-trip tested, including Hindi and emoji.
- Next: buy the domain, deploy on Vercel, add the share image.
