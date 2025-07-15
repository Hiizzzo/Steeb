import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimizaciones de build para mejorar rendimiento
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar vendors pesados en chunks independientes
          'react-vendor': ['react', 'react-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'router-vendor': ['react-router-dom'],
        },
      },
    },
    // Optimizar el tamaño del chunk
    chunkSizeWarningLimit: 1000,
    // Habilitar source maps solo en desarrollo
    sourcemap: mode === 'development',
  },
  // Optimizaciones para dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      'react-router-dom',
    ],
  },
}));
