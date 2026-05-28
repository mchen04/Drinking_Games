import { notFound } from "next/navigation";
import { GAMES, getGame } from "@/games/registry";
import { GameClient } from "@/components/GameClient";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return GAMES.map((g) => ({ slug: g.id }));
}

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const game = getGame(slug);
  if (!game) return { title: "Game not found — Pour Decisions" };
  return {
    title: `${game.title} — Pour Decisions`,
    description: game.tagline,
  };
}

export default async function GamePage({ params }: { params: Params }) {
  const { slug } = await params;
  const game = getGame(slug);
  if (!game) notFound();
  return <GameClient meta={game} />;
}
