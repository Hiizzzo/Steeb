import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, StyleSheet, Dimensions, Animated } from 'react-native';

const { width, height } = Dimensions.get('window');

const THEME_COLORS = {
  dark: {
    circleBackground: '#000000',
    circleBorder: '#FFFFFF',
    icon: '#FFFFFF',
    text: '#FFFFFF',
    overlay: 'rgba(0,0,0,0.55)'
  },
  light: {
    circleBackground: '#FFFFFF',
    circleBorder: '#000000',
    icon: '#000000',
    text: '#000000',
    overlay: 'rgba(0,0,0,0.25)'
  }
};

const CIRCLE_SIZE = 96; // tamaño cómodo para móviles
const RADIUS = 120; // distancia desde el centro para colocar los botones

const RadialMenu = ({ visible, onClose, onSelect = () => {}, theme = 'dark' }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.9, duration: 150, useNativeDriver: true })
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const colors = THEME_COLORS[theme] || THEME_COLORS.dark;

  const Button = ({ label, onPress, children }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => { onPress?.(); onClose?.(); }}
      style={[styles.circle, {
        backgroundColor: colors.circleBackground,
        borderColor: colors.circleBorder,
      }]}
    >
      <View style={styles.iconWrapper}>
        {children}
      </View>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );

  // Íconos hechos con Views para evitar dependencias
  const IconCalendar = () => (
    <View style={[iconStyles.calendarBox, { borderColor: colors.icon }]}>
      <View style={[iconStyles.calendarHeader, { backgroundColor: colors.icon }]} />
      <View style={iconStyles.calendarPinsRow}>
        <View style={[iconStyles.calendarPin, { backgroundColor: colors.icon }]} />
        <View style={[iconStyles.calendarPin, { backgroundColor: colors.icon }]} />
      </View>
    </View>
  );

  const IconStats = () => (
    <View style={iconStyles.statsContainer}>
      <View style={[iconStyles.statsBar, { height: 10, backgroundColor: colors.icon }]} />
      <View style={[iconStyles.statsBar, { height: 16, backgroundColor: colors.icon }]} />
      <View style={[iconStyles.statsBar, { height: 22, backgroundColor: colors.icon }]} />
    </View>
  );

  const IconChat = () => (
    <View style={[iconStyles.chatBubble, { borderColor: colors.icon }]}>
      <View style={[iconStyles.chatTail, { borderTopColor: 'transparent', borderLeftColor: 'transparent', borderRightColor: colors.icon, borderBottomColor: colors.icon }]} />
    </View>
  );

  const IconMenu = () => (
    <View style={iconStyles.menuContainer}>
      <View style={[iconStyles.menuLine, { backgroundColor: colors.icon }]} />
      <View style={[iconStyles.menuLine, { backgroundColor: colors.icon }]} />
      <View style={[iconStyles.menuLine, { backgroundColor: colors.icon }]} />
    </View>
  );

  return (
    <View style={styles.absoluteFill}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { backgroundColor: colors.overlay, opacity }]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.centerContainer, { transform: [{ scale }] }]}> 
        {/* Posiciones en cruz: arriba, derecha, abajo, izquierda */}
        <View style={[styles.itemContainer, { top: height / 2 - RADIUS - CIRCLE_SIZE / 2, left: width / 2 - CIRCLE_SIZE / 2 }]}> 
          <Button label="Calendario" onPress={() => onSelect('calendar')}>
            <IconCalendar />
          </Button>
        </View>

        <View style={[styles.itemContainer, { top: height / 2 - CIRCLE_SIZE / 2, left: width / 2 + RADIUS - CIRCLE_SIZE / 2 }]}> 
          <Button label="Estadísticas" onPress={() => onSelect('stats')}>
            <IconStats />
          </Button>
        </View>

        <View style={[styles.itemContainer, { top: height / 2 + RADIUS - CIRCLE_SIZE / 2, left: width / 2 - CIRCLE_SIZE / 2 }]}> 
          <Button label="Chat con Stebe" onPress={() => onSelect('chat')}>
            <IconChat />
          </Button>
        </View>

        <View style={[styles.itemContainer, { top: height / 2 - CIRCLE_SIZE / 2, left: width / 2 - RADIUS - CIRCLE_SIZE / 2 }]}> 
          <Button label="Más" onPress={() => onSelect('more')}>
            <IconMenu />
          </Button>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  centerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  itemContainer: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

const iconStyles = StyleSheet.create({
  calendarBox: {
    width: 28,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  calendarHeader: {
    position: 'absolute',
    top: -4,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  calendarPinsRow: {
    flexDirection: 'row',
    position: 'absolute',
    top: -8,
    left: 6,
  },
  calendarPin: {
    width: 4,
    height: 6,
    marginRight: 8,
    borderRadius: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: 30,
    height: 22,
    gap: 3,
  },
  statsBar: {
    width: 6,
    borderRadius: 3,
  },
  chatBubble: {
    width: 30,
    height: 22,
    borderRadius: 8,
    borderWidth: 2,
  },
  chatTail: {
    position: 'absolute',
    bottom: -1,
    left: 6,
    width: 0,
    height: 0,
    borderWidth: 6,
    borderStyle: 'solid',
    transform: [{ rotate: '45deg' }],
  },
  menuContainer: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLine: {
    width: 28,
    height: 3,
    borderRadius: 2,
    marginVertical: 2,
  },
});

export default RadialMenu;