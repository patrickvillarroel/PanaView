// Configuración global de la aplicación
import { Platform } from 'react-native';

const getBaseUrl = (): string => {
  if (Platform.OS === 'android') {
    // Android emulator accede al host mediante 10.0.2.2
    return 'http://192.168.0.3:3000/api';
  }
  return 'http://localhost:3000';
};

const getApiUrl = (): string => `${getBaseUrl()}/api`;

export const BASE_URL = getBaseUrl();
export const API_URL = getApiUrl();
export const RADIO_DEFAULT = 500; // metros

export const COLORES = {
  primario: '#1F4E79',
  secundario: '#2E75B6',
  acento: '#D6E4F0',
  exito: '#1E6B3C',
  error: '#7B1818',
  texto: '#3D3D3D',
  fondo: '#FFFFFF',
  fondoGris: '#F2F2F2',
  textoBorrado: '#999999',
};

export const TAMAÑOS = {
  fontoPequeno: 12,
  fontoNormal: 14,
  fontoMedio: 16,
  fontoGrande: 18,
  fontoPequenioGrande: 20,
  fontoExtraGrande: 24,
};

export const ESPACIADO = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const BORDES = {
  redondeado: 8,
  redondeadoGrande: 12,
  redondeadoExtraGrande: 16,
  circulo: 9999,
};
