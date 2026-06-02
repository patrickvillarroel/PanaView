import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { COLORES, ESPACIADO, TAMAÑOS, BORDES } from '../../constants/config';

export default function PerfilScreen() {
  const { usuario, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  if (!isAuthenticated) {
    return (
      <ScrollView style={styles.contenedor} contentContainerStyle={styles.contenedorVacio}>
        <View style={styles.centrado}>
          <Ionicons name="person-circle" size={80} color={COLORES.primario} />
          <Text style={styles.tituloVacio}>Inicia sesión</Text>
          <Text style={styles.textoVacio}>
            Crea una cuenta o inicia sesión para acceder a tu perfil
          </Text>

          <TouchableOpacity
            style={styles.botonPrimario}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.botonTexto}>Iniciar Sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botonSecundario}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.botonSecundarioTexto}>Crear Cuenta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.contenedor}>
      <View style={styles.headerPerfil}>
        <View style={styles.avatarContainer}>
          {usuario?.foto_url ? (
            <Ionicons
              name="person-circle"
              size={80}
              color={COLORES.primario}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.letraInicial}>
                {usuario?.nombre.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.nombreUsuario}>{usuario?.nombre}</Text>
        <Text style={styles.emailUsuario}>{usuario?.email}</Text>
        <View style={styles.badgeRol}>
          <Text style={styles.rolTexto}>{usuario?.rol}</Text>
        </View>
      </View>

      <View style={styles.seccion}>
        <Text style={styles.tituloSeccion}>Opciones</Text>

        <TouchableOpacity style={styles.opcion}>
          <View style={styles.opcionIcono}>
            <Ionicons name="heart" size={20} color={COLORES.primario} />
          </View>
          <Text style={styles.opcionTexto}>Lugares Favoritos</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORES.textoBorrado} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.opcion}>
          <View style={styles.opcionIcono}>
            <Ionicons name="location-outline" size={20} color={COLORES.primario} />
          </View>
          <Text style={styles.opcionTexto}>Historial de Visitas</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORES.textoBorrado} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.opcion}>
          <View style={styles.opcionIcono}>
            <Ionicons name="star-outline" size={20} color={COLORES.primario} />
          </View>
          <Text style={styles.opcionTexto}>Mis Reseñas</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORES.textoBorrado} />
        </TouchableOpacity>
      </View>

      <View style={styles.seccion}>
        <Text style={styles.tituloSeccion}>Configuración</Text>

        <TouchableOpacity style={styles.opcion}>
          <View style={styles.opcionIcono}>
            <Ionicons name="settings-outline" size={20} color={COLORES.primario} />
          </View>
          <Text style={styles.opcionTexto}>Preferencias</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORES.textoBorrado} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.opcion}>
          <View style={styles.opcionIcono}>
            <Ionicons name="help-circle-outline" size={20} color={COLORES.primario} />
          </View>
          <Text style={styles.opcionTexto}>Ayuda y Soporte</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORES.textoBorrado} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.botonCerrarSesion}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={20} color={COLORES.error} />
        <Text style={styles.botonCerrarSesionTexto}>Cerrar Sesión</Text>
      </TouchableOpacity>

      <View style={{ height: ESPACIADO.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  contenedorVacio: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  centrado: {
    alignItems: 'center',
    paddingHorizontal: ESPACIADO.lg,
  },
  headerPerfil: {
    backgroundColor: COLORES.primario,
    paddingVertical: ESPACIADO.xxl,
    paddingHorizontal: ESPACIADO.lg,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: ESPACIADO.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORES.secundario,
    justifyContent: 'center',
    alignItems: 'center',
  },
  letraInicial: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORES.fondo,
  },
  nombreUsuario: {
    fontSize: TAMAÑOS.fontoPequenioGrande,
    fontWeight: '700',
    color: COLORES.fondo,
    marginBottom: ESPACIADO.xs,
  },
  emailUsuario: {
    fontSize: TAMAÑOS.fontoPequeno,
    color: COLORES.acento,
    marginBottom: ESPACIADO.md,
  },
  badgeRol: {
    backgroundColor: COLORES.secundario,
    paddingVertical: ESPACIADO.xs,
    paddingHorizontal: ESPACIADO.md,
    borderRadius: BORDES.circulo,
  },
  rolTexto: {
    color: COLORES.fondo,
    fontSize: TAMAÑOS.fontoPequeno,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  seccion: {
    paddingHorizontal: ESPACIADO.lg,
    paddingTop: ESPACIADO.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.acento,
  },
  tituloSeccion: {
    fontSize: TAMAÑOS.fontoMedio,
    fontWeight: '700',
    color: COLORES.texto,
    marginBottom: ESPACIADO.md,
  },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: ESPACIADO.md,
    paddingHorizontal: ESPACIADO.md,
    marginBottom: ESPACIADO.sm,
    backgroundColor: COLORES.fondoGris,
    borderRadius: BORDES.redondeado,
    gap: ESPACIADO.md,
  },
  opcionIcono: {
    width: 40,
    height: 40,
    borderRadius: BORDES.redondeado,
    backgroundColor: COLORES.acento,
    justifyContent: 'center',
    alignItems: 'center',
  },
  opcionTexto: {
    flex: 1,
    fontSize: TAMAÑOS.fontoNormal,
    fontWeight: '500',
    color: COLORES.texto,
  },
  botonCerrarSesion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: ESPACIADO.lg,
    marginVertical: ESPACIADO.lg,
    paddingVertical: ESPACIADO.md,
    paddingHorizontal: ESPACIADO.lg,
    borderRadius: BORDES.redondeado,
    borderWidth: 2,
    borderColor: COLORES.error,
    gap: ESPACIADO.md,
  },
  botonCerrarSesionTexto: {
    fontSize: TAMAÑOS.fontoMedio,
    fontWeight: '700',
    color: COLORES.error,
  },
  botonPrimario: {
    backgroundColor: COLORES.primario,
    paddingVertical: ESPACIADO.md,
    paddingHorizontal: ESPACIADO.xl,
    borderRadius: BORDES.redondeado,
    marginVertical: ESPACIADO.lg,
  },
  botonSecundario: {
    borderWidth: 2,
    borderColor: COLORES.primario,
    paddingVertical: ESPACIADO.md,
    paddingHorizontal: ESPACIADO.xl,
    borderRadius: BORDES.redondeado,
    marginVertical: ESPACIADO.sm,
  },
  botonTexto: {
    color: COLORES.fondo,
    fontSize: TAMAÑOS.fontoMedio,
    fontWeight: '700',
    textAlign: 'center',
  },
  botonSecundarioTexto: {
    color: COLORES.primario,
    fontSize: TAMAÑOS.fontoMedio,
    fontWeight: '700',
    textAlign: 'center',
  },
  tituloVacio: {
    fontSize: TAMAÑOS.fontoPequenioGrande,
    fontWeight: '700',
    color: COLORES.texto,
    marginVertical: ESPACIADO.lg,
  },
  textoVacio: {
    fontSize: TAMAÑOS.fontoNormal,
    color: COLORES.textoBorrado,
    textAlign: 'center',
    marginVertical: ESPACIADO.lg,
  },
});
