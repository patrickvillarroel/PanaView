import api from '../api/client';
import type { ApiResponse } from '../types';

export interface CicloFacturacion {
  id: string;
  negocio_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  tipo: 'quincenal' | 'mensual';
  total_canjeos: number;
  total_comisiones: number;
  estado: 'activo' | 'pendiente_pago' | 'pagado' | 'vencido';
  fecha_vencimiento: string;
  pagado_en: string | null;
  creado_en: string;
  negocio?: {
    id: string;
    nombre: string;
    comision_porcentaje: number;
    tipo_ciclo: string;
    propietario?: { id: string; nombre: string; email: string };
  };
}

export interface ResumenMensual {
  mes: string;
  comisiones: number;
  canjeos: number;
  ciclos: number;
  cobrado: number;
}

export interface CRMResumen {
  ciclosPendientes: CicloFacturacion[];
  estadisticas: {
    totalPendiente: number;
    totalVencido: number;
    totalDeudas: number;
  };
  resumenMensual: ResumenMensual[];
}

export const facturacionService = {
  async crmResumen(): Promise<CRMResumen> {
    const res = await api.get<ApiResponse<CRMResumen>>('/facturacion/crm');
    return res.data.data!;
  },

  async marcarPagado(cicloId: string): Promise<CicloFacturacion> {
    const res = await api.post<ApiResponse<{ ciclo: CicloFacturacion }>>(`/facturacion/${cicloId}/pagar`);
    return res.data.data!.ciclo;
  },

  async checkVencimientos(): Promise<{ activosTransicionados: number; vencidosDesactivados: number }> {
    const res = await api.post<ApiResponse<{ activosTransicionados: number; vencidosDesactivados: number }>>(
      '/facturacion/check-vencimientos'
    );
    return res.data.data!;
  },

  async configurarNegocio(
    negocioId: string,
    payload: { comision_porcentaje?: number; tipo_ciclo?: 'quincenal' | 'mensual' }
  ): Promise<void> {
    await api.put(`/facturacion/negocio/${negocioId}/config`, payload);
  },
};
