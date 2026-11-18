// Wallet data the API sends to the browser (built in lib/wallet/server.ts).
import type { KissKind } from "@/lib/store";

export type HistoryLine = {
  at: string;
  kind: KissKind;
  /** Signed change to one side of the khata (negative = paid or forgiven). */
  amount: number;
  /** "mine" = changes what the partner owes me; "theirs" = changes what I owe the partner. */
  side: "mine" | "theirs";
  /** I did it (gift, received, forgive). */
  byMe: boolean;
  game?: "wyr" | "quiz";
  label?: string;
  capped?: boolean;
};

export type KhataView = {
  id: string;
  partner: string;
  owedToMe: number;
  iOwe: number;
  earnedToday: number;
  giftedToday: number;
  caps: { daily: number; gift: number; khata: number };
  updatedAt: string;
  history: HistoryLine[];
};

export type WalletView = {
  id: string;
  name: string;
  createdAt: string;
  owedToMe: number;
  iOwe: number;
  khatas: KhataView[];
};

