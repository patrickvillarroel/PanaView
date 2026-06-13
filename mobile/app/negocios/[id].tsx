import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Negocio } from '../../types';
import negociosService from '../../services/negociosService';
import LoadingOverlay from '../../components/LoadingOverlay';
import { COLORES, ESPACIADO, TAMAÑOS, BORDES } from '../../constants/config';

export default function NegocioDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    obtenerNegocio();
  }, [id]);

  const obtenerNegocio = async () => {
    setCargando(true);
    setError(null);

    try {
      const data = await negociosService.getNegocioById(id as string);
      setNegocio(data);
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar el negocio');
    } finally {
      setCargando(false);
    }
  };

  const handleVerPromociones = () => {
    Alert.alert(
      'Promociones',
      'Aquí podrás ver las promociones del negocio.',
      [{ text: 'Aceptar' }]
    );
  };

  if (cargando) {
    return <LoadingOverlay visible mensaje="Cargando negocio..." />;
  }

  if (error || !negocio) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTexto}>{error ?? 'Negocio no encontrado'}</Text>
        <TouchableOpacity style={styles.botonVolver} onPress={() => router.back()}>
          <Text style={styles.botonVolverTexto}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.contenedor} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.botonAtras} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORES.fondo} />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Detalle del negocio</Text>
      </View>

      <View style={styles.card}> 
        <Text style={styles.nombre}>{negocio.nombre}</Text>
        <Text style={styles.categoria}>{negocio.categoria?.nombre}</Text>

        {negocio.descripcion ? (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Descripción</Text>
            <Text style={styles.seccionTexto}>{negocio.descripcion}</Text>
          </View>
        ) : null}

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Información básica</Text>
          {negocio.direccion ? (
            <Text style={styles.infoLinea}>
              <Text style={styles.infoLabel}>Dirección: </Text>
              {negocio.direccion}
            </Text>
          ) : null}
          {negocio.horario ? (
            <Text style={styles.infoLinea}>
              <Text style={styles.infoLabel}>Horario: </Text>
              {negocio.horario}
            </Text>
          ) : null}
          {negocio.telefono ? (
            <Text style={styles.infoLinea}>
              <Text style={styles.infoLabel}>Teléfono: </Text>
              {negocio.telefono}
            </Text>
          ) : null}
          {negocio.whatsapp ? (
            <Text style={styles.infoLinea}>
              <Text style={styles.infoLabel}>WhatsApp: </Text>
              {negocio.whatsapp}
            </Text>
          ) : null}
          {negocio.sitio_web ? (
            <Text style={styles.infoLinea}>
              <Text style={styles.infoLabel}>Sitio web: </Text>
              {negocio.sitio_web}
            </Text>
          ) : null}
        </View>

        <TouchableOpacity style={styles.botonPromociones} onPress={handleVerPromociones}>
          <Text style={styles.botonPromocionesTexto}>Ver promociones</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
    padding: ESPACIADO.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIADO.md,
    marginBottom: ESPACIADO.lg,
  },
  botonAtras: {
    width: 44,
    height: 44,
    borderRadius: BORDES.redondeadoGrande,
    backgroundColor: COLORES.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitulo: {
    fontSize: TAMAÑOS.fontoGrande,
    fontWeight: '800',
    color: COLORES.texto,
  },
  card: {
    backgroundColor: COLORES.fondo,
    borderRadius: BORDES.redondeadoGrande,
    padding: ESPACIADO.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  nombre: {
    fontSize: TAMAÑOS.fontoExtraGrande,
    fontWeight: '800',
    color: COLORES.texto,
    marginBottom: ESPACIADO.sm,
  },
  categoria: {
    fontSize: TAMAÑOS.fontoMedio,
    fontWeight: '600',
    color: COLORES.secundario,
    marginBottom: ESPACIADO.lg,
  },
  seccion: {
    marginBottom: ESPACIADO.lg,
  },
  seccionTitulo: {
    fontSize: TAMAÑOS.fontoMedio,
    fontWeight: '700',
    color: COLORES.primario,
    marginBottom: ESPACIADO.sm,
  },
  seccionTexto: {
    fontSize: TAMAÑOS.fontoNormal,
    color: COLORES.texto,
    lineHeight: 22,
  },
  infoLinea: {
    fontSize: TAMAÑOS.fontoNormal,
    color: COLORES.texto,
    marginBottom: ESPACIADO.xs,
  },
  infoLabel: {
    fontWeight: '700',
    color: COLORES.texto,
  },
  botonPromociones: {
    marginTop: ESPACIADO.md,
    backgroundColor: COLORES.primario,
    paddingVertical: ESPACIADO.md,
    borderRadius: BORDES.redondeado,
    alignItems: 'center',
  },
  botonPromocionesTexto: {
    color: COLORES.fondo,
    fontSize: TAMAÑOS.fontoMedio,
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ESPACIADO.lg,
    backgroundColor: COLORES.fondo,
  },
  errorTexto: {
    fontSize: TAMAÑOS.fontoMedio,
    color: COLORES.error,
    textAlign: 'center',
    marginBottom: ESPACIADO.md,
  },
  botonVolver: {
    backgroundColor: COLORES.primario,
    paddingVertical: ESPACIADO.sm,
    paddingHorizontal: ESPACIADO.lg,
    borderRadius: BORDES.redondeado,
  },
  botonVolverTexto: {
    color: '#fff',
    fontWeight: '700',
    fontSize: TAMAÑOS.fontoNormal,
  },
});
