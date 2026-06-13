import api from './api';
import { AuthResponse, UsuarioPerfil } from '../types';

interface RegisterPayload {
  nombre: string;
  email: string;
  password: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface UpdateProfilePayload {
  nombre?: string;
  foto_url?: string | null;
}

class AuthService {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    try {
      const response = await api.post<{ data: AuthResponse }>('/auth/register', payload);

      if (!response.data?.data) {
        throw new Error('Respuesta inválida del servidor');
      }

      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error en el registro';
      const authError = new Error(message) as Error & { status?: number };
      authError.status = error.response?.status;
      throw authError;
    }
  }

  async login(payload: LoginPayload): Promise<AuthResponse> {
    try {
      const response = await api.post<{ data: AuthResponse }>('/auth/login', payload);

      if (!response.data?.data) {
        throw new Error('Respuesta inválida del servidor');
      }

      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Credenciales inválidas';
      const authError = new Error(message) as Error & { status?: number };
      authError.status = error.response?.status;
      throw authError;
    }
  }

    async getMe(): Promise<UsuarioPerfil> {
      try {
        const response = await api.get<{ data: UsuarioPerfil }>('/auth/me');
        if (!response.data?.data) {
          throw new Error('No se pudo obtener el perfil');
        }
        return response.data.data;
      } catch (error: any) {
        const message = error.response?.data?.message || 'No se pudo obtener el perfil';
        const authError = new Error(message) as Error & { status?: number };
        authError.status = error.response?.status;
        throw authError;
      }
    }

    async updateMe(payload: UpdateProfilePayload): Promise<UsuarioPerfil> {
      try {
        const response = await api.put<{ data: UsuarioPerfil }>('/auth/me', payload);
        if (!response.data?.data) {
          throw new Error('No se pudo actualizar el perfil');
        }
        return response.data.data;
      } catch (error: any) {
        const message = error.response?.data?.message || 'No se pudo actualizar el perfil';
        const authError = new Error(message) as Error & { status?: number };
        authError.status = error.response?.status;
        throw authError;
      }
    }
}

export default new AuthService();
