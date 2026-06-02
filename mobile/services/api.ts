import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/config';
import { useAuth } from '../context/AuthContext';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Interceptor para agregar token JWT
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Error al obtener token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Si es un error de autenticación (401)
    if (error.response?.status === 401) {
      try {
        // Limpiar sesión
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('usuario');
        
        // Redirigir a login (esto debería hacerse desde la app)
        console.log('Sesión expirada, redirigiendo a login');
      } catch (err) {
        console.error('Error al manejar error 401:', err);
      }
    }

    // Error de conexión
    if (!error.response) {
      return Promise.reject({
        message: 'Error de conexión. Verifica tu conexión a internet.',
      });
    }

    return Promise.reject(error);
  }
);

export default api;
