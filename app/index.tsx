import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  // Usando URL de producción como solicitó el usuario
  const LOCAL_URL = 'https://steeb.vercel.app/';

  return (
    <WebView
      source={{ uri: LOCAL_URL }}
      style={styles.container}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      allowsInlineMediaPlayback={true}
      // "Disfrazamos" el WebView como Safari para que Google permita el login, PERO agregamos una marca para nuestro bypass
      userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1 SteebWebView"
      // Habilitar cookies compartidas para mantener la sesión de Google
      sharedCookiesEnabled={true}
      thirdPartyCookiesEnabled={true}
      // Permitir almacenamiento local para Firebase Auth
      cacheEnabled={true}
      // Ver errores en consola
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