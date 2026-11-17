import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KissAndQuiz — Free Games for Couples",
  description:
    "Free couple games you play by sharing a link: quizzes, dares and date ideas. No app, no login, no paywall.",
  openGraph: {
    title: "KissAndQuiz — Free Games for Couples 💞",
    description: "Quizzes, dares and date ideas you play together over a link.",
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
