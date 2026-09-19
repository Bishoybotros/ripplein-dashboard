import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { StoreProvider } from './components/store';
import { ToastProvider } from './components/Toast';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* HashRouter: يعمل على GitHub Pages بدون أي إعداد إضافي لإعادة التوجيه */}
    <HashRouter>
      <StoreProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </StoreProvider>
    </HashRouter>
  </StrictMode>,
);
