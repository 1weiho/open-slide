import { Presentation } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/lib/use-locale';
import { useSlideTitles } from '@/lib/use-slide-titles';
import type { Folder } from '../../lib/sdk';
import { slideIds } from '../../lib/slides';
import { FolderIconChip, SystemViewIcon } from '../sidebar/folder-item';
import { ALL_SLIDES_ID, ASSETS_ID, DRAFT_ID, THEMES_ID } from '../sidebar/sidebar';
import { type CommandGroupSpec, CommandMenu, type CommandSpec } from './command-menu';

export function HomeCommandMenu({
  open,
  onOpenChange,
  folders,
  titleMap,
  onSelectView,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: Folder[];
  titleMap: Record<string, string>;
  onSelectView: (id: string) => void;
}) {
  const t = useLocale();
  const navigate = useNavigate();
  const loadedTitles = useSlideTitles(open);

  const groups = useMemo<CommandGroupSpec[]>(() => {
    const slides: CommandSpec[] = slideIds.map((id) => ({
      id: `slide-${id}`,
      label: titleMap[id] ?? loadedTitles[id] ?? id,
      icon: <Presentation />,
      keywords: [id],
      run: () => navigate(`/s/${id}`),
    }));

    const folderItems: CommandSpec[] = [
      {
        id: `view-${ALL_SLIDES_ID}`,
        label: t.home.slides,
        icon: <SystemViewIcon kind="all" />,
        keywords: ['all', 'slides'],
        run: () => onSelectView(ALL_SLIDES_ID),
      },
      {
        id: `view-${DRAFT_ID}`,
        label: t.home.draft,
        icon: <SystemViewIcon kind="draft" />,
        keywords: ['draft', 'unsorted'],
        run: () => onSelectView(DRAFT_ID),
      },
      ...folders.map((folder) => ({
        id: `view-${folder.id}`,
        label: folder.name,
        icon: <FolderIconChip icon={folder.icon} />,
        keywords: ['folder', folder.id],
        run: () => onSelectView(folder.id),
      })),
    ];

    const navigation: CommandSpec[] = [
      {
        id: `view-${THEMES_ID}`,
        label: t.home.themes,
        icon: <SystemViewIcon kind="themes" />,
        keywords: ['themes', 'design'],
        run: () => onSelectView(THEMES_ID),
      },
    ];
    if (import.meta.env.DEV) {
      navigation.push({
        id: `view-${ASSETS_ID}`,
        label: t.home.assets,
        icon: <SystemViewIcon kind="assets" />,
        keywords: ['assets', 'images', 'files'],
        run: () => onSelectView(ASSETS_ID),
      });
    }

    return [
      { id: 'slides', heading: t.commandMenu.groupSlides, items: slides },
      { id: 'folders', heading: t.commandMenu.groupFolders, items: folderItems },
      { id: 'navigation', heading: t.commandMenu.groupNavigation, items: navigation },
    ];
  }, [t, folders, titleMap, loadedTitles, navigate, onSelectView]);

  return (
    <CommandMenu
      open={open}
      onOpenChange={onOpenChange}
      groups={groups}
      placeholder={t.commandMenu.placeholder}
    />
  );
}
