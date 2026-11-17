import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";

// Absolute URLs for share images. Uses SITE_URL (already set in Vercel for sign-in emails);
// without it, Vercel fills in the deployment URL automatically.
const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: "KissAndQuiz — Free Games for Couples",
  description:
    "Free couple games you play by sharing a link: quizzes, dares and date ideas. No app, no login, no paywall.",
  openGraph: {
    title: "KissAndQuiz — Free Games for Couples 💞",
    description: "Quizzes, dares and date ideas you play together over a link.",
    type: "website",
    siteName: "KissAndQuiz",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fff6f3",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="bg-blobs" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        {children}
      </body>
    </html>
  );
}
