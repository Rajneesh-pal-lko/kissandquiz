// Site-wide header and footer. Plain components (no hooks), usable from server and client pages.
import Link from "next/link";
import { Emoji } from "./Emoji";

type HeaderProps = {
  /** Replace "My results" with a back link, e.g. { href: "/", label: "← All games" }. */
  back?: { href: string; label: string };
  /** Hide the "Play free" button (e.g. while making a quiz). */
  hideCta?: boolean;
};

export function SiteHeader({ back, hideCta }: HeaderProps) {
  return (
    <header className="site-header">
      <div className="site-header-in">
        <Link href="/" className="logo" aria-label="KissAndQuiz home">
          <Emoji code="1f498" size={30} eager className="logo-mark" />
          <span>
            Kiss<em>And</em>Quiz
          </span>
        </Link>
        <nav className="nav" aria-label="Main">
          {back ? (
            <Link href={back.href} className="nav-link">
              {back.label}
            </Link>
          ) : (
            <>
              <Link href="/results/" className="nav-link wide-only">
                My results
              </Link>
              <Link href="/account/" className="nav-link">
                Account
              </Link>
            </>
          )}
          {!hideCta && (
            <Link href="/create/" className="nav-cta">
              Play free
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-in">
        <Link href="/" className="logo" aria-label="KissAndQuiz home">
          <Emoji code="1f498" size={26} className="logo-mark" />
          <span>
            Kiss<em>And</em>Quiz
          </span>
        </Link>
        <p>Free couple games you play over a link. No app, no login, no paywall.</p>
        <nav className="footer-links" aria-label="Footer">
          <Link href="/">All games</Link>
          <Link href="/games/how-well-do-you-know-me/">Couple quiz</Link>
          <Link href="/create/">Create a quiz</Link>
          <Link href="/results/">My results</Link>
          <Link href="/account/">My account</Link>
          <Link href="/privacy/">Privacy</Link>
        </nav>
        <p className="fine">
          Made with <Emoji code="1f496" size={16} alt="love" /> for couples · kissandquiz.com · Emoji art: Microsoft
          Fluent Emoji (MIT)
        </p>
      </div>
    </footer>
  );
}
