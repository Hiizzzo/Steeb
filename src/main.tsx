
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/flash-animation.css';
import { registerServiceWorker } from './registerServiceWorker';
import { setupDevelopmentErrorHandling } from './lib/errorHandler';
import { firebaseErrorHandler } from './lib/firebaseErrorHandler';

// Function to update browser UI for dark mode
const updateBrowserUITheme = (isDark: boolean) => {
  // Update meta theme-color tags
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', isDark ? '#000000' : '#FFFFFF');
  }

  // Update Apple status bar style
  const appleStatusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (appleStatusBarMeta) {
    appleStatusBarMeta.setAttribute('content', isDark ? 'black-translucent' : 'default');
  }

  // Force update browser UI color scheme
  if (isDark) {
    document.documentElement.style.setProperty('color-scheme', 'dark');
    // Force dark mode for browser UI elements
    const meta = document.createElement('meta');
    meta.name = 'color-scheme';
    meta.content = 'dark';
    document.head.appendChild(meta);

    // Additional meta tags for mobile browsers
    const msTileMeta = document.createElement('meta');
    msTileMeta.name = 'msapplication-TileColor';
    msTileMeta.content = '#000000';
    document.head.appendChild(msTileMeta);

    const msNavMeta = document.createElement('meta');
    msNavMeta.name = 'msapplication-navbutton-color';
    msNavMeta.content = '#000000';
    document.head.appendChild(msNavMeta);
  } else {
    document.documentElement.style.setProperty('color-scheme', 'light');
    // Remove dark mode meta tags if they exist
    const darkSchemeMetas = document.querySelectorAll('meta[name="color-scheme"][content="dark"]');
    darkSchemeMetas.forEach(meta => meta.remove());

    // Remove mobile browser dark mode meta tags
    const msTileMetas = document.querySelectorAll('meta[name="msapplication-TileColor"]');
    msTileMetas.forEach(meta => meta.remove());

    const msNavMetas = document.querySelectorAll('meta[name="msapplication-navbutton-color"]');
    msNavMetas.forEach(meta => meta.remove());
  }
};

// Setup development error handling
setupDevelopmentErrorHandling();

// Initialize Firebase error handler
firebaseErrorHandler.logDevelopmentInfo();

// Registramos el service worker
registerServiceWorker();

// Initialize browser UI theme based on current theme
const initializeBrowserUITheme = () => {
  const isDark = document.documentElement.classList.contains('dark') ||
                 document.documentElement.classList.contains('shiny');
  updateBrowserUITheme(isDark);
};

// Observer for theme changes
const observeThemeChanges = () => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const isDark = (mutation.target as Element).classList.contains('dark') ||
                     (mutation.target as Element).classList.contains('shiny');
        updateBrowserUITheme(isDark);
      }
    });
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });
};

// Dev diagnostics: verify SW registrations and network state
if (!import.meta.env.PROD) {
  console.log('[Dev] Online state:', navigator.onLine);
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      console.log('[Dev] Service Worker registrations:', regs.map((r) => r.scope));
    });
  }
}

// Initialize theme and start observing
initializeBrowserUITheme();
observeThemeChanges();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
