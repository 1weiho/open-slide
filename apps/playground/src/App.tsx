import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Home } from './routes/Home';
import { Deck } from './routes/Deck';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/d/:deckId" element={<Deck />} />
      </Routes>
    </BrowserRouter>
  );
}
