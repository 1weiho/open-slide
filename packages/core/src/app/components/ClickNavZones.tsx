import { useInspector } from './inspector/InspectorProvider';

type Props = {
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
};

export function ClickNavZones({ onPrev, onNext, canPrev, canNext }: Props) {
  const { active } = useInspector();
  if (active) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Previous page"
        onClick={onPrev}
        disabled={!canPrev}
        data-inspector-ui
        className="absolute inset-y-0 left-0 z-20 w-[18%] min-w-12"
      />
      <button
        type="button"
        aria-label="Next page"
        onClick={onNext}
        disabled={!canNext}
        data-inspector-ui
        className="absolute inset-y-0 right-0 z-20 w-[18%] min-w-12"
      />
    </>
  );
}
