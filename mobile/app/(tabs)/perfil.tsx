import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { COLORES } from '../../constants/config';

// ─── Datos placeholder ───────────────────────────────────────────────────────

const INTERESES = ['Historia', 'Gastronomía', 'Naturaleza', 'Arquitectura'];

const LUGARES_GUARDADOS = [
  {
    id: '1',
    nombre: 'Casco Viejo',
    categoria: 'Distrito Histórico',
    colores: ['#E8A838', '#C97B1A'] as [string, string],
  },
  {
    id: '2',
    nombre: 'Esclusas de Miraflores',
    categoria: 'Canal de Panamá',
    colores: ['#2196F3', '#1565C0'] as [string, string],
  },
];

const ETIQUETAS_ROL: Record<string, string[]> = {
  turista:  ['Explorador local', 'Viajero'],
  negocio:  ['Propietario', 'Negocio local'],
  admin:    ['Administrador'],
};

const MENU_OPCIONES = [
  { icono: 'settings-outline'      as const, label: 'Configuración de cuenta' },
  { icono: 'notifications-outline' as const, label: 'Notificaciones' },
  { icono: 'shield-checkmark-outline' as const, label: 'Privacidad y seguridad' },
];

// ─── Pantalla sin sesión ─────────────────────────────────────────────────────

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

// ─── Pantalla principal ──────────────────────────────────────────────────────

export default function PerfilScreen() {
  const { usuario, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  if (!isAuthenticated) return <SinSesion />;

  const iniciales = usuario?.nombre
    ? usuario.nombre.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const etiquetas = ETIQUETAS_ROL[usuario?.rol ?? 'turista'] ?? [];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContenido} showsVerticalScrollIndicator={false}>

      {/* ── Hero / Datos del usuario ─────────────────────────────── */}
      <View style={styles.hero}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          {usuario?.foto_url ? (
            <Image source={{ uri: usuario.foto_url }} style={styles.avatarImg} />
          ) : (
            <LinearGradient
              colors={[COLORES.secundario, COLORES.primario]}
              style={styles.avatarGradiente}
            >
              <Text style={styles.avatarIniciales}>{iniciales}</Text>
            </LinearGradient>
          )}
        </View>

        {/* Nombre */}
        <Text style={styles.heroNombre}>{usuario?.nombre ?? 'Usuario'}</Text>

        {/* Ubicación */}
        <View style={styles.heroUbicacion}>
          <Ionicons name="location-sharp" size={13} color={COLORES.secundario} />
          <Text style={styles.heroUbicacionTexto}>Con base en Ciudad de Panamá</Text>
        </View>

        {/* Chips de rol */}
        <View style={styles.chipsWrap}>
          {etiquetas.map((tag) => (
            <View key={tag} style={styles.chip}>
              <Text style={styles.chipTexto}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Botón editar */}
        <TouchableOpacity style={styles.botonEditar} activeOpacity={0.8}>
          <Text style={styles.botonEditarTexto}>Editar perfil</Text>
        </TouchableOpacity>
      </View>

      {/* ── Preferencias de viaje ────────────────────────────────── */}
      <View style={styles.tarjeta}>
        <View style={styles.tarjetaHeader}>
          <Ionicons name="options-outline" size={18} color={COLORES.primario} />
          <Text style={styles.tarjetaTitulo}>Preferencias de viaje</Text>
        </View>
        <View style={styles.interesesWrap}>
          {INTERESES.map((interes) => (
            <View key={interes} style={styles.chipInteres}>
              <Text style={styles.chipInteresTexto}>{interes}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.agregarIntereses}>
          <Ionicons name="add-circle-outline" size={16} color={COLORES.secundario} />
          <Text style={styles.agregarInteresesTexto}>Agregar intereses</Text>
        </TouchableOpacity>
      </View>

      {/* ── Menú de configuración ────────────────────────────────── */}
      <View style={styles.tarjeta}>
        {MENU_OPCIONES.map((opcion, i) => (
          <React.Fragment key={opcion.label}>
            <TouchableOpacity style={styles.menuFila} activeOpacity={0.7}>
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

      {/* Cerrar sesión */}
      <TouchableOpacity style={styles.cerrarSesionFila} onPress={handleLogout} activeOpacity={0.7}>
        <Ionicons name="log-out-outline" size={20} color="#E53935" />
        <Text style={styles.cerrarSesionTexto}>Cerrar sesión</Text>
      </TouchableOpacity>

      {/* ── Lugares Guardados ────────────────────────────────────── */}
      <View style={styles.seccionGuardados}>
        <View style={styles.seccionHeader}>
          <View style={styles.seccionHeaderIzq}>
            <Ionicons name="bookmark-outline" size={18} color={COLORES.primario} />
            <Text style={styles.seccionTitulo}>Lugares Guardados</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.verTodo}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {LUGARES_GUARDADOS.map((lugar) => (
          <TouchableOpacity key={lugar.id} style={styles.cardLugar} activeOpacity={0.85}>
            <LinearGradient colors={lugar.colores} style={styles.cardImagen}>
              <TouchableOpacity style={styles.cardCorazon}>
                <Ionicons name="heart" size={16} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>
            <View style={styles.cardInfo}>
              <Text style={styles.cardNombre}>{lugar.nombre}</Text>
              <View style={styles.cardCategoria}>
                <Ionicons name="location-outline" size={12} color={COLORES.textoBorrado} />
                <Text style={styles.cardCategoriaTexto}>{lugar.categoria}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Scroll
  scroll: { flex: 1, backgroundColor: '#F4F6FB' },
  scrollContenido: { paddingBottom: 16 },

  // ── Sin sesión
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

  // ── Hero
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

  // ── Tarjeta genérica
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

  // Intereses
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
  },
  chipInteresTexto: { fontSize: 12, color: COLORES.secundario, fontWeight: '600' },
  agregarIntereses: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  agregarInteresesTexto: { fontSize: 13, color: COLORES.secundario, fontWeight: '600' },

  // ── Menú
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

  // Cerrar sesión
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

  // ── Lugares Guardados
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

  cardLugar: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImagen: {
    height: 130,
    alignItems: 'flex-end',
    padding: 10,
  },
  cardCorazon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    padding: 12,
  },
  cardNombre: { fontSize: 15, fontWeight: '800', color: '#1A1F36', marginBottom: 4 },
  cardCategoria: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardCategoriaTexto: { fontSize: 12, color: COLORES.textoBorrado },
});
