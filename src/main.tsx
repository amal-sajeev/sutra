import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ui/ErrorBoundary';

const savedTheme = localStorage.getItem('sutra-theme') || 'lain';
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
