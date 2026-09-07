import config from 'virtual:open-slide/config';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { useLocale } from './lib/use-locale';
import { AssetsPage } from './routes/assets';
import { Home } from './routes/home';
import { HomeShell } from './routes/home-shell';
import { Presenter } from './routes/presenter';
import { Slide } from './routes/slide';
import { ThemeDetailPage, ThemesGalleryPage } from './routes/themes';

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      {/* One app-wide provider so adjacent tooltips group: after the first
          opens, moving along a toolbar shows the rest instantly. */}
      <TooltipProvider delay={200}>
        <Routes>
          {config.build.showSlideBrowser && (
            <Route element={<HomeShell />}>
              <Route path="/" element={<Home />} />
              <Route path="/themes" element={<ThemesGalleryPage />} />
              <Route path="/themes/:themeId" element={<ThemeDetailPage />} />
              <Route path="/assets" element={<AssetsPage />} />
            </Route>
          )}
          <Route path="/s/:slideId" element={<Slide />} />
          <Route path="/s/:slideId/presenter" element={<Presenter />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
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
