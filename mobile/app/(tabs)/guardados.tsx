import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORES } from '../../constants/config';

export default function GuardadosScreen() {
  return (
    <View style={styles.contenedor}>
      <Ionicons name="heart-outline" size={64} color={COLORES.acento} />
      <Text style={styles.titulo}>Guardados</Text>
      <Text style={styles.subtitulo}>Próximamente</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORES.primario,
  },
  subtitulo: {
    fontSize: 14,
    color: COLORES.textoBorrado,
  },
});
