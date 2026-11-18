"use client";

// Kiss Wallet: one per person, no sign-up (docs/KISS_WALLET_RULES.md).
// Shows every khata (one per partner): what they owe you, what you owe them, and the history.
// Opening /wallet/#<id>.<token> (the private wallet link) brings the wallet to this browser.
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatedEmoji, Emoji, WhatsAppIcon } from "@/components/Emoji";
import { confetti } from "@/components/fx";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { REMATCH_KEY } from "@/lib/reveal/myGames";
import { NAME_MAX, initial } from "@/lib/reveal/rules";
import { save } from "@/lib/storage";
import {
  cacheOwedToMe,
  forgetLocalWallet,
  getLocalWallet,
  parseWalletLink,
  privateWalletUrl,
  setLocalWallet,
  walletHeader,
  type LocalWallet,
} from "@/lib/wallet/client";
import {
  DAILY_GAME_CAP,
  DAILY_GIFT_CAP,
  GIFT_STEPS,
  KHATA_MAX,
  RATE_CARD,
  STAKES,
  kisses,
  rateCardSplit,
} from "@/lib/wallet/rules";
import type { HistoryLine, KhataView, WalletView } from "@/lib/wallet/types";

type Screen =
  | { kind: "loading" }
  | { kind: "none" }
  | { kind: "offline" }
  | { kind: "import"; link: { id: string; token: string }; name: string }
  | { kind: "wallet"; wallet: WalletView };

async function getWallet(cred: { id: string; token: string }): Promise<WalletView | "missing" | "offline"> {
  try {
    const res = await fetch("/api/wallet/", { headers: { "x-wallet": `${cred.id}.${cred.token}` }, cache: "no-store" });
    if (res.status === 404) return "missing";
    if (!res.ok) return "offline";
    return ((await res.json()) as { wallet: WalletView }).wallet;
  } catch {
    return "offline";
  }
}

