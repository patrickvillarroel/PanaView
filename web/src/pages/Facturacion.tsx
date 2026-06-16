import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  Clock,
  BadgeDollarSign,
} from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { useToast } from '../components/ToastContext';
import { useConfirm } from '../components/useConfirm';
import { facturacionService, CicloFacturacion } from '../services/facturacionService';
import { getApiError } from '../api/client';
import { fechaCorta, iniciales } from '../utils/format';
import './pages.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `$${Number(n ?? 0).toFixed(2)}`;
}

function fmtFecha(iso: string) {
  return fechaCorta(iso);
}

type EstadoKey = CicloFacturacion['estado'];

const ESTADO_META: Record<EstadoKey, { label: string; cls: string }> = {
  activo:         { label: 'Activo',     cls: 'badge-success' },
  pendiente_pago: { label: 'Pendiente',  cls: 'badge-warning' },
  pagado:         { label: 'Pagado',     cls: 'badge badge-success' },
  vencido:        { label: 'Vencido',    cls: 'badge-danger' },
};

function BadgeEstado({ estado }: { estado: EstadoKey }) {
  const m = ESTADO_META[estado] ?? ESTADO_META.activo;
  return <span className={`badge ${m.cls}`}>{m.label}</span>;
}

type Filtro = 'todos' | 'pendiente_pago' | 'vencido';

// ─── Mini barra de progreso mensual ──────────────────────────────────────────

