import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center text-center px-6">
      <div className="text-7xl mb-4">🍸💀</div>
      <h1 className="font-display text-4xl text-neon-pink neon-text mb-2">Last Call</h1>
      <p className="text-white/60 max-w-sm mb-8">
        This game wandered off to find another bar. Let&apos;s get you back to the party.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-2xl font-semibold text-white bg-gradient-to-br from-neon-pink to-neon-violet shadow-[0_0_30px_-6px_#ff2d95]"
      >
        ← Back to all games
      </Link>
    </main>
  );
}
