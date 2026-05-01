import { Agents } from './components/agents';
import { Anatomy } from './components/anatomy';
import { Assets } from './components/assets';
import { Footer } from './components/footer';
import { GetStarted } from './components/get-started';
import { Hero } from './components/hero';
import { HowItWorks } from './components/how-it-works';
import { Inspector } from './components/inspector';
import { LiveDemo } from './components/live-demo';
import { Nav } from './components/nav';

export default function Home() {
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