function BarChart({ data }: { data: { mes: string; comisiones: number; cobrado: number }[] }) {
  const max = Math.max(...data.map((d) => Number(d.comisiones)), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 80 }}>
      {[...data].reverse().map((d) => (
        <div key={d.mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 60, gap: 2 }}>
            <div
              title={`Total: ${fmt(+d.comisiones)}`}
              style={{
                width: '100%',
                background: 'var(--brand-100)',
                borderRadius: 4,
                height: `${(Number(d.comisiones) / max) * 100}%`,
                minHeight: 4,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                title={`Cobrado: ${fmt(+d.cobrado)}`}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'var(--brand-500)',
                  height: `${Number(d.comisiones) > 0 ? (Number(d.cobrado) / Number(d.comisiones)) * 100 : 0}%`,
                  borderRadius: 4,
                }}
              />
            </div>
          </div>
          <span style={{ fontSize: 10, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
            {d.mes.slice(5)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Facturacion() {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();

  const [data, setData] = useState<Awaited<ReturnType<typeof facturacionService.crmResumen>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      setData(await facturacionService.crmResumen());
    } catch (err) {
      toast.error(getApiError(err, 'No se pudo cargar el CRM'));
    }
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const r = await facturacionService.checkVencimientos();
      toast.success(`Revisión completada — ${r.vencidosDesactivados} ciclos vencidos procesados`);
      await load();
    } catch (err) {
      toast.error(getApiError(err, 'Error al revisar vencimientos'));
    } finally {
      setRefreshing(false);
    }
  }

  async function handlePagar(ciclo: CicloFacturacion) {
    const ok = await confirm({
      title: 'Confirmar pago',
      message: `¿Marcar el ciclo de "${ciclo.negocio?.nombre}" por ${fmt(+ciclo.total_comisiones)} como pagado? Esto reactivará sus promociones.`,
      confirmLabel: 'Sí, marcar pagado',
      danger: false,
    });
    if (!ok) return;

    setBusy(ciclo.id);
    try {
      await facturacionService.marcarPagado(ciclo.id);
      toast.success(`Ciclo de "${ciclo.negocio?.nombre}" marcado como pagado`);
      await load();
    } catch (err) {
      toast.error(getApiError(err, 'No se pudo marcar como pagado'));
    } finally {
      setBusy(null);
    }
  }

  const ciclosFiltrados = useMemo(() => {
    const lista = data?.ciclosPendientes ?? [];
    if (filtro === 'todos') return lista;
    return lista.filter((c) => c.estado === filtro);
  }, [data, filtro]);

  const counts = useMemo(() => ({
    todos: data?.ciclosPendientes.length ?? 0,
    pendiente_pago: data?.ciclosPendientes.filter((c) => c.estado === 'pendiente_pago').length ?? 0,
    vencido: data?.ciclosPendientes.filter((c) => c.estado === 'vencido').length ?? 0,
  }), [data]);

  const stats = data?.estadisticas;

  return (
    <PageTransition>
      {/* Encabezado */}
      <div className="page-head">
        <div>
          <h1 className="h1">Facturación</h1>
          <p className="subtitle">Ciclos de cobro por éxito · solo pagas cuando hay resultados</p>
        </div>
        <button
          className="btn btn-ghost"
          onClick={handleRefresh}
          disabled={refreshing}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
          Revisar vencimientos
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner spinner-lg" />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {[
              {
                label: 'Por cobrar',
                value: fmt(stats?.totalPendiente ?? 0),
                color: '#b45309',
                icon: <Clock size={18} color="#b45309" />,
              },
              {
                label: 'Vencido (promos pausadas)',
                value: fmt(stats?.totalVencido ?? 0),
                color: '#dc2626',
                icon: <AlertTriangle size={18} color="#dc2626" />,
              },
              {
                label: 'Ciclos con deuda',
                value: String(stats?.totalDeudas ?? 0),
                color: '#2e75b6',
                icon: <BadgeDollarSign size={18} color="#2e75b6" />,
              },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                className="stat-card"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <div className="stat-card-bar" style={{ background: s.color }} />
                <div className="stat-card-body">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="stat-label">{s.label}</div>
                    {s.icon}
                  </div>
                  <div className="stat-value">{s.value}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Resumen últimos 6 meses */}
          {(data?.resumenMensual?.length ?? 0) > 0 && (
            <motion.div
              className="card"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              style={{ marginBottom: 20, padding: '18px 22px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <TrendingUp size={16} color="var(--brand-500)" />
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                  Últimos 6 meses
                </span>
                <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 4 }}>
                  Azul claro = total generado · Azul oscuro = cobrado
                </span>
              </div>
              <BarChart data={data!.resumenMensual} />
              <div style={{ display: 'flex', gap: 24, marginTop: 12, flexWrap: 'wrap' }}>
                {data!.resumenMensual.slice(0, 3).map((m) => (
                  <div key={m.mes} style={{ fontSize: 12, color: 'var(--muted)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text)' }}>{m.mes}</span>
                    {' · '}
                    {m.canjeos} canjeos
                    {' · '}
                    <span style={{ color: 'var(--brand-600)', fontWeight: 600 }}>{fmt(+m.comisiones)}</span>
                    {' generado · '}
                    <span style={{ color: 'var(--success)', fontWeight: 600 }}>{fmt(+m.cobrado)}</span>
                    {' cobrado'}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Filtros */}
          <div className="toolbar">
            <div className="segmented">
              {(
                [
                  { key: 'todos', label: 'Todos' },
                  { key: 'pendiente_pago', label: 'Pendiente' },
                  { key: 'vencido', label: 'Vencido' },
                ] as { key: Filtro; label: string }[]
              ).map((s) => (
                <button
                  key={s.key}
                  className={filtro === s.key ? 'active' : ''}
                  onClick={() => setFiltro(s.key)}
                >
                  {filtro === s.key && (
                    <motion.span layoutId="fact-seg-bg" className="seg-active-bg" />
                  )}
                  <span className="seg-label">
                    {s.label}
                    <span className="seg-count">{counts[s.key]}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tabla */}
          <motion.div
            className="card table-wrap"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
          >
            {ciclosFiltrados.length === 0 ? (
              <div className="empty">
                <CheckCircle2 size={40} color="var(--success)" />
                <p>Todo al día — sin pagos pendientes</p>
              </div>
            ) : (
              <table className="data">
                <thead>
                  <tr>
                    <th>Negocio</th>
                    <th>Período</th>
                    <th>Tipo</th>
                    <th style={{ textAlign: 'right' }}>Canjeos</th>
                    <th style={{ textAlign: 'right' }}>Comisión</th>
                    <th>Estado</th>
                    <th>Vence</th>
                    <th style={{ textAlign: 'right' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {ciclosFiltrados.map((ciclo) => {
                      const n = ciclo.negocio;
                      const estaVencido = ciclo.estado === 'vencido';
                      return (
                        <motion.tr
                          key={ciclo.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          style={estaVencido ? { background: 'var(--danger-bg)' } : undefined}
                        >
                          <td>
                            <div className="cell-main">
                              <div
                                className="thumb-fallback"
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 10,
                                  background: 'linear-gradient(135deg, var(--brand-400), var(--brand-600))',
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: 13,
                                  flexShrink: 0,
                                }}
                              >
                                {iniciales(n?.nombre ?? '?')}
                              </div>
                              <div>
                                <div className="cell-title">{n?.nombre ?? '—'}</div>
                                {n?.propietario && (
                                  <div className="cell-sub">{n.propietario.nombre} · {n.propietario.email}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ fontSize: 13, color: 'var(--text-soft)', whiteSpace: 'nowrap' }}>
                            {fmtFecha(ciclo.fecha_inicio)} → {fmtFecha(ciclo.fecha_fin)}
                          </td>
                          <td>
                            <span className="badge badge-neutral">
                              {ciclo.tipo === 'quincenal' ? 'Quincenal' : 'Mensual'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 14 }}>
                            {ciclo.total_canjeos}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 15, color: 'var(--brand-700)' }}>
                            {fmt(+ciclo.total_comisiones)}
                          </td>
                          <td>
                            <BadgeEstado estado={ciclo.estado} />
                          </td>
                          <td style={{ fontSize: 13, color: estaVencido ? 'var(--danger)' : 'var(--text-soft)', fontWeight: estaVencido ? 700 : 400, whiteSpace: 'nowrap' }}>
                            {fmtFecha(ciclo.fecha_vencimiento)}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {(ciclo.estado === 'pendiente_pago' || ciclo.estado === 'vencido') && (
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => handlePagar(ciclo)}
                                disabled={busy === ciclo.id}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                              >
                                {busy === ciclo.id ? (
                                  <div className="spinner" style={{ width: 14, height: 14 }} />
                                ) : (
                                  <CheckCircle2 size={14} />
                                )}
                                Marcar pagado
                              </button>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </motion.div>
        </>
      )}

      {dialog}
    </PageTransition>
  );
}
