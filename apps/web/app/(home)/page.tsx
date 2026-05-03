import { Agents } from "@/components/landing/agents";
import { Anatomy } from "@/components/landing/anatomy";
import { Assets } from "@/components/landing/assets";
import { Footer } from "@/components/landing/footer";
import { GetStarted } from "@/components/landing/get-started";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Inspector } from "@/components/landing/inspector";
import { LiveDemo } from "@/components/landing/live-demo";
import { Nav } from "@/components/landing/nav";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main className="relative flex-1">
        <Hero />
        <LiveDemo />
        <HowItWorks />
        <Anatomy />
        <Inspector />
        <Assets />
        <Agents />
        <GetStarted />
      </main>
      <Footer />
    </>
  );
}
