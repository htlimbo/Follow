import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AuthGuard from './components/AuthGuard';
import Portfolio from './pages/Portfolio';
import StockDetail from './pages/StockDetail';

export default function App() {
  return (
    <BrowserRouter>
      <AuthGuard>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Portfolio />} />
            <Route path="/stock/:id" element={<StockDetail />} />
          </Route>
        </Routes>
      </AuthGuard>
    </BrowserRouter>
  );
}
