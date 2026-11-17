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

1. Import this repo at vercel.com/new (framework: Next.js, no settings to change).
2. Add the domain `kissandquiz.com` under Project → Settings → Domains, then point
   your DNS at Vercel as it shows you.

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
