# KissAndQuiz — Project Context

Living document. Update it at the end of every working session (see "Progress log").
Last updated: 2026-11-18

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
- **Stack:** Next.js 15 (App Router, pinned 15.5.29) + React 19 (19.2.9) + TypeScript, **plain CSS (`app/globals.css`). **Backend since 2026-11-18:** Next.js API routes on Vercel + **MongoDB Atlas Free** (`MONGODB_URI` env var in Vercel; never commit it). Static export was removed (superseded: needed for API routes); pages are still pre-rendered where possible.
- **Hosting plan:** Vercel (free), with the custom domain kissandquiz.com. Raj already hosts happynewyear2027.in on Vercel (domain from GoDaddy).
- **Commands:** `npm install`, `npm run dev` (localhost:3000), `npm run build` (output in `./out`).

### Design system v2 "Blush & Plum" (2026-11-18, live on `main`)
- **Look:** warm cream background (`#fff6f3`) with three slow-drifting blurred blobs (blush, peach, lilac), plum-black text (`#2a0f1f`), brand pink `#e8336f` for accents and a deeper gradient (`#e62a6c → #b8134f`) for buttons so white text passes contrast. Chunky "press-down" buttons (Duolingo-style bottom edge), 24–32 px rounded cards, soft pink shadows. WhatsApp buttons are bright green with **dark** text (white on `#25d366` failed contrast).
- **Fonts:** Bricolage Grotesque (headings) + Plus Jakarta Sans (body), self-hosted via `@fontsource-variable/*` (OFL, no Google Fonts request). Hindi names fall back to the system font.
- **Icons:** Microsoft **Fluent Emoji 3D** (MIT) instead of the phone's own emoji, so every phone looks the same. Static: `public/emoji/3d/<codepoint>.webp` (256 px, ~5 KB each). Animated: `public/emoji/anim/<name>.webp` (converted from Microsoft's animated APNGs to animated WebP, 128–192 px, 50–150 KB each), used only for hero heart, share-screen party popper, score reactions and CTA bands. Licence file: `public/emoji/LICENSE-fluent-emoji.txt`. To add an icon: copy from the npm package `@lobehub/fluent-emoji-3d` (`assets/<codepoint>.webp`).
- **Motion (all CSS, no animation library):** hero "live quiz" preview loop, floating emoji stickers, highlighted word underline, question slide-in, option pop / shake on wrong, heart burst + "+1" on right guesses, score ring count-up, heart confetti (`components/fx.ts`, dependency-free), sticky mobile CTA. Everything turns off with the phone's "reduce motion" setting.
- **Rules:** keep motion purposeful and cheap (transform/opacity only), lazy-load images below the fold, keep tap targets ≥ 46 px and inputs ≥ 16 px font (no iOS zoom).

