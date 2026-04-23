import { Agents } from "./components/Agents";
import { Anatomy } from "./components/Anatomy";
import { Features } from "./components/Features";
import { Footer } from "./components/Footer";
import { GetStarted } from "./components/GetStarted";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { LiveDemo } from "./components/LiveDemo";
import { Nav } from "./components/Nav";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="relative flex-1">
        <Hero />
        <LiveDemo />
        <HowItWorks />
        <Anatomy />
        <Features />
        <Agents />
        <GetStarted />
      </main>
      <Footer />
    </>
  );
}
