import { useCallback, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAssets } from '@/lib/assets';
import { useFolders } from '@/lib/folders';
import { format, useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';
import { MobileFolderPill } from '../components/sidebar/mobile-pill';
import { ASSETS_ID, DRAFT_ID, Sidebar, THEMES_ID } from '../components/sidebar/sidebar';
import type { FoldersManifest } from '../lib/sdk';
import { slideIds } from '../lib/slides';
import { themes as themeRegistry } from '../lib/themes';

export type HomeOutletContext = {
  manifest: FoldersManifest;
  loading: boolean;
  draftSlides: string[];
  slidesByFolder: Record<string, string[]>;
  /** Selected folder id when on `/`; equals DRAFT_ID, a folder id, or THEMES_ID. */
  selectedId: string;
  reportTitle: (slideId: string, title: string) => void;
  titleMap: Record<string, string>;
  assign: (slideId: string, folderId: string | null) => Promise<void>;
  renameSlide: (slideId: string, name: string) => Promise<void>;
  deleteSlide: (slideId: string) => Promise<void>;
};

function pathToSelectedId(pathname: string, search: URLSearchParams): string {
  if (pathname === '/themes' || pathname.startsWith('/themes/')) return THEMES_ID;
  if (pathname === '/assets') return ASSETS_ID;
  return search.get('f') ?? DRAFT_ID;
}

export function HomeShell() {
  const { manifest, loading, create, update, remove, assign, renameSlide, deleteSlide } =
    useFolders();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const t = useLocale();

  const selectedId = pathToSelectedId(location.pathname, searchParams);

  const [titleMap, setTitleMap] = useState<Record<string, string>>({});
  const reportTitle = useCallback((slideId: string, slideTitle: string) => {
    setTitleMap((prev) =>
      prev[slideId] === slideTitle ? prev : { ...prev, [slideId]: slideTitle },
    );
  }, []);

  const selectFolder = useCallback(
    (id: string) => {
      if (id === THEMES_ID) navigate('/themes', { replace: true });
      else if (id === ASSETS_ID) navigate('/assets', { replace: true });
      else if (id === DRAFT_ID) navigate('/', { replace: true });
      else navigate(`/?f=${encodeURIComponent(id)}`, { replace: true });
    },
    [navigate],
  );

  const { assets: globalAssets } = useAssets('@global');
  const isAssetsRoute = location.pathname === '/assets';

  const { draftSlides, slidesByFolder } = useMemo(() => {
    const byFolder: Record<string, string[]> = {};
    const draft: string[] = [];
    const known = new Set(manifest.folders.map((f) => f.id));
    for (const id of slideIds) {
      const folderId = manifest.assignments[id];
      if (folderId && known.has(folderId)) {
        byFolder[folderId] ??= [];
        byFolder[folderId].push(id);
      } else {
        draft.push(id);
      }
    }
    return { draftSlides: draft, slidesByFolder: byFolder };
  }, [manifest]);

  const countFor = (folderId: string | null) =>
    folderId === null ? draftSlides.length : (slidesByFolder[folderId]?.length ?? 0);

  const moveSlideWithToast = useCallback(
    async (slideId: string, folderId: string | null) => {
      if (manifest.assignments[slideId] === (folderId ?? undefined)) return;
      const slideName = titleMap[slideId] ?? slideId;
      const folderName =
        folderId === null
          ? t.home.draft
          : (manifest.folders.find((f) => f.id === folderId)?.name ?? folderId);
      try {
        await assign(slideId, folderId);
        toast.success(format(t.home.toastSlideMoved, { slide: slideName, folder: folderName }));
      } catch {
        toast.error(t.home.toastSlideMoveFailed);
      }
    },
    [assign, manifest, titleMap, t],
  );

  const ctx: HomeOutletContext = {
    manifest,
    loading,
    draftSlides,
    slidesByFolder,
    selectedId,
    reportTitle,
    titleMap,
    assign,
    renameSlide,
    deleteSlide,
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <div className="hidden md:block">
        <Sidebar
          folders={manifest.folders}
          countFor={countFor}
          themesCount={themeRegistry.length}
          assetsCount={globalAssets.length}
          selectedId={selectedId}
          onSelect={selectFolder}
          onCreate={(name, icon) => create(name, icon)}
          onRename={(id, name) => update(id, { name })}
          onChangeIcon={(id, icon) => update(id, { icon })}
          onDelete={async (id) => {
            const name = manifest.folders.find((f) => f.id === id)?.name ?? id;
            if (selectedId === id) selectFolder(DRAFT_ID);
            try {
              await remove(id);
              toast.success(format(t.home.toastFolderDeleted, { name }));
            } catch {
              toast.error(t.home.toastFolderDeleteFailed);
            }
          }}
          onDropToFolder={(folderId, slideId) => moveSlideWithToast(slideId, folderId)}
          onDropToDraft={(slideId) => moveSlideWithToast(slideId, null)}
        />
      </div>

      <div className="paper relative flex min-w-0 flex-1 flex-col overflow-y-auto bg-canvas">
        <div className="flex items-center justify-between border-b border-hairline bg-sidebar px-4 py-3 md:hidden">
          <h1 className="font-heading text-lg font-bold tracking-tight">{t.home.appTitle}</h1>
        </div>
        <div className="border-b border-hairline bg-sidebar px-4 py-2 md:hidden">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <MobileFolderPill
              icon={{ type: 'emoji', value: '📝' }}
              label={t.home.draft}
              count={countFor(null)}
              active={selectedId === DRAFT_ID}
              onClick={() => selectFolder(DRAFT_ID)}
            />
            <MobileFolderPill
              icon={{ type: 'emoji', value: '🎨' }}
              label={t.home.themes}
              count={themeRegistry.length}
              active={selectedId === THEMES_ID}
              onClick={() => selectFolder(THEMES_ID)}
            />
            <MobileFolderPill
              icon={{ type: 'emoji', value: '🗂️' }}
              label={t.home.assets}
              count={globalAssets.length}
              active={selectedId === ASSETS_ID}
              onClick={() => selectFolder(ASSETS_ID)}
            />
            {manifest.folders.map((f) => (
              <MobileFolderPill
                key={f.id}
                icon={f.icon}
                label={f.name}
                count={countFor(f.id)}
                active={selectedId === f.id}
                onClick={() => selectFolder(f.id)}
              />
            ))}
          </div>
        </div>

        <div
          className={cn(
            isAssetsRoute
              ? 'flex min-h-0 flex-1 flex-col'
              : 'mx-auto w-full max-w-[1180px] px-5 py-8 md:px-10 md:py-12',
          )}
        >
          <Outlet context={ctx} />
        </div>
      </div>
    </div>
  );
}
