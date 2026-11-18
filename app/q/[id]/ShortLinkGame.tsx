"use client";

import PlayGame from "@/components/PlayGame";
import type { QuizData } from "@/lib/quizLink";
import { clearWalletCache, ensureWallet, walletHeader } from "@/lib/wallet/client";

export default function ShortLinkGame({ id, quiz, stake }: { id: string; quiz: QuizData; stake?: number }) {
  // The partner still sees their score if saving fails. Resolves to "kisses were added".
  async function saveResult(guesses: (number | null)[], partner: string): Promise<boolean> {
    try {
      // Kiss Wallet only when the quiz maker has one (rule B5); optional (rule B4).
      if (partner && stake !== undefined) await ensureWallet(partner);
      const res = await fetch(`/api/quiz/${id}/result/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...walletHeader() },
        body: JSON.stringify({ guesses, partner }),
        keepalive: true,
      });
      if (!res.ok) return false;
      clearWalletCache();
      return ((await res.json()) as { walletCounted?: boolean }).walletCounted === true;
    } catch {
      return false;
    }
  }
  return <PlayGame quiz={quiz} progressKey={`kq.q.${id}`} onFinish={saveResult} stake={stake} />;
}
