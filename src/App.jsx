import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import AuthGuard from './components/layout/AuthGuard';
import Portfolio from './pages/Portfolio';
import StockDetail from './pages/StockDetail';
import Review from './pages/Review';

export default function App() {
  return (
    <BrowserRouter>
      <AuthGuard>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Portfolio />} />
            <Route path="/stock/:id" element={<StockDetail />} />
            <Route path="/review" element={<Review />} />
          </Route>
        </Routes>
      </AuthGuard>
    </BrowserRouter>
  );
}
