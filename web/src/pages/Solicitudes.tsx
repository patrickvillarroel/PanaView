import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldCheck, Check, X, Clock, ImageOff } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import MiniMap from '../components/MiniMap';
import { useConfirm } from '../components/useConfirm';
import { useToast } from '../components/ToastContext';
import { usePending } from '../components/PendingContext';
import { negociosService } from '../services/negociosService';
import { getApiError } from '../api/client';
import type { Negocio } from '../types';
import { assetUrl, iniciales, fechaCorta } from '../utils/format';
import './pages.css';

type TabKey = 'pendientes' | 'revision' | 'resueltas';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'pendientes', label: 'Pendientes' },
  { key: 'revision', label: 'En revisión' },
  { key: 'resueltas', label: 'Resueltas' },
];

export default function Solicitudes() {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const { refresh: refreshPending } = usePending();

  const [items, setItems] = useState<Negocio[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Negocio | null>(null);
  const [tab, setTab] = useState<TabKey>('pendientes');
  const [busy, setBusy] = useState<string | null>(null);
  const [nota, setNota] = useState('');

  useEffect(() => {
    setLoading(true);
    negociosService
      .listAll(false)
      .then((data) => {
        setItems(data);
        if (data.length > 0) setSelected(data[0]);
      })
      .catch((err) => toast.error(getApiError(err, 'No se pudieron cargar las solicitudes')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Auto-select the next item when the current one is removed */
  useEffect(() => {
    if (!selected || items.some((x) => x.id === selected.id)) return;
    setSelected(items[0] ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  async function approve() {
    if (!selected) return;
    const n = selected;
    setBusy(n.id);
    try {
      await negociosService.setVerificado(n.id, true);
      setItems((prev) => prev.filter((x) => x.id !== n.id));
      refreshPending();
      toast.success(`"${n.nombre}" aprobado y verificado`);
    } catch (err) {
      toast.error(getApiError(err, 'No se pudo aprobar'));
    } finally {
      setBusy(null);
    }
  }

  async function reject() {
    if (!selected) return;
    const n = selected;
    const ok = await confirm({
      title: 'Rechazar solicitud',
      message: `¿Rechazar y eliminar la solicitud de "${n.nombre}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Rechazar',
      danger: true,
    });
    if (!ok) return;
    setBusy(n.id);
    try {
      await negociosService.remove(n.id);
      setItems((prev) => prev.filter((x) => x.id !== n.id));
      refreshPending();
      toast.success('Solicitud rechazada');
    } catch (err) {
      toast.error(getApiError(err, 'No se pudo rechazar'));
    } finally {
      setBusy(null);
    }
  }

  const listContent = tab === 'pendientes' ? items : [];

  return (
    <PageTransition>
      {dialog}
      <div className="sol-layout">
        {/* ── LEFT PANEL ── */}
        <div className="sol-list-panel">
          <div className="sol-list-header">
            <p className="h2" style={{ margin: 0 }}>
              Solicitudes
            </p>
            <p className="cell-sub" style={{ margin: '3px 0 0', fontSize: 12 }}>
              Negocios que esperan verificación
            </p>
          </div>

          <div className="sol-tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`sol-tab${tab === t.key ? ' active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
                {t.key === 'pendientes' && items.length > 0 && (
                  <span className="sol-tab-count">{items.length}</span>
                )}
              </button>
            ))}
          </div>

          <div className="sol-list-body">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="sol-list-item" style={{ cursor: 'default' }}>
                  <span
                    className="skeleton"
                    style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <span className="skeleton" style={{ width: '60%', height: 13 }} />
                    <span className="skeleton" style={{ width: '75%', height: 11 }} />
                    <span
                      className="skeleton"
                      style={{ width: '40%', height: 18, borderRadius: 99 }}
                    />
                  </div>
                </div>
              ))
            ) : listContent.length === 0 ? (
              <div className="empty" style={{ padding: '48px 20px' }}>
                <ShieldCheck size={32} color="var(--muted)" />
                <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--muted)' }}>
                  {tab === 'pendientes' ? 'No hay solicitudes pendientes' : 'Sin registros'}
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {listContent.map((n) => (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className={`sol-list-item${selected?.id === n.id ? ' selected' : ''}`}
                    onClick={() => {
                      setSelected(n);
                      setNota('');
                    }}
                  >
                    <div className="sol-list-avatar">{iniciales(n.nombre)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="cell-title" style={{ fontSize: 13.5 }}>
                        {n.nombre}
                      </div>
                      <div className="cell-sub" style={{ fontSize: 12, marginTop: 2 }}>
                        {n.propietario?.nombre ?? '—'} · {n.direccion ?? 'Sin dirección'}
                      </div>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 6 }}
                      >
                        <span
                          className="badge badge-warning"
                          style={{ fontSize: 10.5, padding: '2px 8px' }}
                        >
                          <Clock size={10} /> Pendiente
                        </span>
                        <span className="cell-sub" style={{ fontSize: 11 }}>
                          {fechaCorta(n.creado_en)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="sol-detail-panel">
          {!selected || loading ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--muted)',
                gap: 12,
                height: '100%',
              }}
            >
              <ShieldCheck size={44} />
              <p style={{ margin: 0, fontSize: 14 }}>
                {loading ? 'Cargando solicitudes...' : 'Selecciona una solicitud'}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  minHeight: 0,
                }}
              >
                {/* Header */}
                <div className="sol-detail-header">
                  <div className="sol-detail-avatar">{iniciales(selected.nombre)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}
                    >
                      <span className="h2">{selected.nombre}</span>
                      <span className="badge badge-warning" style={{ fontSize: 11 }}>
                        <Clock size={11} /> Pendiente
                      </span>
                    </div>
                    <p className="cell-sub" style={{ margin: '3px 0 0', fontSize: 12 }}>
                      Solicitud enviada {fechaCorta(selected.creado_en)}
                      {selected.propietario?.nombre ? ` · ${selected.propietario.nombre}` : ''}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={reject}
                      disabled={!!busy}
                      style={{ color: 'var(--danger)', borderColor: '#f4caca' }}
                    >
                      <X size={15} /> Rechazar
                    </button>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={approve}
                      disabled={!!busy}
                    >
                      {busy === selected.id ? (
                        <span
                          className="spinner"
                          style={{ borderTopColor: '#fff', width: 14, height: 14 }}
                        />
                      ) : (
                        <>
                          <Check size={15} /> Aprobar negocio
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="sol-detail-body">
                  {/* Main area */}
                  <div className="sol-detail-main">
                    {/* Datos del negocio */}
                    <div className="sol-card">
                      <div className="sol-card-title">Datos del negocio</div>
                      <div className="sol-info-grid">
                        {selected.categoria?.nombre && (
                          <div className="sol-info-block">
                            <span className="sol-info-label">Categoría</span>
                            <span className="sol-info-value">
                              <span
                                className="badge-dot"
                                style={{ background: 'var(--success)', flexShrink: 0 }}
                              />
                              {selected.categoria.nombre}
                            </span>
                          </div>
                        )}
                        {selected.direccion && (
                          <div className="sol-info-block">
                            <span className="sol-info-label">Dirección</span>
                            <span className="sol-info-value">{selected.direccion}</span>
                          </div>
                        )}
                        {selected.telefono && (
                          <div className="sol-info-block">
                            <span className="sol-info-label">Teléfono</span>
                            <span className="sol-info-value">{selected.telefono}</span>
                          </div>
                        )}
                        {selected.horario && (
                          <div className="sol-info-block">
                            <span className="sol-info-label">Horario</span>
                            <span className="sol-info-value">{selected.horario}</span>
                          </div>
                        )}
                        {selected.sitio_web && (
                          <div className="sol-info-block">
                            <span className="sol-info-label">Sitio web</span>
                            <span className="sol-info-value">{selected.sitio_web}</span>
                          </div>
                        )}
                        {selected.whatsapp && (
                          <div className="sol-info-block">
                            <span className="sol-info-label">WhatsApp</span>
                            <span className="sol-info-value">{selected.whatsapp}</span>
                          </div>
                        )}
                        {selected.descripcion && (
                          <div className="sol-info-block" style={{ gridColumn: '1 / -1' }}>
                            <span className="sol-info-label">Descripción</span>
                            <span
                              className="sol-info-value"
                              style={{ whiteSpace: 'pre-wrap', display: 'block' }}
                            >
                              {selected.descripcion}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Fotos del local */}
                    <div className="sol-card">
                      <div className="sol-card-title">Fotos del local</div>
                      <div className="sol-foto-grid">
                        {[0, 1, 2].map((i) => {
                          const img = selected.imagenes?.[i];
                          const url = img ? assetUrl(img.url) : null;
                          return (
                            <div key={i} className="sol-foto-slot">
                              {url ? (
                                <img
                                  src={url}
                                  alt=""
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <ImageOff size={20} color="var(--border-strong)" />
                              )}
                              <span className="sol-foto-label">foto {i + 1}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="sol-detail-sidebar">
                    {/* Propietario */}
                    {selected.propietario && (
                      <div className="sol-card">
                        <div className="sol-card-title">Propietario</div>
                        <div style={{ padding: '14px 16px' }}>
                          <div
                            style={{
                              display: 'flex',
                              gap: 10,
                              alignItems: 'center',
                              marginBottom: 14,
                            }}
                          >
                            <div
                              className="sol-list-avatar"
                              style={{ width: 40, height: 40, fontSize: 13 }}
                            >
                              {iniciales(selected.propietario.nombre)}
                            </div>
                            <div>
                              <div className="cell-title" style={{ fontSize: 13.5 }}>
                                {selected.propietario.nombre}
                              </div>
                              <div className="cell-sub" style={{ fontSize: 11.5 }}>
                                Miembro registrado
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div className="sol-prop-row">
                              <span className="sol-prop-label">Correo</span>
                              <span className="sol-prop-value">{selected.propietario.email}</span>
                            </div>
                            {selected.telefono && (
                              <div className="sol-prop-row">
                                <span className="sol-prop-label">Teléfono</span>
                                <span className="sol-prop-value">{selected.telefono}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Ubicación */}
                    <div className="sol-card">
                      <div className="sol-card-title">Ubicación</div>
                      {(() => {
                        const lat = Number(selected.latitud);
                        const lng = Number(selected.longitud);
                        return !isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0) ? (
                          <MiniMap
                            key={selected.id}
                            markers={[{ lat, lng }]}
                            height={130}
                            singleZoom={14}
                          />
                        ) : (
                          <div className="map-placeholder" style={{ height: 110 }}>
                            <span style={{ fontSize: 12 }}>Sin coordenadas</span>
                          </div>
                        );
                      })()}
                      {selected.direccion && (
                        <p
                          className="cell-sub"
                          style={{ margin: 0, padding: '9px 14px', fontSize: 12 }}
                        >
                          {selected.direccion}
                        </p>
                      )}
                    </div>

                    {/* Nota de revisión */}
                    <div className="sol-card">
                      <div className="sol-card-title">Nota de revisión</div>
                      <div style={{ padding: 13 }}>
                        <textarea
                          className="textarea"
                          placeholder="Escribe un motivo si rechazas, o una nota interna..."
                          value={nota}
                          onChange={(e) => setNota(e.target.value)}
                          style={{ minHeight: 88, fontSize: 13, resize: 'vertical' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
