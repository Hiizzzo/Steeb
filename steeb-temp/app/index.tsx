import { View, Text, StyleSheet } from 'react-native';

export default function Index() {
  console.log('App Index montada correctamente');
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>STEEB - Task Manager</Text>
      <Text style={styles.subtitle}>App funcionando correctamente</Text>
      <Text style={styles.test}>✅ Pantalla en blanco solucionada</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  test: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
});