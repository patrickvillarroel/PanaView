import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import MapaView from '../../components/MapaView';
import { useGeolocalizacion } from '../../hooks/useGeolocalizacion';
import { useLugares } from '../../hooks/useLugares';
import { COLORES, RADIO_DEFAULT } from '../../constants/config';
import LoadingOverlay from '../../components/LoadingOverlay';

export default function MapaScreen() {
  const router = useRouter();
  const { coordenadas, error: geoError, permiso, cargando: geoCargando } = useGeolocalizacion();
  const { lugares, cargando: lugaresCargando } = useLugares(coordenadas, RADIO_DEFAULT);

  const handleMarkerPress = (lugarId: string) => {
    router.push(`/lugar/${lugarId}`);
  };

  return (
    <View style={styles.contenedor}>
      {geoError && permiso === 'denegado' && (
        <View style={styles.bannerError}>
          <Text style={styles.bannerTexto}>{geoError}</Text>
        </View>
      )}

      <MapaView
        lugares={lugares}
        coordenadas={coordenadas}
        cargando={geoCargando}
        onMarkerPress={handleMarkerPress}
      />

      <LoadingOverlay visible={lugaresCargando} mensaje="Buscando lugares..." />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  bannerError: {
    backgroundColor: COLORES.error,
    padding: 12,
    alignItems: 'center',
    zIndex: 10,
  },
  bannerTexto: {
    color: COLORES.fondo,
    fontSize: 14,
    fontWeight: '500',
  },
});
