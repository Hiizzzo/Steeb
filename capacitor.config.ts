import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.santyy.steeb',
  appName: 'STEEB - Task Manager',
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
      clientId: "169523533903-h5gcs4u9gjptffgt92r68si5mc4n3p0l.apps.googleusercontent.com",
      androidClientId: "169523533903-h5gcs4u9gjptffgt92r68si5mc4n3p0l.apps.googleusercontent.com",
      serverClientId: "169523533903-h5gcs4u9gjptffgt92r68si5mc4n3p0l.apps.googleusercontent.com",
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
