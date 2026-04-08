import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n';
import './index.css';
import App from './App';
import { useAppStore } from './core/store/useAppStore';

function applyTheme(theme: 'light' | 'dark' | 'system') {
  const root = document.documentElement;
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
}

// Apply initial theme
applyTheme(useAppStore.getState().theme);

// Subscribe to theme changes
useAppStore.subscribe((state) => {
  applyTheme(state.theme);
});

// Listen for system preference changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (useAppStore.getState().theme === 'system') {
    applyTheme('system');
  }
});

// When a new deploy changes chunk hashes, the old service worker may serve a stale
// index.html that references chunks that no longer exist. Vite fires this event when
// a dynamic import fails — reloading fetches the fresh index.html and correct chunks.
window.addEventListener('vite:preloadError', () => {
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
