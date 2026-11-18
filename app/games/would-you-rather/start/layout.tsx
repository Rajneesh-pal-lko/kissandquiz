import type { Metadata } from "next";
import { SHARE_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Start a Would You Rather game | KissAndQuiz",
  description: "Pick your answers, guess your partner's, and send them the link. Free, no app, no login.",
  robots: { index: false, follow: true }, // the game flow itself; the landing page is the one to index
  openGraph: {
    title: "Would You Rather for Couples 💞",
    description: "Pick your answers, guess your partner's, and see who knows who better.",
    type: "website",
    images: [SHARE_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [SHARE_IMAGE.url] },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
