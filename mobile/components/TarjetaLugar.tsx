import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Lugar } from '../types';
import { COLORES, TAMAÑOS, ESPACIADO, BORDES } from '../constants/config';
import StarRating from './StarRating';

interface TarjetaLugarProps {
  lugar: Lugar;
  onPress: () => void;
}

const TarjetaLugar: React.FC<TarjetaLugarProps> = ({ lugar, onPress }) => {
  const imagenPortada = lugar.imagenes?.find((img) => img.es_portada)?.url;

  return (
    <TouchableOpacity style={styles.tarjeta} onPress={onPress} activeOpacity={0.7}>
      {imagenPortada && (
        <Image source={{ uri: imagenPortada }} style={styles.imagen} />
      )}
      
      <View style={styles.contenido}>
        <View style={styles.encabezado}>
          <View style={styles.tituloContainer}>
            <Text style={styles.nombre} numberOfLines={2}>
              {lugar.nombre}
            </Text>
            <View style={styles.categoria}>
              <Ionicons
                name="bookmark"
                size={12}
                color={COLORES.secundario}
              />
              <Text style={styles.categoriaNombre}>
                {lugar.categoria.nombre}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.distancia}>
            <Ionicons name="location" size={14} color={COLORES.textoBorrado} />
            <Text style={styles.distanciaTexto}>
              {lugar.distancia_metros
                ? lugar.distancia_metros < 1000
                  ? `${lugar.distancia_metros} m`
                  : `${(lugar.distancia_metros / 1000).toFixed(2)} km`
                : 'N/A'}
            </Text>
          </View>

          {lugar.calificacion_promedio !== undefined && (
            <View style={styles.calificacion}>
              <StarRating
                value={lugar.calificacion_promedio}
                readonly
              />
              <Text style={styles.calificacionTexto}>
                {lugar.calificacion_promedio.toFixed(1)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: COLORES.fondo,
    borderRadius: BORDES.redondeadoGrande,
    overflow: 'hidden',
    marginBottom: ESPACIADO.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  imagen: {
    width: '100%',
    height: 150,
    backgroundColor: COLORES.fondoGris,
  },
  contenido: {
    padding: ESPACIADO.md,
  },
  encabezado: {
    marginBottom: ESPACIADO.sm,
  },
  tituloContainer: {
    flex: 1,
  },
  nombre: {
    fontSize: TAMAÑOS.fontoMedio,
    fontWeight: '700',
    color: COLORES.texto,
    marginBottom: ESPACIADO.xs,
  },
  categoria: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIADO.xs,
  },
  categoriaNombre: {
    fontSize: TAMAÑOS.fontoPequeno,
    color: COLORES.secundario,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distancia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIADO.xs,
  },
  distanciaTexto: {
    fontSize: TAMAÑOS.fontoPequeno,
    color: COLORES.textoBorrado,
  },
  calificacion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIADO.xs,
  },
  calificacionTexto: {
    fontSize: TAMAÑOS.fontoPequeno,
    fontWeight: '600',
    color: COLORES.texto,
  },
});

export default TarjetaLugar;
