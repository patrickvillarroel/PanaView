import { useCallback } from 'react';
import { useAuth as useAuthContext } from '../context/AuthContext';
import authService from '../services/authService';
import { Usuario } from '../types';

interface UseAuthReturn {
  usuario: Usuario | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (nombre: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const { usuario, token, loading, isAuthenticated, login: contextLogin, logout: contextLogout } = useAuthContext();

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      await contextLogin(response.token, response.usuario);
    } catch (error) {
      throw error;
    }
  }, [contextLogin]);

  const register = useCallback(async (nombre: string, email: string, password: string) => {
    try {
      const response = await authService.register({ nombre, email, password });
      await contextLogin(response.token, response.usuario);
    } catch (error) {
      throw error;
    }
  }, [contextLogin]);

  const logout = useCallback(async () => {
    await contextLogout();
  }, [contextLogout]);

  return {
    usuario,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
  };
}
