
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.steeb.app',
  appName: 'steve-the-taskmaster',
  webDir: 'dist',
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
