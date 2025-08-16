import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import BottomTabNavigation from './BottomTabNavigation';
import RadialMenu from './RadialMenu';

const ExampleUsage = () => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [menuVisible, setMenuVisible] = useState(false);
  const [theme, setTheme] = useState('dark');

  const handleTasksPress = () => {
    setActiveTab('tasks');
    console.log('Navegando a TAREAS');
  };

  const handleAddPress = () => {
    setActiveTab('add');
    console.log('Navegando a AGREGAR');
  };

  const handleAddLongPress = () => {
    setMenuVisible(true);
  };

  const handleProgressPress = () => {
    setActiveTab('progress');
    console.log('Navegando a PROGRESO');
  };

  const handleMenuSelect = (option) => {
    console.log('Seleccionado:', option);
    switch (option) {
      case 'calendar':
        // navegación a calendario
        break;
      case 'stats':
        setActiveTab('progress');
        break;
      case 'chat':
        // abrir chat con Stebe
        break;
      case 'more':
        // ejemplo: alternar tema
        setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
        break;
      default:
        break;
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'tasks':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.title}>TAREAS</Text>
            <Text style={styles.subtitle}>Lista de tareas pendientes</Text>
          </View>
        );
      case 'add':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.title}>AGREGAR</Text>
            <Text style={styles.subtitle}>Crear nueva tarea o idea</Text>
          </View>
        );
      case 'progress':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.title}>PROGRESO</Text>
            <Text style={styles.subtitle}>Estadísticas y progreso</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, theme === 'dark' ? styles.darkBg : styles.lightBg]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme === 'dark' ? '#000000' : '#FFFFFF'} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, theme === 'dark' ? styles.textLight : styles.textDark]}>IDEAS</Text>
        <Text style={[styles.headerSubtitle, theme === 'dark' ? styles.textMutedLight : styles.textMutedDark]}>Julio 2025</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Bottom Navigation SOLO en estadísticas */}
      {activeTab === 'progress' && (
        <BottomTabNavigation
          onTasksPress={handleTasksPress}
          onAddPress={handleAddPress}
          onAddLongPress={handleAddLongPress}
          onProgressPress={handleProgressPress}
          theme={theme}
        />
      )}

      {/* Radial Menu Overlay */}
      <RadialMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onSelect={handleMenuSelect}
        theme={theme}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  darkBg: {
    backgroundColor: '#000000',
  },
  lightBg: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 18,
    marginTop: 5,
  },
  textLight: {
    color: '#FFFFFF',
  },
  textDark: {
    color: '#000000',
  },
  textMutedLight: {
    color: '#CCCCCC',
  },
  textMutedDark: {
    color: '#666666',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
});

export default ExampleUsage;