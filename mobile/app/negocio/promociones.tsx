import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import PromocionesService from '../../services/promocionesService';
import negociosService from '../../services/negociosService';
import { Promocion } from '../../types';
import LoadingOverlay from '../../components/LoadingOverlay';
import AppHeader from '../../components/AppHeader';
import SimpleBottomNav from '../../components/SimpleBottomNav';
import { useAuth } from '../../context/AuthContext';
import { COLORES, ESPACIADO, TAMAÑOS, BORDES, BASE_URL } from '../../constants/config';

const { width: ANCHO } = Dimensions.get('window');
const ALTO_HERO = 200;

export default function PromocionesScreen() {
  const { id: negocioId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { usuario } = useAuth();
  const [promos, setPromos] = useState<Promocion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [esPropietario, setEsPropietario] = useState(false);

  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [promoEditando, setPromoEditando] = useState<Promocion | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formPrecio, setFormPrecio] = useState('');
  const [formFecha, setFormFecha] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [imagenNuevaUri, setImagenNuevaUri] = useState<string | null>(null);
  const [imagenActualId, setImagenActualId] = useState<number | null>(null);

  useEffect(() => {
    if (!negocioId) return;
    cargarPromos();
    verificarPropietario();
  }, [negocioId]);

  const verificarPropietario = async () => {
    if (!usuario) {
      setEsPropietario(false);
      return;
    }
    if (usuario.rol === 'admin') {
      setEsPropietario(true);
      return;
    }
    try {
      const negocio = await negociosService.getNegocioById(negocioId as string);
      setEsPropietario(negocio.propietario_id === usuario.id);
    } catch {
      setEsPropietario(false);
    }
  };

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
    if (!fecha || fecha === 'Invalid date') return 'Sin fecha límite';
    try {
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return 'Sin fecha límite';
      return d.toLocaleDateString('es-PA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Sin fecha límite';
    }
  };

  const formatearPrecio = (precio?: number) => {
    if (precio == null) return null;
    return `$${Number(precio).toFixed(2)}`;
  };

  const eliminarPromo = (promo: Promocion) => {
    Alert.alert(
      'Eliminar promoción',
      `¿Estás seguro de eliminar "${promo.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await PromocionesService.eliminar(promo.id);
              setPromos((prev) => prev.filter((p) => p.id !== promo.id));
              Alert.alert('Éxito', 'Promoción eliminada');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  };

  const abrirEditar = (promo: Promocion) => {
    setPromoEditando(promo);
    setFormNombre(promo.nombre || '');
    setFormDescripcion(promo.descripcion || '');
    setFormPrecio(promo.precio != null ? String(promo.precio) : '');
    setFormFecha(promo.fecha_validez || '');
    setImagenNuevaUri(null);
    const imgExistente = promo.imagenes?.[0];
    setImagenActualId(imgExistente?.id ?? null);
    setModalEditarVisible(true);
  };

  const seleccionarImagenEdicion = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería.');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!resultado.canceled && resultado.assets.length > 0) {
      setImagenNuevaUri(resultado.assets[0].uri);
    }
  };

  const guardarEdicion = async () => {
    if (!formNombre.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }
    if (!promoEditando) return;

    setGuardando(true);
    try {
      const payload: any = {
        nombre: formNombre.trim(),
        descripcion: formDescripcion.trim() || undefined,
        precio: formPrecio ? Number(formPrecio) : undefined,
        fecha_validez: formFecha.trim() || undefined,
      };

      const actualizada = await PromocionesService.actualizar(promoEditando.id, payload);

      if (imagenNuevaUri) {
        if (imagenActualId) {
          try {
            await PromocionesService.eliminarImagen(actualizada.id, imagenActualId);
          } catch {}
        }
        await PromocionesService.subirImagen(actualizada.id, imagenNuevaUri, true);
      }

      setPromos((prev) =>
        prev.map((p) => (p.id === actualizada.id ? { ...p, ...actualizada } : p))
      );
      setModalEditarVisible(false);
      Alert.alert('Éxito', 'Promoción actualizada');
      void cargarPromos();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo actualizar');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return <LoadingOverlay visible mensaje="Cargando promociones..." />;
  }

  if (error) {
    return (
      <View style={{ flex: 1 }}>
        <AppHeader />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTexto}>{error}</Text>
          <TouchableOpacity style={styles.botonVolver} onPress={() => router.back()}>
            <Text style={styles.botonVolverTexto}>Volver</Text>
          </TouchableOpacity>
        </View>
        <SimpleBottomNav activeTab="explorar" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <AppHeader />
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
            const imagenUri = item.imagenes?.[0]?.url
              ? `${BASE_URL}${item.imagenes[0].url}`
              : null;

            return (
              <TouchableOpacity
                style={styles.promoCard}
                activeOpacity={0.85}
                onPress={() => router.push(`/negocio/promocionDetalle?id=${item.id}`)}
              >
                {imagenUri ? (
                  <Image source={{ uri: imagenUri }} style={styles.promoCardImagen} />
                ) : (
                  <View style={styles.promoCardPlaceholder}>
                    <Ionicons name="pricetag" size={36} color="#fff" />
                  </View>
                )}

                {esPropietario && (
                  <View style={styles.botoneraSuperior}>
                    <TouchableOpacity
                      style={styles.botonIcono}
                      onPress={() => abrirEditar(item)}
                    >
                      <Ionicons name="create-outline" size={16} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.botonIcono, styles.botonIconoEliminar]}
                      onPress={() => eliminarPromo(item)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}

                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.75)']}
                  style={styles.promoCardGradiente}
                />
                <View style={styles.promoCardOverlay}>
                  <View style={styles.promoCardBody}>
                    <Text style={styles.promoCardNombre} numberOfLines={2}>
                      {item.nombre}
                    </Text>
                    {item.descripcion ? (
                      <Text style={styles.promoCardDesc} numberOfLines={2}>
                        {item.descripcion}
                      </Text>
                    ) : null}
                    <View style={styles.promoCardFooter}>
                      <View style={styles.promoCardFecha}>
                        <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.promoCardFechaTexto}>{fecha}</Text>
                      </View>
                      {precio && (
                        <View style={styles.promoCardPrecio}>
                          <Text style={styles.promoCardPrecioTexto}>{precio}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={<View style={{ height: 24 }} />}
        />
      </View>

      <Modal visible={modalEditarVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContenido}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Editar promoción</Text>
              <TouchableOpacity onPress={() => setModalEditarVisible(false)}>
                <Ionicons name="close" size={24} color={COLORES.texto} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Imagen</Text>
              <TouchableOpacity style={styles.botonImagen} onPress={seleccionarImagenEdicion}>
                {imagenNuevaUri ? (
                  <Image source={{ uri: imagenNuevaUri }} style={styles.previewImagen} />
                ) : promoEditando?.imagenes?.[0]?.url ? (
                  <Image
                    source={{ uri: `${BASE_URL}${promoEditando.imagenes[0].url}` }}
                    style={styles.previewImagen}
                  />
                ) : (
                  <View style={styles.previewPlaceholder}>
                    <Ionicons name="image-outline" size={32} color={COLORES.textoBorrado} />
                    <Text style={styles.previewPlaceholderTexto}>Tocar para cambiar imagen</Text>
                  </View>
                )}
                <View style={styles.botonImagenOverlay}>
                  <Ionicons name="camera" size={18} color="#fff" />
                </View>
              </TouchableOpacity>

              <Text style={styles.label}>Nombre *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre de la promoción"
                value={formNombre}
                onChangeText={setFormNombre}
              />

              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Descripción"
                value={formDescripcion}
                onChangeText={setFormDescripcion}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Precio</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={formPrecio}
                onChangeText={setFormPrecio}
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>Fecha de validez</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={formFecha}
                onChangeText={setFormFecha}
              />

              <TouchableOpacity
                style={[styles.botonGuardar, guardando && styles.botonDeshabilitado]}
                onPress={guardarEdicion}
                disabled={guardando}
              >
                <Text style={styles.botonGuardarTexto}>
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      </View>
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
    height: 200,
    borderRadius: BORDES.redondeadoGrande,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: ESPACIADO.md,
  },
  promoCardImagen: {
    width: '100%',
    height: '100%',
  },
  promoCardPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORES.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoCardGradiente: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '65%',
  },
  promoCardOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: ESPACIADO.md,
  },
  promoCardBody: {},
  promoCardNombre: {
    fontSize: TAMAÑOS.fontoGrande,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  promoCardDesc: {
    fontSize: TAMAÑOS.fontoPequeno,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
    marginBottom: 8,
  },
  promoCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  promoCardFecha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  promoCardFechaTexto: {
    fontSize: TAMAÑOS.fontoPequeno,
    color: 'rgba(255,255,255,0.8)',
  },
  promoCardPrecio: {
    backgroundColor: COLORES.acento,
    borderRadius: BORDES.redondeado,
    paddingHorizontal: ESPACIADO.md,
    paddingVertical: ESPACIADO.xs,
  },
  promoCardPrecioTexto: {
    fontSize: TAMAÑOS.fontoMedio,
    fontWeight: '800',
    color: COLORES.primario,
  },

  botoneraSuperior: {
    position: 'absolute',
    top: ESPACIADO.sm,
    right: ESPACIADO.sm,
    flexDirection: 'row',
    gap: 6,
    zIndex: 10,
  },
  botonIcono: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonIconoEliminar: {
    backgroundColor: 'rgba(220,38,38,0.75)',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContenido: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: ESPACIADO.xl,
    paddingTop: ESPACIADO.xl,
    paddingBottom: ESPACIADO.xxl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ESPACIADO.xl,
  },
  modalTitulo: {
    fontSize: TAMAÑOS.fontoGrande,
    fontWeight: '800',
    color: COLORES.texto,
  },
  label: {
    fontSize: TAMAÑOS.fontoNormal,
    fontWeight: '600',
    color: COLORES.texto,
    marginBottom: ESPACIADO.xs,
    marginTop: ESPACIADO.md,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: BORDES.redondeado,
    paddingHorizontal: ESPACIADO.md,
    paddingVertical: ESPACIADO.md,
    fontSize: TAMAÑOS.fontoNormal,
    color: COLORES.texto,
    backgroundColor: '#F9FAFB',
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  botonGuardar: {
    backgroundColor: COLORES.primario,
    borderRadius: BORDES.redondeado,
    paddingVertical: ESPACIADO.md,
    alignItems: 'center',
    marginTop: ESPACIADO.xl,
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  botonGuardarTexto: {
    color: '#fff',
    fontSize: TAMAÑOS.fontoMedio,
    fontWeight: '700',
  },

  botonImagen: {
    width: '100%',
    height: 160,
    borderRadius: BORDES.redondeado,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    marginBottom: ESPACIADO.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
  },
  previewImagen: {
    width: '100%',
    height: '100%',
  },
  previewPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  previewPlaceholderTexto: {
    fontSize: TAMAÑOS.fontoPequeno,
    color: COLORES.textoBorrado,
  },
  botonImagenOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
