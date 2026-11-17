import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your quiz results | KissAndQuiz",
  robots: { index: false, follow: false },
};

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
