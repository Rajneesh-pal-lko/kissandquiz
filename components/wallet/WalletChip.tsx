"use client";

// Header chip: "💋 12" = kisses owed to you across all khatas. Cached for a minute per tab so
// browsing the site doesn't read the database on every page.
import Link from "next/link";
import { useEffect, useState } from "react";
import { Emoji } from "@/components/Emoji";
import { cacheOwedToMe, cachedOwedToMe, walletHeader, getLocalWallet } from "@/lib/wallet/client";

export default function WalletChip() {
  const [n, setN] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    function refresh() {
      if (!getLocalWallet()) return setN(null);
      const c = cachedOwedToMe();
      if (c !== null) return setN(c);
      fetch("/api/wallet/", { headers: walletHeader(), cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { wallet?: { owedToMe: number } } | null) => {
          if (!alive || !d?.wallet) return;
          setN(d.wallet.owedToMe);
          cacheOwedToMe(d.wallet.owedToMe);
        })
        .catch(() => {});
    }
    refresh();
    window.addEventListener("kq-wallet", refresh);
    return () => {
      alive = false;
      window.removeEventListener("kq-wallet", refresh);
    };
  }, []);

  return (
    <Link href="/wallet/" className="wallet-chip" aria-label={n === null ? "Kiss Wallet" : `Kiss Wallet: ${n} kisses owed to you`}>
      <Emoji code="1f48b" size={20} />
      {n === null ? <span className="wc-label">Wallet</span> : <span>{n > 99 ? "99+" : n}</span>}
    </Link>
  );
}
