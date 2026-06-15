import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { COLORES, BASE_URL } from '../../constants/config';
import LoadingOverlay from '../../components/LoadingOverlay';
import FavoritoCard from '../../components/FavoritoCard';
import authService from '../../services/authService';
import negociosService from '../../services/negociosService';
import promocionesService from '../../services/promocionesService';
import { UsuarioPerfil, CategoriaNegocio, Negocio } from '../../types';

const INTERESES_STORAGE_PREFIX = 'perfil-intereses:';

const ETIQUETAS_ROL: Record<string, string[]> = {
  turista: ['Explorador local', 'Viajero'],
  negocio: ['Propietario', 'Negocio local'],
  admin: ['Administrador'],
};

const MENU_OPCIONES = [
  { icono: 'settings-outline' as const, label: 'Configuración de cuenta', action: 'editar' },
  { icono: 'notifications-outline' as const, label: 'Notificaciones', action: 'configuracion' },
  { icono: 'shield-checkmark-outline' as const, label: 'Privacidad y seguridad', action: 'configuracion' },
];

function SinSesion() {
  const router = useRouter();

  return (
    <View style={styles.sinSesionContenedor}>
      <Ionicons name="person-circle-outline" size={88} color={COLORES.acento} />
      <Text style={styles.sinSesionTitulo}>Inicia sesión</Text>
      <Text style={styles.sinSesionTexto}>
        Crea una cuenta o inicia sesión para acceder a tu perfil
      </Text>
      <TouchableOpacity style={styles.botonPrimario} onPress={() => router.push('/login')}>
        <Text style={styles.botonPrimarioTexto}>Iniciar sesión</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.botonSecundario} onPress={() => router.push('/register')}>
        <Text style={styles.botonSecundarioTexto}>Crear cuenta</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function PerfilScreen() {
  const { usuario, isAuthenticated, logout, setUsuario } = useAuth();
  const router = useRouter();

  const [perfil, setPerfil] = useState<UsuarioPerfil | null>(null);
  const [cargandoPerfil, setCargandoPerfil] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [intereses, setIntereses] = useState<string[]>([]);
  const [modalInteresVisible, setModalInteresVisible] = useState(false);
  const [nuevoInteres, setNuevoInteres] = useState('');
  const [guardandoInteres, setGuardandoInteres] = useState(false);

  // Estado para formulario de negocio
  const [modalNegocioVisible, setModalNegocioVisible] = useState(false);
  const [editandoNegocioId, setEditandoNegocioId] = useState<string | null>(null);
  const [negocioExpandido, setNegocioExpandido] = useState<string | null>(null);
  const [imagenesExistentes, setImagenesExistentes] = useState<{id: number; url: string; es_portada: boolean; orden: number}[]>([]);
  const [categorias, setCategorias] = useState<CategoriaNegocio[]>([]);
  const [enviandoNegocio, setEnviandoNegocio] = useState(false);
  const [formNegocio, setFormNegocio] = useState({
    nombre: '',
    descripcion: '',
    categoria_id: '',
    direccion: '',
    telefono: '',
    whatsapp: '',
    horario: '',
    sitio_web: '',
  });
  const [imagenesSeleccionadas, setImagenesSeleccionadas] = useState<string[]>([]);

  // Estado para negocios del propietario
  const [misNegocios, setMisNegocios] = useState<Negocio[]>([]);
  const [cargandoNegocios, setCargandoNegocios] = useState(false);

  // Estado para formulario de promoción
  const [modalPromoVisible, setModalPromoVisible] = useState(false);
  const [promoNegocioId, setPromoNegocioId] = useState('');
  const [promoNegocioNombre, setPromoNegocioNombre] = useState('');
  const [enviandoPromo, setEnviandoPromo] = useState(false);
  const [formPromo, setFormPromo] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    fecha_validez: '',
  });
  const [imagenPromoUri, setImagenPromoUri] = useState<string | null>(null);

  const perfilVisible: UsuarioPerfil | null = perfil ?? (usuario ? { ...usuario, favoritos: [] } : null);
  const iniciales = perfilVisible?.nombre
    ? perfilVisible.nombre.split(' ').map((parte) => parte[0]).join('').slice(0, 2).toUpperCase()
    : '?';
  const etiquetas = ETIQUETAS_ROL[perfilVisible?.rol ?? 'turista'] ?? [];

  useEffect(() => {
    if (!isAuthenticated) {
      setPerfil(null);
      setIntereses([]);
      setMisNegocios([]);
      return;
    }

    void cargarPerfil();
    void cargarCategorias();
    if (usuario?.rol === 'negocio') {
      void cargarMisNegocios();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (perfilVisible?.id) {
      void cargarIntereses(perfilVisible.id);
    }
  }, [perfilVisible?.id]);

  async function cargarCategorias() {
    try {
      const data = await negociosService.getCategorias();
      setCategorias(data);
    } catch {
      // Silenciar error
    }
  }

  async function cargarMisNegocios() {
    setCargandoNegocios(true);
    try {
      const data = await negociosService.getMisNegocios();
      setMisNegocios(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[perfil] Error cargando negocios:', err.message);
    } finally {
      setCargandoNegocios(false);
    }
  }

  async function cargarPerfil(pullToRefresh = false) {
    try {
      if (pullToRefresh) {
        setRefrescando(true);
      } else {
        setCargandoPerfil(true);
      }

      const data = await authService.getMe();
      setPerfil(data);

      const usuarioBase = {
        id: data.id,
        nombre: data.nombre,
        email: data.email,
        rol: data.rol,
        foto_url: data.foto_url,
      };

      setUsuario(usuarioBase);
      await AsyncStorage.setItem('usuario', JSON.stringify(usuarioBase));
    } catch (error: any) {
      if (error.status === 401) {
        return;
      }

      const msg = error.message || '';
      if (msg === 'Usuario no encontrado') {
        await logout();
        return;
      }

      Alert.alert('Error', msg || 'No se pudo cargar el perfil');
    } finally {
      setCargandoPerfil(false);
      setRefrescando(false);
    }
  }

  async function cargarIntereses(usuarioId: string) {
    try {
      const guardado = await AsyncStorage.getItem(`${INTERESES_STORAGE_PREFIX}${usuarioId}`);
      if (!guardado) {
        setIntereses([]);
        return;
      }

      const parseado = JSON.parse(guardado);
      setIntereses(Array.isArray(parseado) ? parseado.filter((valor) => typeof valor === 'string') : []);
    } catch {
      setIntereses([]);
    }
  }

  async function guardarIntereses(siguientesIntereses: string[]) {
    if (!perfilVisible?.id) return;
    await AsyncStorage.setItem(
      `${INTERESES_STORAGE_PREFIX}${perfilVisible.id}`,
      JSON.stringify(siguientesIntereses)
    );
  }

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  function abrirModalIntereses() {
    setNuevoInteres('');
    setModalInteresVisible(true);
  }

  async function agregarInteres() {
    const interes = nuevoInteres.trim();

    if (!interes) {
      Alert.alert('Agrega un interés', 'Escribe algo para guardarlo en tu perfil.');
      return;
    }

    if (intereses.some((valor) => valor.toLowerCase() === interes.toLowerCase())) {
      Alert.alert('Duplicado', 'Ese interés ya existe en tu perfil.');
      return;
    }

    try {
      setGuardandoInteres(true);
      const siguientes = [...intereses, interes];
      setIntereses(siguientes);
      await guardarIntereses(siguientes);
      setModalInteresVisible(false);
      setNuevoInteres('');
    } finally {
      setGuardandoInteres(false);
    }
  }

  async function eliminarInteres(interesAEliminar: string) {
    const siguientes = intereses.filter((interes) => interes !== interesAEliminar);
    setIntereses(siguientes);
    await guardarIntereses(siguientes);
  }

  function irAConfiguracion(action: string) {
    if (action === 'editar') {
      router.push('/perfil/editar');
      return;
    }

    router.push('/perfil/configuracion');
  }

  function abrirFormularioNegocio() {
    setEditandoNegocioId(null);
    setFormNegocio({
      nombre: '',
      descripcion: '',
      categoria_id: '',
      direccion: '',
      telefono: '',
      whatsapp: '',
      horario: '',
      sitio_web: '',
    });
    setImagenesSeleccionadas([]);
    setImagenesExistentes([]);
    setModalNegocioVisible(true);
  }

  function abrirEdicionNegocio(negocio: Negocio) {
    console.log('[edicion] abrirEdicionNegocio negocio.id:', negocio.id, 'tipo:', typeof negocio.id);
    setEditandoNegocioId(negocio.id);
    setFormNegocio({
      nombre: negocio.nombre || '',
      descripcion: negocio.descripcion || '',
      categoria_id: String(negocio.categoria?.id || ''),
      direccion: negocio.direccion || '',
      telefono: negocio.telefono || '',
      whatsapp: negocio.whatsapp || '',
      horario: negocio.horario || '',
      sitio_web: negocio.sitio_web || '',
    });
    setImagenesSeleccionadas([]);
    setImagenesExistentes(
      (negocio.imagenes || [])
        .filter((img: any) => img.id != null)
        .map((img: any) => ({
          id: img.id,
          url: img.url,
          es_portada: img.es_portada,
          orden: img.orden ?? 0,
        }))
    );
    setModalNegocioVisible(true);
  }

  async function seleccionarImagen() {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para seleccionar imágenes.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 5 - imagenesSeleccionadas.length,
    });

    if (!resultado.canceled) {
      const nuevas = resultado.assets.map((a) => a.uri);
      setImagenesSeleccionadas((prev) => [...prev, ...nuevas].slice(0, 5));
    }
  }

  function eliminarImagen(uri: string) {
    setImagenesSeleccionadas((prev) => prev.filter((u) => u !== uri));
  }

  async function eliminarImagenExistente(imagenId: number) {
    if (!editandoNegocioId) return;
    try {
      await negociosService.eliminarImagenNegocio(editandoNegocioId, imagenId);
      setImagenesExistentes((prev) => prev.filter((img) => img.id !== imagenId));
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo eliminar la imagen');
    }
  }

  async function handleRegistrarNegocio() {
    if (!formNegocio.nombre.trim()) {
      Alert.alert('Error', 'El nombre del negocio es requerido');
      return;
    }
    if (!formNegocio.categoria_id) {
      Alert.alert('Error', 'Selecciona una categoría');
      return;
    }

    setEnviandoNegocio(true);
    try {
      let latitud = 9.089204;
      let longitud = -79.4029686;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          latitud = location.coords.latitude;
          longitud = location.coords.longitude;
        }
      } catch {
        // Usar coordenadas por defecto
      }

      const payload: any = {
        nombre: formNegocio.nombre.trim(),
        descripcion: formNegocio.descripcion.trim() || undefined,
        categoria: { id: Number(formNegocio.categoria_id), nombre: '', icono: '' },
        latitud,
        longitud,
        direccion: formNegocio.direccion.trim() || undefined,
        telefono: formNegocio.telefono.trim() || undefined,
        whatsapp: formNegocio.whatsapp.trim() || undefined,
        horario: formNegocio.horario.trim() || undefined,
        sitio_web: formNegocio.sitio_web.trim() || undefined,
        imagenes: [],
      };

      let negocioId: string;

      if (editandoNegocioId) {
        const actualizado = await negociosService.actualizarNegocio(editandoNegocioId, payload);
        negocioId = actualizado.id;
      } else {
        const nuevoNegocio = await negociosService.crearNegocio(payload);
        negocioId = nuevoNegocio.id;
      }

      if (negocioId && imagenesSeleccionadas.length > 0) {
        const maxOrden = imagenesExistentes.reduce((max, img) => Math.max(max, img.orden ?? 0), 0);
        const esEdicion = Boolean(editandoNegocioId);
        for (let i = 0; i < imagenesSeleccionadas.length; i++) {
          const esPortadaNueva = !esEdicion && i === 0;
          await negociosService.subirImagenNegocio(
            negocioId,
            imagenesSeleccionadas[i],
            esPortadaNueva,
            esPortadaNueva ? 0 : maxOrden + i + 1
          );
        }
      }

      setModalNegocioVisible(false);
      Alert.alert(
        'Éxito',
        editandoNegocioId
          ? 'Negocio actualizado correctamente'
          : 'Tu negocio ha sido registrado y está pendiente de verificación.'
      );
      void cargarMisNegocios();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo registrar el negocio');
    } finally {
      setEnviandoNegocio(false);
    }
  }

  function abrirFormularioPromo(negocioId: string, negocioNombre: string) {
    setPromoNegocioId(negocioId);
    setPromoNegocioNombre(negocioNombre);
    setFormPromo({ nombre: '', descripcion: '', precio: '', fecha_validez: '' });
    setImagenPromoUri(null);
    setModalPromoVisible(true);
  }

  async function seleccionarImagenPromo() {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para seleccionar imágenes.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    if (!resultado.canceled) {
      setImagenPromoUri(resultado.assets[0].uri);
    }
  }

  async function handleCrearPromocion() {
    if (!formPromo.nombre.trim()) {
      Alert.alert('Error', 'El nombre de la promoción es requerido');
      return;
    }

    if (formPromo.fecha_validez && !/^\d{4}-\d{2}-\d{2}$/.test(formPromo.fecha_validez)) {
      Alert.alert('Fecha inválida', 'El formato debe ser AAAA-MM-DD. Ejemplo: 2026-12-31');
      return;
    }

    setEnviandoPromo(true);
    try {
      const payload: any = {
        nombre: formPromo.nombre.trim(),
        descripcion: formPromo.descripcion.trim() || undefined,
        precio: formPromo.precio ? parseFloat(formPromo.precio) : 0,
        fecha_validez: formPromo.fecha_validez || undefined,
      };

      const nuevaPromo = await promocionesService.crear(promoNegocioId, payload);

      if (nuevaPromo?.id && imagenPromoUri) {
        await promocionesService.subirImagen(nuevaPromo.id, imagenPromoUri, true);
      }

      setModalPromoVisible(false);
      Alert.alert('Éxito', 'Promoción creada correctamente');
      void cargarMisNegocios();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo crear la promoción');
    } finally {
      setEnviandoPromo(false);
    }
  }

  if (!isAuthenticated) return <SinSesion />;

  if (cargandoPerfil && !perfilVisible) {
    return <LoadingOverlay visible mensaje="Cargando perfil..." />;
  }

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContenido}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={() => cargarPerfil(true)} />
        }
      >
        <View style={styles.hero}>
          <View style={styles.avatarWrap}>
            {perfilVisible?.foto_url ? (
              <Image source={{ uri: perfilVisible.foto_url }} style={styles.avatarImg} />
            ) : (
              <LinearGradient
                colors={[COLORES.secundario, COLORES.primario]}
                style={styles.avatarGradiente}
              >
                <Text style={styles.avatarIniciales}>{iniciales}</Text>
              </LinearGradient>
            )}
          </View>

          <Text style={styles.heroNombre}>{perfilVisible?.nombre ?? 'Usuario'}</Text>

          <View style={styles.heroUbicacion}>
            <Ionicons name="checkmark-circle" size={13} color={COLORES.secundario} />
            <Text style={styles.heroUbicacionTexto}>Perfil sincronizado con tu cuenta</Text>
          </View>

          <View style={styles.chipsWrap}>
            {etiquetas.map((tag) => (
              <View key={tag} style={styles.chip}>
                <Text style={styles.chipTexto}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.tarjeta}>
          <View style={styles.tarjetaHeader}>
            <Ionicons name="options-outline" size={18} color={COLORES.primario} />
            <Text style={styles.tarjetaTitulo}>Preferencias de viaje</Text>
          </View>

          <View style={styles.interesesWrap}>
            {intereses.length > 0 ? (
              intereses.map((interes) => (
                <TouchableOpacity
                  key={interes}
                  style={styles.chipInteres}
                  activeOpacity={0.7}
                  onPress={() => eliminarInteres(interes)}
                >
                  <Text style={styles.chipInteresTexto}>{interes}</Text>
                  <Ionicons name="close-circle" size={14} color={COLORES.secundario} />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.interesesVacio}>Todavía no has agregado intereses.</Text>
            )}
          </View>

          <TouchableOpacity style={styles.agregarIntereses} onPress={abrirModalIntereses}>
            <Ionicons name="add-circle-outline" size={16} color={COLORES.secundario} />
            <Text style={styles.agregarInteresesTexto}>Agregar intereses</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tarjeta}>
          {MENU_OPCIONES.map((opcion, i) => (
            <React.Fragment key={opcion.label}>
              <TouchableOpacity
                style={styles.menuFila}
                activeOpacity={0.7}
                onPress={() => irAConfiguracion(opcion.action)}
              >
                <View style={styles.menuIconoWrap}>
                  <Ionicons name={opcion.icono} size={20} color={COLORES.primario} />
                </View>
                <Text style={styles.menuLabel}>{opcion.label}</Text>
                <Ionicons name="chevron-forward" size={18} color="#C4C9D4" />
              </TouchableOpacity>
              {i < MENU_OPCIONES.length - 1 && <View style={styles.separador} />}
            </React.Fragment>
          ))}
        </View>

        {perfilVisible?.rol === 'negocio' && (
        <View style={styles.seccionMisNegocios}>
            <View style={styles.seccionHeader}>
              <View style={styles.seccionHeaderIzq}>
                <Ionicons name="storefront-outline" size={18} color={COLORES.primario} />
                <Text style={styles.seccionTitulo}>Mis Negocios</Text>
              </View>
              <TouchableOpacity onPress={abrirFormularioNegocio}>
                <Text style={styles.verTodo}>+ Registrar</Text>
              </TouchableOpacity>
            </View>

            {cargandoNegocios ? (
              <ActivityIndicator color={COLORES.primario} style={{ marginVertical: 20 }} />
            ) : misNegocios.length === 0 ? (
              <View style={styles.estadoVacio}>
                <Ionicons name="storefront-outline" size={42} color={COLORES.textoBorrado} />
                <Text style={styles.estadoVacioTitulo}>Aún no tienes negocios</Text>
                <Text style={styles.estadoVacioTexto}>
                  Registra tu negocio para comenzar a ofrecer promociones.
                </Text>
              </View>
            ) : (
              misNegocios.map((negocio) => {
                const imagenPortada = negocio.imagenes?.find((img) => img.es_portada) || negocio.imagenes?.find((img) => img.url);
                const uriImagen = imagenPortada?.url ? `${BASE_URL}${imagenPortada.url}` : null;

                const expandido = negocioExpandido === negocio.id;

                return (
                  <View key={negocio.id} style={styles.negocioCard}>
                    <TouchableOpacity
                      style={styles.negocioCardHeader}
                      onPress={() => setNegocioExpandido(expandido ? null : negocio.id)}
                      activeOpacity={0.7}
                    >
                      {uriImagen ? (
                        <Image source={{ uri: uriImagen }} style={styles.negocioCardImagen} />
                      ) : (
                        <View style={styles.negocioCardPlaceholder}>
                          <Ionicons name="image-outline" size={20} color={COLORES.textoBorrado} />
                        </View>
                      )}
                      <View style={styles.negocioCardInfo}>
                        <Text style={styles.negocioCardNombre} numberOfLines={1}>{negocio.nombre}</Text>
                        <Text style={styles.negocioCardCategoria}>{negocio.categoria?.nombre}</Text>
                        <View style={styles.negocioCardStatus}>
                          <Ionicons
                            name={negocio.verificado ? 'checkmark-circle' : 'time-outline'}
                            size={12}
                            color={negocio.verificado ? COLORES.exito : '#F59E0B'}
                          />
                          <Text style={[
                            styles.negocioCardStatusTexto,
                            { color: negocio.verificado ? COLORES.exito : '#F59E0B' }
                          ]}>
                            {negocio.verificado ? 'Verificado' : 'Pendiente de verificación'}
                          </Text>
                        </View>
                      </View>
                      <Ionicons
                        name={expandido ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={COLORES.textoBorrado}
                      />
                    </TouchableOpacity>

                    {expandido && (
                      <View style={styles.negocioCardExpandido}>
                        {negocio.descripcion && (
                          <Text style={styles.negocioCardDesc}>{negocio.descripcion}</Text>
                        )}
                        <View style={styles.negocioCardDetalles}>
                          {negocio.direccion && (
                            <View style={styles.negocioCardDetalle}>
                              <Ionicons name="location-outline" size={13} color={COLORES.textoBorrado} />
                              <Text style={styles.negocioCardDetalleTexto}>{negocio.direccion}</Text>
                            </View>
                          )}
                          {negocio.telefono && (
                            <View style={styles.negocioCardDetalle}>
                              <Ionicons name="call-outline" size={13} color={COLORES.textoBorrado} />
                              <Text style={styles.negocioCardDetalleTexto}>{negocio.telefono}</Text>
                            </View>
                          )}
                          {negocio.horario && (
                            <View style={styles.negocioCardDetalle}>
                              <Ionicons name="time-outline" size={13} color={COLORES.textoBorrado} />
                              <Text style={styles.negocioCardDetalleTexto}>{negocio.horario}</Text>
                            </View>
                          )}
                        </View>
                        <TouchableOpacity
                          style={styles.negocioCardEditar}
                          onPress={() => abrirEdicionNegocio(negocio)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="create-outline" size={15} color="#fff" />
                          <Text style={styles.negocioCardEditarTexto}>Editar negocio</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    <View style={styles.negocioCardAcciones}>
                      <TouchableOpacity
                        style={styles.negocioCardBoton}
                        onPress={() => router.push(`/negocio/detalleNegocio?id=${negocio.id}`)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="eye-outline" size={14} color={COLORES.primario} />
                        <Text style={styles.negocioCardBotonTexto}>Ver</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.negocioCardBoton}
                        onPress={() => router.push(`/negocio/promociones?id=${negocio.id}`)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="pricetag-outline" size={14} color={COLORES.primario} />
                        <Text style={styles.negocioCardBotonTexto}>Promos</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.negocioCardBoton, styles.negocioCardBotonPrimario]}
                        onPress={() => abrirFormularioPromo(negocio.id, negocio.nombre)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="add-circle-outline" size={14} color="#fff" />
                        <Text style={[styles.negocioCardBotonTexto, { color: '#fff' }]}>Nueva promo</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
        </View>
        )}

        <View style={styles.seccionGuardados}>
          <View style={styles.seccionHeader}>
            <View style={styles.seccionHeaderIzq}>
              <Ionicons name="bookmark-outline" size={18} color={COLORES.primario} />
              <Text style={styles.seccionTitulo}>Lugares Guardados</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/guardados')}>
              <Text style={styles.verTodo}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          {perfilVisible?.favoritos?.length ? (
            perfilVisible.favoritos.map((lugar) => (
              <FavoritoCard
                key={lugar.id}
                lugar={lugar}
                onPress={() => router.push(`/lugar/${lugar.id}`)}
              />
            ))
          ) : (
            <View style={styles.estadoVacio}>
              <Ionicons name="heart-dislike-outline" size={42} color={COLORES.textoBorrado} />
              <Text style={styles.estadoVacioTitulo}>Aún no tienes guardados</Text>
              <Text style={styles.estadoVacioTexto}>
                Explora lugares y marca tus favoritos para verlos aquí.
              </Text>
              <TouchableOpacity style={styles.estadoVacioBoton} onPress={() => router.push('/(tabs)/explorar')}>
                <Text style={styles.estadoVacioBotonTexto}>Explorar lugares</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.cerrarSesionFila} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color="#E53935" />
          <Text style={styles.cerrarSesionTexto}>Cerrar sesión</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      <Modal transparent visible={modalInteresVisible} animationType="fade" onRequestClose={() => setModalInteresVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>Agregar interés</Text>
            <Text style={styles.modalTexto}>Escribe una preferencia breve para guardarla en este perfil.</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej. Playa"
              placeholderTextColor={COLORES.textoBorrado}
              value={nuevoInteres}
              onChangeText={setNuevoInteres}
              autoCapitalize="words"
            />
            <View style={styles.modalAcciones}>
              <TouchableOpacity style={styles.modalBotonSecundario} onPress={() => setModalInteresVisible(false)}>
                <Text style={styles.modalBotonSecundarioTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBotonPrimario, guardandoInteres && { opacity: 0.7 }]}
                onPress={agregarInteres}
                disabled={guardandoInteres}
              >
                <Text style={styles.modalBotonPrimarioTexto}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={modalNegocioVisible} animationType="slide" onRequestClose={() => setModalNegocioVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalNegocioCard}>
            <View style={styles.modalNegocioHeader}>
              <Text style={styles.modalNegocioTitulo}>
                {editandoNegocioId ? 'Editar negocio' : 'Registrar negocio'}
              </Text>
              <TouchableOpacity onPress={() => setModalNegocioVisible(false)}>
                <Ionicons name="close" size={22} color={COLORES.textoBorrado} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalNegocioScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalNegocioLabel}>Nombre del negocio *</Text>
              <TextInput
                style={styles.modalNegocioInput}
                placeholder="Ej. Restaurante El Buen Sabor"
                placeholderTextColor={COLORES.textoBorrado}
                value={formNegocio.nombre}
                onChangeText={(t) => setFormNegocio({ ...formNegocio, nombre: t })}
              />

              <Text style={styles.modalNegocioLabel}>Descripción</Text>
              <TextInput
                style={[styles.modalNegocioInput, styles.modalNegocioInputAltura]}
                placeholder="Cuéntanos sobre tu negocio..."
                placeholderTextColor={COLORES.textoBorrado}
                value={formNegocio.descripcion}
                onChangeText={(t) => setFormNegocio({ ...formNegocio, descripcion: t })}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <Text style={styles.modalNegocioLabel}>Categoría *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriasScroll}>
                {categorias.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoriaChip,
                      formNegocio.categoria_id === String(cat.id) && styles.categoriaChipActivo,
                    ]}
                    onPress={() => setFormNegocio({ ...formNegocio, categoria_id: String(cat.id) })}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.categoriaChipTexto,
                        formNegocio.categoria_id === String(cat.id) && styles.categoriaChipTextoActivo,
                      ]}
                    >
                      {cat.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.modalNegocioLabel}>Dirección</Text>
              <TextInput
                style={styles.modalNegocioInput}
                placeholder="Ej. Vía España, Albrook"
                placeholderTextColor={COLORES.textoBorrado}
                value={formNegocio.direccion}
                onChangeText={(t) => setFormNegocio({ ...formNegocio, direccion: t })}
              />

              <View style={styles.modalNegocioFila}>
                <View style={styles.modalNegocioCampoMitad}>
                  <Text style={styles.modalNegocioLabel}>Teléfono</Text>
                  <TextInput
                    style={styles.modalNegocioInput}
                    placeholder="6030-1234"
                    placeholderTextColor={COLORES.textoBorrado}
                    value={formNegocio.telefono}
                    onChangeText={(t) => setFormNegocio({ ...formNegocio, telefono: t })}
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={styles.modalNegocioCampoMitad}>
                  <Text style={styles.modalNegocioLabel}>WhatsApp</Text>
                  <TextInput
                    style={styles.modalNegocioInput}
                    placeholder="6030-1234"
                    placeholderTextColor={COLORES.textoBorrado}
                    value={formNegocio.whatsapp}
                    onChangeText={(t) => setFormNegocio({ ...formNegocio, whatsapp: t })}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <Text style={styles.modalNegocioLabel}>Horario</Text>
              <TextInput
                style={styles.modalNegocioInput}
                placeholder="Ej. Lun-Dom 11:00-22:00"
                placeholderTextColor={COLORES.textoBorrado}
                value={formNegocio.horario}
                onChangeText={(t) => setFormNegocio({ ...formNegocio, horario: t })}
              />

              <Text style={styles.modalNegocioLabel}>Sitio web (opcional)</Text>
              <TextInput
                style={styles.modalNegocioInput}
                placeholder="https://..."
                placeholderTextColor={COLORES.textoBorrado}
                value={formNegocio.sitio_web}
                onChangeText={(t) => setFormNegocio({ ...formNegocio, sitio_web: t })}
                keyboardType="url"
                autoCapitalize="none"
              />

              <Text style={styles.modalNegocioLabel}>Imágenes del negocio (máx. 5)</Text>
              <View style={styles.imagenesGrid}>
                {imagenesExistentes.map((img) => (
                  <View key={`exist-${img.id ?? img.url}`} style={styles.imagenPreviewWrap}>
                    <Image source={{ uri: `${BASE_URL}${img.url}` }} style={styles.imagenPreview} />
                    <TouchableOpacity
                      style={styles.imagenEliminar}
                      onPress={() => eliminarImagenExistente(img.id)}
                    >
                      <Ionicons name="close-circle" size={20} color="#E53935" />
                    </TouchableOpacity>
                    {img.es_portada && (
                      <View style={styles.imagenPortadaBadge}>
                        <Text style={styles.imagenPortadaBadgeTexto}>Portada</Text>
                      </View>
                    )}
                  </View>
                ))}
                {imagenesSeleccionadas.map((uri, index) => (
                  <View key={uri} style={styles.imagenPreviewWrap}>
                    <Image source={{ uri }} style={styles.imagenPreview} />
                    <TouchableOpacity
                      style={styles.imagenEliminar}
                      onPress={() => eliminarImagen(uri)}
                    >
                      <Ionicons name="close-circle" size={20} color="#E53935" />
                    </TouchableOpacity>
                    {imagenesExistentes.length === 0 && index === 0 && (
                      <View style={styles.imagenPortadaBadge}>
                        <Text style={styles.imagenPortadaBadgeTexto}>Portada</Text>
                      </View>
                    )}
                  </View>
                ))}
                {(imagenesExistentes.length + imagenesSeleccionadas.length) < 5 && (
                  <TouchableOpacity style={styles.imagenAgregar} onPress={seleccionarImagen}>
                    <Ionicons name="camera-outline" size={28} color={COLORES.textoBorrado} />
                    <Text style={styles.imagenAgregarTexto}>Agregar</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.modalNegocioNota}>
                <Ionicons name="information-circle-outline" size={14} color={COLORES.textoBorrado} />
                <Text style={styles.modalNegocioNotaTexto}>
                  Tu ubicación actual se usará como ubicación del negocio. Podrás editarla después.
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalNegocioBoton, enviandoNegocio && { opacity: 0.7 }]}
              onPress={handleRegistrarNegocio}
              disabled={enviandoNegocio}
              activeOpacity={0.85}
            >
              {enviandoNegocio ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.modalNegocioBotonTexto}>
                  {editandoNegocioId ? 'Guardar cambios' : 'Solicitar registro'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={modalPromoVisible} animationType="slide" onRequestClose={() => setModalPromoVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalNegocioCard}>
            <View style={styles.modalNegocioHeader}>
              <Text style={styles.modalNegocioTitulo}>Nueva promoción</Text>
              <TouchableOpacity onPress={() => setModalPromoVisible(false)}>
                <Ionicons name="close" size={22} color={COLORES.textoBorrado} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalNegocioScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalNegocioLabel}>Negocio</Text>
              <View style={styles.modalNegocioInput}>
                <Text style={{ fontSize: 14, color: COLORES.texto }}>{promoNegocioNombre}</Text>
              </View>

              <Text style={styles.modalNegocioLabel}>Nombre de la promoción *</Text>
              <TextInput
                style={styles.modalNegocioInput}
                placeholder="Ej. 2x1 en cervezas"
                placeholderTextColor={COLORES.textoBorrado}
                value={formPromo.nombre}
                onChangeText={(t) => setFormPromo({ ...formPromo, nombre: t })}
              />

              <Text style={styles.modalNegocioLabel}>Descripción</Text>
              <TextInput
                style={[styles.modalNegocioInput, styles.modalNegocioInputAltura]}
                placeholder="Describe tu promoción..."
                placeholderTextColor={COLORES.textoBorrado}
                value={formPromo.descripcion}
                onChangeText={(t) => setFormPromo({ ...formPromo, descripcion: t })}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <View style={styles.modalNegocioFila}>
                <View style={styles.modalNegocioCampoMitad}>
                  <Text style={styles.modalNegocioLabel}>Precio</Text>
                  <TextInput
                    style={styles.modalNegocioInput}
                    placeholder="$0.00"
                    placeholderTextColor={COLORES.textoBorrado}
                    value={formPromo.precio}
                    onChangeText={(t) => setFormPromo({ ...formPromo, precio: t })}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.modalNegocioCampoMitad}>
                  <Text style={styles.modalNegocioLabel}>Válida hasta</Text>
                  <TextInput
                    style={styles.modalNegocioInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={COLORES.textoBorrado}
                    value={formPromo.fecha_validez}
                    onChangeText={(t) => setFormPromo({ ...formPromo, fecha_validez: t })}
                  />
                </View>
              </View>

              <Text style={styles.modalNegocioLabel}>Imagen de la promoción</Text>
              <View style={styles.imagenesGrid}>
                {imagenPromoUri && (
                  <View style={styles.imagenPreviewWrap}>
                    <Image source={{ uri: imagenPromoUri }} style={styles.imagenPreview} />
                    <TouchableOpacity
                      style={styles.imagenEliminar}
                      onPress={() => setImagenPromoUri(null)}
                    >
                      <Ionicons name="close-circle" size={22} color="#E74C3C" />
                    </TouchableOpacity>
                    <View style={styles.imagenPortadaBadge}>
                      <Text style={styles.imagenPortadaBadgeTexto}>Portada</Text>
                    </View>
                  </View>
                )}
                {imagenPromoUri === null && (
                  <TouchableOpacity
                    style={styles.imagenAgregar}
                    onPress={seleccionarImagenPromo}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="camera-outline" size={28} color={COLORES.textoBorrado} />
                    <Text style={styles.imagenAgregarTexto}>Agregar</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.modalNegocioNota}>
                <Ionicons name="information-circle-outline" size={14} color={COLORES.textoBorrado} />
                <Text style={styles.modalNegocioNotaTexto}>
                  Se generará un código QR automáticamente para esta promoción.
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalNegocioBoton, enviandoPromo && { opacity: 0.7 }]}
              onPress={handleCrearPromocion}
              disabled={enviandoPromo}
              activeOpacity={0.85}
            >
              {enviandoPromo ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.modalNegocioBotonTexto}>Crear promoción</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F4F6FB' },
  scrollContenido: { paddingBottom: 16 },
  sinSesionContenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  sinSesionTitulo: { fontSize: 22, fontWeight: '800', color: COLORES.texto },
  sinSesionTexto: { fontSize: 14, color: COLORES.textoBorrado, textAlign: 'center', lineHeight: 20 },
  botonPrimario: {
    backgroundColor: COLORES.primario,
    paddingVertical: 13,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  botonPrimarioTexto: { color: '#fff', fontSize: 15, fontWeight: '700' },
  botonSecundario: {
    borderWidth: 2,
    borderColor: COLORES.primario,
    paddingVertical: 13,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  botonSecundarioTexto: { color: COLORES.primario, fontSize: 15, fontWeight: '700' },
  hero: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarWrap: {
    marginBottom: 14,
    shadowColor: COLORES.primario,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarImg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarGradiente: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarIniciales: { color: '#fff', fontSize: 34, fontWeight: '800' },
  heroNombre: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1F36',
    marginBottom: 6,
  },
  heroUbicacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  heroUbicacionTexto: {
    fontSize: 13,
    color: COLORES.secundario,
    fontWeight: '500',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 18,
  },
  chip: {
    backgroundColor: '#EEF2F7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  chipTexto: { fontSize: 12, color: '#5F6B7C', fontWeight: '600' },
  botonEditar: {
    backgroundColor: COLORES.primario,
    paddingVertical: 11,
    paddingHorizontal: 36,
    borderRadius: 12,
  },
  botonEditarTexto: { color: '#fff', fontSize: 14, fontWeight: '700' },
  tarjeta: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tarjetaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  tarjetaTitulo: { fontSize: 15, fontWeight: '700', color: '#1A1F36' },
  interesesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chipInteres: {
    borderWidth: 1.5,
    borderColor: COLORES.secundario,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipInteresTexto: { fontSize: 12, color: COLORES.secundario, fontWeight: '600' },
  interesesVacio: { fontSize: 13, color: COLORES.textoBorrado },
  agregarIntereses: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  agregarInteresesTexto: { fontSize: 13, color: COLORES.secundario, fontWeight: '600' },
  menuFila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  menuIconoWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1A1F36' },
  separador: { height: StyleSheet.hairlineWidth, backgroundColor: '#F0F2F5' },
  cerrarSesionFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cerrarSesionTexto: { fontSize: 14, fontWeight: '700', color: '#E53935' },
  seccionGuardados: {
    marginHorizontal: 16,
  },
  seccionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  seccionHeaderIzq: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seccionTitulo: { fontSize: 15, fontWeight: '700', color: '#1A1F36' },
  verTodo: { fontSize: 13, color: COLORES.secundario, fontWeight: '600' },
  estadoVacio: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  estadoVacioTitulo: { fontSize: 15, fontWeight: '700', color: '#1A1F36' },
  estadoVacioTexto: { fontSize: 13, color: COLORES.textoBorrado, textAlign: 'center', lineHeight: 19 },
  estadoVacioBoton: {
    marginTop: 4,
    backgroundColor: COLORES.primario,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  estadoVacioBotonTexto: { color: '#fff', fontSize: 13, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17,24,39,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
  },
  modalTitulo: { fontSize: 18, fontWeight: '800', color: '#1A1F36', marginBottom: 6 },
  modalTexto: { fontSize: 13, color: COLORES.textoBorrado, lineHeight: 19, marginBottom: 14 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D9E2EC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORES.texto,
    marginBottom: 14,
  },
  modalAcciones: {
    flexDirection: 'row',
    gap: 10,
  },
  modalBotonSecundario: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D9E2EC',
    alignItems: 'center',
  },
  modalBotonSecundarioTexto: { fontSize: 14, fontWeight: '700', color: '#1A1F36' },
  modalBotonPrimario: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORES.primario,
    alignItems: 'center',
  },
  modalBotonPrimarioTexto: { fontSize: 14, fontWeight: '700', color: '#fff' },

  negocioSolicitar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 12,
  },
  negocioIconoWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  negocioInfo: {
    flex: 1,
  },
  negocioTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1F36',
  },
  negocioSubtitulo: {
    fontSize: 12,
    color: COLORES.textoBorrado,
    marginTop: 2,
  },

  modalNegocioCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  modalNegocioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalNegocioTitulo: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1F36',
  },
  modalNegocioScroll: {
    paddingHorizontal: 20,
  },
  modalNegocioLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1F36',
    marginBottom: 6,
    marginTop: 12,
  },
  modalNegocioInput: {
    borderWidth: 1,
    borderColor: '#D9E2EC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORES.texto,
    backgroundColor: '#F9FAFB',
  },
  modalNegocioInputAltura: {
    minHeight: 80,
  },
  modalNegocioFila: {
    flexDirection: 'row',
    gap: 12,
  },
  modalNegocioCampoMitad: {
    flex: 1,
  },
  categoriasScroll: {
    marginBottom: 4,
  },
  categoriaChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EEF2F7',
    marginRight: 8,
  },
  categoriaChipActivo: {
    backgroundColor: COLORES.primario,
  },
  categoriaChipTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5F6B7C',
  },
  categoriaChipTextoActivo: {
    color: '#fff',
  },
  modalNegocioNota: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
  },
  modalNegocioNotaTexto: {
    fontSize: 12,
    color: COLORES.textoBorrado,
    flex: 1,
    lineHeight: 17,
  },
  imagenesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
    marginBottom: 12,
  },
  imagenPreviewWrap: {
    position: 'relative',
    width: 90,
    height: 90,
  },
  imagenPreview: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },
  imagenEliminar: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  imagenPortadaBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: COLORES.primario,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  imagenPortadaBadgeTexto: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  imagenAgregar: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D9E2EC',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  imagenAgregarTexto: {
    fontSize: 11,
    color: COLORES.textoBorrado,
    fontWeight: '600',
  },
  modalNegocioBoton: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: COLORES.primario,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalNegocioBotonTexto: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  seccionMisNegocios: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  negocioCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  negocioCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  negocioCardImagen: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  negocioCardPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#EEF2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  negocioCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  negocioCardNombre: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1F36',
  },
  negocioCardCategoria: {
    fontSize: 12,
    color: COLORES.textoBorrado,
    marginTop: 2,
  },
  negocioCardStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  negocioCardStatusTexto: {
    fontSize: 11,
    fontWeight: '600',
  },
  negocioCardExpandido: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF0',
    marginBottom: 10,
  },
  negocioCardDesc: {
    fontSize: 12,
    color: COLORES.texto,
    lineHeight: 18,
    marginBottom: 8,
  },
  negocioCardDetalles: {
    gap: 4,
    marginBottom: 10,
  },
  negocioCardDetalle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  negocioCardDetalleTexto: {
    fontSize: 11,
    color: COLORES.textoBorrado,
  },
  negocioCardEditar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORES.primario,
    borderRadius: 10,
    paddingVertical: 10,
  },
  negocioCardEditarTexto: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  negocioCardAcciones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  negocioCardBoton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#EEF2F7',
  },
  negocioCardBotonPrimario: {
    backgroundColor: COLORES.primario,
  },
  negocioCardBotonTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORES.primario,
  },
  negocioPromosList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
  },
  negocioPromosTitulo: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORES.textoBorrado,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  negocioPromoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
  },
  negocioPromoIcono: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORES.primario,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  negocioPromoInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  negocioPromoNombre: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1F36',
    flex: 1,
  },
  negocioPromoPrecio: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORES.primario,
    marginLeft: 8,
  },
  negocioPromosMas: {
    fontSize: 12,
    color: COLORES.secundario,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
});