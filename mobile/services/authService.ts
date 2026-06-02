import api from './api';
import { AuthResponse, Usuario } from '../types';

interface RegisterPayload {
  nombre: string;
  email: string;
  password: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

class AuthService {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/register', payload);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Error en el registro'
      );
    }
  }

  async login(payload: LoginPayload): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/login', payload);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Credenciales inválidas'
      );
    }
  }
}

export default new AuthService();
