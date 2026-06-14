import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Linking,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Negocio } from '../types';
import { COLORES, TAMAÑOS, ESPACIADO, BORDES, BASE_URL } from '../constants/config';

interface TarjetaNegocioProps {
  negocio: Negocio;
  onPress?: () => void;
}

const TarjetaNegocio: React.FC<TarjetaNegocioProps> = ({ negocio, onPress }) => {
  const imagenPortada = negocio.imagenes?.find((img) => img.es_portada);
  const primeraImagen = negocio.imagenes?.[0];
  const uriImagen = imagenPortada?.url
    ? `${BASE_URL}${imagenPortada.url}`
    : primeraImagen?.url
      ? `${BASE_URL}${primeraImagen.url}`
      : null;

  const abrirWhatsApp = () => {
    if (negocio.whatsapp) {
      const numeroLimpio = negocio.whatsapp.replace(/\D/g, '');
      Linking.openURL(`whatsapp://send?phone=${numeroLimpio}`).catch(() => {
        Linking.openURL(`https://wa.me/${numeroLimpio}`);
      });
    }
  };

  return (
    <TouchableOpacity
      style={styles.tarjeta}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {uriImagen ? (
        <Image source={{ uri: uriImagen }} style={styles.imagen} resizeMode="cover" />
      ) : (
        <View style={styles.imagenPlaceholder}>
          <Ionicons name="business" size={32} color={COLORES.textoBorrado} />
        </View>
      )}

      <View style={styles.contenido}>
        <View style={styles.encabezado}>
          <View style={styles.infoContainer}>
            <Text style={styles.nombre} numberOfLines={1}>{negocio.nombre}</Text>
            <Text style={styles.categoria}>{negocio.categoria.nombre}</Text>
          </View>
          {negocio.verificado && (
            <Ionicons name="checkmark-circle" size={18} color={COLORES.secundario} />
          )}
        </View>

        <View style={styles.detalles}>
          {negocio.distancia_metros != null && (
            <View style={styles.detalle}>
              <Ionicons name="location-outline" size={14} color={COLORES.textoBorrado} />
              <Text style={styles.detalleTexto}>
                {negocio.distancia_metros < 1000
                  ? `${Math.round(negocio.distancia_metros)} m`
                  : `${(negocio.distancia_metros / 1000).toFixed(1)} km`}
              </Text>
            </View>
          )}
          {negocio.horario && (
            <View style={styles.detalle}>
              <Ionicons name="time-outline" size={14} color={COLORES.textoBorrado} />
              <Text style={styles.detalleTexto} numberOfLines={1}>{negocio.horario}</Text>
            </View>
          )}
        </View>

        {negocio.whatsapp && (
          <TouchableOpacity style={styles.botonWhatsApp} onPress={abrirWhatsApp}>
            <Ionicons name="logo-whatsapp" size={15} color="white" />
            <Text style={styles.botonWhatsAppTexto}>WhatsApp</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: COLORES.fondo,
    borderRadius: BORDES.redondeadoGrande,
    marginBottom: ESPACIADO.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  imagen: {
    width: '100%',
    height: 140,
  },
  imagenPlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: COLORES.fondoGris,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contenido: {
    padding: ESPACIADO.md,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIADO.sm,
    marginBottom: ESPACIADO.sm,
  },
  infoContainer: {
    flex: 1,
  },
  nombre: {
    fontSize: TAMAÑOS.fontoMedio,
    fontWeight: '700',
    color: COLORES.texto,
  },
  categoria: {
    fontSize: TAMAÑOS.fontoPequeno,
    color: COLORES.secundario,
    fontWeight: '500',
  },
  detalles: {
    marginBottom: ESPACIADO.sm,
    gap: 4,
  },
  detalle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detalleTexto: {
    fontSize: TAMAÑOS.fontoPequeno,
    color: COLORES.textoBorrado,
    flex: 1,
  },
  botonWhatsApp: {
    flexDirection: 'row',
    backgroundColor: '#25D366',
    paddingVertical: ESPACIADO.sm,
    paddingHorizontal: ESPACIADO.md,
    borderRadius: BORDES.redondeado,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  botonWhatsAppTexto: {
    color: 'white',
    fontSize: TAMAÑOS.fontoPequeno,
    fontWeight: '600',
  },
});

export default TarjetaNegocio;