### Current files
| Path | Purpose |
| --- | --- |
| `app/page.tsx` | Home page = **game store**: hero (headline, CTAs, highlight chips, live quiz preview), How it works (3 steps), featured live game card, "Coming soon" rail (swipe on phones, grid on desktop), value props, final CTA band, sticky mobile CTA. Built from `lib/games.ts` |
| `components/Emoji.tsx` | `<Emoji code>` (static 3D emoji), `<AnimatedEmoji name code>` (animated WebP, static fallback for reduce-motion), `<WhatsAppIcon>` |
| `components/SiteChrome.tsx` | Sticky glass header (logo, My results, Account, "Play free") and footer (links incl. Privacy, emoji credit). `hideCta` hides "Play free" in the quiz flows |
| `components/QuizPreview.tsx` | Pure-CSS looping demo of a partner guessing question #29 (hero art on home + game page) |
| `components/StickyCta.tsx` | Bottom CTA bar on phones; appears after the hero CTA scrolls away |
| `components/ScoreRing.tsx` | Animated score ring + count-up on the partner's score screen |
| `components/fx.ts` | `heartBurst(el, "+1")` and `confetti()`; skipped for reduce-motion |
| `lib/ui.ts` | Category labels + 3D icons, option letters, `scoreMood(pct)` (verdict + animated reaction) |
| `lib/seo.ts` | `SHARE_IMAGE` for pages that set their own `openGraph` (Next.js drops the parent's image otherwise) |
| `app/opengraph-image.jpg`, `app/icon.png`, `app/apple-icon.png` | Default share image (1200×630, 76 KB), favicon and home-screen icon (Fluent heart-with-arrow) |
| `lib/games.ts` | Game catalog (slug, title, tagline, emoji, `icon` = 3D emoji codepoint, status live/soon, category, time, card colours). To launch a game: add its page under `app/games/<slug>/` and set status to `live` |
| `app/games/how-well-do-you-know-me/page.tsx` | Game 1 landing page: hero + preview, How it works, "78 questions, 7 topics" chips (counted from the bank), FAQ with FAQPage JSON-LD, CTA band, sticky mobile CTA |
| `app/create/page.tsx` | Creator flow: name → 10 questions (Back/Next, auto-advance on tap, 🔄 swap question) → review screen (tap to edit, change name) → share (WhatsApp, native share, copy, edit answers, new quiz). Draft saved in localStorage (`kq.create.v1`) so refresh doesn't lose work |
| `app/create/layout.tsx` | Share/SEO metadata for `/create/` |
| `app/play/page.tsx` | Old long links `/play/#…` (kept forever; no results saved). Uses `PlayGame`. Partner flow: intro → guess each question (one guess, locked after reveal, shows creator's answer) with Back/Next → score + verdict → "See all answers" review, send score on WhatsApp / native share, play again, make own quiz. Progress saved in sessionStorage per link; reloads on hash change |
| `app/play/layout.tsx` | Share preview title "How well do you know me? 💘"; `noindex` (quiz links are personal) |
| `lib/questions.ts` | **81 questions (78 active)** in 7 categories (favourites, habits, personality, love, past, future, funny), 4–6 options each. Index = stable ID. **Only append; never reorder or delete questions or options.** Use `retired: true` to stop picking a question (old links still decode). Picker takes max 2 per category. Static for now; can move to a DB later keeping the index as ID |
| `lib/store.ts` | Server-only data layer: MongoDB (cached client, TTL indexes, 180-day auto-delete) or in-memory store in local dev. Collections `quizzes` `{_id: 8-char id, n, a, ownerHash, ownerUserId?, createdAt}`, `users` (unique email), `loginTokens`, `sessions`, and `results` `{quizId, partner, guesses, score, total, createdAt}` |
| `lib/quizRules.ts` | Shared validation (name, pairs, guesses, score) for browser and API |
| `app/api/quiz/…` | `POST /api/quiz/` create → `{id, token}`; `GET /api/quiz/<id>/`; `POST /api/quiz/<id>/result/` (score computed server-side, max 10 per quiz); `GET /api/quiz/<id>/results/` with header `x-owner-token` (creator only) |
| `app/q/[id]/` | Short quiz link, server-rendered so WhatsApp preview says "How well do you know <name>? 💘"; noindex. Partner can enter their name; result saved once (replays not saved) |
| `app/results/` | Creator's results page (partner's score + every answer). Quizzes listed from this phone's localStorage (`kq.myquizzes.v1`) or a private link `/results/?id=<id>#<token>` |
| `components/PlayGame.tsx` | The partner game, shared by `/play/#…` (old links) and `/q/<id>/` |
| `lib/myQuizzes.ts` | Creator's quiz list + secret tokens in localStorage |
| `lib/auth.ts` | Optional accounts: email validation, session cookie `kq_session` (hashed in DB, 30 days), current user, Resend email sender (dev: link logged) |
| `app/api/auth/{start,verify,logout}/` | Email sign-in link flow. `start` {name,email,consent} → emails `/account/verify/#<token>` (single use, 15 min, max 3 per 15 min). `verify` {t} → creates account if email is new (one per email; existing keeps its name), signs in |
| `app/api/me/` | GET profile + quizzes; PATCH name; DELETE account (cascades quizzes + results). `app/api/me/claim/` moves this phone's quizzes into the account |
| `app/account/`, `app/account/verify/`, `app/privacy/` | Account page (sign in / profile / quizzes / log out / delete), sign-in landing page (button, so email scanners can't use the link), plain-language privacy policy |
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

### Original strategy PDF vs. where we are (reviewed 2026-11-18, session 6)
The founding doc is **"AI Couple Games — Brand Strategy" (PDF, Nov 2026)**: 14 game ideas, 4 phases, a 12-week Valentine's test, and the pass/fail rule **"30%+ of players send the link; 10%+ come back in week 2"** (fail → switch niche).
| PDF said | What we did | Note |
| --- | --- | --- |
| Pick a name first (Dono, Saath, Hum Do…) | **KissAndQuiz** | Saath rejected (taken) |
| Weeks 1–4: domain, Next.js on Vercel, game 1 | Game 1 + short links + creator results + accounts + redesign, all live | **Ahead on code. Domain still not bought.** |
| Supabase | MongoDB Atlas Free | Supabase free pauses when idle; Mongo is fine |
| Week 5: AdSense + email list + AI directories | Not done | AdSense **deferred** (Vercel Hobby forbids ads; new sites usually get "low value content" rejection; India RPM low) |
| Weeks 6–7: Truth or Dare + Love Letter writer, Product Hunt | Not started | Love Letter is ChatGPT-replaceable; build two-player things first |
| Weeks 8–11: 20–30 Shorts/Reels | Not started | **Start in December, not week 8** |
| Measure send rate + week-2 return | **No analytics yet** | Biggest gap: we can't run the PDF's test without it |
Fresh checks (2026-11-18): Vercel Hobby still bans ads, AdSense, affiliate-first sites and even donations; Pro is $20/month. Next.js 15 can run on Cloudflare Workers via the OpenNext adapter (free plan: 100K requests/day, 3 MiB worker limit). AdSense restricts sexually suggestive content, so spicy modes must stay off ad pages. Couple-test trends keep coming (12 questions, forest question, bird test, "would you still love me if I was a worm"); "send this to your partner" captions are still the common hook. Rose Day 2027 = Sun Feb 7; Valentine's Day 2027 = Sun Feb 14.

---

## 5. Roadmap (priority order)
**Viral picks:** (1) How Well Do You Know Me (done), (2) "Would You Still Love Me If…" hypotheticals with a reaction card, (3) Couple Ludo with dares.
**SEO picks:** truth or dare for couples; a deep-question deck with levels; a scratch-off date night generator.
**Retention:** a partner-synced daily question with streaks (the clearest gap).
**Deadline to aim for:** Valentine's Week, Feb 7–14, 2027.

---

### Valentine's 2027 plan (proposed 2026-11-18, session 6; waiting for Raj's OK)
Rule: **distribution is now the bottleneck, not code.** No new big features (no paid tier, no Ludo, no AI API) before Feb 15.
| Week | Build (evenings/weekends) | Distribution |
| --- | --- | --- |
| Nov 18–24 | Buy domain, switch env vars, test on 2 real phones (WhatsApp/Instagram in-app browsers). **Funnel tracking:** tag quizzes made from a partner's score screen (`fromQuiz`), so the DB shows created → played → partner made own quiz. Search Console + sitemap | Reserve `kissandquiz` handles (Instagram, YouTube, X) |
| Nov 25–Dec 8 | Score-card image (canvas) for WhatsApp/Stories | First 6–8 Shorts/Reels: screen-record real partner reactions, "send this to your partner" |
| Dec 9–22 | Love Calculator + FLAMES (Hinglish, funnels into game 1). Publish `/valentine-week/` hub page early (so Google indexes it) | 2–3 videos/week |
| Dec 23–Jan 12 | Game 2 "Would You Still Love Me If…" (static bank, reaction card) | r/SideProject + Indie Hackers posts |
| Jan 13–Feb 6 | Valentine Week hub: one small tool/card per day (Rose → Valentine's), reusing existing pieces. Truth or Dare (mild/medium default, spicy opt-in, noindex) only if time | Product Hunt launch late Jan; daily posts from Feb 1 |
| Feb 7–14 | Bug fixes only | Post daily (one per Valentine Week day) |
| Feb 15 | **Review:** share rate, partner completion, % partners who make their own quiz, week-2 return. Then pick: daily question + streaks (retention bet) vs. India games (Ludo/Antakshari) | |
Money decision: stay on Vercel Hobby with **no ads** through Valentine's. After Feb 15, if traffic is real, choose Vercel Pro ($20/mo) or move to Cloudflare Workers (OpenNext) before any ads/affiliate/payments. *(Partly superseded by session 7: Raj wants paid features, so payments may come before Feb 15; still no AdSense.)*

### Monetisation plan (proposed 2026-11-18, session 7; waiting for Raj's decisions)
Raj clarified his original goal: **not AdSense**. Reach a big crowd (India first, global too) and sell cheap premium features worth "10x the price", including 18+ couple games (truth or dare, spicy scratch cards, sex-position games, a daily question for both partners). He also floated a premium-only, limited launch tested with paid ads.
Full research: **Claude Doc "KissAndQuiz — How to Make Money (Premium + 18+ Research)"** https://claude.ai/artifact/Xfw312fPBtk7VhUKrgykPx
Key findings:
- **What sells:** double-blind yes/maybe/no matching where only shared yeses are revealed (Spicer ~$4.99/mo or $39.99/yr, ~$10K/mo est.; Kindu; Secret Desires $24.99 lifetime; Tease $5.99/mo). Competitors need two app installs and often charge per phone. Our edge: one link, no install, **one payment covers both partners**.
- **Spicy-only apps are small earners** (Desire: ~46.6K installs, under $10K/mo est., 73% ads). Paired (broad relationship ritual) earns far more.
- **18+ line: "spicy, not explicit".** Explicit sex content (sex-position illustrations, graphic acts, nudity) is blocked by Stripe, Lemon Squeezy, Paddle and Indian gateways (Zoho Payments bans "sexually suggestive materials (including literature)"; Razorpay terms not checked yet), by Vercel's AUP ("obscene"), by Meta ads (no ads discussing sexual practices) and by AdSense, and it carries Indian law risk (IT Act 67/67A; 25 OTT apps blocked in 2025, 5 more in Feb 2026; draft 2026 rules add an "Adult-only" rating with age verification). Adult processors (CCBill ~10.8–14.5%, reserves, cards only, no UPI) are poor for India. Apple/Google allow 17+ spicy text apps (Spicer, Desire) but take 15–30% and need an install.
- **Google SafeSearch:** explicit pages should sit on a separate domain/subdomain, or the whole site may be filtered.
- **Minors:** DPDP Rules notified Nov 2025; verifiable parental consent for under-18s; most duties from 14 May 2027. Use an 18+ gate.
- **Pricing:** India prefers one-time payments (Razorpay: a one-off ₹499 feels easier than ₹99/month). UPI AutoPay renews up to ₹15,000 without OTP. RevenueCat 2026: hard paywall 10.7% vs freemium 2.1% day-35 conversion; India/SEA 1.4%; year-1 value per payer $14 in India/SEA vs $32 in North America.
- **Premium-only vs freemium:** a paywall before the partner joins kills the viral loop. Fake scarcity backfires for unknown brands; real scarcity (founders' price) is fine.
- **Paid ads test:** Instagram Reels in India costs about ₹45–140 per 1,000 views and ₹4–55 per click. Use a real pre-order, not "notify me".
**Decision (Raj, 2026-11-18, session 7):** 18+ content lives on a **separate subdomain**. No nudity or vulgar content; censored words (asterisks) and hint-style silhouette art only (no anime style for anything sexual). Launch order: normal games + Couple Pass go live first once a payment gateway approves them; the **18+ subdomain stays offline until the gateway has reviewed and approved the 18+ content itself, in writing** (same merchant account, so approval for normal games doesn't cover it). Sex-position silhouettes only as a later deck, after that approval.
Proposed (for Raj to decide):
1. **Model B:** free first game + one-time **Couple Pass** that unlocks premium for both partners (not premium-only).
2. **Flagship paid feature: Spicy Match** (text-only yes/maybe/no, Mild level free, Hot levels paid) on an 18+ subdomain, noindex, no ads. **Don't build an illustrated sex-position game.**
3. Prices to test: single pack ₹49/$1.99; Couple Pass 1 year ₹199/$14.99; lifetime ₹399/$29; **founders' offer: first 500 at ₹99/$4.99 lifetime**.
4. Before charging: buy domain → written gateway approval (Razorpay/Cashfree) with 10 sample cards → one IT/cyber lawyer consult → move off Vercel Hobby (Pro $20/mo or Cloudflare).
5. ₹10,000 Instagram Reels pre-order test in mid-January with PG-13 ad creatives; pass = 1.5%+ of visitors pay, 30%+ partner completion.

### Game lineup: 10 free + 10 spicy (proposed 2026-11-18, session 8; waiting for Raj's OK)
Raj's idea: no "bombarding" with many games; instead the 10 best Indian couple games free + 10 best spicy ones (18+ subdomain), free at first and later behind the Couple Pass.
Verdict (Claude): **right direction, but launch in waves, not all 20 at once.**
- Choice overload is not the issue (a 2010 meta-analysis of 50 experiments found an average effect of about zero); **presentation** is. Jackbox ships packs of ~5 games and still had to build a "Party Starter" because players asked where to start. So: one featured game + mood groups.
- Precedent for a separate spicy set: Jackbox released a smaller 3-game "Naughty Pack" (2024).
- Competitor: connectedcouples.app already has **10 free browser couple games, no account** (Never Have I Ever, Would You Rather, This or That, Most Likely To, Truth or Dare, How Well Do You Know Me, 21 Questions, Two Truths and a Lie, 5 Second Rule, Date Night Roulette). "10 free games" alone is not our edge; **India (Hinglish, Ludo, Antakshari, FLAMES, shaadi games) + partner-over-link + spicy zone** is.
- Google's scaled content abuse policy targets many low-value pages; 20 real games with useful pages are fine, 100 thin template pages are not.
- "Free now, paid later" risk: Paired reviews complain features moved behind the paywall. So keep Mild levels free forever, and label spicy Hot levels "free for launch week" from day one.
- **Build 20 games on ~5 shared engines** (content changes, code doesn't): A) quiz-and-guess (exists), B) card deck with levels, C) private match (both answer, reveal), D) random generator (calculator / wheel / dice / scratch), E) board (Ludo).
Free 10: How Well Do You Know Me (A, live) · Love Calculator + FLAMES (D) · Truth or Dare Mild, Hinglish (B) · Never Have I Ever (B) · Would You Rather / This or That (C) · Who's More Likely To (C) · Would You Still Love Me If… (B/C) · Couple Ludo with Dares (E) · Antakshari for Two (B) · Shaadi Shoe Game / Who Knows the Couple Best (C).
Spicy 10 (18+ subdomain, text + hint art): Spicy Match yes/maybe/no (C, flagship) · Spicy Truth or Dare (B) · Naughty Never Have I Ever (B) · Spicy Would You Rather (C) · Dare Dice (D) · Spicy Scratch Cards (D) · Hot Seat Rapid Fire (B) · Spicy Ludo (E) · Fantasy Builder (C) · 7-Day Spicy Challenge (B, daily unlock, Valentine's Week). Later: position-silhouette deck after gateway approval.
Waves: **Wave 1 by Feb 7, 2027:** free 5 (HWDYKM, Love Calc+FLAMES, Truth or Dare Mild, Never Have I Ever, Would You Rather) + spicy 3 (Spicy Match, Spicy ToD, Naughty NHIE) — uses engines A, B, C, D only. **Wave 2 (Mar–Apr):** Ludo + Spicy Ludo, Antakshari, Who's More Likely, Would You Still Love Me If, Shoe Game, Dare Dice, Scratch Cards, Hot Seat, Fantasy Builder, 7-Day Challenge. Add a game only when the previous one is good.

## 6. Next steps
**Session 7 (proposed, priority order; replaces the session 6 order once Raj approves):** 0) Raj decides: Model B, "spicy not explicit", founders' price, hosting (Vercel Pro vs Cloudflare). 1) Buy kissandquiz.com (gateways need a live site with terms, refund policy, contact). 2) Email Razorpay + Cashfree 10 sample Spicy Match cards; get written approval; one lawyer consult. 3) Build Spicy Match (Mild free + one paid Hot level) on the existing link + MongoDB, 18+ subdomain. 4) Checkout (UPI + cards) + Couple Pass unlock for both partners + simple funnel tracking (paused by Raj for now; needed before the ads test). 5) Mid-Jan ₹10,000 ads pre-order test. 6) Feb 7–14 Valentine push with founders' offer. 7) Feb 15 review; if people pay, add Scratch-off dates and Truth or Dare Spicy.

**Session 6 (proposed, priority order; partly superseded by session 7, funnel tracking paused by Raj):** 1) buy kissandquiz.com + handles, 2) real-phone test, 3) funnel tracking (`fromQuiz`) + Search Console, 4) score-card image, 5) start Shorts/Reels in December, 6) Love Calculator/FLAMES + early `/valentine-week/` page, 7) Game 2, 8) Valentine Week hub, 9) Feb 15 review. Items below are the older list (still valid; step 5 MongoDB is done, see session 4).

