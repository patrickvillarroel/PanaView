import React from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Modal,
} from 'react-native';
import { COLORES, ESPACIADO } from '../constants/config';

interface LoadingOverlayProps {
  visible: boolean;
  mensaje?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  mensaje = 'Cargando...',
}) => {
  return (
    <Modal visible={visible} transparent statusBarTranslucent>
      <View style={styles.contenedor}>
        <View style={styles.cuadro}>
          <ActivityIndicator
            size="large"
            color={COLORES.primario}
          />
          <Text style={styles.texto}>{mensaje}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  cuadro: {
    backgroundColor: COLORES.fondo,
    padding: ESPACIADO.xl,
    borderRadius: 12,
    alignItems: 'center',
    gap: ESPACIADO.md,
  },
  texto: {
    fontSize: 16,
    color: COLORES.texto,
    fontWeight: '500',
  },
});

export default LoadingOverlay;
