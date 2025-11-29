import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useEffect, useRef } from 'react';

// Configurar Google Sign-In con el ID que nos dio el usuario
GoogleSignin.configure({
  iosClientId: '893679097790-mog5bng2hpkaipgk679ooh1cdh3pdpr2',
  // webClientId: '...', // No necesario si solo usamos el token en firebase web
});

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const LOCAL_URL = 'https://steeb.vercel.app/';

  // Función para manejar el login nativo
  const handleNativeLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      if (idToken) {
        // Enviar el token de vuelta a la web
        const jsCode = `
          if (window.handleNativeGoogleLogin) {
            window.handleNativeGoogleLogin('${idToken}');
          }
        `;
        webViewRef.current?.injectJavaScript(jsCode);
      }
    } catch (error: any) {
      console.log('Google Sign-In Error:', error);
      // Enviar error a la web
      const jsCode = `
        console.error('Native Login Error: ${error.code}');
        if (window.handleNativeGoogleLoginError) {
          window.handleNativeGoogleLoginError('${error.code}');
        }
      `;
      webViewRef.current?.injectJavaScript(jsCode);
    }
  };

  // Escuchar mensajes desde la Web
  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'loginGoogle') {
        handleNativeLogin();
      }
    } catch (e) {
      // Ignorar mensajes que no sean JSON
    }
  };

  return (
    <WebView
      ref={webViewRef}
      source={{ uri: LOCAL_URL }}
      style={styles.container}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      allowsInlineMediaPlayback={true}
      // User Agent personalizado para que la web sepa que es la app nativa
      userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1 SteebNativeWrapper"
      sharedCookiesEnabled={true}
      thirdPartyCookiesEnabled={true}
      cacheEnabled={true}
      onMessage={onMessage}
      onError={(syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.warn('WebView error: ', nativeEvent);
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});