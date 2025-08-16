import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Text,
} from 'react-native';

const { width } = Dimensions.get('window');

// Iconos personalizados con componentes simples
const CheckIcon = ({ color = '#FFFFFF' }) => (
  <View style={iconStyles.checkContainer}>
    <Text style={[iconStyles.checkText, { color }]}>✓</Text>
  </View>
);

const PlusIcon = ({ color = '#FFFFFF' }) => (
  <View style={iconStyles.plusContainer}>
    <View style={[iconStyles.plusHorizontal, { backgroundColor: color }]} />
    <View style={[iconStyles.plusVertical, { backgroundColor: color }]} />
  </View>
);

const ChartIcon = ({ color = '#FFFFFF' }) => (
  <View style={iconStyles.chartContainer}>
    <View style={[iconStyles.chartBar, { height: 12, backgroundColor: color }]} />
    <View style={[iconStyles.chartBar, { height: 18, backgroundColor: color }]} />
    <View style={[iconStyles.chartBar, { height: 15, backgroundColor: color }]} />
    <View style={[iconStyles.chartBar, { height: 20, backgroundColor: color }]} />
  </View>
);

const BottomTabNavigationSimple = ({ onTasksPress, onAddPress, onProgressPress, onAddLongPress, theme = 'dark' }) => {
  const normalizedTheme = theme === 'white' ? 'light' : theme;
  const isLight = normalizedTheme === 'light';
  const colors = {
    buttonBg: isLight ? '#FFFFFF' : '#000000',
    icon: isLight ? '#000000' : '#FFFFFF',
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {/* Botón TAREAS (Check) */}
        <TouchableOpacity
          style={[styles.tabButton, { backgroundColor: colors.buttonBg }]}
          onPress={onTasksPress}
          activeOpacity={0.7}
        >
          <CheckIcon color={colors.icon} />
        </TouchableOpacity>

        {/* Botón AGREGAR (Plus) - Más grande y centrado */}
        <TouchableOpacity
          style={[styles.tabButton, styles.centerButton, { backgroundColor: colors.buttonBg }]}
          onPress={onAddPress}
          onLongPress={onAddLongPress}
          delayLongPress={300}
          activeOpacity={0.7}
        >
          <PlusIcon color={colors.icon} />
        </TouchableOpacity>

        {/* Botón PROGRESO (Chart/Stats) */}
        <TouchableOpacity
          style={[styles.tabButton, { backgroundColor: colors.buttonBg }]}
          onPress={onProgressPress}
          activeOpacity={0.7}
        >
          <ChartIcon color={colors.icon} />
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
    backgroundColor: '#000000',
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

const iconStyles = StyleSheet.create({
  // Check Icon Styles
  checkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  
  // Plus Icon Styles
  plusContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusHorizontal: {
    position: 'absolute',
    width: 20,
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
  },
  plusVertical: {
    position: 'absolute',
    width: 3,
    height: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
  },
  
  // Chart Icon Styles
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: 20,
    height: 20,
  },
  chartBar: {
    width: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
    marginHorizontal: 0.5,
  },
});

export default BottomTabNavigationSimple;