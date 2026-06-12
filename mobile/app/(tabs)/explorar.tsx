import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import lugaresService from '../../services/lugaresService';
import { Lugar } from '../../types';
import { COLORES } from '../../constants/config';

const RADIO = 5000;

// ─── Helpers ────────────────────────────────────────────────────────────────

function distanciaTexto(metros?: number) {
  if (metros == null) return null;
  return metros >= 1000
    ? `${(metros / 1000).toFixed(1)} km`
    : `${Math.round(metros)} m`;
}

function imagenPortada(lugar: Lugar): string | null {
  if (!lugar.imagenes?.length) return null;
  const portada = lugar.imagenes.find((i) => i.es_portada) ?? lugar.imagenes[0];
  return portada?.url ?? null;
}

const GRADIENTES: [string, string][] = [
  ['#E8A838', '#C97B1A'],
  ['#2196F3', '#1565C0'],
  ['#4CAF50', '#2E7D32'],
  ['#9C27B0', '#6A1B9A'],
  ['#FF5722', '#BF360C'],
];

// ─── Componente de tarjeta ───────────────────────────────────────────────────

interface TarjetaLugarProps {
  lugar: Lugar;
  indice: number;
  onDetalles: (id: string) => void;
  onRuta: (lat: number, lng: number) => void;
}

function TarjetaLugar({ lugar, indice, onDetalles, onRuta }: TarjetaLugarProps) {
  const img = imagenPortada(lugar);
  const dist = distanciaTexto(lugar.distancia_metros);
  const gradiente = GRADIENTES[indice % GRADIENTES.length];

  return (
    <View style={styles.tarjeta}>
      {/* Imagen */}
      <View style={styles.tarjetaImagenWrap}>
        {img ? (
          <Image source={{ uri: img }} style={styles.tarjetaImagen} resizeMode="cover" />
        ) : (
          <LinearGradient colors={gradiente} style={styles.tarjetaImagen} />
        )}

        {/* Distancia */}
        {dist && (
          <View style={styles.badgeDistancia}>
            <Ionicons name="navigate-outline" size={10} color="#fff" />
            <Text style={styles.badgeDistanciaTexto}>{dist}</Text>
          </View>
        )}

        {/* Guardar */}
        <TouchableOpacity style={styles.btnGuardar}>
          <Ionicons name="heart-outline" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.tarjetaInfo}>
        <Text style={styles.tarjetaNombre} numberOfLines={1}>
          {lugar.nombre}
        </Text>
        <Text style={styles.tarjetaCategoria} numberOfLines={1}>
          {lugar.categoria?.nombre ?? 'Turismo'}
        </Text>
        <Text style={styles.tarjetaDesc} numberOfLines={2}>
          {lugar.descripcion}
        </Text>

        {/* Acciones */}
        <View style={styles.tarjetaAcciones}>
          <TouchableOpacity
            style={styles.btnDetalles}
            onPress={() => onDetalles(lugar.id)}
            activeOpacity={0.75}
          >
            <Text style={styles.btnDetallesTexto}>Detalles</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnRuta}
            onPress={() => onRuta(Number(lugar.latitud), Number(lugar.longitud))}
            activeOpacity={0.75}
          >
            <Ionicons name="navigate" size={14} color="#fff" />
            <Text style={styles.btnRutaTexto}>Ruta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Pantalla principal ──────────────────────────────────────────────────────

