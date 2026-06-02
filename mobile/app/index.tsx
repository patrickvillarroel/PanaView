import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { COLORES } from '../constants/config';

export default function SplashScreen() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.replace('/(tabs)/mapa');
      } else {
        router.replace('/login');
      }
    }
  }, [loading, isAuthenticated, router]);

  return (
    <View style={styles.contenedor}>
      <ActivityIndicator size="large" color={COLORES.primario} />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORES.fondo,
  },
});