Proposed order after Research 2:
1. Test the current flows on two real phones (WhatsApp and Instagram in-app browsers, Chrome, Safari).
2. Buy kissandquiz.com (+ kissnquiz.com redirect); reserve the `kissandquiz` handles.
3. Hosting: **stay on Vercel Hobby for now** (decided 2026-11-17). Before turning on ads, affiliate links or payments, either upgrade to Vercel Pro or move to Cloudflare Pages. Keep code portable (no Vercel-only features) so a move stays cheap.
4. ~~Default share image~~ (done in the redesign, 76 KB) → still to do: **score-card image** the partner can share.
5. **Raj: connect MongoDB** — add `MONGODB_URI` in Vercel env vars, allow `0.0.0.0/0` in Atlas Network Access, redeploy, test create → partner plays → results on two phones. Then **change the Atlas DB password** (it was shared in chat) and update the Vercel variable. Until then the site falls back to long links.
5b. **Accounts go live after:** buy kissandquiz.com → create a Resend account → verify the domain (DNS records) → add `RESEND_API_KEY`, `EMAIL_FROM` (e.g. `KissAndQuiz <hello@kissandquiz.com>`), `SITE_URL=https://kissandquiz.com` in Vercel → redeploy. Until then `/account/` shows "coming soon". Add a real contact email to `/privacy/`.
6. Free analytics (Cloudflare Web Analytics): share rate, partner completion, partners who make their own quiz.
7. Love Calculator + FLAMES (Hinglish, shareable result, funnels into game 1). India SEO magnet.
8. Game 2: "Would You Still Love Me If…".
9. Hindi/Hinglish question pack.
10. Valentine Week hub (Feb 7–14, 2027): one mini game or tool per day. Must be live by early Feb.
11. Later: Mirror mode (both partners answer), custom questions, AI love letter / shayari generator (API cost → premium), daily question with streaks, date-idea scratch card with gift affiliate links.

