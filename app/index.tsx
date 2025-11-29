import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  // Usando URL de producción como solicitó el usuario
  const LOCAL_URL = 'https://steeb.vercel.app/';

  return (
    onError = {(syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('WebView error: ', nativeEvent);
  }
}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});