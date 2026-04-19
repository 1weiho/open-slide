import type { SlidePage } from '../lib/sdk';
import { SlideCanvas } from './SlideCanvas';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../lib/sdk';

type Props = {
  pages: SlidePage[];
  current: number;
  onSelect: (index: number) => void;
};

const THUMB_WIDTH = 200;
const THUMB_SCALE = THUMB_WIDTH / CANVAS_WIDTH;
const THUMB_HEIGHT = CANVAS_HEIGHT * THUMB_SCALE;

export function ThumbnailRail({ pages, current, onSelect }: Props) {
  return (
    <aside className="thumbnail-rail">
      {pages.map((Page, i) => (
        <button
          key={i}
          className={`thumbnail ${i === current ? 'is-active' : ''}`}
          onClick={() => onSelect(i)}
          aria-label={`Go to slide ${i + 1}`}
        >
          <span className="thumbnail-index">{i + 1}</span>
          <div
            className="thumbnail-frame"
            style={{ width: THUMB_WIDTH, height: THUMB_HEIGHT }}
          >
            <SlideCanvas scale={THUMB_SCALE} center={false} className="flat">
              <Page />
            </SlideCanvas>
          </div>
        </button>
      ))}
    </aside>
  );
}
