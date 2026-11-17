import type { Metadata } from "next";
import Link from "next/link";
import { AnimatedEmoji, Emoji } from "@/components/Emoji";
import QuizPreview from "@/components/QuizPreview";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import StickyCta from "@/components/StickyCta";
import { QUESTIONS, QUIZ_LENGTH, activeQuestionIds, type Category } from "@/lib/questions";
import { SHARE_IMAGE } from "@/lib/seo";
import { CATEGORY_UI } from "@/lib/ui";

export const metadata: Metadata = {
  title: "How Well Does Your Partner Know You? Free Couple Quiz | KissAndQuiz",
  description:
    "Free couple quiz. Answer 10 questions about yourself, send the link to your partner, and see how well they really know you. No app, no login.",
  openGraph: {
    title: "How well do you know me? 💘",
    description: "Take my couple quiz on KissAndQuiz and see your score.",
    type: "website",
    images: [SHARE_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [SHARE_IMAGE.url] },
};

const FAQ: { q: string; a: string }[] = [
  { q: "Is it really free?", a: "Yes. Making a quiz and playing it are free. There's no trial and no card needed." },
  {
    q: "Does my partner need to install an app?",
    a: "No. They tap your link on WhatsApp or Instagram and play in their browser. No login either.",
  },
  {
    q: "How do I see my partner's score?",
    a: "After they play, open \"My results\" on the phone you made the quiz on. To see results on any phone, save your quizzes to a free account, or use the private results link you get when you make the quiz.",
  },
  {
    q: "Can I change the questions?",
    a: "Yes. Tap \"Swap\" on any question to get a different one, and edit any answer before you create your link.",
  },
  {
    q: "What happens to my answers?",
    a: "We keep your name, your answers, and your partner's guesses (plus their name, if they add it). Quizzes are deleted automatically after 6 months. Accounts are optional; if you make one, we also keep your email. See our privacy policy for details.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

export default function HowWellDoYouKnowMe() {
  const active = activeQuestionIds();
  const counts = active.reduce<Record<string, number>>((acc, id) => {
    const c = QUESTIONS[id].category;
    acc[c] = (acc[c] ?? 0) + 1;
    return acc;
  }, {});
  const categories = Object.keys(CATEGORY_UI) as Category[];

  return (
    <>
      <SiteHeader back={{ href: "/", label: "← All games" }} />
      <main className="wrap wide">
        <section className="game-hero">
          <div>
            <p className="eyebrow rise">
              <Emoji code="1f498" size={20} eager /> Couple quiz · 2 min
            </p>
            <h1 className="rise d1">
              How well does your partner <span className="hl">really</span> know you?
            </h1>
            <p className="lead rise d2">
              Answer {QUIZ_LENGTH} quick questions about yourself, send the link to your partner, and watch them guess.
              Free, no app, no login.
            </p>
            <div className="rise d3" id="hero-cta" style={{ maxWidth: 420 }}>
              <Link href="/create/" className="btn">
                Create my quiz — it&apos;s free
              </Link>
            </div>
            <p className="hero-sub rise d3">
              Already made one? <Link href="/results/">See your partner&apos;s score →</Link>
            </p>
          </div>
          <QuizPreview />
        </section>

        <section className="section" aria-labelledby="how-title">
          <h2 id="how-title" className="section-title" style={{ marginBottom: 18 }}>
            How it works
          </h2>
          <ol className="step-list">
            <li>
              <span className="n">1</span> Answer {QUIZ_LENGTH} questions about you (about a minute).
            </li>
            <li>
              <span className="n">2</span> Send your link on WhatsApp or Instagram.
            </li>
            <li>
              <span className="n">3</span> Your partner guesses your answers and gets a score.
            </li>
            <li>
              <span className="n">4</span> See their score and every answer they got wrong. Then tease them about it.
            </li>
          </ol>
        </section>

        <section className="section" aria-labelledby="topics-title">
          <div className="section-head">
            <h2 id="topics-title" className="section-title">
              {active.length} questions, 7 topics
            </h2>
          </div>
          <p className="muted" style={{ marginTop: -6, marginBottom: 16 }}>
            Every quiz mixes topics, so no two quizzes are the same.
          </p>
          <div className="topic-grid">
            {categories.map((c) => (
              <span key={c} className="topic">
                <Emoji code={CATEGORY_UI[c].icon} size={26} />
                {CATEGORY_UI[c].label}
                <span className="muted">· {counts[c] ?? 0}</span>
              </span>
            ))}
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
          <AnimatedEmoji name="sparkling_heart" code="1f496" size={80} />
          <h2>Ready? It takes one minute.</h2>
          <p>Your partner only sees each of your answers after they guess it.</p>
          <Link href="/create/" className="btn">
            Create my quiz
          </Link>
        </section>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      </main>
      <SiteFooter />
      <StickyCta href="/create/" label="Create my quiz — free" watch="hero-cta" />
    </>
  );
}
