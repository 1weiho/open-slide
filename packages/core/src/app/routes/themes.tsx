import { useNavigate, useParams } from 'react-router-dom';
import { useLocale } from '@/lib/use-locale';
import { FolderIconChip } from '../components/sidebar/folder-item';
import { ThemeDetail } from '../components/themes/theme-detail';
import { ThemesGallery } from '../components/themes/themes-gallery';
import { themes as themeRegistry } from '../lib/themes';

export function ThemesGalleryPage() {
  const navigate = useNavigate();
  const t = useLocale();
  return (
    <>
      <header className="mb-8 md:mb-12">
        <div className="flex flex-wrap items-center gap-3">
          <FolderIconChip icon={{ type: 'emoji', value: '🎨' }} className="size-7 text-2xl" />
          <h1 className="font-heading text-[32px] font-semibold leading-[1.05] tracking-[-0.025em] md:text-[44px]">
            {t.themes.title}
          </h1>
          <span className="folio ml-1 self-end pb-2">
            {themeRegistry.length.toString().padStart(2, '0')}
          </span>
        </div>
      </header>
      <ThemesGallery onOpen={(id) => navigate(`/themes/${encodeURIComponent(id)}`)} />
    </>
  );
}

export function ThemeDetailPage() {
  const { themeId } = useParams<{ themeId: string }>();
  const navigate = useNavigate();
  if (!themeId) return null;
  return <ThemeDetail themeId={themeId} onBack={() => navigate('/themes')} />;
}
