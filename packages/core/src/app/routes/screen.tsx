import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { format, useLocale } from '@/lib/use-locale';
import { Player } from '../components/player';
import { useSlideModule } from '../lib/use-slide-module';

/**
 * The audience slide window. It hosts the Player with controls, so it is the
 * source of truth that broadcasts state and answers the presenter's commands.
 */
export function Screen() {
  const { slideId = '' } = useParams();
  const { slide, error } = useSlideModule(slideId);
  const [searchParams] = useSearchParams();
  const [index, setIndex] = useState(() => {
    const p = Number(searchParams.get('p') ?? '1') - 1;
    return Number.isFinite(p) && p > 0 ? p : 0;
  });
  // Fullscreen needs a user gesture in this window; window.open doesn't carry
  // one across, so the audience starts behind a one-click overlay.
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(true);
  const t = useLocale();

  if (error) {
    return (
      <div className="dark grid h-dvh place-items-center bg-background p-8 text-foreground">
        <div className="max-w-md text-center">
          <span className="eyebrow text-destructive/80">{t.common.loadFailed}</span>
          <h2 className="mt-2 font-heading text-xl font-semibold">{t.common.failedToLoadSlide}</h2>
          <pre className="mt-4 overflow-auto rounded-[6px] border border-border bg-card p-4 text-left text-[11.5px] whitespace-pre-wrap shadow-edge">
            {error}
          </pre>
        </div>
      </div>
    );
  }

  if (!slide) {
    return (
      <div className="dark grid h-dvh place-items-center bg-background text-muted-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-px w-56 overflow-hidden bg-border">
            <span
              aria-hidden
              className="line-loader-bar absolute inset-y-[-0.5px] left-0 w-1/4 bg-foreground"
            />
          </div>
          <div className="text-[11.5px]">{format(t.presenter.loadingSlide, { slideId })}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Player
        pages={slide.default}
        design={slide.design}
        transition={slide.transition}
        index={Math.max(0, Math.min(slide.default.length - 1, index))}
        onIndexChange={setIndex}
        onExit={() => window.close()}
        controls
        slideId={slideId}
        fullscreen={false}
      />
      {showFullscreenPrompt && (
        <button
          type="button"
          onClick={() => {
            document.documentElement
              .requestFullscreen?.()
              .then(() => setShowFullscreenPrompt(false))
              .catch(() => {});
          }}
          className="dark fixed inset-0 z-[9999] grid place-items-center bg-black/80 text-foreground"
        >
          <span className="font-heading text-2xl font-semibold tracking-tight">
            {t.present.enterFullscreenAria}
          </span>
        </button>
      )}
    </>
  );
}
