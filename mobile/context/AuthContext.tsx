import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Usuario, AuthResponse } from '../types';
import * as SecureStore from 'expo-secure-store';

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (token: string, usuario: Usuario) => Promise<void>;
  logout: () => Promise<void>;
  setUsuario: (usuario: Usuario | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restaurar sesión al iniciar la app
  useEffect(() => {
    bootstrapAsync();
  }, []);

  async function bootstrapAsync() {
    try {
      // Intentar restaurar el token guardado
      const savedToken = await AsyncStorage.getItem('authToken');
      
      if (savedToken) {
        // Validar que el token no haya expirado
        const tokenData = JSON.parse(
          atob(savedToken.split('.')[1])
        );
        
        const expirationTime = tokenData.exp * 1000;
        const currentTime = Date.now();
        
        if (expirationTime > currentTime) {
          // Token válido, restaurar sesión
          setToken(savedToken);
          const savedUsuario = await AsyncStorage.getItem('usuario');
          if (savedUsuario) {
            setUsuario(JSON.parse(savedUsuario));
          }
        } else {
          // Token expirado, limpiar
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('usuario');
        }
      }
    } catch (error) {
      console.warn('Error al restaurar sesión:', error);
    } finally {
      setLoading(false);
    }
  }

  async function login(newToken: string, newUsuario: Usuario) {
    try {
      // Guardar token y usuario
      await AsyncStorage.setItem('authToken', newToken);
      await AsyncStorage.setItem('usuario', JSON.stringify(newUsuario));
      
      setToken(newToken);
      setUsuario(newUsuario);
    } catch (error) {
      console.error('Error al guardar sesión:', error);
      throw error;
    }
  }

  async function logout() {
    try {
      // Limpiar almacenamiento
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('usuario');
      
      setToken(null);
      setUsuario(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  }

  const value = {
    usuario,
    token,
    loading,
    isAuthenticated: !!token && !!usuario,
    login,
    logout,
    setUsuario,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook para usar el contexto de autenticación
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
