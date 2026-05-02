import { useLocale } from '@/lib/use-locale';
import { useInspector } from './inspector/inspector-provider';

type Props = {
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
};

export function ClickNavZones({ onPrev, onNext, canPrev, canNext }: Props) {
  const { active } = useInspector();
  const t = useLocale();
  if (active) return null;

  return (
    <>
      <button
        type="button"
        aria-label={t.clickNav.prevAria}
        onClick={onPrev}
        disabled={!canPrev}
        data-inspector-ui
        className="absolute inset-y-0 left-0 z-20 w-[18%] min-w-12 md:hidden"
      />
      <button
        type="button"
        aria-label={t.clickNav.nextAria}
        onClick={onNext}
        disabled={!canNext}
        data-inspector-ui
        className="absolute inset-y-0 right-0 z-20 w-[18%] min-w-12 md:hidden"
      />
    </>
  );
}
