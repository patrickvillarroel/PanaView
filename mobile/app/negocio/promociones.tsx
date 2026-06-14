import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import PromocionesService from '../../services/promocionesService';
import { Promocion } from '../../types';
import LoadingOverlay from '../../components/LoadingOverlay';
import { COLORES, ESPACIADO, TAMAÑOS, BORDES } from '../../constants/config';

const { width: ANCHO } = Dimensions.get('window');
const ALTO_HERO = 200;

export default function PromocionesScreen() {
  const { id: negocioId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [promos, setPromos] = useState<Promocion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!negocioId) return;
    cargarPromos();
  }, [negocioId]);

  const cargarPromos = async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await PromocionesService.listar(negocioId as string);
      setPromos(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar las promociones');
    } finally {
      setCargando(false);
    }
  };

  const formatearFecha = (fecha?: string) => {
    if (!fecha) return 'Sin fecha límite';
    try {
      const d = new Date(fecha);
      return d.toLocaleDateString('es-PA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return fecha;
    }
  };

  const formatearPrecio = (precio?: number) => {
    if (precio == null) return null;
    return `$${Number(precio).toFixed(2)}`;
  };

  if (cargando) {
    return <LoadingOverlay visible mensaje="Cargando promociones..." />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTexto}>{error}</Text>
        <TouchableOpacity style={styles.botonVolver} onPress={() => router.back()}>
          <Text style={styles.botonVolverTexto}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
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

        <View style={styles.heroTextos}>
          <Text style={styles.heroNombre}>Promociones</Text>
          <Text style={styles.heroSub}>
            {promos.length === 0
              ? 'Sin promociones disponibles'
              : `${promos.length} promoción${promos.length !== 1 ? 'es' : ''} disponible${promos.length !== 1 ? 's' : ''}`}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <FlatList
          data={promos}
          keyExtractor={(i) => i.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <View style={styles.vacio}>
              <Ionicons name="pricetag-outline" size={48} color={COLORES.textoBorrado} />
              <Text style={styles.vacioTitulo}>No hay promociones</Text>
              <Text style={styles.vacioTexto}>
                Cuando el negocio cree promociones, aparecerán aquí.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const precio = formatearPrecio(item.precio);
            const fecha = formatearFecha(item.fecha_validez);

            return (
              <TouchableOpacity
                style={styles.promoCard}
                activeOpacity={0.85}
                onPress={() => router.push(`/negocio/promocionDetalle?id=${item.id}`)}
              >
                <View style={styles.promoIcono}>
                  <Ionicons name="pricetag" size={22} color="#fff" />
                </View>
                <View style={styles.promoContenido}>
                  <Text style={styles.promoNombre} numberOfLines={2}>
                    {item.nombre}
                  </Text>
                  {item.descripcion ? (
                    <Text style={styles.promoDesc} numberOfLines={1}>
                      {item.descripcion}
                    </Text>
                  ) : null}
                  <View style={styles.promoMeta}>
                    <Ionicons name="calendar-outline" size={13} color={COLORES.textoBorrado} />
                    <Text style={styles.promoMetaTexto}>{fecha}</Text>
                  </View>
                </View>
                {precio && (
                  <View style={styles.promoPrecio}>
                    <Text style={styles.promoPrecioTexto}>{precio}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={<View style={{ height: 24 }} />}
        />
      </View>
    </View>
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
  heroNombre: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: TAMAÑOS.fontoNormal,
    marginTop: 4,
  },

  card: {
    flex: 1,
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

  lista: {
    paddingBottom: ESPACIADO.lg,
  },

  vacio: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: ESPACIADO.xxl,
  },
  vacioTitulo: {
    fontSize: TAMAÑOS.fontoGrande,
    fontWeight: '700',
    color: COLORES.texto,
    marginTop: ESPACIADO.lg,
    marginBottom: ESPACIADO.sm,
  },
  vacioTexto: {
    fontSize: TAMAÑOS.fontoNormal,
    color: COLORES.textoBorrado,
    textAlign: 'center',
    lineHeight: 22,
  },

  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORES.fondoGris,
    borderRadius: BORDES.redondeadoGrande,
    padding: ESPACIADO.md,
    marginBottom: ESPACIADO.sm,
  },
  promoIcono: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORES.primario,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ESPACIADO.md,
  },
  promoContenido: {
    flex: 1,
  },
  promoNombre: {
    fontSize: TAMAÑOS.fontoMedio,
    fontWeight: '700',
    color: COLORES.texto,
  },
  promoDesc: {
    fontSize: TAMAÑOS.fontoPequeno,
    color: COLORES.textoBorrado,
    marginTop: 2,
  },
  promoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: ESPACIADO.xs,
  },
  promoMetaTexto: {
    fontSize: TAMAÑOS.fontoPequeno,
    color: COLORES.textoBorrado,
  },
  promoPrecio: {
    backgroundColor: COLORES.acento,
    borderRadius: BORDES.redondeado,
    paddingHorizontal: ESPACIADO.md,
    paddingVertical: ESPACIADO.sm,
    marginLeft: ESPACIADO.sm,
  },
  promoPrecioTexto: {
    fontSize: TAMAÑOS.fontoMedio,
    fontWeight: '800',
    color: COLORES.primario,
  },
});
