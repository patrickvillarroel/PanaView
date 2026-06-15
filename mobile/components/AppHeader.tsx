import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

const IMAGEN_ROL: Record<string, ReturnType<typeof require>> = {
  turista: require('../assets/turista.png'),
  negocio: require('../assets/propetario.png'),
  admin:   require('../assets/admin.png'),
};

export default function AppHeader() {
  const { usuario } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const rolImagen = IMAGEN_ROL[usuario?.rol ?? 'turista'] ?? IMAGEN_ROL.turista;

  return (
    <View style={[styles.contenedor, { paddingTop: insets.top + 8 }]}>
      {/* Espaciador izquierdo para centrar el título */}
      <View style={styles.lado} />

      {/* Título centrado */}
      <Text style={styles.titulo}>PanaView</Text>

      {/* Avatar → navega al perfil */}
      <View style={styles.lado}>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/perfil')}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {usuario?.foto_url ? (
            <Image source={{ uri: usuario.foto_url }} style={styles.avatarImg} />
          ) : (
            <Image source={rolImagen} style={styles.avatarImg} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8EAED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 3,
  },
  lado: {
    width: 40,
    alignItems: 'flex-end',
  },
  titulo: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: '#1F4E79',
    letterSpacing: -0.2,
  },
  avatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#D6E4F0',
  },
});
