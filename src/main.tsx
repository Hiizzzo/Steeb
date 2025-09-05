
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './registerServiceWorker';
import { setupDevelopmentErrorHandling } from './lib/errorHandler';
import { firebaseErrorHandler } from './lib/firebaseErrorHandler';

// Setup development error handling
setupDevelopmentErrorHandling();

// Initialize Firebase error handler
firebaseErrorHandler.logDevelopmentInfo();

// Registramos el service worker
registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
