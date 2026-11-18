"use client";

// The game screen behind a shared link (/w/<id>/ for Would You Rather).
// - Partner B: join with a name → each round "Your pick" → "Their pick?" → reveal → final.
// - Creator A (token on this phone, or the private #token link): waiting / partner's progress / full reveal.
// - Anyone else once two players are in: "This game already has two players".
// The server only sends what this player may see (lib/reveal/view.ts).
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatedEmoji, Emoji, WhatsAppIcon } from "@/components/Emoji";
import { SiteHeader } from "@/components/SiteChrome";
import Choices from "@/components/reveal/Choices";
import FinalResult from "@/components/reveal/FinalResult";
import { ensureWallet, walletHeader } from "@/lib/wallet/client";
import { kisses } from "@/lib/wallet/rules";
import RoundReveal from "@/components/reveal/RoundReveal";
import { configFor } from "@/lib/reveal/configs";
import { REMATCH_KEY, forgetMyGame, getMyGame, saveMyGame, updateMyGame } from "@/lib/reveal/myGames";
import { NAME_MAX, fill, initial, nextRound, sameName } from "@/lib/reveal/rules";
import type { GameType, GameView, RevealConfig } from "@/lib/reveal/types";
import { load, save } from "@/lib/storage";

type Screen =
  | { kind: "loading" }
  | { kind: "offline" }
  | { kind: "gone" }
  | { kind: "join" }
  | { kind: "confirm" }
  | { kind: "full" }
  | { kind: "play"; game: GameView };

/** Local, per-tab progress so a refresh lands on the same step. */
type Ui = { reveal: number | null; pending: { round: number; pick: number } | null };

const POLL_MS = 10_000;
const TOKEN_RE = /^[A-Za-z0-9_-]{20,100}$/;

/** Broken / expired / offline screens. Takes the game type (not the config) so server pages can render it. */
export function GameProblem({ reason, type }: { reason: "broken" | "expired" | "offline"; type: GameType }) {
  const cfg = configFor(type) as RevealConfig;
  return (
    <>
      <SiteHeader />
      <main className="wrap flow">
        <div className="card flow-card center slide-in">
          <div className="name-hero">
            <Emoji code={reason === "offline" ? "1f914" : "1f494"} size={80} eager />
          </div>
          {reason === "offline" ? (
            <>
              <h2>Couldn&apos;t load this game</h2>
              <p className="muted">Check your internet and try again.</p>
              <button className="btn" onClick={() => window.location.reload()}>
                Try again
              </button>
            </>
          ) : (
            <>
              <h2>{reason === "expired" ? "This game has expired" : "This game link looks broken"}</h2>
              <p className="muted">
                {reason === "expired"
                  ? "Games are deleted after 6 months. Start a new one and send it to your partner."
                  : "WhatsApp sometimes cuts links. Ask your partner to send the full link again, or start your own game."}
              </p>
              <Link href={cfg.start} className="btn">
                Start a new game
              </Link>
            </>
          )}
          <Link href="/" className="btn ghost">
            See all games
          </Link>
        </div>
      </main>
    </>
  );
}

type Props = { type: GameType; id: string; creator: string; full: boolean };

