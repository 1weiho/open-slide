import type { CSSProperties } from 'react';
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
            className="floating group block rounded-[10px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] p-6 sm:p-7 transition-[border-color,box-shadow] duration-300 hover:border-[color:var(--color-dim)]"
          >
            <div className="flex items-center justify-end">
              <XGlyph className="size-4 text-[color:var(--color-dim)] transition-colors group-hover:text-[color:var(--color-text)]" />
            </div>

            <div className="relative mt-5 flex flex-col">
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
                    <p className="mt-1 text-[16px] leading-[1.5] text-[color:var(--color-text-soft)]">
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
            <div className="relative aspect-video bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                title="Sam Lambert at Cursor Compile 2026"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="absolute inset-0 size-full"
              />
            </div>
            <figcaption className="border-t border-[color:var(--color-rule-soft)] px-6 py-5">
              <div className="text-[16px] font-medium tracking-[-0.01em] text-[color:var(--color-text)]">
                Cursor Compile 26
              </div>
              <div className="mt-1 text-[14px] text-[color:var(--color-text-soft)]">
                CEO of PlanetScale Sam Lambert
              </div>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

function XGlyph({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
