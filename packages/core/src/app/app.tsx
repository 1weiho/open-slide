import config from 'virtual:open-slide/config';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { useLocale } from './lib/use-locale';
import { AssetsPage } from './routes/assets';
import { Home } from './routes/home';
import { HomeShell } from './routes/home-shell';
import { Presenter } from './routes/presenter';
import { Slide } from './routes/slide';
import { ThemeDetailPage, ThemesGalleryPage } from './routes/themes';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {config.build.showSlideBrowser ? (
          <Route element={<HomeShell />}>
            <Route path="/" element={<Home />} />
            <Route path="/themes" element={<ThemesGalleryPage />} />
            <Route path="/themes/:themeId" element={<ThemeDetailPage />} />
            <Route path="/assets" element={<AssetsPage />} />
          </Route>
        ) : (
          <Route path="/" element={<NotFound />} />
        )}
        <Route path="/s/:slideId" element={<Slide />} />
        <Route path="/s/:slideId/presenter" element={<Presenter />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

function NotFound() {
  const t = useLocale();
  return (
    <div className="grid h-screen place-items-center bg-background px-6 text-center text-foreground">
      <div>
        <p className="folio">{t.notFound.eyebrow}</p>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
          {t.notFound.title}
        </h1>
      </div>
    </div>
  );
}
