import api from './api';
import { Promocion, ApiResponse } from '../types';

class PromocionesService {
  async listar(negocioId: string): Promise<Promocion[]> {
    const resp = await api.get<ApiResponse<Promocion[]>>(`/promociones/negocios/${negocioId}`);
    return resp.data.data || [];
  }

  async crear(negocioId: string, payload: Partial<Promocion>): Promise<Promocion> {
    const resp = await api.post<ApiResponse<Promocion>>(`/promociones/negocios/${negocioId}`, payload);
    return resp.data.data!;
  }

  async obtener(id: string): Promise<Promocion> {
    const resp = await api.get<ApiResponse<Promocion>>(`/promociones/${id}`);
    return resp.data.data!;
  }

  async redeemByQR(qr: string): Promise<void> {
    await api.post('/promociones/redeem-by-qr', { qr_codigo: qr });
  }

  async redeemById(id: string): Promise<void> {
    await api.post(`/promociones/${id}/redeem`);
  }
}

export default new PromocionesService();
