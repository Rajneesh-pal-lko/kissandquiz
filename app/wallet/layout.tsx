import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kiss Wallet | KissAndQuiz",
  description: "Win kisses in couple games, collect them when you meet. Free, no sign-up.",
  robots: { index: false, follow: true }, // personal page
};

export default function WalletLayout({ children }: { children: React.ReactNode }) {
  return children;
}