---

## 7. Progress log
### 2026-11-18 (session 8) — How many games?
- Raj asked: many games, or the 10 best Indian couple games free + 10 best spicy (free first, later Couple Pass)? Asked to ignore payment/legal for this question.
- Research: choice-overload meta-analysis (mixed, ~zero average effect), Jackbox pack design (5 per pack, separate 3-game Naughty Pack, "Party Starter" for where-to-start), competitor connectedcouples.app (10 free browser couple games), Google scaled content abuse, Indian wedding/couple games (Antakshari, ring-in-milk, joota chupai, shoe game), Paired complaints about features moving behind paywall.
- Proposed: 10 free + 10 spicy lineup built on ~5 shared engines, launched in two waves (5 free + 3 spicy by Feb 7). Details in section 5 "Game lineup". Waiting for Raj's OK.
- No code changed.

### 2026-11-18 (session 7) — Monetisation and 18+ research
- Raj: hold off on funnel tracking. Clarified the original goal: big crowd (India + global) and cheap paid premium features, including 18+ couple games (truth or dare, spicy scratch cards, sex-position games, a daily question for both partners), not AdSense. Asked whether to launch premium-only/limited and test with paid ads.
- Deep research written to the Claude Doc "KissAndQuiz — How to Make Money (Premium + 18+ Research)": https://claude.ai/artifact/Xfw312fPBtk7VhUKrgykPx (competitor prices, pricing in India, payment gateway / law / ads / hosting rules for 18+, premium-only vs freemium, ads test plan, free vs premium feature map, risks). Summary in section 5 "Monetisation plan".
- Proposed: Model B (free first game + one-time Couple Pass covering both partners); flagship paid feature Spicy Match (text only); "spicy, not explicit" (no illustrated sex-position game); founders' price; ₹10K Reels pre-order test in mid-January. Waiting for Raj's decisions.
- Decision (Raj): 18+ on its own subdomain, hint-style (no nudity/vulgar), goes live only after gateway approval of the 18+ content; normal games + payments launch first.
- No code changed.
- Next: Raj decides; buy domain; gateway approval with sample cards.

