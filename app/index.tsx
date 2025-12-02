import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useRef } from 'react';

// Configurar Google Sign-In con el ID correcto
GoogleSignin.configure({
  iosClientId: '169523533903-nplu58hed2b3gdfih47mbgrk989itm1c.apps.googleusercontent.com',
  webClientId: '169523533903-j7lhgcgd8ucr9fnfct5r3gop7h1sec4c.apps.googleusercontent.com',
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
        const jsCode = `
          if (window.handleNativeGoogleLogin) {
            window.handleNativeGoogleLogin('${idToken}');
          }
        `;
        webViewRef.current?.injectJavaScript(jsCode);
      }
    } catch (error: any) {
      console.log('Google Sign-In Error:', error);
      const jsCode = `
        console.error('Native Login Error: ${error.code}');
        if (window.handleNativeGoogleLoginError) {
          window.handleNativeGoogleLoginError('${error.code}');
        }
      `;
      webViewRef.current?.injectJavaScript(jsCode);
    }
  };

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