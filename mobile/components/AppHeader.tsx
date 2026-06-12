import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

interface AppHeaderProps {
  onMenuPress?: () => void;
}

export default function AppHeader({ onMenuPress }: AppHeaderProps) {
  const { usuario } = useAuth();
  const insets = useSafeAreaInsets();

  const iniciales = usuario?.nombre
    ? usuario.nombre
        .split(' ')
        .filter(Boolean)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  return (
    <View style={[styles.contenedor, { paddingTop: insets.top + 8 }]}>
      {/* Hamburger */}
      <TouchableOpacity
        style={styles.botonMenu}
        onPress={onMenuPress}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="menu" size={26} color="#202124" />
      </TouchableOpacity>

      {/* Título */}
      <Text style={styles.titulo}>PanaView</Text>

      {/* Avatar */}
      <View style={styles.avatarContenedor}>
        {usuario?.foto_url ? (
          <Image source={{ uri: usuario.foto_url }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarTexto}>{iniciales}</Text>
          </View>
        )}
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
  botonMenu: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: '#1F4E79',
    letterSpacing: -0.2,
  },
  avatarContenedor: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#D6E4F0',
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1F4E79',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#D6E4F0',
  },
  avatarTexto: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
