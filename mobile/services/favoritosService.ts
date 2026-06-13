import api from './api';
import { ApiResponse } from '../types';

interface ToggleFavoritoResponse {
  lugar_id: string;
  es_favorito: boolean;
}

class FavoritosService {
  async toggleFavorito(lugarId: string): Promise<boolean> {
    try {
      const response = await api.post<ApiResponse<ToggleFavoritoResponse>>(
        `/favoritos/${lugarId}`
      );

      return response.data.data?.es_favorito ?? false;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'No se pudo actualizar el favorito'
      );
    }
  }
}

export default new FavoritosService();