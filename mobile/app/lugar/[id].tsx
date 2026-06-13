import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Lugar, Resena } from '../../types';
import lugaresService from '../../services/lugaresService';
import favoritosService from '../../services/favoritosService';
import authService from '../../services/authService';
import resenasService from '../../services/resenasService';
import { useAuth } from '../../context/AuthContext';
import { COLORES, ESPACIADO, TAMAÑOS, BORDES } from '../../constants/config';
import LoadingOverlay from '../../components/LoadingOverlay';
import StarRating from '../../components/StarRating';

const { width: ANCHO } = Dimensions.get('window');
const ALTO_HERO = 300;

const COLORES_AVATAR = ['#1F4E79', '#2E75B6', '#1E6B3C', '#B45309', '#7C3AED', '#DB2777', '#0F766E'];

function Avatar({ nombre, size = 38 }: { nombre: string; size?: number }) {
  const iniciales = nombre
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0] ?? '')
    .join('')
    .toUpperCase();
  const color = COLORES_AVATAR[nombre.charCodeAt(0) % COLORES_AVATAR.length];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#fff', fontSize: size * 0.38, fontWeight: '700' }}>
        {iniciales}
      </Text>
    </View>
  );
}

function SeccionTexto({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <View style={styles.seccion}>
      <Text style={styles.seccionTitulo}>{titulo}</Text>
      <Text style={styles.seccionTexto}>{texto}</Text>
    </View>
  );
}

