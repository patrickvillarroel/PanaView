import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORES, ESPACIADO } from '../constants/config';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: number;
}

const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  readonly = false,
  size = 16,
}) => {
  const estrellas = [1, 2, 3, 4, 5];

  const manejarPress = (numEstrellas: number) => {
    if (!readonly && onChange) {
      onChange(numEstrellas);
    }
  };

  return (
    <View style={styles.contenedor}>
      {estrellas.map((num) => (
        <TouchableOpacity
          key={num}
          onPress={() => manejarPress(num)}
          disabled={readonly}
          activeOpacity={readonly ? 1 : 0.7}
        >
          <Ionicons
            name={num <= value ? 'star' : 'star-outline'}
            size={size}
            color={COLORES.exito}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    gap: ESPACIADO.xs,
  },
});

export default StarRating;
