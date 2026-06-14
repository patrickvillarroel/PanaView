import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Negocio } from '../../types';
import negociosService from '../../services/negociosService';
import LoadingOverlay from '../../components/LoadingOverlay';
import { COLORES, ESPACIADO, TAMAÑOS, BORDES } from '../../constants/config';

const { width: ANCHO } = Dimensions.get('window');
const ALTO_HERO = 280;

function SeccionTexto({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <View style={styles.seccion}>
      <Text style={styles.seccionTitulo}>{titulo}</Text>
      <Text style={styles.seccionTexto}>{texto}</Text>
    </View>
  );
}

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
    // Navegar a la lista de promociones del negocio
    router.push(`/negocio/promociones?id=${negocio?.id}`);
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

  const distanciaTexto =
    negocio.distancia_metros != null
      ? negocio.distancia_metros < 1000
        ? `${Math.round(negocio.distancia_metros)} m`
        : `${(negocio.distancia_metros / 1000).toFixed(1)} km`
      : null;

  const rating = negocio.calificacion_promedio ?? 0;
  const totalResenas = negocio.total_resenas ?? 0;

  return (
    <ScrollView style={styles.contenedor} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <LinearGradient
          colors={[COLORES.primario, COLORES.secundario]}
          style={styles.heroImagen}
        />

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.78)']}
          style={styles.heroGradiente}
        />

        <TouchableOpacity style={styles.botonAtras} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={21} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.botonFavorito} activeOpacity={0.85}>
          <Ionicons name="heart-outline" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.heroTextos}>
          <View style={styles.categoriaPill}>
            <Text style={styles.categoriaPillTexto}>{negocio.categoria?.nombre}</Text>
          </View>
          <Text style={styles.heroNombre}>{negocio.nombre}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.statsRow}>
          {rating !== undefined ? (
            <View style={styles.statItem}>
              <Ionicons name="star" size={17} color="#F59E0B" />
              <Text style={styles.statValor}>{rating.toFixed(1)}</Text>
              <Text style={styles.statEtiqueta}>({totalResenas})</Text>
            </View>
          ) : (
            <View style={styles.statItem}>
              <Ionicons name="star-outline" size={17} color={COLORES.textoBorrado} />
              <Text style={styles.statEtiqueta}>Sin calificación</Text>
            </View>
          )}

          {distanciaTexto ? (
            <>
              <View style={styles.statSep} />
              <View style={styles.statItem}>
                <Ionicons name="navigate-outline" size={15} color={COLORES.secundario} />
                <Text style={styles.statValor}>{distanciaTexto}</Text>
                <Text style={styles.statEtiqueta}>de ti</Text>
              </View>
            </>
          ) : null}

          {negocio.direccion ? (
            <>
              <View style={styles.statSep} />
              <View style={[styles.statItem, { flex: 1 }]}> 
                <Ionicons name="location-outline" size={15} color={COLORES.textoBorrado} />
                <Text style={[styles.statEtiqueta, { flex: 1 }]} numberOfLines={1}>
                  {negocio.direccion}
                </Text>
              </View>
            </>
          ) : null}
        </View>

        {negocio.direccion ? (
          <View style={styles.direccionRow}>
            <Ionicons name="map-outline" size={13} color={COLORES.textoBorrado} />
            <Text style={styles.direccionTexto}>{negocio.direccion}</Text>
          </View>
        ) : null}

        {negocio.descripcion ? (
          <SeccionTexto titulo="Descripción" texto={negocio.descripcion} />
        ) : null}

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Información básica</Text>
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

        <TouchableOpacity
          style={styles.botonPromociones}
          onPress={handleVerPromociones}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[COLORES.primario, COLORES.secundario]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.botonPromocionesInner}
          >
            <Text style={styles.botonPromocionesTexto}>Ver promociones</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },

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
    paddingVertical: ESPACIADO.md,
    paddingHorizontal: ESPACIADO.xl,
    borderRadius: BORDES.redondeado,
  },
  botonVolverTexto: { color: '#fff', fontWeight: '700' },

  hero: { width: ANCHO, height: ALTO_HERO },
  heroImagen: { width: '100%', height: '100%' },
  heroGradiente: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 200,
  },
  botonAtras: {
    position: 'absolute',
    top: 44,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextos: {
    position: 'absolute',
    bottom: 36,
    left: 16,
    right: 16,
  },
  botonFavorito: {
    position: 'absolute',
    top: 44,
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriaPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
  },
  categoriaPillTexto: {
    color: '#fff',
    fontSize: TAMAÑOS.fontoPequeno,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroNombre: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  card: {
    backgroundColor: COLORES.fondo,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: ESPACIADO.xl,
    paddingHorizontal: ESPACIADO.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIADO.md,
    marginBottom: ESPACIADO.md,
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORES.fondoGris,
    paddingHorizontal: ESPACIADO.md,
    paddingVertical: ESPACIADO.sm,
    borderRadius: BORDES.redondeadoGrande,
  },
  statValor: {
    fontSize: TAMAÑOS.fontoNormal,
    fontWeight: '700',
    color: COLORES.texto,
  },
  statEtiqueta: {
    fontSize: TAMAÑOS.fontoPequeno,
    color: COLORES.textoBorrado,
  },
  statSep: {
    width: 1,
    height: 18,
    backgroundColor: COLORES.acento,
  },

  direccionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORES.fondoGris,
    borderRadius: BORDES.redondeado,
    paddingVertical: ESPACIADO.sm,
    paddingHorizontal: ESPACIADO.md,
    marginBottom: ESPACIADO.xl,
  },
  direccionTexto: {
    fontSize: TAMAÑOS.fontoPequeno,
    color: COLORES.textoBorrado,
    flex: 1,
  },

  seccion: { marginBottom: ESPACIADO.xl },
  seccionTitulo: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORES.textoBorrado,
    textTransform: 'uppercase',
    letterSpacing: 1,
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
    marginBottom: ESPACIADO.sm,
  },
  infoLabel: {
    fontWeight: '700',
    color: COLORES.texto,
  },

  botonPromociones: {
    marginBottom: ESPACIADO.xl,
    borderRadius: BORDES.redondeadoGrande,
    overflow: 'hidden',
  },
  botonPromocionesInner: {
    paddingVertical: ESPACIADO.md,
    alignItems: 'center',
  },
  botonPromocionesTexto: {
    color: COLORES.fondo,
    fontSize: TAMAÑOS.fontoMedio,
    fontWeight: '700',
  },
});