export default function WalletPage() {
  const [screen, setScreen] = useState<Screen>({ kind: "loading" });
  const [notice, setNotice] = useState("");
  const linkRef = useRef<{ id: string; token: string } | null>(null);

  const show = useCallback((wallet: WalletView) => {
    setScreen({ kind: "wallet", wallet });
    cacheOwedToMe(wallet.owedToMe);
  }, []);

  const loadLocal = useCallback(async () => {
    const local = getLocalWallet();
    if (!local) return setScreen({ kind: "none" });
    const w = await getWallet(local);
    if (w === "offline") return setScreen({ kind: "offline" });
    if (w === "missing") {
      forgetLocalWallet();
      setNotice("Your old wallet wasn't found (deleted, or unused for 6 months). Play a game to start a new one.");
      return setScreen({ kind: "none" });
    }
    if (w.name !== local.name) setLocalWallet({ ...local, name: w.name });
    show(w);
  }, [show]);

  useEffect(() => {
    async function init() {
      const hash = window.location.hash;
      if (hash.length > 1) {
        linkRef.current = parseWalletLink(hash);
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
      const link = linkRef.current;
      if (!link) return loadLocal();
      const local = getLocalWallet();
      if (local?.id === link.id) return loadLocal();
      const w = await getWallet(link);
      if (w === "offline") return setScreen({ kind: "offline" });
      if (w === "missing") {
        setNotice("That wallet link doesn't work any more.");
        return loadLocal();
      }
      if (!local) {
        setLocalWallet({ id: link.id, token: link.token, name: w.name });
        return show(w);
      }
      setScreen({ kind: "import", link, name: w.name });
    }
    init();
    window.addEventListener("hashchange", init);
    return () => window.removeEventListener("hashchange", init);
  }, [loadLocal, show]);

  return (
    <>
      <SiteHeader />
      <main className="wrap flow wallet">
        {notice && <p className="feedback bad">{notice}</p>}
        {screen.kind === "loading" && <div className="card flow-card center muted">Opening your Kiss Wallet…</div>}
        {screen.kind === "offline" && (
          <div className="card flow-card center">
            <Emoji code="1f914" size={64} eager />
            <h2>Couldn&apos;t open your wallet</h2>
            <p className="muted">Check your internet and try again.</p>
            <button className="btn" onClick={() => window.location.reload()}>
              Try again
            </button>
          </div>
        )}
        {screen.kind === "none" && <NoWallet onCreated={show} />}
        {screen.kind === "import" && (
          <div className="card flow-card center">
            <Emoji code="1f45b" size={64} eager />
            <h2>Open {screen.name}&apos;s wallet here?</h2>
            <p className="muted">
              This browser already has a different wallet ({getLocalWallet()?.name}). If you switch, keep that one&apos;s private
              link, or it can&apos;t be opened here again.
            </p>
            <button
              className="btn"
              onClick={() => {
                setLocalWallet({ id: screen.link.id, token: screen.link.token, name: screen.name });
                loadLocal();
              }}
            >
              Yes, use {screen.name}&apos;s wallet
            </button>
            <button className="btn ghost" onClick={loadLocal}>
              No, keep {getLocalWallet()?.name}&apos;s
            </button>
          </div>
        )}
        {screen.kind === "wallet" && <Wallet wallet={screen.wallet} onChange={show} onGone={() => setScreen({ kind: "none" })} />}
        <Rules />
      </main>
      <SiteFooter />
    </>
  );
}

// ---------- No wallet yet ----------
function NoWallet({ onCreated }: { onCreated: (w: WalletView) => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const clean = name.replace(/\s+/g, " ").trim();

  async function create() {
    if (!clean || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/wallet/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: clean }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { id: string; token: string; wallet: WalletView };
      setLocalWallet({ id: data.id, token: data.token, name: data.wallet.name });
      onCreated(data.wallet);
    } catch {
      setError("Couldn't make your wallet right now. Check your internet and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="flow-hero">
        <div className="name-hero rise">
          <AnimatedEmoji name="face_blowing_a_kiss" code="1f618" size={96} eager />
        </div>
        <h1 className="rise d1">
          Your <span className="hl">Kiss Wallet</span>
        </h1>
        <p className="lead rise d2">
          Play any game with your partner. The winner earns kisses, the other one owes them. Pay up when you meet. 💋
        </p>
      </section>
      <div className="card flow-card rise d3">
        <ol className="wallet-steps">
          <li>
            <Emoji code="1f3af" size={34} />
            <span>
              <strong>Play for 1, 2, 3 or 5 kisses</strong> Would You Rather or the couple quiz.
            </span>
          </li>
          <li>
            <Emoji code="1f3c6" size={34} />
            <span>
              <strong>Winner earns, loser owes.</strong> Tie? You both win.
            </span>
          </li>
          <li>
            <Emoji code="1f48b" size={34} />
            <span>
              <strong>Pay when you meet.</strong> Peck = 1, hug + kiss = 3, movie kiss = 10.
            </span>
          </li>
        </ol>
        <Link href="/games/would-you-rather/start/" className="btn">
          Play Would You Rather →
        </Link>
        <Link href="/create/" className="btn ghost">
          Make a couple quiz
        </Link>
        <p className="muted center tip">Your wallet starts automatically when you play. No sign-up.</p>
      </div>
      <div className="card flow-card">
        <h3 className="center">Or start an empty wallet now</h3>
        <input
          type="text"
          placeholder="Your name"
          aria-label="Your name"
          autoComplete="given-name"
          maxLength={NAME_MAX}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
        />
        {error && (
          <p className="feedback bad" role="alert" style={{ margin: "0 0 14px" }}>
            {error}
          </p>
        )}
        <button className="btn plum" onClick={create} disabled={!clean || busy}>
          {busy ? "Making your wallet…" : "Start my Kiss Wallet"}
        </button>
        <p className="muted center tip">Have a wallet on another phone? Open its private wallet link here.</p>
      </div>
    </>
  );
}

// ---------- Wallet ----------
function Wallet({ wallet, onChange, onGone }: { wallet: WalletView; onChange: (w: WalletView) => void; onGone: () => void }) {
  const local = getLocalWallet() as LocalWallet;
  const [copied, setCopied] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(wallet.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function replaceKhata(k: KhataView) {
    const khatas = wallet.khatas.map((x) => (x.id === k.id ? k : x));
    onChange({
      ...wallet,
      khatas,
      owedToMe: khatas.reduce((n, x) => n + x.owedToMe, 0),
      iOwe: khatas.reduce((n, x) => n + x.iOwe, 0),
    });
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(privateWalletUrl(window.location.origin, local));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked.
    }
  }

  async function rename() {
    const clean = newName.replace(/\s+/g, " ").trim();
    if (!clean || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/wallet/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...walletHeader() },
        body: JSON.stringify({ name: clean }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { wallet: WalletView };
      setLocalWallet({ ...local, name: data.wallet.name });
      onChange(data.wallet);
      setRenaming(false);
    } catch {
      setError("Couldn't change the name. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function del() {
    if (!window.confirm("Delete your Kiss Wallet? All your khatas and their history are deleted for both of you. This can't be undone.")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/wallet/", { method: "DELETE", headers: walletHeader() });
      if (!res.ok && res.status !== 404) throw new Error();
      forgetLocalWallet();
      onGone();
    } catch {
      setError("Couldn't delete right now. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="wallet-hero rise">
        <p className="wh-name">
          <Emoji code="1f45b" size={22} /> {wallet.name}&apos;s Kiss Wallet
        </p>
        <div className="wh-big">
          <span className="wh-num">{wallet.owedToMe}</span>
          <Emoji code="1f48b" size={56} eager />
        </div>
        <p className="wh-sub">{wallet.owedToMe === 1 ? "kiss owed to you" : "kisses owed to you"}</p>
        {wallet.iOwe > 0 && <p className="wh-owe">You owe {kisses(wallet.iOwe)}</p>}
      </section>

      {wallet.khatas.length === 0 && (
        <div className="card flow-card center">
          <Emoji code="1f48c" size={60} />
          <h2>No kisses yet</h2>
          <p className="muted">Play a game with your partner. Pick how many kisses it&apos;s for; the winner earns them.</p>
          <Link href="/games/would-you-rather/start/" className="btn">
            Play Would You Rather →
          </Link>
          <Link href="/create/" className="btn ghost">
            Make a couple quiz
          </Link>
        </div>
      )}

      {wallet.khatas.map((k) => (
        <Khata key={k.id} k={k} myName={wallet.name} onChange={replaceKhata} />
      ))}

      <div className="card">
        <div className="private-box" style={{ marginTop: 0 }}>
          <div className="ph">
            <Emoji code="1f512" size={40} />
            <p>
              <strong>Keep your wallet</strong>
              <br />
              <span className="muted">
                It lives on this phone. Played inside WhatsApp, or switching phones? Open your private wallet link there. Don&apos;t
                share it: anyone with it can use your wallet.
              </span>
            </p>
          </div>
          <button className="btn plum" onClick={copyLink}>
            {copied ? "Private link copied ✓" : "Copy my private wallet link"}
          </button>
        </div>
        {renaming ? (
          <div className="rename">
            <input
              type="text"
              aria-label="Your name"
              value={newName}
              maxLength={NAME_MAX}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && rename()}
              autoFocus
            />
            <div className="btn-row">
              <button className="btn sm" onClick={rename} disabled={busy}>
                Save name
              </button>
              <button className="btn ghost sm" onClick={() => setRenaming(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="btn-row">
            <button className="btn ghost sm" onClick={() => setRenaming(true)}>
              Change name
            </button>
            <button className="btn ghost sm danger" onClick={del} disabled={busy}>
              Delete wallet
            </button>
          </div>
        )}
        {error && <p className="feedback bad">{error}</p>}
      </div>
    </>
  );
}

// ---------- One khata (you and one partner) ----------
type Panel = null | "received" | "forgive" | "gift";

function Khata({ k, myName, onChange }: { k: KhataView; myName: string; onChange: (k: KhataView) => void }) {
  const [panel, setPanel] = useState<Panel>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const p = k.partner;
  const giftLeft = Math.max(0, k.caps.gift - k.giftedToday);

  async function act(body: object, okText: string, party = false) {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/wallet/khata/${k.id}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...walletHeader() },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => null)) as { khata?: KhataView; error?: string } | null;
      if (res.ok && data?.khata) {
        onChange(data.khata);
        setPanel(null);
        setMsg({ ok: true, text: okText });
        if (party) confetti(60);
      } else if (data?.error === "not_enough") {
        setMsg({ ok: false, text: `${p} doesn't owe you that many.` });
      } else if (data?.error === "gift_cap") {
        setMsg({ ok: false, text: `You can gift up to ${DAILY_GIFT_CAP} kisses a day. Save some for tomorrow 😉` });
      } else if (data?.error === "khata_full") {
        setMsg({ ok: false, text: `A khata can hold ${KHATA_MAX} kisses. Pay some first!` });
      } else {
        setMsg({ ok: false, text: "Couldn't save that. Check your internet and try again." });
      }
    } catch {
      setMsg({ ok: false, text: "Couldn't save that. Check your internet and try again." });
    } finally {
      setBusy(false);
    }
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const remind =
    k.owedToMe > 0
      ? `${p}, you owe me ${kisses(k.owedToMe)} 😘 (${rateCardSplit(k.owedToMe)}). Pay up when we meet, or try to win them back: ${origin}/games/would-you-rather/`
      : `${p}, our kiss khata is clear 😇 Play me for some kisses? ${origin}/games/would-you-rather/`;

  function rematch() {
    save(REMATCH_KEY, { type: "wyr", name: myName, partner: p });
  }

  return (
    <div className="card khata">
      <div className="kh-head">
        <span className="ava">{initial(myName)}</span>
        <span className="ava b">{initial(p)}</span>
        <h2>You &amp; {p}</h2>
      </div>
      <div className="kh-tiles">
        <div className="kh-tile mine">
          <span className="kh-lbl">{p} owes you</span>
          <span className="kh-num">
            {k.owedToMe} <Emoji code="1f48b" size={28} />
          </span>
          {k.owedToMe > 0 && <span className="kh-split">{rateCardSplit(k.owedToMe)}</span>}
        </div>
        <div className="kh-tile theirs">
          <span className="kh-lbl">You owe {p}</span>
          <span className="kh-num">
            {k.iOwe} <Emoji code="1f48b" size={28} />
          </span>
          {k.iOwe > 0 && <span className="kh-split">{rateCardSplit(k.iOwe)}</span>}
        </div>
      </div>
      <p className="kh-today muted">
        Today from games: {k.earnedToday}/{DAILY_GAME_CAP} kisses
      </p>

      <div className="kh-actions">
        <button className={panel === "received" ? "kh-act on" : "kh-act"} onClick={() => setPanel(panel === "received" ? null : "received")} disabled={k.owedToMe === 0}>
          <Emoji code="2705" size={22} /> Got kisses
        </button>
        <button className={panel === "gift" ? "kh-act on" : "kh-act"} onClick={() => setPanel(panel === "gift" ? null : "gift")}>
          <Emoji code="1f381" size={22} /> Gift
        </button>
        <button className={panel === "forgive" ? "kh-act on" : "kh-act"} onClick={() => setPanel(panel === "forgive" ? null : "forgive")} disabled={k.owedToMe === 0}>
          <Emoji code="1f607" size={22} alt="" /> Forgive
        </button>
      </div>

      {panel === "received" && (
        <div className="kh-panel slide-in">
          <p className="muted">Which kiss did {p} pay? Only you can mark kisses you received.</p>
          <div className="rate-grid">
            {RATE_CARD.map((r) => (
              <button
                key={r.key}
                className="rate-btn"
                disabled={busy || r.value > k.owedToMe}
                onClick={() => act({ action: "received", item: r.key }, `${r.label} received 😘 ${p} owes you ${k.owedToMe - r.value} now.`, true)}
              >
                <Emoji code={r.code} size={34} />
                <span>{r.label}</span>
                <b>−{r.value}</b>
              </button>
            ))}
          </div>
        </div>
      )}
      {panel === "gift" && (
        <div className="kh-panel slide-in">
          <p className="muted">
            Add kisses to what you owe {p}, just because. {giftLeft > 0 ? `You can gift ${giftLeft} more today.` : "That's all the gifting for today."}
          </p>
          <div className="stake-row">
            {GIFT_STEPS.map((n) => (
              <button
                key={n}
                className="stake-opt"
                disabled={busy || n > giftLeft}
                onClick={() => act({ action: "gift", amount: n }, `You gifted ${p} ${kisses(n)} 💝`)}
              >
                +{n}
              </button>
            ))}
          </div>
        </div>
      )}
      {panel === "forgive" && (
        <div className="kh-panel slide-in">
          <p className="muted">Let {p} off the hook. It only changes what {p} owes you.</p>
          <div className="btn-row">
            <button className="btn ghost sm" disabled={busy} onClick={() => act({ action: "forgive", amount: 1 }, `You forgave ${p} 1 kiss 😇`)}>
              Forgive 1
            </button>
            <button
              className="btn ghost sm"
              disabled={busy}
              onClick={() => {
                if (window.confirm(`Clear all ${kisses(k.owedToMe)} ${p} owes you?`)) act({ action: "forgive", amount: "all" }, `Khata cleared. ${p} owes you nothing now 😇`);
              }}
            >
              Clear all {k.owedToMe}
            </button>
          </div>
        </div>
      )}
      {msg && <p className={msg.ok ? "feedback ok" : "feedback bad"}>{msg.text}</p>}

      <a className="btn whatsapp" href={`https://wa.me/?text=${encodeURIComponent(remind)}`} target="_blank" rel="noopener noreferrer">
        <WhatsAppIcon /> {k.owedToMe > 0 ? `Remind ${p} on WhatsApp` : `Message ${p} on WhatsApp`}
      </a>
      <Link href="/games/would-you-rather/start/" className="btn light" onClick={rematch}>
        Play {p} for more kisses →
      </Link>

      <button className="link-btn full" onClick={() => setShowHistory(!showHistory)} aria-expanded={showHistory}>
        {showHistory ? "Hide history ▲" : "Khata history ▼"}
      </button>
      {showHistory && (
        <ol className="kh-history slide-in">
          {k.history.length === 0 && <li className="muted">Nothing yet.</li>}
          {k.history.map((h, i) => (
            <li key={i}>
              <span className="kh-h-text">{historyText(h, p)}</span>
              <span className={h.side === "mine" ? "kh-h-amt mine" : "kh-h-amt theirs"}>
                {h.amount > 0 ? "+" : h.amount < 0 ? "−" : ""}
                {Math.abs(h.amount)} {h.side === "mine" ? "owed to you" : "you owe"}
              </span>
              <time className="kh-h-time">{when(h.at)}</time>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

const GAME_NAME: Record<string, string> = { wyr: "Would You Rather", quiz: "the couple quiz" };

function historyText(h: HistoryLine, p: string): string {
  const game = h.game ? GAME_NAME[h.game] : "a game";
  const capped = h.capped ? " (daily or khata limit)" : "";
  switch (h.kind) {
    case "win":
      return (h.side === "mine" ? `You won ${game}` : `${p} won ${game}`) + capped;
    case "tie":
      return `Tie in ${game}` + capped;
    case "bonus":
      return (h.side === "mine" ? "Your perfect-score bonus" : `${p}'s perfect-score bonus`) + capped;
    case "gift":
      return h.byMe ? `You gifted ${p}` : `${p} gifted you`;
    case "received":
      return h.byMe ? `You got a ${(h.label ?? "kiss").toLowerCase()} from ${p}` : `${p} got a ${(h.label ?? "kiss").toLowerCase()} from you`;
    case "forgive":
      return h.byMe ? `You forgave ${p}` : `${p} forgave you`;
    default:
      return "";
  }
}

function when(iso: string): string {
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 24 * 60) return `${Math.round(mins / 60)}h ago`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

// ---------- Rules (short version of docs/KISS_WALLET_RULES.md) ----------
function Rules() {
  const [open, setOpen] = useState(false);
  return (
    <div className="card">
      <button className="link-btn full" onClick={() => setOpen(!open)} aria-expanded={open}>
        {open ? "Hide the Kiss Wallet rules ▲" : "Kiss Wallet rules ▼"}
      </button>
      {open && (
        <ol className="wallet-rules slide-in">
          <li>
            <strong>Play for {STAKES.join(", ")} kisses.</strong> The person who starts the game picks. Default: 1.
          </li>
          <li>
            <strong>Winner earns, loser owes.</strong> More correct guesses wins. Tie: you both win the kisses.
          </li>
          <li>
            <strong>Couple quiz:</strong> 7+ out of 10 and the guesser wins; 4–6 is a tie; 0–3 and the quiz maker wins.
          </li>
          <li>
            <strong>Perfect score = +1 bonus kiss.</strong>
          </li>
          <li>
            <strong>Each game counts once.</strong> Replays don&apos;t add kisses. Both players need their own wallet.
          </li>
          <li>
            <strong>Limits:</strong> up to {DAILY_GAME_CAP} kisses a day from games per partner, and a khata holds up to {KHATA_MAX}. Pay
            some to earn more.
          </li>
          <li>
            <strong>Pay when you meet.</strong> Peck = 1, hug + kiss = 3, 10-second kiss = 5, movie kiss = 10. Only the person who is
            owed marks kisses as received.
          </li>
          <li>
            <strong>Gift or forgive any time.</strong> Gift up to {DAILY_GIFT_CAP} a day; forgive one or clear the whole khata.
          </li>
          <li>
            <strong>Just for fun.</strong> Kisses are never a duty. No penalties, no interest. Kisses can&apos;t be bought, sold or
            swapped for anything.
          </li>
          <li>
            <strong>Private.</strong> Only the two of you see your khata. Delete your wallet any time. Unused wallets are deleted after
            6 months.
          </li>
        </ol>
      )}
    </div>
  );
}
