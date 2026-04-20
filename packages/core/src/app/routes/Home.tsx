import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderPlus } from 'lucide-react';
import { slideIds, loadSlide } from '../lib/slides';
import type { SlideModule } from '../lib/sdk';
import { SlideCanvas } from '../components/SlideCanvas';
import { Card, CardContent } from '@/components/ui/card';

export function Home() {
  return (
    <div className="mx-auto max-w-6xl px-8 py-16">
      <header className="mb-10 flex items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">open-slide</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {slideIds.length} slide{slideIds.length === 1 ? '' : 's'} · start with any agent using the{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">create-slide</code>{' '}
            skill
          </p>
        </div>
      </header>

      {slideIds.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
            <FolderPlus className="size-8 opacity-50" />
            <p>No slides yet.</p>
            <p className="text-sm">
              Create{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                slides/my-slide/index.tsx
              </code>{' '}
              with{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                export default [Page1, Page2]
              </code>
              .
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
          {slideIds.map((id) => (
            <li key={id}>
              <SlideCard id={id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SlideCard({ id }: { id: string }) {
  const [slide, setSlide] = useState<SlideModule | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadSlide(id)
      .then((mod) => {
        if (!cancelled) setSlide(mod);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id]);

  const FirstPage = slide?.default[0];
  const title = slide?.meta?.title ?? id;
  const pageCount = slide?.default.length ?? 0;

  return (
    <Link
      to={`/s/${id}`}
      className="group block overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 transition-all duration-200 hover:-translate-y-0.5 hover:ring-foreground/20 hover:shadow-lg"
    >
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-indigo-50 to-violet-50">
        {FirstPage ? (
          <SlideCanvas flat>
            <FirstPage />
          </SlideCanvas>
        ) : (
          <div className="grid h-full w-full place-items-center text-xs tracking-widest uppercase text-muted-foreground/60">
            Loading
          </div>
        )}
      </div>
      <div className="flex items-baseline justify-between gap-3 px-4 py-3">
        <span className="truncate text-sm font-medium">{title}</span>
        {pageCount > 0 && (
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {pageCount} page{pageCount === 1 ? '' : 's'}
          </span>
        )}
      </div>
    </Link>
  );
}
