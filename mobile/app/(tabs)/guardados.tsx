import React, { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORES } from '../../constants/config';
import LoadingOverlay from '../../components/LoadingOverlay';
import FavoritoCard from '../../components/FavoritoCard';
import authService from '../../services/authService';
import { UsuarioPerfil } from '../../types';

function SinSesion() {
  const router = useRouter();

  return (
    <View style={styles.estadoVacioContenedor}>
      <Ionicons name="heart-outline" size={70} color={COLORES.acento} />
      <Text style={styles.titulo}>Guardados</Text>
      <Text style={styles.subtitulo}>Inicia sesión para ver tus lugares favoritos.</Text>
      <TouchableOpacity style={styles.boton} onPress={() => router.push('/login')}>
        <Text style={styles.botonTexto}>Iniciar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function GuardadosScreen() {
  const { isAuthenticated, logout, setUsuario } = useAuth();
  const router = useRouter();

  const [perfil, setPerfil] = useState<UsuarioPerfil | null>(null);
  const [cargando, setCargando] = useState(false);
  const [refrescando, setRefrescando] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setPerfil(null);
      return;
    }

    void cargarGuardados();
  }, [isAuthenticated]);

  const cargarGuardados = async (pullToRefresh = false) => {
    try {
      if (pullToRefresh) {
        setRefrescando(true);
      } else {
        setCargando(true);
      }

      const data = await authService.getMe();
      setPerfil(data);

      setUsuario({
        id: data.id,
        nombre: data.nombre,
        email: data.email,
        rol: data.rol,
        foto_url: data.foto_url,
      });
    } catch (error: any) {
      if (error.status === 401) {
        return;
      }

      Alert.alert('Error', error.message || 'No se pudieron cargar tus guardados');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  if (!isAuthenticated) return <SinSesion />;

  if (cargando && !perfil) {
    return <LoadingOverlay visible mensaje="Cargando guardados..." />;
  }

  const favoritos = perfil?.favoritos ?? [];

  return (
    <ScrollView
      style={styles.contenedor}
      contentContainerStyle={styles.contenido}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => cargarGuardados(true)} />}
    >
      <View style={styles.header}>
        <Text style={styles.titulo}>Guardados</Text>
        <Text style={styles.subtitulo}>Tus lugares favoritos sincronizados con tu cuenta.</Text>
      </View>

      {favoritos.length ? (
        favoritos.map((lugar) => (
          <FavoritoCard
            key={lugar.id}
            lugar={lugar}
            onPress={() => router.push(`/lugar/${lugar.id}`)}
          />
        ))
      ) : (
        <View style={styles.estadoVacioContenedor}>
          <Ionicons name="bookmark-outline" size={70} color={COLORES.acento} />
          <Text style={styles.titulo}>Sin guardados todavía</Text>
          <Text style={styles.subtitulo}>Explora lugares y usa el corazón para agregarlos aquí.</Text>
          <TouchableOpacity style={styles.boton} onPress={() => router.push('/(tabs)/explorar')}>
            <Text style={styles.botonTexto}>Explorar lugares</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#F4F6FB',
  },
  contenido: {
    padding: 16,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 12,
  },
  titulo: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1F36',
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 13,
    color: COLORES.textoBorrado,
    lineHeight: 19,
  },
  estadoVacioContenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 44,
  },
  boton: {
    backgroundColor: COLORES.primario,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 6,
  },
  botonTexto: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});