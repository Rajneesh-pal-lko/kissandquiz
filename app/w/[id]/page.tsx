// Would You Rather game links: /w/<id>/. Rendered on the server so WhatsApp/Instagram
// previews show the creator's name ("Riya wants to play Would You Rather with you 💞").
import type { Metadata } from "next";
import RevealGame, { GameProblem } from "@/components/reveal/RevealGame";
import { WYR } from "@/lib/reveal/configs";
import { GAME_ID_RE } from "@/lib/reveal/rules";
import { SHARE_IMAGE } from "@/lib/seo";
import { store, storeAvailable, type GameDoc } from "@/lib/store";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function findGame(id: string): Promise<{ game: GameDoc | null; error: boolean }> {
  if (!GAME_ID_RE.test(id)) return { game: null, error: false };
  if (!storeAvailable()) return { game: null, error: true };
  try {
    const game = await store().getGame(id);
    return { game: game && game.type === WYR.type ? game : null, error: false };
  } catch (err) {
    console.error("load game failed", err);
    return { game: null, error: true };
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const { game } = await findGame(id);
  const name = game?.players[0]?.name;
  const title = name ? `${name} wants to play Would You Rather with you 💞` : "Would You Rather for Couples 💞";
  const description = name
    ? `Pick your answers, guess ${name}'s, and see who knows who better. 10 rounds, free, no app, no login.`
    : "Pick your answers, guess your partner's, and see who knows who better. Free, no app, no login.";
  return {
    title: `${title} | KissAndQuiz`,
    description,
    robots: { index: false, follow: true }, // personal links: keep out of search
    openGraph: { title, description, type: "website", siteName: "KissAndQuiz", images: [SHARE_IMAGE] },
    twitter: { card: "summary_large_image", title, description, images: [SHARE_IMAGE.url] },
  };
}

export default async function WyrGamePage({ params }: Params) {
  const { id } = await params;
  const { game, error } = await findGame(id);
  if (error) return <GameProblem reason="offline" cfg={WYR} />;
  if (!game) return <GameProblem reason={GAME_ID_RE.test(id) ? "expired" : "broken"} cfg={WYR} />;
  return <RevealGame type={WYR.type} id={id} creator={game.players[0].name} full={game.players.length >= 2} />;
}
