import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy policy | KissAndQuiz",
  description: "What KissAndQuiz stores, why, and how to delete it.",
};

// Plain-language privacy notice. Not legal advice; review before monetising or scaling.
export default function PrivacyPage() {
  return (
    <main className="wrap">
      <header className="topbar">
        <Link href="/" className="logo">
          Kiss<span>And</span>Quiz
        </Link>
      </header>
      <h1>Privacy policy</h1>
      <p className="muted">Last updated: 18 November 2026</p>

      <div className="card prose">
        <h2>What we store</h2>
        <ul>
          <li>
            <strong>Quizzes:</strong> the first name you type and your answers, so your partner can play.
          </li>
          <li>
            <strong>Results:</strong> your partner's guesses, score and (if they type it) their name, so you can see how
            they did.
          </li>
          <li>
            <strong>Accounts (optional):</strong> your name and email, so you can sign in on any phone. One account per
            email.
          </li>
          <li>
            <strong>On your phone:</strong> your quiz drafts and the private keys to your quizzes' results, in your
            browser's storage.
          </li>
        </ul>

        <h2>What we don't do</h2>
        <ul>
          <li>No passwords. You sign in with a one-time email link.</li>
          <li>We don't sell your data or send you marketing emails without asking first.</li>
          <li>Playing a quiz never needs an account or an email.</li>
        </ul>

        <h2>How long we keep it</h2>
        <ul>
          <li>Quizzes and results are deleted automatically after 6 months.</li>
          <li>Sign-in links expire after 15 minutes; sign-ins last 30 days.</li>
          <li>Your account stays until you delete it.</li>
        </ul>

        <h2>Your choices</h2>
        <ul>
          <li>
            Delete your account any time from <Link href="/account/">My account</Link>. This also deletes the quizzes
            saved in it and their results.
          </li>
          <li>Questions or requests: contact the site owner (contact email coming soon).</li>
        </ul>

        <h2>Who processes data for us</h2>
        <ul>
          <li>Vercel (hosting), MongoDB Atlas (database), and an email provider (sign-in emails).</li>
        </ul>
      </div>
    </main>
  );
}
