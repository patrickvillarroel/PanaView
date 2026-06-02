import api from './api';
import { Resena, ApiResponse } from '../types';

interface CrearResenaPayload {
  lugar_id: string;
  calificacion: number;
  comentario?: string;
}

interface ActualizarResenaPayload {
  calificacion?: number;
  comentario?: string;
}

class ResenasService {
  async getResenasPorLugar(lugarId: string): Promise<Resena[]> {
    try {
      const response = await api.get<ApiResponse<Resena[]>>(
        `/resenas/${lugarId}`
      );
      return response.data.data || [];
    } catch (error: any) {
      console.error('Error al obtener reseñas:', error);
      throw error;
    }
  }

  async createResena(payload: CrearResenaPayload): Promise<Resena> {
    try {
      const response = await api.post<ApiResponse<Resena>>(
        '/resenas',
        payload
      );
      return response.data.data!;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Error al crear reseña'
      );
    }
  }

  async updateResena(
    id: number,
    payload: ActualizarResenaPayload
  ): Promise<Resena> {
    try {
      const response = await api.put<ApiResponse<Resena>>(
        `/resenas/${id}`,
        payload
      );
      return response.data.data!;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Error al actualizar reseña'
      );
    }
  }
}

export default new ResenasService();
