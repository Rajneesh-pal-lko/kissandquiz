import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Privacy policy | KissAndQuiz",
  description: "What KissAndQuiz stores, why, and how to delete it.",
};

// Plain-language privacy notice. Not legal advice; review before monetising or scaling.
export default function PrivacyPage() {
  return (
    <>
    <SiteHeader />
    <main className="wrap flow">
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
            <strong>Two-player games (like Would You Rather):</strong> both players&apos; first names, picks and guesses,
            and the scores, so you can both see the reveal. Each player gets a private key on their phone; we store only
            a scrambled (hashed) copy of it.
          </li>
          <li>
            <strong>Kiss Wallet:</strong> the name you play with, and for each partner you play with a shared
            &quot;khata&quot;: how many kisses each of you owes, and a history (which game, how many kisses, when). Your
            wallet&apos;s private key stays on your phone; we store only a hashed copy. Only you and that partner can see
            your khata.
          </li>
          <li>
            <strong>Spam protection:</strong> a scrambled (hashed) version of your IP address when you start or join a
            game, kept for up to 2 hours.
          </li>
          <li>
            <strong>Accounts (optional):</strong> your name and email, so you can sign in on any phone. One account per
            email.
          </li>
          <li>
            <strong>On your phone:</strong> your quiz and game drafts, the private keys to your quizzes&apos; results and
            your games, in your browser&apos;s storage.
          </li>
        </ul>

        <h2>What we don't do</h2>
        <ul>
          <li>No passwords. You sign in with a one-time email link.</li>
          <li>We don't sell your data or send you marketing emails without asking first.</li>
          <li>Playing a quiz or a game never needs an account or an email.</li>
          <li>Your partner only sees your answers in a game after answering the same question themselves.</li>
        </ul>

        <h2>How long we keep it</h2>
        <ul>
          <li>Quizzes, results and two-player games are deleted automatically after 6 months.</li>
          <li>Kiss Wallets and khatas are deleted after 6 months without any activity; history lines after 6 months.</li>
          <li>Sign-in links expire after 15 minutes; sign-ins last 30 days.</li>
          <li>Your account stays until you delete it.</li>
        </ul>

        <h2>Your choices</h2>
        <ul>
          <li>
            Delete your account any time from <Link href="/account/">My account</Link>. This also deletes the quizzes
            saved in it and their results. Two-player games are not linked to accounts; they are deleted after 6 months.
          </li>
          <li>
            Delete your Kiss Wallet any time from the <Link href="/wallet/">Kiss Wallet</Link> page. This deletes your khatas
            and their history for both of you.
          </li>
          <li>Questions or requests: contact the site owner (contact email coming soon).</li>
        </ul>

        <h2>Who processes data for us</h2>
        <ul>
          <li>Vercel (hosting), MongoDB Atlas (database), and an email provider (sign-in emails).</li>
        </ul>
      </div>
    </main>
    <SiteFooter />
    </>
  );
}
