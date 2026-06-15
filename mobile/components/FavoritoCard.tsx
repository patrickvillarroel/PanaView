import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LugarFavoritoResumen, NegocioFavoritoResumen } from '../types';
import { COLORES } from '../constants/config';

interface FavoritoCardProps {
  lugar: LugarFavoritoResumen | NegocioFavoritoResumen;
  onPress: () => void;
}

export default function FavoritoCard({ lugar, onPress }: FavoritoCardProps) {
  const iniciales = lugar.nombre
    .split(' ')
    .map((parte) => parte[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const categoria = lugar.categoria?.nombre ?? 'Lugar guardado';
  const ubicacion = lugar.direccion || lugar.provincia || categoria;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      {lugar.imagen_portada ? (
        <Image source={{ uri: lugar.imagen_portada }} style={styles.imagen} />
      ) : (
        <LinearGradient
          colors={[COLORES.secundario, COLORES.primario]}
          style={styles.imagen}
        >
          <View style={styles.placeholderCircle}>
            <Text style={styles.placeholderTexto}>{iniciales || 'PR'}</Text>
          </View>
        </LinearGradient>
      )}

      <View style={styles.contenido}>
        <Text style={styles.nombre} numberOfLines={2}>
          {lugar.nombre}
        </Text>
        <View style={styles.categoriaFila}>
          <Ionicons name="location-outline" size={12} color={COLORES.textoBorrado} />
          <Text style={styles.categoriaTexto} numberOfLines={1}>
            {ubicacion}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
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
  imagen: {
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  placeholderTexto: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  contenido: {
    padding: 12,
  },
  nombre: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1F36',
    marginBottom: 4,
  },
  categoriaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoriaTexto: {
    fontSize: 12,
    color: COLORES.textoBorrado,
    flex: 1,
  },
});