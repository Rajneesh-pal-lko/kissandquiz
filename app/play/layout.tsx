import type { Metadata } from "next";

// Shown when a quiz link is shared on WhatsApp/Instagram. Quiz links are personal,
// so search engines should not index them.
export const metadata: Metadata = {
  title: "How well do you know me? 💘 | KissAndQuiz",
  description: "I made a couple quiz about myself. Guess my answers and see your score. Free, no app, no login.",
  robots: { index: false, follow: true },
  openGraph: {
    title: "How well do you know me? 💘",
    description: "Guess my answers and see your score. Free, no app, no login.",
    type: "website",
    siteName: "KissAndQuiz",
  },
};

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
