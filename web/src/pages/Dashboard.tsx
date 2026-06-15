import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Eye, Plus } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import MiniMap from '../components/MiniMap';
import { useToast } from '../components/ToastContext';
import { lugaresService } from '../services/lugaresService';
import { negociosService } from '../services/negociosService';
import { getApiError } from '../api/client';
import type { Lugar, Negocio } from '../types';
import { iniciales, fechaCorta } from '../utils/format';
import './pages.css';

const STAT_META = [
  { key: 'lugares' as const, label: 'Lugares turísticos', color: '#2e75b6' },
  { key: 'negocios' as const, label: 'Negocios activos', color: '#15803d' },
  { key: 'pendientes' as const, label: 'Solicitudes pendientes', color: '#b45309' },
  { key: 'verificados' as const, label: 'Negocios verificados', color: '#374151' },
] as const;

interface Stats {
  lugares: number;
  negocios: number;
  verificados: number;
  pendientes: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([lugaresService.listAll(), negociosService.listAll()])
      .then(([l, n]) => {
        setLugares(l);
        setNegocios(n);
        const verificados = n.filter((x) => x.verificado).length;
        setStats({ lugares: l.length, negocios: n.length, verificados, pendientes: n.length - verificados });
      })
      .catch(() => setStats({ lugares: 0, negocios: 0, verificados: 0, pendientes: 0 }));
  }, []);

  const pendientes = negocios.filter((n) => !n.verificado);

  async function quickApprove(n: Negocio) {
    setBusy(n.id);
    try {
      await negociosService.setVerificado(n.id, true);
      setNegocios((prev) => prev.map((x) => (x.id === n.id ? { ...x, verificado: true } : x)));
      setStats((s) =>
        s ? { ...s, verificados: s.verificados + 1, pendientes: s.pendientes - 1 } : s,
      );
      toast.success(`"${n.nombre}" aprobado`);
    } catch (err) {
      toast.error(getApiError(err, 'No se pudo aprobar'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <PageTransition>
      {/* Stat cards */}
      <div className="stat-grid">
        {STAT_META.map((meta, i) => (
          <motion.div
            key={meta.key}
            className="stat-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.35 }}
          >
            <div className="stat-card-bar" style={{ background: meta.color }} />
            <div className="stat-card-body">
              <div className="stat-label">{meta.label}</div>
              <div className="stat-value">
                {stats ? (
                  <CountUp value={stats[meta.key]} />
                ) : (
                  <span
                    className="skeleton"
                    style={{ display: 'inline-block', width: 56, height: 30, borderRadius: 6 }}
                  />
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Two-column grid */}
      <div className="dash-grid">
        {/* Left column */}
        <div className="dash-col-main">
          {/* Map placeholder */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="dash-section-header">
              <span className="h2">Mapa de negocios</span>
              {stats && (
                <span className="cell-sub">
                  {stats.negocios} ubicaciones · {stats.lugares} lugares
                </span>
              )}
            </div>
            {stats === null ? (
              <div className="map-placeholder" style={{ height: 190 }} />
            ) : (
              <MiniMap
                height={190}
                markers={lugares
                  .map((l) => ({
                    lat: Number(l.latitud),
                    lng: Number(l.longitud),
                  }))
                  .filter((m) => !isNaN(m.lat) && !isNaN(m.lng))}
              />
            )}
          </div>

          {/* Solicitudes recientes */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="dash-section-header">
              <span className="h2">Solicitudes recientes</span>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/solicitudes')}>
                Ver todas
              </button>
            </div>
            {!stats ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="sol-reciente-row">
                  <span
                    className="skeleton"
                    style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <span className="skeleton" style={{ width: '50%', height: 13 }} />
                    <span className="skeleton" style={{ width: '70%', height: 11 }} />
                  </div>
                </div>
              ))
            ) : pendientes.length === 0 ? (
              <div className="empty" style={{ padding: '24px 20px' }}>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
                  No hay solicitudes pendientes
                </p>
              </div>
            ) : (
              pendientes.slice(0, 4).map((n, i) => (
                <motion.div
                  key={n.id}
                  className="sol-reciente-row"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                >
                  <div className="sol-reciente-avatar">{iniciales(n.nombre)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="cell-title">{n.nombre}</div>
                    <div className="cell-sub">
                      {n.propietario?.nombre ?? '—'} · {n.direccion ?? 'Sin dirección'}
                    </div>
                  </div>
                  <span className="cell-sub" style={{ whiteSpace: 'nowrap', marginRight: 8 }}>
                    {fechaCorta(n.creado_en)}
                  </span>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => quickApprove(n)}
                    disabled={busy === n.id}
                    style={{ flexShrink: 0 }}
                  >
                    {busy === n.id ? (
                      <span
                        className="spinner"
                        style={{ borderTopColor: '#fff', width: 14, height: 14 }}
                      />
                    ) : (
                      <>
                        <Check size={14} /> Aprobar
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate('/solicitudes')}
                    style={{ flexShrink: 0 }}
                  >
                    <Eye size={14} /> Ver
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="dash-col-side">
          {/* Lugares populares */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="dash-section-header">
              <span className="h2">Lugares populares</span>
            </div>
            {!stats ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="lugar-rank-item">
                  <span className="skeleton" style={{ width: 26, height: 26, borderRadius: 8 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <span className="skeleton" style={{ width: '55%', height: 13 }} />
                    <span className="skeleton" style={{ width: '40%', height: 11 }} />
                  </div>
                </div>
              ))
            ) : lugares.length === 0 ? (
              <div className="empty" style={{ padding: '20px' }}>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>No hay lugares</p>
              </div>
            ) : (
              lugares.slice(0, 5).map((l, i) => (
                <div key={l.id} className="lugar-rank-item">
                  <span className="lugar-rank-num">{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="cell-title">{l.nombre}</div>
                    <div className="cell-sub">{l.categoria?.nombre ?? '—'}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Acciones rápidas */}
          <div className="acciones-dark">
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>
                Acciones rápidas
              </div>
              <div style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 2 }}>
                Crea y gestiona contenido
              </div>
            </div>
            <button className="acciones-btn-primary" onClick={() => navigate('/lugares')}>
              <Plus size={15} /> Nuevo lugar
            </button>
            <button className="acciones-btn-ghost" onClick={() => navigate('/negocios')}>
              <Plus size={15} /> Nuevo negocio
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function CountUp({ value }: { value: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 700;
    const tick = (t: number) => {
      const p = Math.min((t - start) / dur, 1);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{n}</>;
}
