import type { Metadata, Viewport } from "next";
import { Unbounded, Inter } from "next/font/google";
import "./globals.css";

const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-unbounded",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pour Decisions — The Ultimate Drinking Games Arcade",
  description:
    "30+ drinking games in one neon arcade. Cards, dice, party prompts, spinners, trivia and more — beautifully animated and ready to play.",
  keywords: ["drinking games", "party games", "kings cup", "never have i ever", "beer pong"],
  openGraph: {
    title: "Pour Decisions 🍸",
    description: "30+ beautifully animated drinking games. Pick one and play.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#07040f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${unbounded.variable} ${inter.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
