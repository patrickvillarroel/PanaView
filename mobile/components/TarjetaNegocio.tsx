import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Negocio } from '../types';
import { COLORES, TAMAÑOS, ESPACIADO, BORDES } from '../constants/config';

interface TarjetaNegocioProps {
  negocio: Negocio;
  onPress?: () => void;
}

const TarjetaNegocio: React.FC<TarjetaNegocioProps> = ({ negocio, onPress }) => {
  const abrirWhatsApp = () => {
    if (negocio.whatsapp) {
      const numeroLimpio = negocio.whatsapp.replace(/\D/g, '');
      Linking.openURL(`whatsapp://send?phone=${numeroLimpio}`).catch(() => {
        Linking.openURL(
          `https://wa.me/${numeroLimpio}`
        );
      });
    }
  };

  return (
    <TouchableOpacity
      style={styles.tarjeta}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.encabezado}>
        <View style={styles.iconoContainer}>
          <Ionicons
            name="business"
            size={24}
            color={COLORES.primario}
          />
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.nombre}>{negocio.nombre}</Text>
          <Text style={styles.categoria}>{negocio.categoria.nombre}</Text>
        </View>
      </View>

      <View style={styles.detalles}>
        {negocio.distancia_metros && (
          <View style={styles.detalle}>
            <Ionicons
              name="location-outline"
              size={14}
              color={COLORES.textoBorrado}
            />
            <Text style={styles.detalleTexto}>
              {negocio.distancia_metros < 1000
                ? `${negocio.distancia_metros} m`
                : `${(negocio.distancia_metros / 1000).toFixed(2)} km`}
            </Text>
          </View>
        )}

        {negocio.horario && (
          <View style={styles.detalle}>
            <Ionicons
              name="time-outline"
              size={14}
              color={COLORES.textoBorrado}
            />
            <Text style={styles.detalleTexto} numberOfLines={1}>
              {negocio.horario}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {negocio.telefono && (
          <View style={styles.contactoIcono}>
            <Ionicons
              name="call-outline"
              size={16}
              color={COLORES.primario}
            />
          </View>
        )}

        {negocio.whatsapp && (
          <TouchableOpacity
            style={styles.botonWhatsApp}
            onPress={abrirWhatsApp}
          >
            <Ionicons
              name="logo-whatsapp"
              size={16}
              color="white"
            />
            <Text style={styles.botonTexto}>WhatsApp</Text>
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
    padding: ESPACIADO.md,
    marginBottom: ESPACIADO.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ESPACIADO.md,
    gap: ESPACIADO.md,
  },
  iconoContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDES.redondeado,
    backgroundColor: COLORES.acento,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  nombre: {
    fontSize: TAMAÑOS.fontoMedio,
    fontWeight: '700',
    color: COLORES.texto,
    marginBottom: ESPACIADO.xs,
  },
  categoria: {
    fontSize: TAMAÑOS.fontoPequeno,
    color: COLORES.secundario,
    fontWeight: '500',
  },
  detalles: {
    marginBottom: ESPACIADO.md,
    gap: ESPACIADO.sm,
  },
  detalle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIADO.xs,
  },
  detalleTexto: {
    fontSize: TAMAÑOS.fontoPequeno,
    color: COLORES.textoBorrado,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIADO.md,
  },
  contactoIcono: {
    width: 36,
    height: 36,
    borderRadius: BORDES.redondeado,
    backgroundColor: COLORES.acento,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonWhatsApp: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#25D366',
    paddingVertical: ESPACIADO.sm,
    paddingHorizontal: ESPACIADO.md,
    borderRadius: BORDES.redondeado,
    justifyContent: 'center',
    alignItems: 'center',
    gap: ESPACIADO.xs,
  },
  botonTexto: {
    color: 'white',
    fontSize: TAMAÑOS.fontoPequeno,
    fontWeight: '600',
  },
});

export default TarjetaNegocio;
