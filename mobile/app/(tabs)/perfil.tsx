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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { COLORES } from '../../constants/config';
import LoadingOverlay from '../../components/LoadingOverlay';
import FavoritoCard from '../../components/FavoritoCard';
import authService from '../../services/authService';
import { UsuarioPerfil } from '../../types';

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

  const perfilVisible: UsuarioPerfil | null = perfil ?? (usuario ? { ...usuario, favoritos: [] } : null);
  const iniciales = perfilVisible?.nombre
    ? perfilVisible.nombre.split(' ').map((parte) => parte[0]).join('').slice(0, 2).toUpperCase()
    : '?';
  const etiquetas = ETIQUETAS_ROL[perfilVisible?.rol ?? 'turista'] ?? [];

  useEffect(() => {
    if (!isAuthenticated) {
      setPerfil(null);
      setIntereses([]);
      return;
    }

    void cargarPerfil();
  }, [isAuthenticated]);

  useEffect(() => {
    if (perfilVisible?.id) {
      void cargarIntereses(perfilVisible.id);
    }
  }, [perfilVisible?.id]);

  const cargarPerfil = async (pullToRefresh = false) => {
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

      Alert.alert('Error', error.message || 'No se pudo cargar el perfil');
    } finally {
      setCargandoPerfil(false);
      setRefrescando(false);
    }
  };

  const cargarIntereses = async (usuarioId: string) => {
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
  };

  const guardarIntereses = async (siguientesIntereses: string[]) => {
    if (!perfilVisible?.id) return;
    await AsyncStorage.setItem(
      `${INTERESES_STORAGE_PREFIX}${perfilVisible.id}`,
      JSON.stringify(siguientesIntereses)
    );
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const abrirModalIntereses = () => {
    setNuevoInteres('');
    setModalInteresVisible(true);
  };

  const agregarInteres = async () => {
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
  };

  const eliminarInteres = async (interesAEliminar: string) => {
    const siguientes = intereses.filter((interes) => interes !== interesAEliminar);
    setIntereses(siguientes);
    await guardarIntereses(siguientes);
  };

  const irAConfiguracion = (action: string) => {
    if (action === 'editar') {
      router.push('/perfil/editar');
      return;
    }

    router.push('/perfil/configuracion');
  };

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

        <TouchableOpacity style={styles.cerrarSesionFila} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color="#E53935" />
          <Text style={styles.cerrarSesionTexto}>Cerrar sesión</Text>
        </TouchableOpacity>

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
    marginBottom: 12,
    paddingVertical: 14,
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
});