import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8083,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            try {
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'backend unavailable' }));
            } catch { }
          });
        },
      },
      // Eliminado: proxy de /lovable-uploads para servir desde /public en desarrollo
    },
  },
  plugins: [
    {
      name: 'react-native-web-shim',
      resolveId(id) {
        if (id === 'react-native/Libraries/TurboModule/TurboModuleRegistry') {
          return id;
        }
      },
      load(id) {
        if (id === 'react-native/Libraries/TurboModule/TurboModuleRegistry') {
          return `
            export const TurboModuleRegistry = {
              get: () => null,
              getEnforcing: () => null,
            };
            export default TurboModuleRegistry;
          `;
        }
      },
      transform(code, id) {
        // Inject missing exports into react-native-web
        if (id.includes('react-native-web') && !id.includes('node_modules/.vite')) {
          if (!code.includes('TurboModuleRegistry')) {
            return code + `\nexport const TurboModuleRegistry = { get: () => null, getEnforcing: () => null };`;
          }
        }
      },
    },
    react(),
  ],
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
    include: [
      'react-native-web',
    ],
    exclude: [
      'react-native',
      'react-native-webview',
      '@react-native-google-signin/google-signin',
      'expo',
      'expo-router',
      '@expo/vector-icons',
    ],
  },
  resolve: {
    extensions: ['.web.js', '.web.jsx', '.web.ts', '.web.tsx', '.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react-native": "react-native-web",
      "react-native/Libraries/TurboModule/TurboModuleRegistry": path.resolve(__dirname, "./src/mocks/TurboModuleRegistry.ts"),
      "@react-native-google-signin/google-signin": path.resolve(__dirname, "./src/mocks/GoogleSignIn.ts"),
      "expo-tracking-transparency": path.resolve(__dirname, "./src/mocks/expo-tracking-transparency.ts"),
      "@capacitor/core": path.resolve(__dirname, "./src/mocks/capacitor-core.ts"),
    },
  },
}));
