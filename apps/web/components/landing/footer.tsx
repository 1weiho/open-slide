import Image from 'next/image';
import { Container } from './frame';
import { VercelOssBadge } from './vercel-oss-badge';

export function Footer() {
  return (
    <footer className="border-t border-[color:var(--color-rule)]">
      <Container className="grid grid-cols-12 gap-x-6 gap-y-10 py-12 sm:py-16">
        <div className="col-span-12 flex flex-col gap-4 lg:col-span-6">
          <div className="flex items-center gap-2.5 text-[14px] font-medium">
            <Image
              src="/open-slide.png"
              alt=""
              aria-hidden
              width={24}
              height={24}
              className="h-6 w-6 rounded-[4px]"
            />
            <span className="tracking-[-0.01em]">open-slide</span>
          </div>
          <p className="max-w-[38ch] text-[14px] leading-[1.6] text-[color:var(--color-muted)]">
            A React-first slide framework authored by AI agents. Free and open source under the MIT
            license.
          </p>
        </div>

        <FooterCol
          title="Product"
          links={[
            ['Live demo', '#demo'],
            ['Docs', '/docs'],
            ['FAQ', '#faq'],
          ]}
        />
        <FooterCol
          title="Packages"
          links={[
            ['@open-slide/core', 'https://www.npmjs.com/package/@open-slide/core'],
            ['@open-slide/cli', 'https://www.npmjs.com/package/@open-slide/cli'],
          ]}
        />
        <FooterCol
          title="Elsewhere"
          links={[
            ['GitHub', 'https://github.com/1weiho/open-slide'],
            ['npm', 'https://www.npmjs.com/package/@open-slide/core'],
            ['Issues', 'https://github.com/1weiho/open-slide/issues'],
          ]}
        />
      </Container>

      <div className="border-t border-[color:var(--color-rule-soft)]">
        <Container className="flex flex-col items-start justify-between gap-3 py-5 text-[13px] text-[color:var(--color-muted)] sm:flex-row sm:items-center sm:gap-0">
          <VercelOssBadge />
          <span>
            Crafted with 🤍 by{' '}
            <a
              href="https://1wei.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[color:var(--color-text)] transition-colors hover:text-[color:var(--color-muted)]"
            >
              Yiwei
            </a>
            .
          </span>
        </Container>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div className="col-span-6 flex flex-col gap-4 md:col-span-4 lg:col-span-2">
      <div className="caption">{title}</div>
      <ul className="flex flex-col gap-2.5">
        {links.map(([label, href]) => (
          <li key={label}>
            <a
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="text-[14px] text-[color:var(--color-text-soft)] transition-colors hover:text-[color:var(--color-text)]"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
