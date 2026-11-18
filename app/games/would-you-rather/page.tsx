import type { Metadata } from "next";
import Link from "next/link";
import { AnimatedEmoji, Emoji } from "@/components/Emoji";
import WyrPreview from "@/components/reveal/WyrPreview";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import StickyCta from "@/components/StickyCta";
import { WYR } from "@/lib/reveal/configs";
import { lcFirst as lc } from "@/lib/reveal/rules";
import { SHARE_IMAGE } from "@/lib/seo";
import { WYR_CATEGORY_UI, WYR_QUESTIONS, WYR_SAMPLE_IDS, type WyrCategory } from "@/lib/wyrQuestions";

export const metadata: Metadata = {
  title: "Would You Rather for Couples: Free Game with Your Partner | KissAndQuiz",
  description:
    "120 fun would you rather questions for couples. Pick your answer, guess your partner's, and see who knows who better. Free, no app, no login.",
  alternates: { canonical: "/games/would-you-rather/" },
  openGraph: {
    title: "Would You Rather for Couples 💞",
    description: "Pick your answer, guess your partner's, and see who knows who better. Free, over one link.",
    type: "website",
    images: [SHARE_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [SHARE_IMAGE.url] },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "How do you play Would You Rather as a couple?",
    a: "Each of you picks between two options, like \"Ghar ka khana forever or restaurant food every night?\". Here you also guess what your partner picked. After each round you see both picks and both guesses, and at the end whoever guessed more right wins.",
  },
  {
    q: "Do we need to be together to play?",
    a: "No. One of you answers first and sends a link on WhatsApp. The other plays on their own phone, whenever they like. It works long distance too.",
  },
  {
    q: "Is it free? Do we need an app?",
    a: "It's free, with no app and no login. Your partner just taps the link and plays in the browser.",
  },
  {
    q: "Can my partner see my answers before they play?",
    a: "No. Your partner only sees your answer for a round after they have answered it themselves. This is checked on our server, not just hidden on the screen.",
  },
  {
    q: "Can someone else play our game?",
    a: "No. Each game is for two people. The first person who opens your link and joins becomes your partner in that game. Anyone else who opens it sees that the game is full.",
  },
  {
    q: "What happens to our answers?",
    a: "We keep your names, picks and guesses so you can both see the reveal. Games are deleted automatically after 6 months. See our privacy policy for details.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};


export default function WouldYouRatherPage() {
  const active = WYR_QUESTIONS.filter((q) => !q.retired);
  const counts = active.reduce<Record<string, number>>((acc, q) => {
    acc[q.category] = (acc[q.category] ?? 0) + 1;
    return acc;
  }, {});
  const categories = Object.keys(WYR_CATEGORY_UI) as WyrCategory[];

  return (
    <>
      <SiteHeader back={{ href: "/", label: "← All games" }} />
      <main className="wrap wide">
        <section className="game-hero">
          <div>
            <p className="eyebrow rise">
              <Emoji code="1f914" size={20} eager /> Classic couple game · 3 min
            </p>
            <h1 className="rise d1">Would You Rather for Couples</h1>
            <p className="lead rise d2">
              Pick your answer, then guess what your partner picked. Send one link, they play on their phone, and you both see
              who knows who better. Free, no app, no login.
            </p>
            <div className="rise d3" id="hero-cta" style={{ maxWidth: 420 }}>
              <Link href={WYR.start} className="btn">
                Start a game — it&apos;s free
              </Link>
            </div>
            <p className="hero-sub rise d3">
              Also try: <Link href="/games/how-well-do-you-know-me/">How well do you know me? →</Link>
            </p>
          </div>
          <WyrPreview />
        </section>

        <section className="section" aria-labelledby="how-title">
          <h2 id="how-title" className="section-title" style={{ marginBottom: 18 }}>
            How it works
          </h2>
          <ol className="step-list">
            <li>
              <span className="n">1</span> Answer {WYR.rounds} &quot;would you rather&quot; questions, and guess what your partner
              would pick.
            </li>
            <li>
              <span className="n">2</span> Send your link on WhatsApp or Instagram.
            </li>
            <li>
              <span className="n">3</span> Your partner picks and guesses too. After every round they see both answers.
            </li>
            <li>
              <span className="n">4</span> Whoever guessed more right wins. Then they start a new game and send it back to you.
            </li>
          </ol>
        </section>

        <section className="section" aria-labelledby="topics-title">
          <div className="section-head">
            <h2 id="topics-title" className="section-title">
              {active.length} questions, {categories.length} topics
            </h2>
          </div>
          <p className="muted" style={{ marginTop: -6, marginBottom: 16 }}>
            Every game mixes topics, with a little Hinglish and a lot of filmy drama.
          </p>
          <div className="topic-grid">
            {categories.map((c) => (
              <span key={c} className="topic">
                <Emoji code={WYR_CATEGORY_UI[c].icon} size={26} />
                {WYR_CATEGORY_UI[c].label}
                <span className="muted">· {counts[c] ?? 0}</span>
              </span>
            ))}
          </div>
        </section>

        <section className="section" aria-labelledby="samples-title">
          <h2 id="samples-title" className="section-title" style={{ marginBottom: 18 }}>
            {WYR_SAMPLE_IDS.length} would you rather questions for couples
          </h2>
          <div className="card">
            <ol className="sample-list">
              {WYR_SAMPLE_IDS.map((i) => {
                const q = WYR_QUESTIONS[i];
                return (
                  <li key={i}>
                    Would you rather <strong>{lc(q.a)}</strong> or <strong>{lc(q.b)}</strong>?
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <section className="section" aria-labelledby="faq-title">
          <h2 id="faq-title" className="section-title" style={{ marginBottom: 18 }}>
            Questions couples ask
          </h2>
          <div className="faq">
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="cta-band">
          <AnimatedEmoji name="revolving_hearts" code="1f49e" size={80} />
          <h2>Ghar ka khana or restaurant every night?</h2>
          <p>Find out what your partner would pick, and if they can guess yours.</p>
          <Link href={WYR.start} className="btn">
            Start a game
          </Link>
        </section>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      </main>
      <SiteFooter />
      <StickyCta href={WYR.start} label="Start a game — free" watch="hero-cta" />
    </>
  );
}
