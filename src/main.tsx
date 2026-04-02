import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import type { ThemeMode } from './types';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ui/ErrorBoundary';

const VALID_THEMES: ThemeMode[] = ['lain', 'matrix', 'light'];
const rawTheme = localStorage.getItem('sutra-theme') as ThemeMode | null;
const savedTheme: ThemeMode =
  rawTheme && VALID_THEMES.includes(rawTheme) ? rawTheme : 'lain';
document.documentElement.setAttribute('data-theme', savedTheme);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename="/sutra">
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
