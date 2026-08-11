'use client';

import { type CSSProperties, useState } from 'react';
import { SectionRule } from './frame';

const tweetUrl = 'https://x.com/samlambert/status/2066020380092051484?s=20';
const videoId = 'zxvyO5vnknI';

type Tweet = {
  name: string;
  handle: string;
  avatar: string;
  body: string;
};

const thread: Tweet[] = [
  {
    name: 'Hang Huang',
    handle: '@hanghuang_',
    avatar: '/assets/avatar/hanghuang_.png',
    body: 'what’s the secret sauce you landed on 👀',
  },
  {
    name: 'Sam Lambert',
    handle: '@samlambert',
    avatar: '/assets/avatar/samlambert.png',
    body: 'open-slide + cursor',
  },
];

export function UsedBy() {
  return (
    <section id="used-by" className="relative">
      <SectionRule />
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12 py-20 sm:py-32 lg:py-40">
        <h2
          data-reveal="blur"
          className="text-[32px] sm:text-[44px] lg:text-[60px] leading-[1.1] sm:leading-[1.05] tracking-[-0.035em] font-medium max-w-[820px] mb-14 sm:mb-20"
        >
          Used by people
          <br />
          <span className="font-[family-name:var(--font-pixel)] text-[color:var(--color-muted)]">
            who create engaging slides.
          </span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <a
            data-reveal
            href={tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="floating group relative block rounded-[10px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] p-6 sm:p-7 transition-[border-color,box-shadow] duration-300 hover:border-[color:var(--color-dim)]"
          >
            <XGlyph className="absolute right-6 top-6 sm:right-7 sm:top-7 size-4 text-[color:var(--color-dim)] transition-colors group-hover:text-[color:var(--color-text)]" />

            <div className="relative flex flex-col">
              <span
                aria-hidden
                className="absolute left-5 top-5 bottom-5 w-px -translate-x-1/2 bg-[color:var(--color-rule)]"
              />
              {thread.map((t) => (
                <div key={t.handle} className="relative flex gap-3 pb-5 last:pb-0">
                  <img
                    src={t.avatar}
                    alt=""
                    className="relative size-10 shrink-0 rounded-full object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[15px] font-semibold tracking-[-0.01em] text-[color:var(--color-text)]">
                        {t.name}
                      </span>
                      <span className="font-[family-name:var(--font-mono)] text-[13px] text-[color:var(--color-muted)]">
                        {t.handle}
                      </span>
                    </div>
                    <p className="text-[16px] leading-[1.5] text-[color:var(--color-text-soft)]">
                      {t.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </a>

          <figure
            data-reveal
            style={{ '--reveal-delay': '120ms' } as CSSProperties}
            className="floating m-0 overflow-hidden rounded-[10px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)]"
          >
            <VideoPlayer />
            <figcaption className="flex items-center gap-3.5 border-t border-[color:var(--color-rule-soft)] px-6 py-5">
              <a
                href="https://planetscale.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="PlanetScale"
                className="shrink-0 rounded-sm transition-opacity hover:opacity-70"
              >
                <img
                  src="/assets/planetscale-light.svg"
                  alt="PlanetScale"
                  className="logo-light size-8"
                />
                <img
                  src="/assets/planetscale-dark.svg"
                  alt="PlanetScale"
                  aria-hidden
                  className="logo-dark size-8"
                />
              </a>
              <div>
                <div className="text-[16px] font-medium tracking-[-0.01em] text-[color:var(--color-text)]">
                  Cursor Compile 26
                </div>
                <div className="mt-0.5 text-[14px] text-[color:var(--color-text-soft)]">
                  Sam Lambert — CEO of PlanetScale
                </div>
              </div>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

function VideoPlayer() {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="relative aspect-video bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&color=white&iv_load_policy=3&playsinline=1`}
          title="Sam Lambert at Cursor Compile 2026"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="absolute inset-0 size-full"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label="Play — Sam Lambert at Cursor Compile 2026"
      className="group/play relative block aspect-video w-full overflow-hidden bg-black"
    >
      <img
        src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
        alt=""
        className="absolute inset-0 size-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/play:scale-[1.04]"
      />
      <span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent transition-opacity duration-300 group-hover/play:opacity-70"
      />
      <span
        aria-hidden
        className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-black shadow-[0_4px_20px_-2px_rgba(0,0,0,0.4)] backdrop-blur transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-active/play:scale-95"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="size-6 translate-x-[1px]">
          <path d="M6 4.5 20 12 6 19.5 Z" />
        </svg>
      </span>
    </button>
  );
}

function XGlyph({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
