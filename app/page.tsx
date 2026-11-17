import Link from "next/link";
import { AnimatedEmoji, Emoji } from "@/components/Emoji";
import QuizPreview from "@/components/QuizPreview";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import StickyCta from "@/components/StickyCta";
import { GAMES, gameHref, type Game } from "@/lib/games";

function FeaturedGame({ game }: { game: Game }) {
  return (
    <Link href={gameHref(game)} className="feature">
      <div className="feature-art">
        <AnimatedEmoji name="heart_with_arrow" code={game.icon} size={150} className="main" />
        <Emoji code="1f970" size={50} className="float f1" />
        <Emoji code="2753" size={40} className="float f3" />
        <Emoji code="1f3c6" size={46} className="float f2" />
      </div>
      <div className="feature-body">
        <div className="meta-row">
          <span className="pill light">{game.category}</span>
          <span className="pill light">{game.time}</span>
          <span className="pill light">10 questions</span>
        </div>
        <h3>{game.title}</h3>
        <p>{game.tagline}</p>
        <span className="btn light auto">Play now →</span>
      </div>
    </Link>
  );
}

function GameCard({ game }: { game: Game }) {
  return (
    <article
      className="game-card"
      aria-label={`${game.title} (coming soon)`}
      style={{ "--a": game.colors[0], "--b": game.colors[1] } as React.CSSProperties}
    >
      <div className="game-art">
        <Emoji code={game.icon} size={76} />
        <span className="badge">Coming soon</span>
      </div>
      <div className="game-body">
        <div className="game-meta">
          <span>{game.category}</span>
          <span aria-hidden>·</span>
          <span>{game.time}</span>
        </div>
        <h3>{game.title}</h3>
        <p>{game.tagline}</p>
      </div>
    </article>
  );
}

export default function Home() {
  const live = GAMES.filter((g) => g.status === "live");
  const soon = GAMES.filter((g) => g.status === "soon");

  return (
    <>
      <SiteHeader />
      <main className="wrap wide">
        <section className="hero">
          <div>
            <p className="eyebrow rise">
              <Emoji code="2728" size={20} eager /> Free games for couples
            </p>
            <h1 className="rise d1">
              Couple games you play <span className="hl">over one link</span>
            </h1>
            <p className="lead rise d2">
              Quizzes, dares and date ideas for two. Send a link on WhatsApp, your partner taps it and plays. No app, no
              login, no paywall.
            </p>
            <div className="hero-ctas rise d3" id="hero-cta">
              <Link href="/create/" className="btn">
                Create my couple quiz
              </Link>
              <Link href="#games" className="btn ghost">
                See all games
              </Link>
            </div>
            <ul className="chips rise d3" aria-label="Highlights">
              <li className="chip">
                <Emoji code="2705" size={18} eager /> 100% free
              </li>
              <li className="chip">
                <Emoji code="1f512" size={18} eager /> No login
              </li>
              <li className="chip">
                <Emoji code="23f1" size={18} eager /> 2 minutes
              </li>
              <li className="chip">
                <Emoji code="1f4f2" size={18} eager /> Works in WhatsApp
              </li>
            </ul>
          </div>
          <QuizPreview />
        </section>

        <section className="section" aria-labelledby="how-title">
          <div className="section-head">
            <h2 id="how-title" className="section-title">
              How it works
            </h2>
          </div>
          <ol className="steps-grid">
            <li className="step-card">
              <span className="step-num">1</span>
              <Emoji code="270d" size={56} />
              <h3>Answer about you</h3>
              <p>10 quick questions about your habits, favourites and quirks. Takes a minute.</p>
            </li>
            <li className="step-card">
              <span className="step-num">2</span>
              <Emoji code="1f48c" size={56} />
              <h3>Send one link</h3>
              <p>Share it on WhatsApp or Instagram. Your partner opens it in the browser.</p>
            </li>
            <li className="step-card">
              <span className="step-num">3</span>
              <Emoji code="1f3c6" size={56} />
              <h3>See who wins</h3>
              <p>They guess your answers. You both see the score and every answer they missed.</p>
            </li>
          </ol>
        </section>

        <section className="section" id="games" aria-labelledby="play-title">
          <div className="section-head">
            <h2 id="play-title" className="section-title">
              Play now
            </h2>
          </div>
          {live.map((g) => (
            <FeaturedGame key={g.slug} game={g} />
          ))}
        </section>

        <section className="section" aria-labelledby="soon-title">
          <div className="section-head">
            <h2 id="soon-title" className="section-title">
              Coming soon
            </h2>
            <p className="muted">We&apos;re building these next</p>
          </div>
          <div className="rail">
            {soon.map((g) => (
              <GameCard key={g.slug} game={g} />
            ))}
          </div>
        </section>

        <section className="section values" aria-label="Why KissAndQuiz">
          <div className="value">
            <Emoji code="1f381" size={44} />
            <div>
              <h3>Free to play</h3>
              <p>Every game here is free. No paywall, no trial, no card.</p>
            </div>
          </div>
          <div className="value">
            <Emoji code="1f4f2" size={44} />
            <div>
              <h3>No app, no login</h3>
              <p>Your partner taps the link and plays in their browser.</p>
            </div>
          </div>
          <div className="value">
            <Emoji code="1f512" size={44} />
            <div>
              <h3>Private by design</h3>
              <p>No account needed. Quizzes are deleted automatically after 6 months.</p>
            </div>
          </div>
        </section>

        <section className="cta-band">
          <AnimatedEmoji name="revolving_hearts" code="1f49e" size={84} />
          <h2>How well does your partner really know you?</h2>
          <p>Make your quiz in a minute and find out tonight.</p>
          <Link href="/create/" className="btn">
            Create my couple quiz
          </Link>
        </section>
      </main>
      <SiteFooter />
      <StickyCta href="/create/" label="Create my couple quiz" watch="hero-cta" />
    </>
  );
}
