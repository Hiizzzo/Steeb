import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const BottomTabNavigation = ({ onTasksPress, onAddPress, onProgressPress, onAddLongPress, theme = 'dark' }) => {
  // Determinar color de íconos según el tema
  const iconColor = theme === 'dark' ? '#FFFFFF' : '#000000';
  const buttonBgColor = theme === 'dark' ? '#FFFFFF' : '#000000';

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {/* Botón TAREAS (Check) */}
        <TouchableOpacity
          style={[styles.tabButton, { backgroundColor: buttonBgColor }]}
          onPress={onTasksPress}
          activeOpacity={0.7}
        >
          <Ionicons name="checkmark" size={24} color={iconColor} />
        </TouchableOpacity>

        {/* Botón AGREGAR (Plus) - Más grande y centrado */}
        <TouchableOpacity
          style={[styles.tabButton, styles.centerButton, { backgroundColor: buttonBgColor }]}
          onPress={onAddPress}
          onLongPress={onAddLongPress}
          delayLongPress={300}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={28} color={iconColor} />
        </TouchableOpacity>

        {/* Botón PROGRESO (Chart/Stats) */}
        <TouchableOpacity
          style={[styles.tabButton, { backgroundColor: buttonBgColor }]}
          onPress={onProgressPress}
          activeOpacity={0.7}
        >
          <Ionicons name="stats-chart" size={24} color={iconColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'transparent',
    paddingHorizontal: 40,
    paddingVertical: 10,
    width: width * 0.8,
  },
  tabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  centerButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    elevation: 10,
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});

export default BottomTabNavigation;