import { ButtonLink } from './button';
import { CopyCommand } from './copy-command';
import { Container } from './frame';

export function GetStarted() {
  return (
    <section id="install">
      <Container className="pb-24 sm:pb-32">
        <div
          data-reveal
          className="flex flex-col items-center gap-8 rounded-[24px] border border-[color:var(--color-rule-soft)] bg-[color:var(--color-panel-hi)] px-6 py-20 text-center sm:py-28"
        >
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-balance text-[32px] font-medium leading-[1.08] tracking-[-0.03em] text-[color:var(--color-text)] sm:text-[44px] lg:text-[52px]">
              Author a deck in the next minute.
            </h2>
            <p className="max-w-[46ch] text-pretty text-[16px] leading-[1.6] text-[color:var(--color-text-soft)] sm:text-[17px]">
              One command, zero config. Free and open source under the MIT license. Your agent takes
              it from here.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <ButtonLink href="/docs" size="lg">
              Read the docs
            </ButtonLink>
            <CopyCommand command="npx @open-slide/cli init" location="footer-cta" size="lg" />
          </div>
        </div>
      </Container>
    </section>
  );
}
