"use client";

// Old-style long links: /play/#<base64 quiz>. Kept forever so links shared before
// short links existed keep working. Nothing is saved to the server here.
import { useEffect, useState } from "react";
import PlayGame, { BrokenLink } from "@/components/PlayGame";
import { decodeQuiz, type QuizData } from "@/lib/quizLink";
import { cleanPairs } from "@/lib/quizRules";

export default function PlayPage() {
  const [hash, setHash] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizData | null>(null);

  // Read the quiz from the URL hash. Also re-read if a new link is pasted in the same tab.
  useEffect(() => {
    function read() {
      const h = window.location.hash.slice(1);
      const data = decodeQuiz(h);
      const a = data ? cleanPairs(data.a) : [];
      setQuiz(data && a.length > 0 ? { n: data.n, a } : null);
      setHash(h);
    }
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  if (hash === null) return <main className="wrap" />;
  if (!quiz) return <BrokenLink />;
  return <PlayGame key={hash} quiz={quiz} progressKey={`kq.play.${hash}`} />;
}
