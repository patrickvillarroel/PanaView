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
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Negocio, Resena } from '../../types';
import negociosService from '../../services/negociosService';
import favoritosNegociosService from '../../services/favoritosNegociosService';
import resenasNegociosService from '../../services/resenasNegociosService';
import LoadingOverlay from '../../components/LoadingOverlay';
import AppHeader from '../../components/AppHeader';
import SimpleBottomNav from '../../components/SimpleBottomNav';
import { COLORES, ESPACIADO, TAMAÑOS, BORDES, BASE_URL } from '../../constants/config';

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
  const [esFavorito, setEsFavorito] = useState(false);
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [nuevaCalificacion, setNuevaCalificacion] = useState(5);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [enviandoResena, setEnviandoResena] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  useEffect(() => {
    if (!id) return;
    obtenerNegocio();
  }, [id]);

  useEffect(() => {
    if (!negocio) return;
    verificarFavorito();
    cargarResenas();
  }, [negocio]);

  const verificarFavorito = async () => {
    try {
      const favorito = await favoritosNegociosService.checkFavorito(negocio!.id);
      setEsFavorito(favorito);
    } catch {
      // Silenciar error si no está autenticado
    }
  };

  const handleToggleFavorito = async () => {
    if (!negocio) return;
    try {
      const resultado = await favoritosNegociosService.toggleFavorito(negocio.id);
      setEsFavorito(resultado);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo actualizar el favorito');
    }
  };

  const cargarResenas = async () => {
    try {
      const data = await resenasNegociosService.getResenasPorNegocio(negocio!.id);
      setResenas(data);
    } catch {
      // Silenciar error
    }
  };

  const handleCrearResena = async () => {
    if (!negocio) return;
    if (nuevaCalificacion < 1 || nuevaCalificacion > 5) {
      Alert.alert('Error', 'La calificación debe ser entre 1 y 5');
      return;
    }

    setEnviandoResena(true);
    try {
      await resenasNegociosService.createResena({
        negocio_id: negocio.id,
        calificacion: nuevaCalificacion,
        comentario: nuevoComentario.trim() || undefined,
      });
      setNuevoComentario('');
      setNuevaCalificacion(5);
      setMostrarFormulario(false);
      await cargarResenas();
      Alert.alert('¡Gracias!', 'Tu reseña ha sido publicada');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo publicar la reseña');
    } finally {
      setEnviandoResena(false);
    }
  };

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
      <View style={{ flex: 1 }}>
        <AppHeader />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTexto}>{error ?? 'Negocio no encontrado'}</Text>
          <TouchableOpacity style={styles.botonVolver} onPress={() => router.back()}>
            <Text style={styles.botonVolverTexto}>Volver</Text>
          </TouchableOpacity>
        </View>
        <SimpleBottomNav activeTab="explorar" />
      </View>
    );
  }

  const imagenPortada = negocio.imagenes?.find((img) => img.es_portada);
  const primeraImagen = negocio.imagenes?.[0];
  const uriImagen = imagenPortada?.url
    ? `${BASE_URL}${imagenPortada.url}`
    : primeraImagen?.url
      ? `${BASE_URL}${primeraImagen.url}`
      : null;

  const distanciaTexto =
    negocio.distancia_metros != null
      ? negocio.distancia_metros < 1000
        ? `${Math.round(negocio.distancia_metros)} m`
        : `${(negocio.distancia_metros / 1000).toFixed(1)} km`
      : null;

  const rating = negocio.calificacion_promedio ?? 0;
  const totalResenas = negocio.total_resenas ?? 0;

  return (
    <View style={{ flex: 1 }}>
      <AppHeader />
      <ScrollView style={styles.contenedor} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        {uriImagen ? (
          <Image source={{ uri: uriImagen }} style={styles.heroImagen} resizeMode="cover" />
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
          activeOpacity={0.85}
          onPress={handleToggleFavorito}
        >
          <Ionicons
            name={esFavorito ? 'heart' : 'heart-outline'}
            size={20}
            color={esFavorito ? '#E74C3C' : '#fff'}
          />
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

        {negocio.imagenes && negocio.imagenes.length > 0 ? (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Galería</Text>
            <FlatList
              data={negocio.imagenes}
              keyExtractor={(_, idx) => String(idx)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galeriaLista}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: `${BASE_URL}${item.url}` }}
                  style={styles.galeriaImagen}
                  resizeMode="cover"
                />
              )}
            />
          </View>
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

        <View style={styles.seccion}>
          <View style={styles.resenasHeader}>
            <Text style={styles.seccionTitulo}>Reseñas ({resenas.length})</Text>
            <TouchableOpacity
              style={styles.botonEscribirResena}
              onPress={() => setMostrarFormulario(!mostrarFormulario)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={mostrarFormulario ? 'close' : 'create-outline'}
                size={16}
                color={COLORES.primario}
              />
              <Text style={styles.botonEscribirResenaTexto}>
                {mostrarFormulario ? 'Cancelar' : 'Escribir reseña'}
              </Text>
            </TouchableOpacity>
          </View>

          {mostrarFormulario && (
            <View style={styles.formularioResena}>
              <Text style={styles.formularioLabel}>Tu calificación</Text>
              <View style={styles.estrellasRow}>
                {[1, 2, 3, 4, 5].map((estrella) => (
                  <TouchableOpacity
                    key={estrella}
                    onPress={() => setNuevaCalificacion(estrella)}
                    style={styles.estrellaBoton}
                  >
                    <Ionicons
                      name={estrella <= nuevaCalificacion ? 'star' : 'star-outline'}
                      size={28}
                      color={estrella <= nuevaCalificacion ? '#F59E0B' : COLORES.textoBorrado}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.inputComentario}
                placeholder="Cuéntanos tu experiencia (opcional)"
                placeholderTextColor={COLORES.textoBorrado}
                value={nuevoComentario}
                onChangeText={setNuevoComentario}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.botonPublicar, enviandoResena && styles.botonPublicarDeshabilitado]}
                onPress={handleCrearResena}
                disabled={enviandoResena}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[COLORES.primario, COLORES.secundario]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.botonPublicarInner}
                >
                  <Text style={styles.botonPublicarTexto}>
                    {enviandoResena ? 'Publicando...' : 'Publicar reseña'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {resenas.length === 0 ? (
            <View style={styles.resenasVacio}>
              <Ionicons name="chatbubble-ellipses-outline" size={36} color={COLORES.acento} />
              <Text style={styles.resenasVacioTexto}>Aún no hay reseñas. Sé el primero en opinar.</Text>
            </View>
          ) : (
            resenas.map((resena) => (
              <View key={resena.id} style={styles.resenaCard}>
                <View style={styles.resenaCardHeader}>
                  <View style={styles.resenaAvatar}>
                    <Text style={styles.resenaAvatarTexto}>
                      {resena.usuario?.nombre?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View style={styles.resenaInfo}>
                    <Text style={styles.resenaNombre}>{resena.usuario?.nombre || 'Anónimo'}</Text>
                    <View style={styles.resenaEstrellas}>
                      {[1, 2, 3, 4, 5].map((estrella) => (
                        <Ionicons
                          key={estrella}
                          name={estrella <= resena.calificacion ? 'star' : 'star-outline'}
                          size={12}
                          color="#F59E0B"
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.resenaFecha}>
                    {new Date(resena.creado_en).toLocaleDateString('es-PA', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                </View>
                {resena.comentario ? (
                  <Text style={styles.resenaComentario}>{resena.comentario}</Text>
                ) : null}
              </View>
            ))
          )}
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

      <View style={{ height: 100 }} />
    </ScrollView>
    <SimpleBottomNav activeTab="explorar" />
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
    top: 12,
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
    top: 12,
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

  galeriaLista: {
    gap: ESPACIADO.sm,
  },
  galeriaImagen: {
    width: 200,
    height: 140,
    borderRadius: BORDES.redondeadoGrande,
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

  resenasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ESPACIADO.md,
  },
  botonEscribirResena: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORES.acento,
    paddingHorizontal: ESPACIADO.md,
    paddingVertical: ESPACIADO.sm,
    borderRadius: BORDES.redondeado,
  },
  botonEscribirResenaTexto: {
    fontSize: TAMAÑOS.fontoPequeno,
    fontWeight: '700',
    color: COLORES.primario,
  },

  formularioResena: {
    backgroundColor: COLORES.fondoGris,
    borderRadius: BORDES.redondeadoGrande,
    padding: ESPACIADO.lg,
    marginBottom: ESPACIADO.xl,
  },
  formularioLabel: {
    fontSize: TAMAÑOS.fontoPequeno,
    fontWeight: '700',
    color: COLORES.texto,
    marginBottom: ESPACIADO.sm,
  },
  estrellasRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: ESPACIADO.md,
  },
  estrellaBoton: {
    padding: 2,
  },
  inputComentario: {
    backgroundColor: COLORES.fondo,
    borderRadius: BORDES.redondeado,
    borderWidth: 1,
    borderColor: COLORES.acento,
    padding: ESPACIADO.md,
    fontSize: TAMAÑOS.fontoNormal,
    color: COLORES.texto,
    minHeight: 80,
    marginBottom: ESPACIADO.md,
  },
  botonPublicar: {
    borderRadius: BORDES.redondeadoGrande,
    overflow: 'hidden',
  },
  botonPublicarDeshabilitado: {
    opacity: 0.6,
  },
  botonPublicarInner: {
    paddingVertical: ESPACIADO.md,
    alignItems: 'center',
  },
  botonPublicarTexto: {
    color: COLORES.fondo,
    fontSize: TAMAÑOS.fontoMedio,
    fontWeight: '700',
  },

  resenasVacio: {
    alignItems: 'center',
    paddingVertical: ESPACIADO.xxl,
    gap: ESPACIADO.sm,
  },
  resenasVacioTexto: {
    fontSize: TAMAÑOS.fontoNormal,
    color: COLORES.textoBorrado,
  },

  resenaCard: {
    backgroundColor: COLORES.fondo,
    borderRadius: BORDES.redondeadoGrande,
    padding: ESPACIADO.lg,
    marginBottom: ESPACIADO.md,
    borderWidth: 1,
    borderColor: COLORES.acento,
  },
  resenaCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ESPACIADO.sm,
  },
  resenaAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORES.primario,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ESPACIADO.md,
  },
  resenaAvatarTexto: {
    color: '#fff',
    fontSize: TAMAÑOS.fontoMedio,
    fontWeight: '700',
  },
  resenaInfo: {
    flex: 1,
  },
  resenaNombre: {
    fontSize: TAMAÑOS.fontoNormal,
    fontWeight: '700',
    color: COLORES.texto,
  },
  resenaEstrellas: {
    flexDirection: 'row',
    gap: 1,
    marginTop: 2,
  },
  resenaFecha: {
    fontSize: TAMAÑOS.fontoPequeno,
    color: COLORES.textoBorrado,
  },
  resenaComentario: {
    fontSize: TAMAÑOS.fontoNormal,
    color: COLORES.texto,
    lineHeight: 20,
  },
});
