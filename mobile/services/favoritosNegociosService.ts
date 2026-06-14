import api from './api';
import { ApiResponse } from '../types';

class FavoritosNegociosService {
  async checkFavorito(negocioId: string): Promise<boolean> {
    const resp = await api.get<ApiResponse<{ es_favorito: boolean }>>(
      `/favoritos-negocios/${negocioId}/check`
    );
    return resp.data.data?.es_favorito ?? false;
  }

  async toggleFavorito(negocioId: string): Promise<boolean> {
    const resp = await api.post<ApiResponse<{ es_favorito: boolean }>>(
      `/favoritos-negocios/${negocioId}`
    );
    return resp.data.data?.es_favorito ?? false;
  }

  async getFavoritos(): Promise<any[]> {
    const resp = await api.get<ApiResponse<any[]>>('/favoritos-negocios');
    return resp.data.data || [];
  }
}

export default new FavoritosNegociosService();