### 2026-11-18 (session 6) — Strategy review vs. original PDF
- Raj shared the founding "AI Couple Games — Brand Strategy" PDF and asked how to proceed. Compared it with what's built (table in section 4) and re-checked the web: Vercel Hobby terms, OpenNext on Cloudflare, AdSense content rules and new-site rejections, current couple trends, Valentine Week 2027 dates.
- Findings: code is ahead of the PDF's plan; domain, analytics and content/distribution are behind. We can't run the PDF's pass/fail test (30% send, 10% return) without tracking.
- Proposed (waiting for Raj): the Valentine's 2027 week-by-week plan in section 5; no ads before Feb 15; funnel tracking via a `fromQuiz` field; start videos in December.
- No code changed.
- Next: Raj confirms the plan and buys the domain; then funnel tracking + score card.

### 2026-11-18 (session 5) — UI redesign v2
- Raj asked for a professional, mobile-first redesign with animations and richer visuals than text + emoji. Researched 2026 UI trends (motion-first UI, tactile/"light skeuomorphic" buttons, bento/card grids, dopamine colours), couple apps (Paired's warm rebrand, partner-name framing), quiz-site patterns, Duolingo-style micro-interactions, and licences for 3D/animated emoji (Fluent Emoji = MIT; Noto animated = CC BY 4.0, not used).
- Decision (Claude, for Raj to review): design system **"Blush & Plum"** (see section 3), Fluent 3D + animated emoji, Bricolage Grotesque + Plus Jakarta Sans, CSS-only motion with reduce-motion support. No new runtime libraries (only the two font packages).
- Built on branch **`redesign-v2`** (merged to `main` the same night): every page restyled (home, game page, create, play, score, results, broken links, account, verify, privacy), sticky glass header + footer, sticky mobile CTA, default share image + favicon + Apple icon, FAQ + JSON-LD on the game page. Fixed contrast on pink and WhatsApp buttons. Partner sees no "Play free" button while playing (less distraction). Pages scroll to top on step change.
- Merged the redesign with session 3's account feature (account/verify/privacy pages restyled; results page keeps the signed-in quiz list; share screen keeps "save it to a free account").
- `metadataBase` now reads `SITE_URL` so share images get absolute URLs.
- Tested: production build passes; full flow on 390 px and 360 px phones (create → short link → partner plays → score → creator results), long-link fallback, Hindi name, broken/expired links, account sign-in with dev link, privacy page. No console errors except the expected 401 from `/api/me/` when signed out. Not yet checked on real phones or inside WhatsApp/Instagram in-app browsers.
- Raj reviewed the preview and approved. **Merged `redesign-v2` → `main`** (fast-forward). Raj saw no working account on the preview, most likely because Vercel's `MONGODB_URI`/Resend env vars are set for Production only (the preview then shows "Accounts are coming soon"). Production deploy of `1a3ab1a` reported success; Raj to confirm the account page works there.
- Decision (home page, for later): keep the single featured game while there is one. Once 3+ games are live: general hero + featured button picked from real play data + "Trending" row; special takeover for Valentine's Week. Needs analytics first.
- Next: test on real phones (WhatsApp/Instagram in-app browsers); then score-card image, analytics, Love Calculator/FLAMES.

### 2026-11-18 (session 4)
- Live at https://kissandquiz-mu.vercel.app with MongoDB + Resend configured: `/api/me/` returns `{"error":"signed_out","accounts":true}`.
- Test email setup: Resend domain happynewyear2027.in (sending verified; "receiving" MX not needed, keep it off), new send-only API key, `EMAIL_FROM=KissAndQuiz <login@happynewyear2027.in>`, `SITE_URL=https://kissandquiz-mu.vercel.app`. Switch to kissandquiz.com once bought.
- Next: Raj tests sign-in email + quiz flow on two phones; rotate Atlas password.

### 2026-11-18 (session 3)
- Decision (Raj): add **optional creator accounts** now (option A): name + email, **one profile per email**, sign in with an emailed link (no passwords). Partners never need an account (keeps the one-tap join).
- Built and pushed (`c04b53e`): users/loginTokens/sessions in MongoDB; `/account` (sign in, profile, quiz list, rename, log out, delete account with its quizzes and results), `/account/verify`, `/privacy`; quizzes made while signed in are saved to the account; quizzes made on the phone are claimed on sign-in; results readable on any signed-in phone. Email via Resend (free: 3,000/month, 100/day, needs a verified domain).
- Tested locally (in-memory store, dev sign-in links): sign up, same email on a 2nd phone keeps the first name, results via account, quiz created while signed in, rename, reused link rejected, bad email / no consent rejected, rate limit (4th link → 429), stranger can't read results, logout, delete cascade (partner link then shows "expired"). No console errors.
- Next: Raj connects MongoDB and tests on phones; buy domain → Resend → env vars to switch accounts on.

### 2026-11-18 (session 2)
- Built the backend (commit `dc813a3`): short links `/q/<id>/`, creator results page `/results/`, personal WhatsApp preview, partner name (optional), server-side scoring, max 10 results per quiz, 180-day auto-delete, creator secret token (only hash stored). Old `/play/#…` links unchanged; create falls back to them if the API is unavailable.
- Decision: MongoDB Atlas Free + Next.js API routes on Vercel. Static export removed (superseded the "no backend / static export" decision because creator results need a database).
- Tested locally with the in-memory store: full create → play → results flow, private results link on another device, wrong token, tampered input, replay not double-saved, legacy links, expired/broken links, production fallback when DB is missing. No console errors. Could not test against the real Atlas cluster from the sandbox (network blocked).
- Security: Raj shared the DB password in chat; it is not stored in the repo, context or memory. Raj to rotate it after setup.
- Next: Raj sets `MONGODB_URI` in Vercel and tests on phones; then OG/score-card images.

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
