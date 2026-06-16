import api from './api';
import { ApiResponse } from '../types';

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

export interface CanjeHistorial {
  id: string;
  promocion_id: string;
  usuario_id: string | null;
  ciclo_id: string | null;
  metodo: 'app' | 'qr_scan';
  monto_comision: number;
  canjeado_en: string;
  promocion?: { id: string; nombre: string; precio: number };
  usuario?: { id: string; nombre: string } | null;
}

export interface ResumenNegocio {
  cicloActual: CicloFacturacion | null;
  historial: CicloFacturacion[];
  estadisticas: {
    totalGenerado: number;
    totalAdeudado: number;
    ciclosPendientes: number;
    canjeosSinCiclo: number;
  };
}

export interface ResumenCRM {
  ciclosPendientes: CicloFacturacion[];
  estadisticas: {
    totalPendiente: number;
    totalVencido: number;
    totalDeudas: number;
  };
  resumenMensual: {
    mes: string;
    comisiones: number;
    canjeos: number;
    ciclos: number;
    cobrado: number;
  }[];
}

class FacturacionService {
  async resumenNegocio(negocioId: string): Promise<ResumenNegocio> {
    const r = await api.get<ApiResponse<ResumenNegocio>>(`/facturacion/negocio/${negocioId}`);
    return r.data.data!;
  }

  async historialCanjeos(negocioId: string, cicloId?: string): Promise<CanjeHistorial[]> {
    const params = cicloId ? `?cicloId=${cicloId}` : '';
    const r = await api.get<ApiResponse<CanjeHistorial[]>>(`/facturacion/negocio/${negocioId}/canjeos${params}`);
    return r.data.data ?? [];
  }

  async marcarPagado(cicloId: string): Promise<CicloFacturacion> {
    const r = await api.post<ApiResponse<{ ciclo: CicloFacturacion }>>(`/facturacion/${cicloId}/pagar`);
    return r.data.data!.ciclo;
  }

  async crearPago(cicloId: string): Promise<{ url: string }> {
    const r = await api.post<ApiResponse<{ url: string }>>(`/facturacion/${cicloId}/crear-pago`);
    return r.data.data!;
  }

  async crmResumen(): Promise<ResumenCRM> {
    const r = await api.get<ApiResponse<ResumenCRM>>('/facturacion/crm');
    return r.data.data!;
  }

  async checkVencimientos(): Promise<{ activosTransicionados: number; vencidosDesactivados: number }> {
    const r = await api.post<ApiResponse<any>>('/facturacion/check-vencimientos');
    return r.data.data;
  }

  async configurarNegocio(negocioId: string, payload: { comision_porcentaje?: number; tipo_ciclo?: string }): Promise<void> {
    await api.put(`/facturacion/negocio/${negocioId}/config`, payload);
  }
}

export default new FacturacionService();
