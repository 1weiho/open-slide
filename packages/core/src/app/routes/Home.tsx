import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FolderPlus } from 'lucide-react';
import { slideIds, loadSlide } from '../lib/slides';
import type { SlideModule } from '../lib/sdk';
import { SlideCanvas } from '../components/SlideCanvas';
import { Card, CardContent } from '@/components/ui/card';
import { useFolders } from '@/lib/folders';
import { Sidebar, DRAFT_ID } from '../components/sidebar/Sidebar';
import { FolderIconChip, SLIDE_DND_MIME } from '../components/sidebar/FolderItem';

export function Home() {
  const { manifest, create, update, remove, assign } = useFolders();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('f') ?? DRAFT_ID;

  const selectFolder = (id: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (id === DRAFT_ID) next.delete('f');
        else next.set('f', id);
        return next;
      },
      { replace: true },
    );
  };

  const { draftSlides, slidesByFolder } = useMemo(() => {
    const byFolder: Record<string, string[]> = {};
    const draft: string[] = [];
    const known = new Set(manifest.folders.map((f) => f.id));
    for (const id of slideIds) {
      const folderId = manifest.assignments[id];
      if (folderId && known.has(folderId)) {
        (byFolder[folderId] ??= []).push(id);
      } else {
        draft.push(id);
      }
    }
    return { draftSlides: draft, slidesByFolder: byFolder };
  }, [manifest]);

  const countFor = (folderId: string | null) =>
    folderId === null ? draftSlides.length : slidesByFolder[folderId]?.length ?? 0;

  const selectedFolder =
    selectedId === DRAFT_ID ? null : manifest.folders.find((f) => f.id === selectedId) ?? null;
  const visibleSlides =
    selectedId === DRAFT_ID ? draftSlides : slidesByFolder[selectedId] ?? [];

  const title = selectedFolder?.name ?? 'Draft';
  const headerIcon = selectedFolder?.icon ?? { type: 'emoji' as const, value: '📝' };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        folders={manifest.folders}
        countFor={countFor}
        selectedId={selectedId}
        onSelect={selectFolder}
        onCreate={(name, icon) => create(name, icon)}
        onRename={(id, name) => update(id, { name })}
        onChangeIcon={(id, icon) => update(id, { icon })}
        onDelete={(id) => {
          if (selectedId === id) selectFolder(DRAFT_ID);
          remove(id);
        }}
        onDropToFolder={(folderId, slideId) => assign(slideId, folderId)}
        onDropToDraft={(slideId) => assign(slideId, null)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl px-8 py-12">
          <header className="mb-8 flex items-center gap-3">
            <FolderIconChip icon={headerIcon} className="size-6 text-xl" />
            <h2 className="font-heading text-2xl font-bold tracking-tight">{title}</h2>
            <span className="text-sm text-muted-foreground">
              {visibleSlides.length} slide{visibleSlides.length === 1 ? '' : 's'}
            </span>
          </header>

          {visibleSlides.length === 0 ? (
            <EmptyState isDraft={selectedId === DRAFT_ID} folderName={selectedFolder?.name} />
          ) : (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
              {visibleSlides.map((id) => (
                <li key={id}>
                  <SlideCard id={id} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ isDraft, folderName }: { isDraft: boolean; folderName?: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
        <FolderPlus className="size-8 opacity-50" />
        {isDraft ? (
          <>
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
          </>
        ) : (
          <>
            <p>No slides in {folderName ?? 'this folder'}.</p>
            <p className="text-sm">Drag a slide from Draft into the sidebar folder.</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SlideCard({ id }: { id: string }) {
  const [slide, setSlide] = useState<SlideModule | null>(null);
  const [dragging, setDragging] = useState(false);
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
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(SLIDE_DND_MIME, id);
        e.dataTransfer.effectAllowed = 'move';
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      className={dragging ? 'opacity-50' : ''}
    >
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
    </div>
  );
}
