import { useState, useEffect, createContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/layout/ErrorBoundary';
import AppShell from './components/layout/AppShell';
import AuthGuard from './components/layout/AuthGuard';
import { StockDataProvider } from './contexts/StockDataContext';
import Portfolio from './pages/Portfolio';
import StockDetail from './pages/StockDetail';
import Review from './pages/Review';
import Activation from './pages/Activation';
import { isTauri } from './store';

// License 状态上下文，供 Layout 等组件读取试用天数
export const LicenseContext = createContext({ status: 'licensed' });

export default function App() {
  const [licenseStatus, setLicenseStatus] = useState(null); // null = loading
  const [licenseModule, setLicenseModule] = useState(null);
  const [showActivation, setShowActivation] = useState(false);

  useEffect(() => {
    if (!isTauri) {
      setLicenseStatus({ status: 'licensed' });
      return;
    }
    import('./license.js').then(mod => {
      setLicenseModule(mod);
      mod.checkLicense()
        .then(setLicenseStatus)
        .catch(() => setLicenseStatus({ status: 'licensed' }));
    }).catch(() => setLicenseStatus({ status: 'licensed' }));
  }, []);

  if (!licenseStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-tertiary text-sm">加载中...</div>
      </div>
    );
  }

  // 试用到期或主动点击激活 → 显示激活页
  if (licenseStatus.status === 'expired' || showActivation) {
    return (
      <Activation
        onActivated={() => {
          setLicenseStatus({ status: 'licensed' });
          setShowActivation(false);
        }}
        onActivate={key => licenseModule.activateLicense(key)}
        onBack={licenseStatus.status !== 'expired' ? () => setShowActivation(false) : null}
      />
    );
  }

  // trial 或 licensed → 正常进入应用
  return (
    <ErrorBoundary>
      <LicenseContext.Provider value={{ ...licenseStatus, showActivation: () => setShowActivation(true) }}>
        <BrowserRouter>
          <AuthGuard>
            <StockDataProvider>
              <Routes>
                <Route element={<AppShell />}>
                  <Route path="/" element={<Portfolio />} />
                  <Route path="/stock/:id" element={<StockDetail />} />
                  <Route path="/review" element={<Review />} />
                </Route>
              </Routes>
            </StockDataProvider>
          </AuthGuard>
        </BrowserRouter>
      </LicenseContext.Provider>
    </ErrorBoundary>
  );
}
