
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/flash-animation.css';
import { registerServiceWorker } from './registerServiceWorker';
import { setupDevelopmentErrorHandling } from './lib/errorHandler';
import { firebaseErrorHandler } from './lib/firebaseErrorHandler';

// Setup development error handling
setupDevelopmentErrorHandling();

// Initialize Firebase error handler
firebaseErrorHandler.logDevelopmentInfo();

// Registramos el service worker
registerServiceWorker();

// Dev diagnostics: verify SW registrations and network state
if (!import.meta.env.PROD) {
  console.log('[Dev] Online state:', navigator.onLine);
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      console.log('[Dev] Service Worker registrations:', regs.map((r) => r.scope));
    });
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
