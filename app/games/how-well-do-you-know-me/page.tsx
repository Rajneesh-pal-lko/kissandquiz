import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How Well Does Your Partner Know You? Free Couple Quiz | KissAndQuiz",
  description:
    "Free couple quiz. Answer 10 questions about yourself, send the link to your partner, and see how well they really know you. No app, no login.",
  openGraph: {
    title: "How well do you know me? 💘",
    description: "Take my couple quiz on KissAndQuiz and see your score.",
    type: "website",
  },
};

export default function HowWellDoYouKnowMe() {
  return (
    <main className="wrap">
      <header className="topbar">
        <Link href="/" className="logo">
          Kiss<span>And</span>Quiz
        </Link>
        <Link href="/" className="back">
          ← All games
        </Link>
      </header>

      <h1>How well does your partner really know you? 💘</h1>
      <p className="lead">
        Answer 10 quick questions about yourself, send the link to your partner, and watch them
        guess. Free, no app, no login.
      </p>

      <Link href="/create/" className="btn">
        Create my quiz
      </Link>
      <p className="muted center tip">
        Already made one? <Link href="/results/">See your partner's score →</Link>
      </p>

      <div className="card">
        <h2>How it works</h2>
        <ol className="steps">
          <li>Answer 10 questions about you (takes 1 minute).</li>
          <li>Send your link on WhatsApp or Instagram.</li>
          <li>Your partner guesses your answers and gets a score.</li>
          <li>Screenshot the score and tease them about it 😄</li>
        </ol>
      </div>

      <footer>Made with ❤️ for couples · kissandquiz.com</footer>
    </main>
  );
}
