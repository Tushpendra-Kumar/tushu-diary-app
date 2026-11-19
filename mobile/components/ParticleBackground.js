import React, { useEffect, useRef, useContext } from 'react';
import { C } from '../constants/theme';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');
const PARTICLE_COUNT = 8;

const Particle = ({ reduceMotion }) => {
  const x = useRef(new Animated.Value(Math.random() * width)).current;
  const y = useRef(new Animated.Value(Math.random() * height)).current;
  const opacity = useRef(new Animated.Value(Math.random() * 0.4 + 0.1)).current;
  const scale = useRef(new Animated.Value(Math.random() * 1.2 + 0.5)).current;
  const animRef = useRef(null);

  useEffect(() => {
    if (reduceMotion) {
      if (animRef.current) animRef.current.stop();
      return;
    }

    const float = () => {
      const anim = Animated.parallel([
        Animated.timing(x, {
          toValue: Math.random() * width,
          duration: Math.random() * 14000 + 14000,
          useNativeDriver: true,
        }),
        Animated.timing(y, {
          toValue: Math.random() * height,
          duration: Math.random() * 14000 + 14000,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: Math.random() * 0.5 + 0.2,
            duration: Math.random() * 4000 + 2000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: Math.random() * 0.25 + 0.1,
            duration: Math.random() * 4000 + 2000,
            useNativeDriver: true,
          }),
        ]),
      ]);
      animRef.current = anim;
      anim.start(() => float());
    };

    float();

    return () => {
      if (animRef.current) animRef.current.stop();
    };
  }, [x, y, opacity, reduceMotion]);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          transform: [{ translateX: x }, { translateY: y }, { scale }],
          opacity,
          backgroundColor: C.gold,
        },
      ]}
    />
  );
};

function ParticleBackground() {
  const themeCtx = useContext(ThemeContext);
  const prefs = themeCtx?.prefs;

  // If reduceEffects is on — render minimal static background only
  if (prefs?.reduceEffects) {
    return (
      <View pointerEvents="none" style={styles.container}>
        <View style={styles.base} />
      </View>
    );
  }

  const reduceMotion = prefs?.reduceMotion ?? false;
  const particles = Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
    <Particle key={i} reduceMotion={reduceMotion} />
  ));

  return (
    <View pointerEvents="none" style={styles.container}>
      {/* Background Base */}
      <View style={styles.base} pointerEvents="none" />

      {/* Large Curved Orbital Lines */}
      <View style={[styles.orbitalLine, styles.orbitalLine1]} pointerEvents="none" />
      <View style={[styles.orbitalLine, styles.orbitalLine2]} pointerEvents="none" />
      <View style={[styles.orbitalLine, styles.orbitalLine3]} pointerEvents="none" />

      {/* Particles */}
      {particles}
    </View>
  );
}

export default React.memo(ParticleBackground);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#06080D',
    overflow: 'hidden',
    zIndex: -1,
  },
  base: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  particle: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#F0A500',
    elevation: 2,
  },
  orbitalLine: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(240, 165, 0, 0.15)',
    borderRadius: 9999,
  },
  orbitalLine1: {
    width: width * 2,
    height: width * 2,
    top: -width * 0.5,
    left: -width * 1.2,
  },
  orbitalLine2: {
    width: width * 1.5,
    height: width * 1.5,
    bottom: -width * 0.5,
    right: -width * 0.8,
    borderColor: 'rgba(240, 165, 0, 0.08)',
  },
  orbitalLine3: {
    width: width * 2.5,
    height: width * 2.5,
    top: height * 0.2,
    left: width * 0.1,
    borderColor: 'rgba(10,10,10,0.75)',
  },
});