export default function LugarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [lugar, setLugar] = useState<Lugar | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalResena, setModalResena] = useState(false);
  const [calificacion, setCalificacion] = useState(5);
  const [comentario, setComentario] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [esFavorito, setEsFavorito] = useState(false);
  const [cargandoFavorito, setCargandoFavorito] = useState(false);

  useEffect(() => {
    obtenerLugar();
  }, [id]);

  useEffect(() => {
    if (!id || !isAuthenticated) {
      setEsFavorito(false);
      return;
    }

    void cargarEstadoFavorito();
  }, [id, isAuthenticated]);

  const obtenerLugar = async () => {
    if (!id) return;
    try {
      setCargando(true);
      setError(null);
      const data = await lugaresService.getLugarById(id);
      setLugar(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el lugar');
    } finally {
      setCargando(false);
    }
  };

  const cargarEstadoFavorito = async () => {
    try {
      setCargandoFavorito(true);
      const perfil = await authService.getMe();
      const favoritoExiste = perfil.favoritos?.some((favorito) => favorito.id === id) ?? false;
      setEsFavorito(favoritoExiste);
    } catch {
      setEsFavorito(false);
    } finally {
      setCargandoFavorito(false);
    }
  };

  const handleToggleFavorito = async () => {
    if (!isAuthenticated || !lugar) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para guardar lugares.');
      return;
    }

    try {
      setGuardando(true);
      const siguienteEstado = await favoritosService.toggleFavorito(lugar.id);
      setEsFavorito(siguienteEstado);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo actualizar el favorito');
    } finally {
      setGuardando(false);
    }
  };

  const handleAgregarResena = async () => {
    if (!lugar || !comentario.trim()) {
      Alert.alert('Error', 'Por favor escribe un comentario');
      return;
    }
    try {
      setGuardando(true);
      await resenasService.createResena({
        lugar_id: lugar.id,
        calificacion,
        comentario,
      });
      setComentario('');
      setCalificacion(5);
      setModalResena(false);
      await obtenerLugar();
      Alert.alert('¡Publicada!', 'Tu reseña ha sido publicada exitosamente');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <LoadingOverlay visible mensaje="Cargando lugar..." />;

  if (error || !lugar) {
    return (
      <View style={styles.estadoError}>
        <Ionicons name="alert-circle-outline" size={56} color={COLORES.error} />
        <Text style={styles.textoError}>{error ?? 'Lugar no encontrado'}</Text>
        <TouchableOpacity style={styles.botonVolver} onPress={() => router.back()}>
          <Text style={styles.botonVolverTexto}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const imagenes = lugar.imagenes ?? [];
  const portada = imagenes.find((i) => i.es_portada)?.url ?? imagenes[0]?.url;
  const galeria = imagenes.filter((i) => !i.es_portada && i.url);

  const distanciaTexto =
    lugar.distancia_metros != null
      ? lugar.distancia_metros < 1000
        ? `${Math.round(lugar.distancia_metros)} m`
        : `${(lugar.distancia_metros / 1000).toFixed(1)} km`
      : null;

  return (
    <>
      <ScrollView style={styles.contenedor} showsVerticalScrollIndicator={false}>
        {/* ── HERO ─────────────────────────────────────────────── */}
        <View style={styles.hero}>
          {portada ? (
            <Image source={{ uri: portada }} style={styles.heroImagen} resizeMode="cover" />
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

          <TouchableOpacity
            style={styles.botonFavorito}
            onPress={handleToggleFavorito}
            disabled={guardando || cargandoFavorito}
          >
            <Ionicons
              name={esFavorito ? 'heart' : 'heart-outline'}
              size={21}
              color={esFavorito ? '#EF4444' : '#fff'}
            />
          </TouchableOpacity>

          <View style={styles.heroTextos}>
            <View style={styles.categoriaPill}>
              <Text style={styles.categoriaPillTexto}>{lugar.categoria.nombre}</Text>
            </View>
            <Text style={styles.heroNombre}>{lugar.nombre}</Text>
          </View>
        </View>

        {/* ── CARD FLOTANTE ────────────────────────────────────── */}
        <View style={styles.card}>
          {/* Stats */}
          <View style={styles.statsRow}>
            {lugar.calificacion_promedio !== undefined ? (
              <View style={styles.statItem}>
                <Ionicons name="star" size={17} color="#F59E0B" />
                <Text style={styles.statValor}>
                  {lugar.calificacion_promedio.toFixed(1)}
                </Text>
                <Text style={styles.statEtiqueta}>
                  ({lugar.total_resenas ?? 0})
                </Text>
              </View>
            ) : (
              <View style={styles.statItem}>
                <Ionicons name="star-outline" size={17} color={COLORES.textoBorrado} />
                <Text style={styles.statEtiqueta}>Sin calificación</Text>
              </View>
            )}

            {distanciaTexto && (
              <>
                <View style={styles.statSep} />
                <View style={styles.statItem}>
                  <Ionicons name="navigate-outline" size={15} color={COLORES.secundario} />
                  <Text style={styles.statValor}>{distanciaTexto}</Text>
                  <Text style={styles.statEtiqueta}>de ti</Text>
                </View>
              </>
            )}

            {lugar.provincia && (
              <>
                <View style={styles.statSep} />
                <View style={[styles.statItem, { flex: 1 }]}>
                  <Ionicons name="location-outline" size={15} color={COLORES.textoBorrado} />
                  <Text style={[styles.statEtiqueta, { flex: 1 }]} numberOfLines={1}>
                    {lugar.provincia}
                  </Text>
                </View>
              </>
            )}
          </View>

          {lugar.direccion && (
            <View style={styles.direccionRow}>
              <Ionicons name="map-outline" size={13} color={COLORES.textoBorrado} />
              <Text style={styles.direccionTexto}>{lugar.direccion}</Text>
            </View>
          )}

          {/* Descripción */}
          <SeccionTexto titulo="Descripción" texto={lugar.descripcion} />

          {/* Historia */}
          {lugar.historia ? (
            <SeccionTexto titulo="Historia" texto={lugar.historia} />
          ) : null}

          {/* Audio */}
          {lugar.audio_url ? (
            <TouchableOpacity style={styles.botonAudio} activeOpacity={0.85}>
              <LinearGradient
                colors={[COLORES.primario, COLORES.secundario]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.botonAudioInner}
              >
                <Ionicons name="play-circle-outline" size={22} color="#fff" />
                <Text style={styles.botonAudioTexto}>Escuchar audioguía</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : null}

          {/* Galería */}
          {galeria.length > 0 && (
            <View style={styles.seccion}>
              <Text style={styles.seccionTitulo}>Galería</Text>
              <FlatList
                data={galeria}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, i) => String(i)}
                contentContainerStyle={{ gap: 10 }}
                renderItem={({ item }) => (
                  <Image source={{ uri: item.url }} style={styles.galeriaImg} />
                )}
              />
            </View>
          )}

          {/* Reseñas */}
          <View style={styles.seccion}>
            <View style={styles.seccionHeader}>
              <Text style={styles.seccionTitulo}>Reseñas</Text>
              {isAuthenticated && (
                <TouchableOpacity
                  style={styles.botonNuevaResena}
                  onPress={() => setModalResena(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                  <Text style={styles.botonNuevaResenaTexto}>Añadir</Text>
                </TouchableOpacity>
              )}
            </View>

            {lugar.resenas && lugar.resenas.length > 0 ? (
              lugar.resenas.map((r: Resena) => (
                <View key={r.id} style={styles.tarjetaResena}>
                  <View style={styles.resenaHeader}>
                    <Avatar nombre={r.usuario.nombre} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resenaNombre}>{r.usuario.nombre}</Text>
                      <Text style={styles.resenaFecha}>
                        {new Date(r.creado_en).toLocaleDateString('es-PA', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                    <StarRating value={r.calificacion} readonly size={14} />
                  </View>
                  {r.comentario ? (
                    <Text style={styles.resenaComentario}>{r.comentario}</Text>
                  ) : null}
                </View>
              ))
            ) : (
              <View style={styles.sinResenas}>
                <Ionicons name="chatbubble-ellipses-outline" size={36} color={COLORES.acento} />
                <Text style={styles.sinResenasTexto}>
                  Sé el primero en dejar una reseña
                </Text>
              </View>
            )}
          </View>

          <View style={{ height: ESPACIADO.xxl * 2 }} />
        </View>
      </ScrollView>

      {/* ── MODAL NUEVA RESEÑA ────────────────────────────────── */}
      <Modal visible={modalResena} transparent statusBarTranslucent animationType="slide">
        <View style={styles.modalFondo}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Nueva reseña</Text>
              <TouchableOpacity onPress={() => setModalResena(false)}>
                <Ionicons name="close" size={24} color={COLORES.texto} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Calificación</Text>
              <StarRating value={calificacion} onChange={setCalificacion} size={36} />

              <Text style={[styles.modalLabel, { marginTop: ESPACIADO.lg }]}>
                Comentario
              </Text>
              <TextInput
                style={styles.inputComentario}
                placeholder="Comparte tu experiencia..."
                placeholderTextColor={COLORES.textoBorrado}
                value={comentario}
                onChangeText={setComentario}
                multiline
                numberOfLines={4}
                maxLength={500}
              />

              <TouchableOpacity
                style={[styles.botonPublicar, guardando && { opacity: 0.6 }]}
                onPress={handleAgregarResena}
                disabled={guardando}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[COLORES.primario, COLORES.secundario]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.botonPublicarInner}
                >
                  <Text style={styles.botonPublicarTexto}>Publicar reseña</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <LoadingOverlay visible={guardando} mensaje="Publicando reseña..." />
    </>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo },

  // ── Error ──────────────────────────────────────────────────
  estadoError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: ESPACIADO.lg,
    padding: ESPACIADO.lg,
    backgroundColor: COLORES.fondo,
  },
  textoError: { fontSize: TAMAÑOS.fontoMedio, color: COLORES.error, textAlign: 'center' },
  botonVolver: {
    backgroundColor: COLORES.primario,
    paddingVertical: ESPACIADO.md,
    paddingHorizontal: ESPACIADO.xl,
    borderRadius: BORDES.redondeado,
  },
  botonVolverTexto: { color: '#fff', fontWeight: '700' },

  // ── Hero ───────────────────────────────────────────────────
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
  heroTextos: {
    position: 'absolute',
    bottom: 36,
    left: 16,
    right: 16,
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
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  // ── Card flotante ──────────────────────────────────────────
  card: {
    backgroundColor: COLORES.fondo,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: ESPACIADO.xl,
    paddingHorizontal: ESPACIADO.lg,
    // sombra suave hacia arriba
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },

  // ── Stats ──────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIADO.md,
    marginBottom: ESPACIADO.md,
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValor: {
    fontSize: TAMAÑOS.fontoNormal,
    fontWeight: '700',
    color: COLORES.texto,
  },
  statEtiqueta: { fontSize: TAMAÑOS.fontoPequeno, color: COLORES.textoBorrado },
  statSep: { width: 1, height: 18, backgroundColor: COLORES.acento },

  // ── Dirección ──────────────────────────────────────────────
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

  // ── Secciones ──────────────────────────────────────────────
  seccion: { marginBottom: ESPACIADO.xl },
  seccionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ESPACIADO.md,
  },
  seccionTitulo: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORES.textoBorrado,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  seccionTexto: {
    fontSize: TAMAÑOS.fontoNormal,
    color: COLORES.texto,
    lineHeight: 22,
  },

  // ── Audio ──────────────────────────────────────────────────
  botonAudio: {
    borderRadius: BORDES.redondeadoGrande,
    overflow: 'hidden',
    marginBottom: ESPACIADO.xl,
  },
  botonAudioInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ESPACIADO.md,
    gap: ESPACIADO.sm,
  },
  botonAudioTexto: {
    color: '#fff',
    fontSize: TAMAÑOS.fontoMedio,
    fontWeight: '700',
  },

  // ── Galería ────────────────────────────────────────────────
  galeriaImg: {
    width: 140,
    height: 100,
    borderRadius: BORDES.redondeadoGrande,
  },

  // ── Reseñas ────────────────────────────────────────────────
  botonNuevaResena: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORES.primario,
    borderRadius: 20,
    paddingHorizontal: ESPACIADO.md,
    paddingVertical: 6,
  },
  botonNuevaResenaTexto: {
    color: '#fff',
    fontSize: TAMAÑOS.fontoPequeno,
    fontWeight: '700',
  },
  tarjetaResena: {
    backgroundColor: COLORES.fondoGris,
    borderRadius: BORDES.redondeadoGrande,
    padding: ESPACIADO.md,
    marginBottom: ESPACIADO.md,
  },
  resenaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIADO.md,
    marginBottom: ESPACIADO.sm,
  },
  resenaNombre: {
    fontSize: TAMAÑOS.fontoNormal,
    fontWeight: '700',
    color: COLORES.texto,
  },
  resenaFecha: {
    fontSize: TAMAÑOS.fontoPequeno,
    color: COLORES.textoBorrado,
    marginTop: 2,
  },
  resenaComentario: {
    fontSize: TAMAÑOS.fontoNormal,
    color: COLORES.texto,
    lineHeight: 20,
  },
  sinResenas: {
    alignItems: 'center',
    gap: ESPACIADO.md,
    paddingVertical: ESPACIADO.xl,
  },
  sinResenasTexto: {
    fontSize: TAMAÑOS.fontoNormal,
    color: COLORES.textoBorrado,
    textAlign: 'center',
  },

  // ── Modal ──────────────────────────────────────────────────
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORES.fondo,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: ESPACIADO.xxl,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORES.acento,
    alignSelf: 'center',
    marginTop: ESPACIADO.md,
    marginBottom: ESPACIADO.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ESPACIADO.lg,
    paddingVertical: ESPACIADO.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORES.acento,
  },
  modalTitulo: {
    fontSize: TAMAÑOS.fontoMedio,
    fontWeight: '800',
    color: COLORES.texto,
  },
  modalBody: { padding: ESPACIADO.lg },
  modalLabel: {
    fontSize: TAMAÑOS.fontoNormal,
    fontWeight: '600',
    color: COLORES.texto,
    marginBottom: ESPACIADO.md,
  },
  inputComentario: {
    borderWidth: 1,
    borderColor: COLORES.acento,
    borderRadius: BORDES.redondeadoGrande,
    padding: ESPACIADO.md,
    fontSize: TAMAÑOS.fontoNormal,
    color: COLORES.texto,
    textAlignVertical: 'top',
    minHeight: 100,
    backgroundColor: COLORES.fondoGris,
    marginBottom: ESPACIADO.md,
  },
  botonPublicar: {
    borderRadius: BORDES.redondeadoGrande,
    overflow: 'hidden',
    marginTop: ESPACIADO.sm,
  },
  botonPublicarInner: {
    paddingVertical: ESPACIADO.md,
    alignItems: 'center',
  },
  botonPublicarTexto: {
    color: '#fff',
    fontSize: TAMAÑOS.fontoMedio,
    fontWeight: '700',
  },
});
