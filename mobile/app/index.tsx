import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

const DURACION_ENTRADA = 750;
const PAUSA = 700;

export default function SplashScreen() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const opacidad = useRef(new Animated.Value(0)).current;
  const escala = useRef(new Animated.Value(0.78)).current;
  const traslacionY = useRef(new Animated.Value(24)).current;
  const opacidadPunto = useRef(new Animated.Value(0)).current;
  const escalaPunto = useRef(new Animated.Value(0.6)).current;

  const [animLista, setAnimLista] = useState(false);

  useEffect(() => {
    Animated.sequence([
      // 1. Logo entra con spring
      Animated.parallel([
        Animated.spring(escala, {
          toValue: 1,
          useNativeDriver: true,
          tension: 55,
          friction: 7,
        }),
        Animated.timing(opacidad, {
          toValue: 1,
          duration: DURACION_ENTRADA,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(traslacionY, {
          toValue: 0,
          duration: DURACION_ENTRADA,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      // 2. Pausa breve
      Animated.delay(200),

      // 3. Indicador de carga aparece
      Animated.parallel([
        Animated.timing(opacidadPunto, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(escalaPunto, {
          toValue: 1,
          useNativeDriver: true,
          tension: 180,
          friction: 8,
        }),
      ]),

      // 4. Pausa final antes de navegar
      Animated.delay(PAUSA),
    ]).start(() => setAnimLista(true));
  }, []);

  useEffect(() => {
    if (!animLista || loading) return;
    if (isAuthenticated) {
      router.replace('/(tabs)/mapa');
    } else {
      router.replace('/login');
    }
  }, [animLista, loading, isAuthenticated]);

  return (
    <View style={styles.contenedor}>
      <Animated.Image
        source={require('../assets/splash.png')}
        style={[
          styles.logo,
          {
            opacity: opacidad,
            transform: [{ scale: escala }, { translateY: traslacionY }],
          },
        ]}
        resizeMode="contain"
      />

      <Animated.View
        style={[
          styles.puntoContenedor,
          {
            opacity: opacidadPunto,
            transform: [{ scale: escalaPunto }],
          },
        ]}
      >
        <PuntosPulsantes />
      </Animated.View>
    </View>
  );
}

function PuntosPulsantes() {
  const puntos = [0, 1, 2];
  const anims = useRef(puntos.map(() => new Animated.Value(0.35))).current;

  useEffect(() => {
    const secuencia = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 380,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.35,
            duration: 380,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(380),
        ])
      );

    const loops = anims.map((a, i) => secuencia(a, i * 180));
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, []);

  return (
    <View style={styles.puntosFila}>
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={[styles.punto, { opacity: anim, transform: [{ scale: anim }] }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  logo: {
    width: 260,
    height: 260,
  },
  puntoContenedor: {
    position: 'absolute',
    bottom: 72,
  },
  puntosFila: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  punto: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1F4E79',
  },
});
