import config from 'virtual:open-slide/config';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { Home } from './routes/home';
import { Slide } from './routes/slide';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={config.build.showSlideBrowser ? <Home /> : <NotFound />} />
        <Route path="/s/:slideId" element={<Slide />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <div className="grid h-screen place-items-center bg-background px-6 text-center text-foreground">
      <div>
        <p className="folio">404 · not found</p>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">Page not found</h1>
      </div>
    </div>
  );
}
