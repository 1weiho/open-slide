import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Home } from './routes/Home';
import { Slide } from './routes/Slide';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/s/:slideId" element={<Slide />} />
      </Routes>
    </BrowserRouter>
  );
}
