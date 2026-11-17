# KissAndQuiz

Free couple games, played over a link. First game: **"How Well Do You Know Me?"**

1. You answer 10 questions about yourself.
2. The site gives you a link to send to your partner.
3. Your partner guesses your answers and gets a score, then makes their own quiz.

No login, no database, no app. The answers live in the link itself (after the `#`), so the
site is fully static and free to host.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
```

## Build

```bash
npm run build    # static site in ./out
```

## Deploy on Vercel
1. Import the GitHub repo in Vercel (framework: Next.js, default settings).
2. In Vercel → Project → Settings → Environment Variables, add `MONGODB_URI` (MongoDB Atlas connection string; see `.env.example`). Redeploy after adding it.
3. In MongoDB Atlas → Network Access, allow `0.0.0.0/0` (Vercel functions have changing IPs). Use a strong database password.

4. Optional accounts: add `RESEND_API_KEY`, `EMAIL_FROM` and `SITE_URL` (see `.env.example`). Needs a domain verified in Resend. Without them, `/account/` shows "coming soon"; everything else works.

Without `MONGODB_URI` in production, the site still works: quiz links fall back to the old long `/play/#…` format and creators can't see results.

### Data
- `quizzes`: `{ _id: shortId, n, a, ownerHash, createdAt }`. `results`: `{ quizId, partner, guesses, score, total, createdAt }`.
- Both auto-delete after 180 days (TTL index on `createdAt`, created automatically).
- Accounts (optional, creators only): `users` `{ _id, email (unique), name, createdAt, lastLoginAt }`, `loginTokens` (hashed, 15-min TTL), `sessions` (hashed, 30-day TTL, httpOnly cookie `kq_session`). Quizzes get `ownerUserId` when made while signed in or claimed from the phone. Deleting an account deletes its quizzes and results.
- The creator's secret token is kept only on their phone; the database stores its SHA-256 hash.

## Project layout

| Path | What it is |
| --- | --- |
| `app/page.tsx` | Home page |
| `app/create/page.tsx` | Make a quiz and get the share link |
| `app/play/page.tsx` | Partner plays the quiz and sees the score |
| `lib/questions.ts` | Question bank (add new questions at the end only) |
| `lib/quizLink.ts` | Encodes/decodes a quiz into the link |

## Notes

- Shared links store question numbers, so never reorder or delete questions in
  `lib/questions.ts`. Only append new ones.
- The answers in a link are lightly encoded, not encrypted. That's fine for a fun quiz.
