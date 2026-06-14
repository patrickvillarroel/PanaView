import api from './api';
import { Resena, ApiResponse } from '../types';

interface CrearResenaPayload {
  negocio_id: string;
  calificacion: number;
  comentario?: string;
}

class ResenasNegociosService {
  async getResenasPorNegocio(negocioId: string): Promise<Resena[]> {
    try {
      const response = await api.get<ApiResponse<Resena[]>>(
        `/resenas-negocios/${negocioId}`
      );
      return response.data.data || [];
    } catch (error: any) {
      console.error('Error al obtener reseñas del negocio:', error);
      throw error;
    }
  }

  async createResena(payload: CrearResenaPayload): Promise<Resena> {
    try {
      const response = await api.post<ApiResponse<Resena>>(
        '/resenas-negocios',
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
    payload: { calificacion?: number; comentario?: string }
  ): Promise<Resena> {
    try {
      const response = await api.put<ApiResponse<Resena>>(
        `/resenas-negocios/${id}`,
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

export default new ResenasNegociosService();
