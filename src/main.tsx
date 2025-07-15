
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerServiceWorker } from './registerServiceWorker'
import { ThemeProvider } from "next-themes";
import React from 'react';

// Registramos el service worker para PWA
registerServiceWorker();

// Optimización: Pre-warm el container de React
const container = document.getElementById('root')!;
const root = createRoot(container);

// Renderizado optimizado con StrictMode solo en desarrollo
const isDevelopment = import.meta.env.DEV;

root.render(
  isDevelopment ? (
    <React.StrictMode>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <App />
      </ThemeProvider>
    </React.StrictMode>
  ) : (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <App />
    </ThemeProvider>
  )
);
