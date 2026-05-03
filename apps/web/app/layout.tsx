import { RootProvider } from "fumadocs-ui/provider/next";
import "./global.css";
import type { Metadata } from "next";
import {
  Geist,
  Instrument_Serif,
  Inter,
  JetBrains_Mono,
} from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
});

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const instrument = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "open-slide — slides as React code, crafted by agents",
  description:
    "A React-first slide framework authored by AI agents. Each page is arbitrary code on a 1920×1080 canvas — versioned, reviewable, yours.",
  metadataBase: new URL("https://open-slide.dev"),
  openGraph: {
    title: "open-slide",
    description: "A React-first slide framework, crafted by agents.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "open-slide",
    description: "A React-first slide framework, crafted by agents.",
  },
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.className} ${geist.variable} ${jetbrains.variable} ${instrument.variable}`}
    >
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
