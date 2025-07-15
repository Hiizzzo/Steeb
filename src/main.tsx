
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Registrar service worker de forma asíncrona para no bloquear el inicio
setTimeout(() => {
  import('./registerServiceWorker').then(({ registerServiceWorker }) => {
    registerServiceWorker();
  });
}, 100);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
