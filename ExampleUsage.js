import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import BottomTabNavigation from './BottomTabNavigation';

const ExampleUsage = () => {
  const [activeTab, setActiveTab] = useState('tasks');

  const handleTasksPress = () => {
    setActiveTab('tasks');
    console.log('Navegando a TAREAS');
    // Aquí puedes navegar a la pantalla de tareas
  };

  const handleAddPress = () => {
    setActiveTab('add');
    console.log('Navegando a AGREGAR');
    // Aquí puedes abrir modal de agregar o navegar a pantalla de agregar
  };

  const handleProgressPress = () => {
    setActiveTab('progress');
    console.log('Navegando a PROGRESO');
    // Aquí puedes navegar a la pantalla de progreso
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>IDEAS</Text>
        <Text style={styles.headerSubtitle}>Julio 2025</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Bottom Navigation SIEMPRE visible */}
      <BottomTabNavigation
        onTasksPress={handleTasksPress}
        onAddPress={handleAddPress}
        onProgressPress={handleProgressPress}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    color: '#000000',
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#666666',
    marginTop: 5,
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