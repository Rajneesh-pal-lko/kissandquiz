import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KissAndQuiz — How Well Does Your Partner Know You?",
  description:
    "Free couple quiz. Answer 10 questions about yourself, send the link to your partner, and see how well they really know you. No app, no login.",
  openGraph: {
    title: "How well do you know me? 💘",
    description: "Take my couple quiz on KissAndQuiz and see your score.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e8336f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
