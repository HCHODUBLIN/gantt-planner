import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { I18nProvider } from './contexts/I18nContext';
import { DataProvider } from './contexts/DataContext';
import App from './App';
import './App.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <ThemeProvider>
        <I18nProvider>
          <DataProvider>
            <App />
          </DataProvider>
        </I18nProvider>
      </ThemeProvider>
    </HashRouter>
  </StrictMode>
);
