// Short quiz links: /q/<id>/. Rendered on the server so WhatsApp/Instagram previews
// can show the creator's name ("How well do you know Riya? 💘").
import type { Metadata } from "next";
import { BrokenLink } from "@/components/PlayGame";
import { QUIZ_ID_RE } from "@/lib/quizRules";
import { SHARE_IMAGE } from "@/lib/seo";
import { store, storeAvailable, type QuizDoc } from "@/lib/store";
import ShortLinkGame from "./ShortLinkGame";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function findQuiz(id: string): Promise<{ quiz: QuizDoc | null; error: boolean }> {
  if (!QUIZ_ID_RE.test(id) || !storeAvailable()) return { quiz: null, error: false };
  try {
    return { quiz: await store().getQuiz(id), error: false };
  } catch (err) {
    console.error("load quiz failed", err);
    return { quiz: null, error: true };
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const { quiz } = await findQuiz(id);
  const title = quiz ? `How well do you know ${quiz.n}? 💘` : "How well do you know me? 💘";
  const description = quiz
    ? `${quiz.n} made a couple quiz. Guess their answers and see your score. Free, no app, no login.`
    : "Guess my answers and see your score. Free, no app, no login.";
  return {
    title: `${title} | KissAndQuiz`,
    description,
    robots: { index: false, follow: true }, // personal links: keep out of search
    openGraph: { title, description, type: "website", siteName: "KissAndQuiz", images: [SHARE_IMAGE] },
    twitter: { card: "summary_large_image", title, description, images: [SHARE_IMAGE.url] },
  };
}

export default async function QuizPage({ params }: Params) {
  const { id } = await params;
  const { quiz, error } = await findQuiz(id);
  if (error) return <BrokenLink reason="offline" />;
  if (!quiz) return <BrokenLink reason={QUIZ_ID_RE.test(id) ? "expired" : "broken"} />;
  return <ShortLinkGame id={id} quiz={{ n: quiz.n, a: quiz.a }} />;
}
