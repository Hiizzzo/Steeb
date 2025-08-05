
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.7126f1f20cb14568aedf02de29585a45',
  appName: 'steve-the-taskmaster',
  webDir: 'dist',
  server: {
    url: 'https://7126f1f2-0cb1-4568-aedf-02de29585a45.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#FFFFFF",
      showSpinner: true,
      spinnerColor: "#000000",
    },
    Filesystem: {
      ioTimeout: 60000 // Timeout largo para descargas de modelos grandes
    }
  }
};

export default config;
