import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  RefreshControl,
} from 'react-native';
import { useGeolocalizacion } from '../../hooks/useGeolocalizacion';
import { COLORES, ESPACIADO, RADIO_DEFAULT } from '../../constants/config';
import negociosService from '../../services/negociosService';
import TarjetaNegocio from '../../components/TarjetaNegocio';
import LoadingOverlay from '../../components/LoadingOverlay';
import { Negocio } from '../../types';

export default function NegociosScreen() {
  const { coordenadas } = useGeolocalizacion();
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [cargando, setCargando] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (coordenadas) {
      obtenerNegocios();
    }
  }, [coordenadas]);

  const obtenerNegocios = async () => {
    if (!coordenadas) return;

    try {
      setCargando(true);
      setError(null);
      const nuevosNegocios = await negociosService.getNegociosCercanos(
        coordenadas.latitude,
        coordenadas.longitude,
        RADIO_DEFAULT
      );
      setNegocios(nuevosNegocios);
    } catch (err: any) {
      setError(err.message || 'Error al obtener negocios');
    } finally {
      setCargando(false);
    }
  };

  const handleRefresh = async () => {
    setRefrescando(true);
    await obtenerNegocios();
    setRefrescando(false);
  };

  if (!coordenadas && cargando) {
    return (
      <View style={styles.contenedor}>
        <LoadingOverlay visible={true} mensaje="Obteniendo ubicación..." />
      </View>
    );
  }

  if (error && negocios.length === 0) {
    return (
      <View style={styles.contenedorVacio}>
        <Text style={styles.textoVacio}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      <FlatList
        data={negocios}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TarjetaNegocio negocio={item} />}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          <View style={styles.contenedorVacio}>
            <Text style={styles.textoVacio}>
              No hay negocios cercanos en este momento
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={handleRefresh}
            colors={[COLORES.primario]}
          />
        }
      />
      <LoadingOverlay visible={cargando && !refrescando} mensaje="Cargando negocios..." />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  lista: {
    padding: ESPACIADO.lg,
    flexGrow: 1,
  },
  contenedorVacio: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoVacio: {
    fontSize: 16,
    color: COLORES.textoBorrado,
    textAlign: 'center',
  },
});
