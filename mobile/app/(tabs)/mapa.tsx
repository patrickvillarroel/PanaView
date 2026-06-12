import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import MapaWebView from '../../components/MapaWebView';
import { COLORES } from '../../constants/config';

export default function MapaScreen() {
  const router = useRouter();

  const handleMarkerPress = (lugarId: string) => {
    router.push(`/lugar/${lugarId}`);
  };

  return (
    <View style={styles.contenedor}>
      <MapaWebView onLugarPress={handleMarkerPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
});
