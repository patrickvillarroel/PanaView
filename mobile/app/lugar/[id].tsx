import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Lugar, Resena } from '../../types';
import lugaresService from '../../services/lugaresService';
import resenasService from '../../services/resenasService';
import { useAuth } from '../../context/AuthContext';
import { COLORES, ESPACIADO, TAMAÑOS, BORDES } from '../../constants/config';
import LoadingOverlay from '../../components/LoadingOverlay';
import StarRating from '../../components/StarRating';

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

  useEffect(() => {
    obtenerLugar();
  }, [id]);

  const obtenerLugar = async () => {
    if (!id) return;

    try {
      setCargando(true);
      setError(null);
      const lugarData = await lugaresService.getLugarById(id);
      setLugar(lugarData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el lugar');
    } finally {
      setCargando(false);
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
      
      // Recargar lugar para actualizar reseñas
      await obtenerLugar();
      Alert.alert('Éxito', 'Tu reseña ha sido publicada');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setGuardando(false);
    }
  };

  const toggleFavorito = () => {
    setEsFavorito(!esFavorito);
    // Aquí iría la lógica para guardar/eliminar favorito en el backend
  };

  if (cargando) {
    return <LoadingOverlay visible={true} mensaje="Cargando lugar..." />;
  }

  if (error || !lugar) {
    return (
      <View style={styles.contenedorError}>
        <Ionicons name="alert-circle" size={64} color={COLORES.error} />
        <Text style={styles.textoError}>{error || 'Lugar no encontrado'}</Text>
        <TouchableOpacity
          style={styles.botonVolver}
          onPress={() => router.back()}
        >
          <Text style={styles.botonVolverTexto}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const imagenPortada = lugar.imagenes?.[0]?.url;

  return (
    <ScrollView style={styles.contenedor} showsVerticalScrollIndicator={false}>
      {imagenPortada && (
        <Image
          source={{ uri: imagenPortada }}
          style={styles.imagen}
        />
      )}

      <TouchableOpacity
        style={styles.botonAtras}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.botonFavorito}
        onPress={toggleFavorito}
      >
        <Ionicons
          name={esFavorito ? 'heart' : 'heart-outline'}
          size={24}
          color={COLORES.error}
        />
      </TouchableOpacity>

      <View style={styles.contenido}>
        <View style={styles.encabezado}>
          <View style={styles.tituloContainer}>
            <Text style={styles.nombre}>{lugar.nombre}</Text>
            <View style={styles.categoria}>
              <Text style={styles.categoriaNombre}>
                {lugar.categoria.nombre}
              </Text>
            </View>
          </View>
        </View>

        {lugar.calificacion_promedio !== undefined && (
          <View style={styles.calificacionContainer}>
            <StarRating value={lugar.calificacion_promedio} readonly size={20} />
            <Text style={styles.calificacionTexto}>
              {lugar.calificacion_promedio.toFixed(1)}
            </Text>
            <Text style={styles.resenasCount}>
              ({lugar.total_resenas || 0} reseñas)
            </Text>
          </View>
        )}

        <View style={styles.detalles}>
          {lugar.direccion && (
            <View style={styles.detalle}>
              <Ionicons name="location-outline" size={20} color={COLORES.primario} />
              <Text style={styles.detalleTexto}>{lugar.direccion}</Text>
            </View>
          )}
          {lugar.provincia && (
            <View style={styles.detalle}>
              <Ionicons name="map-outline" size={20} color={COLORES.primario} />
              <Text style={styles.detalleTexto}>{lugar.provincia}</Text>
            </View>
          )}
        </View>

        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>Descripción</Text>
          <Text style={styles.descripcion}>{lugar.descripcion}</Text>
        </View>

        {lugar.historia && (
          <View style={styles.seccion}>
            <Text style={styles.tituloSeccion}>Historia</Text>
            <Text style={styles.historia}>{lugar.historia}</Text>
          </View>
        )}

        {lugar.audio_url && (
          <TouchableOpacity style={styles.botonAudio}>
            <Ionicons name="play-circle" size={20} color="white" />
            <Text style={styles.botonAudioTexto}>Escuchar Audioguía</Text>
          </TouchableOpacity>
        )}

        <View style={styles.seccion}>
          <View style={styles.encabezadoResenas}>
            <Text style={styles.tituloSeccion}>Reseñas</Text>
            {isAuthenticated && (
              <TouchableOpacity
                style={styles.botonAgregarResena}
                onPress={() => setModalResena(true)}
              >
                <Ionicons name="add" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>

          {lugar.resenas && lugar.resenas.length > 0 ? (
            <FlatList
              data={lugar.resenas}
              scrollEnabled={false}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }: { item: Resena }) => (
                <View style={styles.tarjetaResena}>
                  <View style={styles.encabezadoResena}>
                    <Text style={styles.nombreResena}>
                      {item.usuario.nombre}
                    </Text>
                    <StarRating value={item.calificacion} readonly size={16} />
                  </View>
                  {item.comentario && (
                    <Text style={styles.comentarioResena}>
                      {item.comentario}
                    </Text>
                  )}
                  <Text style={styles.fechaResena}>
                    {new Date(item.creado_en).toLocaleDateString()}
                  </Text>
                </View>
              )}
            />
          ) : (
            <Text style={styles.sinResenas}>
              Aún no hay reseñas. ¡Sé el primero!
            </Text>
          )}
        </View>

        <View style={{ height: ESPACIADO.xl }} />
      </View>

      <Modal visible={modalResena} transparent statusBarTranslucent>
        <View style={styles.modalFondo}>
          <View style={styles.modalContenido}>
            <View style={styles.modalEncabezado}>
              <Text style={styles.modalTitulo}>Escribir Reseña</Text>
              <TouchableOpacity onPress={() => setModalResena(false)}>
                <Ionicons name="close" size={24} color={COLORES.texto} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.label}>Calificación</Text>
              <StarRating
                value={calificacion}
                onChange={setCalificacion}
                size={32}
              />

              <Text style={[styles.label, { marginTop: ESPACIADO.lg }]}>
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
                style={[styles.botonPrimario, guardando && { opacity: 0.6 }]}
                onPress={handleAgregarResena}
                disabled={guardando}
              >
                <Text style={styles.botonPrimarioTexto}>Publicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <LoadingOverlay visible={guardando} mensaje="Publicando reseña..." />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  imagen: {
    width: '100%',
    height: 250,
    backgroundColor: COLORES.fondoGris,
  },
  botonAtras: {
    position: 'absolute',
    top: ESPACIADO.lg,
    left: ESPACIADO.lg,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: ESPACIADO.sm,
    borderRadius: BORDES.circulo,
  },
  botonFavorito: {
    position: 'absolute',
    top: ESPACIADO.lg,
    right: ESPACIADO.lg,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: ESPACIADO.sm,
    borderRadius: BORDES.circulo,
  },
  contenido: {
    padding: ESPACIADO.lg,
  },
  encabezado: {
    marginBottom: ESPACIADO.md,
  },
  tituloContainer: {
    flex: 1,
  },
  nombre: {
    fontSize: TAMAÑOS.fontoPequenioGrande,
    fontWeight: '700',
    color: COLORES.texto,
    marginBottom: ESPACIADO.sm,
  },
  categoria: {
    backgroundColor: COLORES.acento,
    paddingVertical: ESPACIADO.xs,
    paddingHorizontal: ESPACIADO.md,
    borderRadius: BORDES.redondeado,
    alignSelf: 'flex-start',
  },
  categoriaNombre: {
    fontSize: TAMAÑOS.fontoPequeno,
    color: COLORES.primario,
    fontWeight: '600',
  },
  calificacionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ESPACIADO.lg,
    gap: ESPACIADO.md,
  },
  calificacionTexto: {
    fontSize: TAMAÑOS.fontoMedio,
    fontWeight: '700',
    color: COLORES.texto,
  },
  resenasCount: {
    fontSize: TAMAÑOS.fontoPequeno,
    color: COLORES.textoBorrado,
  },
  detalles: {
    marginBottom: ESPACIADO.lg,
    gap: ESPACIADO.sm,
  },
  detalle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIADO.md,
  },
  detalleTexto: {
    fontSize: TAMAÑOS.fontoNormal,
    color: COLORES.texto,
    flex: 1,
  },
  seccion: {
    marginBottom: ESPACIADO.lg,
  },
  tituloSeccion: {
    fontSize: TAMAÑOS.fontoMedio,
    fontWeight: '700',
    color: COLORES.texto,
    marginBottom: ESPACIADO.md,
  },
  descripcion: {
    fontSize: TAMAÑOS.fontoNormal,
    color: COLORES.texto,
    lineHeight: 20,
  },
  historia: {
    fontSize: TAMAÑOS.fontoNormal,
    color: COLORES.texto,
    lineHeight: 20,
  },
  botonAudio: {
    flexDirection: 'row',
    backgroundColor: COLORES.primario,
    paddingVertical: ESPACIADO.md,
    paddingHorizontal: ESPACIADO.lg,
    borderRadius: BORDES.redondeado,
    alignItems: 'center',
    justifyContent: 'center',
    gap: ESPACIADO.md,
    marginBottom: ESPACIADO.lg,
  },
  botonAudioTexto: {
    color: COLORES.fondo,
    fontSize: TAMAÑOS.fontoMedio,
    fontWeight: '600',
  },
  encabezadoResenas: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ESPACIADO.md,
  },
  botonAgregarResena: {
    backgroundColor: COLORES.primario,
    width: 40,
    height: 40,
    borderRadius: BORDES.circulo,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tarjetaResena: {
    backgroundColor: COLORES.fondoGris,
    padding: ESPACIADO.md,
    borderRadius: BORDES.redondeado,
    marginBottom: ESPACIADO.md,
  },
  encabezadoResena: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ESPACIADO.sm,
  },
  nombreResena: {
    fontSize: TAMAÑOS.fontoNormal,
    fontWeight: '600',
    color: COLORES.texto,
  },
  comentarioResena: {
    fontSize: TAMAÑOS.fontoNormal,
    color: COLORES.texto,
    marginBottom: ESPACIADO.sm,
    lineHeight: 18,
  },
  fechaResena: {
    fontSize: TAMAÑOS.fontoPequeno,
    color: COLORES.textoBorrado,
  },
  sinResenas: {
    fontSize: TAMAÑOS.fontoNormal,
    color: COLORES.textoBorrado,
    textAlign: 'center',
    paddingVertical: ESPACIADO.lg,
  },
  contenedorError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ESPACIADO.lg,
    backgroundColor: COLORES.fondo,
  },
  textoError: {
    fontSize: TAMAÑOS.fontoMedio,
    color: COLORES.error,
    marginVertical: ESPACIADO.lg,
    textAlign: 'center',
  },
  botonVolver: {
    backgroundColor: COLORES.primario,
    paddingVertical: ESPACIADO.md,
    paddingHorizontal: ESPACIADO.lg,
    borderRadius: BORDES.redondeado,
  },
  botonVolverTexto: {
    color: COLORES.fondo,
    fontWeight: '600',
  },
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContenido: {
    backgroundColor: COLORES.fondo,
    borderTopLeftRadius: BORDES.redondeadoExtraGrande,
    borderTopRightRadius: BORDES.redondeadoExtraGrande,
    paddingBottom: ESPACIADO.xl,
  },
  modalEncabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ESPACIADO.lg,
    paddingVertical: ESPACIADO.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.acento,
  },
  modalTitulo: {
    fontSize: TAMAÑOS.fontoMedio,
    fontWeight: '700',
    color: COLORES.texto,
  },
  modalBody: {
    padding: ESPACIADO.lg,
  },
  label: {
    fontSize: TAMAÑOS.fontoNormal,
    fontWeight: '600',
    color: COLORES.texto,
    marginBottom: ESPACIADO.md,
  },
  inputComentario: {
    borderWidth: 1,
    borderColor: COLORES.acento,
    borderRadius: BORDES.redondeado,
    padding: ESPACIADO.md,
    fontSize: TAMAÑOS.fontoNormal,
    color: COLORES.texto,
    textAlignVertical: 'top',
    minHeight: 100,
    backgroundColor: COLORES.fondoGris,
  },
  botonPrimario: {
    backgroundColor: COLORES.primario,
    paddingVertical: ESPACIADO.md,
    borderRadius: BORDES.redondeado,
    alignItems: 'center',
    marginTop: ESPACIADO.lg,
  },
  botonPrimarioTexto: {
    color: COLORES.fondo,
    fontSize: TAMAÑOS.fontoMedio,
    fontWeight: '700',
  },
});
