import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Search, MapPin, ImageOff } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import LugarFormModal from './LugarFormModal';
import { useConfirm } from '../components/useConfirm';
import { useToast } from '../components/ToastContext';
import { lugaresService } from '../services/lugaresService';
import { getApiError } from '../api/client';
import { CATEGORIAS_LUGAR, type Lugar } from '../types';
import { portadaUrl, recortar } from '../utils/format';
import './pages.css';

function categoriaNombre(l: Lugar): string {
  return (
    l.categoria?.nombre ??
    CATEGORIAS_LUGAR.find((c) => c.id === l.categoria_id)?.nombre ??
    '—'
  );
}

export default function Lugares() {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();

  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Lugar | null>(null);

  async function load() {
    setLoading(true);
    try {
      setLugares(await lugaresService.listAll());
    } catch (err) {
      toast.error(getApiError(err, 'No se pudieron cargar los lugares'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lugares;
    return lugares.filter(
      (l) =>
        l.nombre.toLowerCase().includes(q) ||
        (l.provincia ?? '').toLowerCase().includes(q) ||
        categoriaNombre(l).toLowerCase().includes(q)
    );
  }, [lugares, query]);

  function openCreate() {
    setEditTarget(null);
    setModalOpen(true);
  }
  function openEdit(l: Lugar) {
    setEditTarget(l);
    setModalOpen(true);
  }

  async function handleDelete(l: Lugar) {
    const ok = await confirm({
      title: 'Eliminar lugar',
      message: `¿Seguro que deseas eliminar "${l.nombre}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    try {
      await lugaresService.remove(l.id);
      setLugares((prev) => prev.filter((x) => x.id !== l.id));
      toast.success('Lugar eliminado');
    } catch (err) {
      toast.error(getApiError(err, 'No se pudo eliminar el lugar'));
    }
  }

  return (
    <PageTransition>
      {dialog}

      <div className="page-head">
        <div>
          <h1 className="h1">Lugares turísticos</h1>
          <p className="subtitle">
            {lugares.length} lugar{lugares.length === 1 ? '' : 'es'} registrado
            {lugares.length === 1 ? '' : 's'} en la plataforma
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} />
          Nuevo lugar
        </button>
      </div>

      <div className="toolbar">
        <div className="search">
          <span className="search-icon">
            <Search size={17} />
          </span>
          <input
            placeholder="Buscar por nombre, provincia o categoría…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="card table-wrap">
        {loading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <div className="empty">
            <MapPin size={34} style={{ opacity: 0.4, marginBottom: 10 }} />
            <p style={{ margin: 0, fontWeight: 600 }}>
              {query ? 'Sin resultados' : 'Aún no hay lugares'}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 13 }}>
              {query
                ? 'Prueba con otro término de búsqueda.'
                : 'Crea el primer punto turístico con el botón “Nuevo lugar”.'}
            </p>
          </div>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>Lugar</th>
                <th>Categoría</th>
                <th>Provincia</th>
                <th>Coordenadas</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filtered.map((l, i) => {
                  const img = portadaUrl(l.imagenes);
                  return (
                    <motion.tr
                      key={l.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    >
                      <td>
                        <div className="cell-main">
                          {img ? (
                            <img
                              className="thumb"
                              src={img}
                              alt=""
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="thumb-fallback">
                              <ImageOff size={18} />
                            </span>
                          )}
                          <div>
                            <div className="cell-title">{l.nombre}</div>
                            <div className="cell-sub">{recortar(l.descripcion, 52)}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-neutral">{categoriaNombre(l)}</span>
                      </td>
                      <td>{l.provincia || '—'}</td>
                      <td className="text-soft" style={{ fontSize: 13 }}>
                        {Number(l.latitud).toFixed(4)}, {Number(l.longitud).toFixed(4)}
                      </td>
                      <td>
                        <div className="row gap-2" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="icon-action"
                            onClick={() => openEdit(l)}
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="icon-action danger"
                            onClick={() => handleDelete(l)}
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      <LugarFormModal
        open={modalOpen}
        lugar={editTarget}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />
    </PageTransition>
  );
}

function TableSkeleton() {
  return (
    <div style={{ padding: 18 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="row gap-3"
          style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}
        >
          <div className="skeleton" style={{ width: 46, height: 46, borderRadius: 10 }} />
          <div className="grow">
            <div className="skeleton" style={{ width: '40%', height: 13, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: '60%', height: 11 }} />
          </div>
          <div className="skeleton" style={{ width: 80, height: 22, borderRadius: 999 }} />
        </div>
      ))}
    </div>
  );
}
