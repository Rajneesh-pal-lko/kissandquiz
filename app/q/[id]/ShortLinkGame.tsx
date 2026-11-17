"use client";

import PlayGame from "@/components/PlayGame";
import type { QuizData } from "@/lib/quizLink";

export default function ShortLinkGame({ id, quiz }: { id: string; quiz: QuizData }) {
  function saveResult(guesses: (number | null)[], partner: string) {
    // Fire and forget: the partner still sees their score if saving fails.
    fetch(`/api/quiz/${id}/result/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guesses, partner }),
      keepalive: true,
    }).catch(() => {});
  }
  return <PlayGame quiz={quiz} progressKey={`kq.q.${id}`} onFinish={saveResult} />;
}