export default function ExplorarScreen() {
  const router = useRouter();
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const coordsRef = useRef<{ lat: number; lng: number } | null>(null);

  const cargarLugares = useCallback(async (lat: number, lng: number) => {
    setCargando(true);
    setError(null);
    try {
      const data = await lugaresService.getLugaresCercanos(lat, lng, RADIO);
      setLugares(data);
    } catch {
      setError('No se pudieron cargar los lugares. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        // Sin permiso: cargar con coordenadas de Panamá City
        await cargarLugares(8.9936, -79.5197);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude: lat, longitude: lng } = loc.coords;
      coordsRef.current = { lat, lng };
      await cargarLugares(lat, lng);
    })();
  }, [cargarLugares]);

  // Categorías únicas derivadas de los datos
  const categorias = ['Todos', ...Array.from(
    new Set(lugares.map((l) => l.categoria?.nombre).filter(Boolean))
  )] as string[];

  const lugaresFiltrados =
    categoriaActiva === 'Todos'
      ? lugares
      : lugares.filter((l) => l.categoria?.nombre === categoriaActiva);

  const abrirRuta = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
    Linking.openURL(url);
  };

  const abrirDetalles = (id: string) => {
    router.push(`/lugar/${id}`);
  };

  return (
    <View style={styles.contenedor}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitulo}>Explorador Cercano</Text>
        <Text style={styles.headerSubtitulo}>
          Descubre lugares auténticos cerca de ti
        </Text>
      </View>

      {/* ── Chips de categoría ───────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScroll}
        style={styles.chipsRow}
        alwaysBounceVertical={false}
      >
        {categorias.map((cat) => {
          const activo = cat === categoriaActiva;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, activo && styles.chipActivo]}
              onPress={() => setCategoriaActiva(cat)}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Lista ───────────────────────────────────────────────── */}
      {cargando ? (
        <View style={styles.centrado}>
          <ActivityIndicator size="large" color={COLORES.primario} />
          <Text style={styles.cargandoTexto}>Buscando lugares…</Text>
        </View>
      ) : error ? (
        <View style={styles.centrado}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORES.textoBorrado} />
          <Text style={styles.errorTexto}>{error}</Text>
          <TouchableOpacity
            style={styles.btnReintentar}
            onPress={() => coordsRef.current && cargarLugares(coordsRef.current.lat, coordsRef.current.lng)}
          >
            <Text style={styles.btnReintentarTexto}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : lugaresFiltrados.length === 0 ? (
        <View style={styles.centrado}>
          <Ionicons name="location-outline" size={56} color={COLORES.acento} />
          <Text style={styles.vacioTexto}>Sin lugares en esta categoría</Text>
        </View>
      ) : (
        <FlatList
          data={lugaresFiltrados}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <TarjetaLugar
              lugar={item}
              indice={index}
              onDetalles={abrirDetalles}
              onRuta={abrirRuta}
            />
          )}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#F4F6FB',
  },

  // Header
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitulo: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1F36',
    marginBottom: 4,
  },
  headerSubtitulo: {
    fontSize: 13,
    color: COLORES.textoBorrado,
    fontWeight: '400',
  },

  // Chips
  chipsRow: {
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8EAED',
    flexGrow: 0,
    flexShrink: 0,
  },
  chipsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F0F2F5',
    marginRight: 8,
  },
  chipActivo: {
    backgroundColor: COLORES.primario,
  },
  chipTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5F6B7C',
  },
  chipTextoActivo: {
    color: '#fff',
  },

  // Lista
  lista: {
    padding: 16,
    paddingBottom: 32,
  },

  // Tarjeta
  tarjeta: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  tarjetaImagenWrap: {
    height: 160,
    position: 'relative',
  },
  tarjetaImagen: {
    width: '100%',
    height: '100%',
  },
  badgeDistancia: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeDistanciaTexto: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  btnGuardar: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Info
  tarjetaInfo: {
    padding: 14,
  },
  tarjetaNombre: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1F36',
    marginBottom: 2,
  },
  tarjetaCategoria: {
    fontSize: 12,
    color: COLORES.textoBorrado,
    fontWeight: '500',
    marginBottom: 6,
  },
  tarjetaDesc: {
    fontSize: 13,
    color: '#5F6B7C',
    lineHeight: 19,
    marginBottom: 12,
  },

  // Botones
  tarjetaAcciones: {
    flexDirection: 'row',
    columnGap: 10,
  },
  btnDetalles: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORES.primario,
    alignItems: 'center',
  },
  btnDetallesTexto: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORES.primario,
  },
  btnRuta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORES.primario,
  },
  btnRutaTexto: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },

  // Estados
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  cargandoTexto: { fontSize: 14, color: COLORES.textoBorrado },
  errorTexto: { fontSize: 14, color: COLORES.textoBorrado, textAlign: 'center' },
  vacioTexto: { fontSize: 15, color: COLORES.textoBorrado, fontWeight: '600' },
  btnReintentar: {
    backgroundColor: COLORES.primario,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  btnReintentarTexto: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
