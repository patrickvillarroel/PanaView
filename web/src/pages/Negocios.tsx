import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Store,
  ImageOff,
  ShieldCheck,
  Clock,
  Check,
} from 'lucide-react';
import PageTransition from '../components/PageTransition';
import NegocioFormModal from './NegocioFormModal';
import { useConfirm } from '../components/useConfirm';
import { useToast } from '../components/ToastContext';
import { usePending } from '../components/PendingContext';
import { negociosService } from '../services/negociosService';
import { getApiError } from '../api/client';
import type { Categoria, Negocio } from '../types';
import { portadaUrl, recortar } from '../utils/format';
import './pages.css';

type Filtro = 'todos' | 'verificados' | 'pendientes';

export default function Negocios() {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const { refresh: refreshPending } = usePending();

  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Negocio | null>(null);

  async function load() {
    setLoading(true);
    try {
      setNegocios(await negociosService.listAll());
    } catch (err) {
      toast.error(getApiError(err, 'No se pudieron cargar los negocios'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    negociosService.categorias().then(setCategorias).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => {
    const verificados = negocios.filter((n) => n.verificado).length;
    return {
      todos: negocios.length,
      verificados,
      pendientes: negocios.length - verificados,
    };
  }, [negocios]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return negocios
      .filter((n) =>
        filtro === 'verificados'
          ? n.verificado
          : filtro === 'pendientes'
          ? !n.verificado
          : true
      )
      .filter(
        (n) =>
          !q ||
          n.nombre.toLowerCase().includes(q) ||
          (n.categoria?.nombre ?? '').toLowerCase().includes(q) ||
          (n.propietario?.nombre ?? '').toLowerCase().includes(q)
      );
  }, [negocios, query, filtro]);

  function openCreate() {
    setEditTarget(null);
    setModalOpen(true);
  }
  function openEdit(n: Negocio) {
    setEditTarget(n);
    setModalOpen(true);
  }

  async function handleVerify(n: Negocio) {
    try {
      await negociosService.setVerificado(n.id, true);
      setNegocios((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, verificado: true } : x))
      );
      refreshPending();
      toast.success(`"${n.nombre}" verificado`);
    } catch (err) {
      toast.error(getApiError(err, 'No se pudo verificar'));
    }
  }

  async function handleDelete(n: Negocio) {
    const ok = await confirm({
      title: 'Eliminar negocio',
      message: `¿Seguro que deseas eliminar "${n.nombre}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    try {
      await negociosService.remove(n.id);
      setNegocios((prev) => prev.filter((x) => x.id !== n.id));
      refreshPending();
      toast.success('Negocio eliminado');
    } catch (err) {
      toast.error(getApiError(err, 'No se pudo eliminar el negocio'));
    }
  }

  const segments: { key: Filtro; label: string; count: number }[] = [
    { key: 'todos', label: 'Todos', count: counts.todos },
    { key: 'verificados', label: 'Verificados', count: counts.verificados },
    { key: 'pendientes', label: 'Pendientes', count: counts.pendientes },
  ];

  return (
    <PageTransition>
      {dialog}

      <div className="page-head">
        <div>
          <h1 className="h1">Negocios</h1>
          <p className="subtitle">
            Catálogo completo · {counts.verificados} verificados · {counts.pendientes}{' '}
            pendientes
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} />
          Nuevo negocio
        </button>
      </div>

      <div className="toolbar">
        <div className="search">
          <span className="search-icon">
            <Search size={17} />
          </span>
          <input
            placeholder="Buscar por nombre, categoría o propietario…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="segmented">
          {segments.map((s) => (
            <button
              key={s.key}
              className={filtro === s.key ? 'active' : ''}
              onClick={() => setFiltro(s.key)}
            >
              {filtro === s.key && (
                <motion.span layoutId="seg-active" className="seg-active-bg" />
              )}
              <span className="seg-label">
                {s.label}
                <span className="seg-count">{s.count}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="card table-wrap">
        {loading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <div className="empty">
            <Store size={34} style={{ opacity: 0.4, marginBottom: 10 }} />
            <p style={{ margin: 0, fontWeight: 600 }}>
              {query || filtro !== 'todos' ? 'Sin resultados' : 'Aún no hay negocios'}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 13 }}>
              {query || filtro !== 'todos'
                ? 'Ajusta los filtros o el término de búsqueda.'
                : 'Registra el primer negocio con el botón “Nuevo negocio”.'}
            </p>
          </div>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>Negocio</th>
                <th>Categoría</th>
                <th>Propietario</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filtered.map((n, i) => {
                  const img = portadaUrl(n.imagenes);
                  return (
                    <motion.tr
                      key={n.id}
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
                            <div className="cell-title">{n.nombre}</div>
                            <div className="cell-sub">{recortar(n.descripcion, 50)}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-neutral">
                          {n.categoria?.nombre ?? '—'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: 13.5 }}>{n.propietario?.nombre ?? '—'}</div>
                        <div className="cell-sub">{n.propietario?.email ?? ''}</div>
                      </td>
                      <td>
                        {n.verificado ? (
                          <span className="badge badge-success">
                            <ShieldCheck size={13} /> Verificado
                          </span>
                        ) : (
                          <span className="badge badge-warning">
                            <Clock size={13} /> Pendiente
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="row gap-2" style={{ justifyContent: 'flex-end' }}>
                          {!n.verificado && (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleVerify(n)}
                              title="Verificar negocio"
                            >
                              <Check size={15} /> Verificar
                            </button>
                          )}
                          <button
                            className="icon-action"
                            onClick={() => openEdit(n)}
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="icon-action danger"
                            onClick={() => handleDelete(n)}
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

      <NegocioFormModal
        open={modalOpen}
        negocio={editTarget}
        categorias={categorias}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          load();
          refreshPending();
        }}
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
          <div className="skeleton" style={{ width: 90, height: 22, borderRadius: 999 }} />
        </div>
      ))}
    </div>
  );
}
