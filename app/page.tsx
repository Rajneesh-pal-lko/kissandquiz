import Link from "next/link";
import { GAMES, gameHref, type Game } from "@/lib/games";

function GameCard({ game }: { game: Game }) {
  const live = game.status === "live";
  const inner = (
    <>
      <div
        className="game-art"
        style={{ background: `linear-gradient(135deg, ${game.colors[0]}, ${game.colors[1]})` }}
      >
        <span className="game-emoji" aria-hidden>
          {game.emoji}
        </span>
        <span className={live ? "badge live" : "badge"}>{live ? "Play now" : "Coming soon"}</span>
      </div>
      <div className="game-body">
        <div className="game-meta">
          <span>{game.category}</span>
          <span>·</span>
          <span>{game.time}</span>
        </div>
        <h3>{game.title}</h3>
        <p>{game.tagline}</p>
      </div>
    </>
  );

  return live ? (
    <Link href={gameHref(game)} className="game-card">
      {inner}
    </Link>
  ) : (
    <div className="game-card soon" aria-disabled="true">
      {inner}
    </div>
  );
}

export default function Home() {
  const live = GAMES.filter((g) => g.status === "live");
  const soon = GAMES.filter((g) => g.status === "soon");

  return (
    <main className="wrap wide">
      <header className="topbar">
        <Link href="/" className="logo">
          Kiss<span>And</span>Quiz
        </Link>
      </header>

      <section className="hero">
        <h1>Free games for couples 💞</h1>
        <p className="lead">
          Quizzes, dares and date ideas you play together by sharing a link. No app, no login, no
          paywall.
        </p>
      </section>

      <h2 className="section-title">Play now</h2>
      <div className="game-grid">
        {live.map((g) => (
          <GameCard key={g.slug} game={g} />
        ))}
      </div>

      <h2 className="section-title">Coming soon</h2>
      <div className="game-grid">
        {soon.map((g) => (
          <GameCard key={g.slug} game={g} />
        ))}
      </div>

      <footer>Made with ❤️ for couples · kissandquiz.com</footer>
    </main>
  );
}
