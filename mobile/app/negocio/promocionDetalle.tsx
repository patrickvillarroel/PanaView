import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import PromocionesService from '../../services/promocionesService';
import { Promocion } from '../../types';
import LoadingOverlay from '../../components/LoadingOverlay';
import { useAuth } from '../../context/AuthContext';
import { COLORES, ESPACIADO, TAMAÑOS, BORDES, BASE_URL } from '../../constants/config';

const { width: ANCHO } = Dimensions.get('window');

export default function PromocionDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { usuario } = useAuth();
  const [promo, setPromo] = useState<Promocion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [mostrarQR, setMostrarQR] = useState(false);

  useEffect(() => {
    if (!id) return;
    cargarPromo();
  }, [id]);

  const cargarPromo = async () => {
    setCargando(true);
    try {
      const data = await PromocionesService.obtener(id as string);
      setPromo(data);
    } catch (err) {
      console.warn('Error al cargar promoción:', err);
    } finally {
      setCargando(false);
    }
  };

  const handleGenerarQR = () => {
    setMostrarQR(!mostrarQR);
  };

  const qrValue = promo && usuario ? `PANAVIEW:${promo.id}:${usuario.id}` : null;

  if (cargando) {
    return <LoadingOverlay visible mensaje="Cargando promoción..." />;
  }

  if (!promo) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORES.error} />
        <Text style={styles.errorTexto}>No se pudo cargar la promoción</Text>
        <TouchableOpacity style={styles.botonVolver} onPress={() => router.back()}>
          <Text style={styles.botonVolverTexto}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fecha = (() => {
    if (!promo.fecha_validez || promo.fecha_validez === 'Invalid date') return 'Sin fecha límite';
    try {
      const d = new Date(promo.fecha_validez);
      if (isNaN(d.getTime())) return 'Sin fecha límite';
      return d.toLocaleDateString('es-PA', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return 'Sin fecha límite';
    }
  })();

  const precio = `$${Number(promo.precio).toFixed(2)}`;

  return (
    <ScrollView style={styles.contenedor} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        {promo.imagenes?.[0]?.url ? (
          <Image source={{ uri: `${BASE_URL}${promo.imagenes[0].url}` }} style={styles.heroImagen} />
        ) : (
          <LinearGradient
            colors={[COLORES.primario, COLORES.secundario]}
            style={styles.heroImagen}
          />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.78)']}
          style={styles.heroGradiente}
        />
        <TouchableOpacity style={styles.botonAtras} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={21} color="#fff" />
        </TouchableOpacity>

        <View style={styles.heroContenido}>
          <View style={styles.heroIcono}>
            <Ionicons name="pricetag" size={32} color="#fff" />
          </View>
          <Text style={styles.heroNombre}>{promo.nombre}</Text>
          <View style={styles.heroPrecio}>
            <Text style={styles.heroPrecioTexto}>{precio}</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        {promo.descripcion ? (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Descripción</Text>
            <Text style={styles.seccionTexto}>{promo.descripcion}</Text>
          </View>
        ) : null}

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Detalles</Text>

          <View style={styles.detalleRow}>
            <View style={styles.detalleIcono}>
              <Ionicons name="cash-outline" size={18} color={COLORES.secundario} />
            </View>
            <View style={styles.detalleContenido}>
              <Text style={styles.detalleLabel}>Precio</Text>
              <Text style={styles.detalleValor}>{precio}</Text>
            </View>
          </View>

          <View style={styles.detalleRow}>
            <View style={styles.detalleIcono}>
              <Ionicons name="calendar-outline" size={18} color={COLORES.secundario} />
            </View>
            <View style={styles.detalleContenido}>
              <Text style={styles.detalleLabel}>Válida hasta</Text>
              <Text style={styles.detalleValor}>{fecha}</Text>
            </View>
          </View>

        </View>

        <TouchableOpacity
          style={styles.botonQR}
          activeOpacity={0.85}
          onPress={handleGenerarQR}
        >
          <LinearGradient
            colors={
              mostrarQR
                ? [COLORES.textoBorrado, '#777']
                : [COLORES.primario, COLORES.secundario]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.botonQRGradiente}
          >
            <Ionicons
              name={mostrarQR ? 'eye-off-outline' : 'qr-code-outline'}
              size={20}
              color="#fff"
            />
            <Text style={styles.botonQRTexto}>
              {mostrarQR ? 'Ocultar código QR' : 'Generar código QR'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {mostrarQR && qrValue && (
          <View style={styles.qrContainer}>
            <View style={styles.qrMarco}>
              <QRCode value={qrValue} size={180} color={COLORES.primario} />
            </View>
            <Text style={styles.qrInstruccion}>
              Presenta este código al negocio para canjear la promoción
            </Text>
          </View>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
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
    marginTop: ESPACIADO.md,
    marginBottom: ESPACIADO.lg,
  },
  botonVolver: {
    backgroundColor: COLORES.primario,
    paddingVertical: ESPACIADO.md,
    paddingHorizontal: ESPACIADO.xl,
    borderRadius: BORDES.redondeado,
  },
  botonVolverTexto: {
    color: '#fff',
    fontWeight: '700',
  },

  hero: {
    width: ANCHO,
    height: 280,
  },
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
    zIndex: 2,
  },
  heroContenido: {
    position: 'absolute',
    bottom: 36,
    left: ESPACIADO.lg,
    right: ESPACIADO.lg,
    alignItems: 'center',
    zIndex: 2,
  },
  heroIcono: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ESPACIADO.md,
  },
  heroNombre: {
    color: '#fff',
    fontSize: TAMAÑOS.fontoExtraGrande,
    fontWeight: '800',
    textAlign: 'center',
  },
  heroPrecio: {
    marginTop: ESPACIADO.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BORDES.redondeadoGrande,
    paddingHorizontal: ESPACIADO.xl,
    paddingVertical: ESPACIADO.sm,
  },
  heroPrecioTexto: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },

  card: {
    backgroundColor: COLORES.fondo,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingTop: ESPACIADO.xl,
    paddingHorizontal: ESPACIADO.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },

  seccion: {
    marginBottom: ESPACIADO.xl,
  },
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

  detalleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORES.fondoGris,
    borderRadius: BORDES.redondeadoGrande,
    padding: ESPACIADO.md,
    marginBottom: ESPACIADO.sm,
  },
  detalleIcono: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ESPACIADO.md,
  },
  detalleContenido: {
    flex: 1,
  },
  detalleLabel: {
    fontSize: TAMAÑOS.fontoPequeno,
    color: COLORES.textoBorrado,
    fontWeight: '600',
  },
  detalleValor: {
    fontSize: TAMAÑOS.fontoMedio,
    color: COLORES.texto,
    fontWeight: '700',
    marginTop: 2,
  },
  detalleValorChico: {
    fontSize: TAMAÑOS.fontoPequeno,
    color: COLORES.texto,
    fontWeight: '600',
    marginTop: 2,
  },

  botonQR: {
    marginBottom: ESPACIADO.md,
    borderRadius: BORDES.redondeadoGrande,
    overflow: 'hidden',
  },
  botonQRGradiente: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: ESPACIADO.lg,
  },
  botonQRTexto: {
    color: '#fff',
    fontSize: TAMAÑOS.fontoMedio,
    fontWeight: '700',
  },

  qrContainer: {
    alignItems: 'center',
    marginBottom: ESPACIADO.xl,
    paddingVertical: ESPACIADO.xl,
    backgroundColor: '#fff',
    borderRadius: BORDES.redondeadoExtraGrande,
    borderWidth: 2,
    borderColor: COLORES.acento,
    borderStyle: 'dashed',
  },
  qrMarco: {
    padding: ESPACIADO.lg,
    backgroundColor: '#fff',
    borderRadius: BORDES.redondeadoGrande,
    shadowColor: COLORES.primario,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  qrInstruccion: {
    marginTop: ESPACIADO.md,
    fontSize: TAMAÑOS.fontoPequeno,
    color: COLORES.textoBorrado,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  botonCanjear: {
    borderRadius: BORDES.redondeadoGrande,
    overflow: 'hidden',
  },
  botonCanjearGradiente: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: ESPACIADO.lg,
  },
  botonCanjearTexto: {
    color: '#fff',
    fontSize: TAMAÑOS.fontoMedio,
    fontWeight: '700',
  },
});
