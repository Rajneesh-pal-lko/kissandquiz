import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create your couple quiz | KissAndQuiz",
  description: "Answer 10 questions about yourself and send the link to your partner. Free, no app, no login.",
  openGraph: {
    title: "How well does your partner know you? 💘",
    description: "Make your couple quiz in 1 minute and send it to your partner.",
    type: "website",
    siteName: "KissAndQuiz",
  },
};

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
