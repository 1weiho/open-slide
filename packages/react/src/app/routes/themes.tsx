import { useNavigate, useParams } from 'react-router-dom';
import { useLocale } from '@/lib/use-locale';
import { pad2 } from '@/lib/utils';
import { SystemViewIcon } from '../components/sidebar/folder-item';
import { ThemeDetail } from '../components/themes/theme-detail';
import { ThemesGallery } from '../components/themes/themes-gallery';
import { themes as themeRegistry } from '../lib/themes';

export function ThemesGalleryPage() {
  const navigate = useNavigate();
  const t = useLocale();
  return (
    <>
      <header className="mb-6 md:mb-8">
        <div className="flex flex-wrap items-center gap-2.5">
          <SystemViewIcon kind="themes" className="text-muted-foreground" />
          <h1 className="font-heading text-[19px] font-semibold leading-none tracking-[-0.015em] md:text-[21px]">
            {t.themes.title}
          </h1>
          <span className="folio ml-0.5">{pad2(themeRegistry.length)}</span>
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
