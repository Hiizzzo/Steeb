import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.steeb.oficial',
  appName: 'STEEB',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  ios: {
    scheme: 'steeb',
    webContentsDebuggingEnabled: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#000000",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      spinnerStyle: "large",
      spinnerColor: "#999999",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true
    },
    App: {
      appendUserAgent: "STEEB-App/1.0"
    },
    GoogleAuth: {
      scopes: ["profile", "email"],
      serverClientId: "169523533903-ok4fdik9kf257vu1rn4r8dacjhnu1e75.apps.googleusercontent.com",
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