export default function RevealGame({ type, id, creator }: Props) {
  const cfg = configFor(type) as RevealConfig;
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>({ kind: "loading" });
  const [token, setToken] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [ui, setUi] = useState<Ui>({ reveal: null, pending: null });
  const [tap, setTap] = useState<{ round: number; sub: "pick" | "guess"; i: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [joinStake, setJoinStake] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const linkToken = useRef<string | null>(null);
  const uiKey = `kq.reveal.ui.${id}`;

  const showGame = useCallback(
    (game: GameView) => {
      setScreen({ kind: "play", game });
      if (game.me === 0 && game.partner) updateMyGame(id, { partner: game.partner });
      if (game.me === 1) updateMyGame(id, { partner: game.creator });
    },
    [id],
  );

  const fetchState = useCallback(
    async (tok: string | null, fromLink: boolean) => {
      try {
        const res = await fetch(`/api/game/${id}/state/`, {
          headers: tok ? { "x-player-token": tok } : {},
          cache: "no-store",
        });
        if (res.status === 404) return setScreen({ kind: "gone" });
        if (!res.ok) return setScreen({ kind: "offline" });
        const { game } = (await res.json()) as { game: GameView };
        if (game.me !== null && tok) {
          if (fromLink || !getMyGame(id)) {
            saveMyGame({
              id,
              type,
              token: tok,
              role: game.me,
              name: game.me === 0 ? game.creator : game.partner ?? "",
              partner: game.me === 0 ? game.partner ?? null : game.creator,
              createdAt: new Date().toISOString(),
            });
          }
          setToken(tok);
          return showGame(game);
        }
        // Token missing or not valid for this game.
        if (tok) {
          if (getMyGame(id)?.token === tok) forgetMyGame(id);
          if (fromLink) setNotice("That private link doesn't match this game.");
        }
        setToken(null);
        setJoinStake(game.kiss ? game.stake ?? 1 : 0);
        setScreen({ kind: game.full ? "full" : "join" });
      } catch {
        setScreen({ kind: "offline" });
      }
    },
    [id, type, showGame],
  );

  // First load: private link (#token) → saved token on this phone → stranger.
  useEffect(() => {
    function init() {
      const hash = window.location.hash.slice(1);
      if (hash) {
        // Keep the link's token in a ref: the #hash is removed right away, and this effect
        // can run twice (React dev mode) before the token is saved on the phone.
        linkToken.current = TOKEN_RE.test(hash) ? hash : null;
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
      const fromLink = !!linkToken.current;
      const tok = linkToken.current ?? getMyGame(id)?.token ?? null;
      setNotice("");
      fetchState(tok, fromLink);
    }
    const savedUi = load<Ui>(uiKey, "session");
    if (savedUi && typeof savedUi === "object") setUi({ reveal: savedUi.reveal ?? null, pending: savedUi.pending ?? null });
    init();
    // A private link pasted into a tab that already shows this game only changes the #hash.
    window.addEventListener("hashchange", init);
    return () => {
      window.removeEventListener("hashchange", init);
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    save(uiKey, ui, "session");
  }, [ui, uiKey]);

  // Creator waiting for the partner: refresh every few seconds while the tab is visible.
  const game = screen.kind === "play" ? screen.game : null;
  const waiting = !!game && game.me === 0 && !game.done;
  useEffect(() => {
    if (!waiting || !token) return;
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible") fetchState(token, false);
    }, POLL_MS);
    return () => window.clearInterval(t);
  }, [waiting, token, fetchState]);

  // Scroll to top whenever the step changes.
  const stepKey =
    screen.kind !== "play"
      ? screen.kind
      : `${screen.game.done}-${ui.reveal}-${nextRound(screen.game.mine ?? [])}-${ui.pending ? "g" : "p"}`;
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [stepKey]);

  async function join(confirmed = false) {
    const clean = name.replace(/\s+/g, " ").trim();
    if (!clean || busy) return;
    if (!confirmed && sameName(clean, creator)) return setScreen({ kind: "confirm" });
    setBusy(true);
    setError("");
    try {
      await ensureWallet(clean); // Kiss Wallet, optional (rule B4)
      const res = await fetch(`/api/game/${id}/join/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...walletHeader() },
        body: JSON.stringify({ name: clean }),
      });
      if (res.status === 409) return setScreen({ kind: "full" });
      if (res.status === 404) return setScreen({ kind: "gone" });
      if (res.status === 429) return setError("Too many players joined from this network just now. Try again in a little while.");
      if (!res.ok) return setError("Couldn't join right now. Check your internet and try again.");
      const data = (await res.json()) as { token: string; game: GameView };
      saveMyGame({ id, type, token: data.token, role: 1, name: data.game.partner ?? clean, partner: creator, createdAt: new Date().toISOString() });
      setToken(data.token);
      setUi({ reveal: null, pending: null });
      showGame(data.game);
    } catch {
      setError("Couldn't join right now. Check your internet and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(round: number, pick: number, guess: number | null) {
    if (!token || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/game/${id}/round/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-player-token": token },
        body: JSON.stringify({ round, pick, guess }),
      });
      const data = (await res.json().catch(() => null)) as { game?: GameView | null; error?: string } | null;
      if (res.ok && data?.game) {
        showGame(data.game);
        setUi({ reveal: round, pending: null });
      } else if (res.status === 409 && data?.game) {
        // Already saved (double tap / retry) or out of step: catch up with the server.
        showGame(data.game);
        setUi({ reveal: data.game.mine?.[round] ? round : null, pending: null });
      } else if (res.status === 404) {
        setScreen({ kind: "gone" });
      } else {
        setError("Couldn't save your answer. Check your internet and tap again.");
      }
    } catch {
      setError("Couldn't save your answer. Check your internet and tap again.");
    } finally {
      setBusy(false);
      setTap(null);
    }
  }

  function playAgain(myName: string, otherName: string) {
    save(REMATCH_KEY, { type, name: myName, partner: otherName });
    router.push(cfg.start);
  }

  async function copyLink(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore.
    }
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = `${origin}${cfg.linkPrefix}${id}/`;

  // ---------- Screens ----------
  if (screen.kind === "loading")
    return (
      <>
        <SiteHeader hideCta />
        <main className="wrap flow">
          <p className="muted center" style={{ marginTop: 40 }}>
            Loading…
          </p>
        </main>
      </>
    );
  if (screen.kind === "offline") return <GameProblem reason="offline" type={type} />;
  if (screen.kind === "gone") return <GameProblem reason="expired" type={type} />;

  if (screen.kind === "full")
    return (
      <>
        <SiteHeader />
        <main className="wrap flow">
          <div className="card flow-card center slide-in">
            <div className="name-hero">
              <Emoji code="1f91d" size={80} eager />
            </div>
            <h2>This game already has two players</h2>
            <p className="muted">
              {creator}&apos;s game is just for two. Start your own and send it to someone special.
            </p>
            {notice && <p className="feedback bad">{notice}</p>}
            <Link href={cfg.start} className="btn">
              Start your own game
            </Link>
            <Link href="/" className="btn ghost">
              See all games
            </Link>
            <p className="muted tip">Is this your game? Open the link in the browser where you played it.</p>
          </div>
        </main>
      </>
    );

  if (screen.kind === "join" || screen.kind === "confirm") {
    const clean = name.replace(/\s+/g, " ").trim();
    const stake = screen.kind === "join" ? joinStake : 0;
    return (
      <>
        <SiteHeader hideCta />
        <main className="wrap flow">
          {screen.kind === "join" ? (
            <>
              <section className="flow-hero">
                <div className="intro-avatar rise">
                  <div className="initial" aria-hidden>
                    {initial(creator)}
                  </div>
                  <AnimatedEmoji name="revolving_hearts" code="1f49e" size={64} eager />
                </div>
                <h1 className="rise d1">
                  <span className="hl">{creator}</span> wants to play {cfg.title} with you
                </h1>
                <p className="lead rise d2">
                  {cfg.rounds} quick rounds. Pick what you&apos;d rather do, then guess what {creator} picked. See who knows
                  who better.
                </p>
                {stake > 0 && (
                  <p className="stake-badge rise d2">
                    <Emoji code="1f48b" size={22} /> Playing for {kisses(stake)} · winner collects when you meet
                  </p>
                )}
              </section>
              <div className="card flow-card rise d3">
                {notice && <p className="feedback bad">{notice}</p>}
                <input
                  type="text"
                  placeholder="Your name"
                  aria-label="Your name"
                  autoComplete="given-name"
                  value={name}
                  maxLength={NAME_MAX}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && join()}
                />
                {error && (
                  <p className="feedback bad" role="alert" style={{ margin: "0 0 14px" }}>
                    {error}
                  </p>
                )}
                <button className="btn" onClick={() => join()} disabled={!clean || busy}>
                  {busy ? "Joining…" : "Let's play →"}
                </button>
                <p className="muted center tip">
                  No app, no login. About 3 minutes. Only the two of you can see the answers.
                </p>
              </div>
            </>
          ) : (
            <div className="card flow-card center slide-in">
              <div className="name-hero">
                <Emoji code="1f914" size={72} eager />
              </div>
              <h2>Are you {creator}?</h2>
              <p className="muted">
                This game was started by {creator}. If you made it, don&apos;t join as the second player: open the link in the
                browser where you made it, or use the private link you copied on the share screen.
              </p>
              <button
                className="btn"
                onClick={() => {
                  setScreen({ kind: "join" });
                  join(true);
                }}
              >
                No, I&apos;m {clean || "someone else"}. Let&apos;s play
              </button>
              <button className="btn ghost" onClick={() => setScreen({ kind: "join" })}>
                ← Back
              </button>
            </div>
          )}
        </main>
      </>
    );
  }

  // ---------- Player ----------
  const g = screen.game;
  const me = g.me as 0 | 1;
  const q = g.q ?? [];
  const mine = g.mine ?? [];
  const theirs = g.theirs ?? [];
  const names = { A: g.creator, B: g.partner ?? null };
  const myName = (me === 0 ? g.creator : g.partner) || "You";
  const otherName = me === 0 ? g.partner || "your partner" : g.creator;
  const total = q.length;

  // Final reveal (both players).
  if (g.done && g.score && (me === 0 || ui.reveal === null)) {
    return (
      <>
        <SiteHeader />
        <main className="wrap flow">
          <FinalResult
            cfg={cfg}
            me={me}
            q={q}
            mine={mine}
            theirs={theirs}
            score={g.score}
            stake={g.kiss ? g.stake : 0}
            walletCounted={!!g.walletCounted}
            names={names}
            link={link}
            onPlayAgain={() => playAgain(myName, otherName)}
          />
        </main>
      </>
    );
  }

  // Creator: waiting for the partner.
  if (me === 0) {
    const shareText = `Would you rather…? 💞 I picked my answers and guessed yours. Your turn, it takes 3 minutes: ${link}`;
    const played = g.progress?.[1] ?? 0;
    return (
      <>
        <SiteHeader />
        <main className="wrap flow">
          <div className="card flow-card center slide-in">
            {!g.full ? (
              <>
                <div className="name-hero">
                  <Emoji code="1f91e" size={72} eager />
                </div>
                <h2>Waiting for your partner, {g.creator}</h2>
                <p className="muted">
                  Your answers are saved. Send the link to your partner. You&apos;ll see every answer here as soon as they
                  finish.
                </p>
                <div className="linkbox">
                  <code>{link}</code>
                  <button className="chip-btn" onClick={() => copyLink(link)}>
                    {copied ? "Copied ✓" : "Copy"}
                  </button>
                </div>
                <a className="btn whatsapp" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon /> Send on WhatsApp
                </a>
              </>
            ) : (
              <>
                <div className="name-hero">
                  <AnimatedEmoji name="smiling_face_with_hearts" code="1f970" size={80} eager />
                </div>
                <h2>{g.partner} is playing…</h2>
                <p className="muted">
                  {played} of {total} rounds done. The full reveal shows up here when they finish.
                </p>
                <div className="progress" aria-label={`${played} of ${total} rounds done`}>
                  <div style={{ width: `${Math.max(4, (played / total) * 100)}%` }} />
                </div>
              </>
            )}
            <button className="chip-btn" onClick={() => fetchState(token, false)} style={{ margin: "6px auto 0" }}>
              <Emoji code="1f504" size={16} className="spin" /> Refresh
            </button>
          </div>
          <p className="muted center tip">
            <Link href="/">More couple games →</Link>
          </p>
        </main>
      </>
    );
  }

  // Partner: per-round reveal.
  const tally: [number, number] = [0, 0];
  q.forEach((_, r) => {
    const a = mine[r];
    const b = theirs[r];
    if (a && b) {
      if (a.guess === b.pick) tally[0]++;
      if (b.guess === a.pick) tally[1]++;
    }
  });
  if (ui.reveal !== null && mine[ui.reveal] && theirs[ui.reveal]) {
    const r = ui.reveal;
    return (
      <>
        <SiteHeader hideCta />
        <main className="wrap flow">
          <RoundReveal
            cfg={cfg}
            qIndex={q[r]}
            round={r}
            total={total}
            mine={mine[r]!}
            theirs={theirs[r]!}
            names={names}
            myName={myName}
            otherName={otherName}
            tally={tally}
            meIsA={false}
            onNext={() => setUi({ reveal: null, pending: null })}
          />
        </main>
      </>
    );
  }

  // Partner: answer the next round.
  const round = nextRound(mine);
  if (round === -1) {
    // All answered but no score yet (shouldn't happen for WYR): show a waiting note.
    return (
      <>
        <SiteHeader />
        <main className="wrap flow">
          <div className="card flow-card center">
            <h2>All done!</h2>
            <button className="btn" onClick={() => fetchState(token, false)}>
              See the result
            </button>
          </div>
        </main>
      </>
    );
  }
  const qn = cfg.questions[q[round]];
  const cat = cfg.categories[qn.category];
  const options = qn.options.map((o) => fill(o, names));
  const pending = ui.pending && ui.pending.round === round ? ui.pending : null;
  const guessing = cfg.prediction && !!pending;
  const ask = guessing ? fill(cfg.text.guess, { partner: g.creator }) : cfg.text.pick;
  const shownPick = tap && tap.round === round && tap.sub === "pick" ? tap.i : pending?.pick ?? null;
  const shownGuess = tap && tap.round === round && tap.sub === "guess" ? tap.i : null;

  function choose(i: number) {
    if (busy || timer.current) return;
    if (!guessing) {
      setTap({ round, sub: "pick", i });
      timer.current = setTimeout(() => {
        timer.current = null;
        setTap(null);
        if (cfg.prediction) setUi({ reveal: null, pending: { round, pick: i } });
        else submit(round, i, null);
      }, 260);
    } else if (pending) {
      setTap({ round, sub: "guess", i });
      timer.current = setTimeout(() => {
        timer.current = null;
        submit(round, pending.pick, i);
      }, 200);
    }
  }

  return (
    <>
      <SiteHeader hideCta />
      <main className="wrap flow">
        <div className="card flow-card">
          <div className="q-top">
            <span className="q-count">
              {round + 1} <span>/ {total}</span>
            </span>
            {cfg.scoring && round > 0 && (
              <span className="tally">
                <span className="score-pill">
                  <Emoji code="1f3af" size={18} /> You {tally[0]}
                </span>
                <span className="score-pill">
                  {otherName} {tally[1]}
                </span>
              </span>
            )}
          </div>
          <div className="progress" aria-hidden>
            <div style={{ width: `${Math.max(4, ((round + (guessing ? 0.5 : 0)) / total) * 100)}%` }} />
          </div>
          <div key={`${round}-${guessing ? "g" : "p"}`} className="slide-in">
            {cat && (
              <span className="q-cat">
                <Emoji code={cat.icon} size={18} /> {cat.label}
              </span>
            )}
            {cfg.prediction && (
              <div className="steps2" aria-hidden>
                <span className={guessing ? "st done" : "st on"}>
                  <b>{guessing ? "✓" : "1"}</b> Your pick
                </span>
                <span className="arrow">→</span>
                <span className={guessing ? "st on" : "st"}>
                  <b>2</b> {g.creator}&apos;s pick?
                </span>
              </div>
            )}
            <h2 className="wyr-prompt">{qn.prompt}</h2>
            <p className="wyr-ask">{ask}</p>
            <Choices
              options={options}
              label={ask}
              pick={shownPick}
              guess={shownGuess}
              mode={guessing ? "guess" : "pick"}
              guessTag={`${g.creator}?`}
              disabled={busy}
              onChoose={(i) => choose(i)}
            />
            {busy && <p className="saving-note">Revealing…</p>}
            {error && (
              <p className="feedback bad" role="alert">
                <Emoji code="1f914" size={26} /> {error}
              </p>
            )}
          </div>
          {guessing && (
            <button className="btn ghost" onClick={() => setUi({ reveal: null, pending: null })} disabled={busy} style={{ marginTop: 16 }}>
              ← Change my pick
            </button>
          )}
          <p className="muted center tip">
            {guessing
              ? `Guess what ${g.creator} really picked. Answers lock once you see the reveal.`
              : `${g.creator} already answered. You'll see their pick right after your guess.`}
          </p>
        </div>
      </main>
    </>
  );
}
