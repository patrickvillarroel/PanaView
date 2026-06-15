import { useEffect, useState } from 'react';
import { Store, ShieldCheck } from 'lucide-react';
import Modal from '../components/Modal';
import { useToast } from '../components/ToastContext';
import { negociosService, type NegocioPayload } from '../services/negociosService';
import { getApiError } from '../api/client';
import type { Categoria, Negocio } from '../types';
import { portadaUrl } from '../utils/format';

interface Props {
  open: boolean;
  negocio: Negocio | null;
  categorias: Categoria[];
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  nombre: string;
  categoria_id: string;
  descripcion: string;
  telefono: string;
  whatsapp: string;
  horario: string;
  sitio_web: string;
  direccion: string;
  latitud: string;
  longitud: string;
  imagen_portada: string;
  verificado: boolean;
}

function emptyForm(categorias: Categoria[]): FormState {
  return {
    nombre: '',
    categoria_id: String(categorias[0]?.id ?? 1),
    descripcion: '',
    telefono: '',
    whatsapp: '',
    horario: '',
    sitio_web: '',
    direccion: '',
    latitud: '',
    longitud: '',
    imagen_portada: '',
    verificado: true,
  };
}

// Panamanian phone: 7-8 digits, optional +507 prefix and formatting chars
const PHONE_RE = /^[\+\d][\d\s\-\(\)]{5,14}$/;
const URL_RE = /^https?:\/\/.+\..+/;

export default function NegocioFormModal({
  open,
  negocio,
  categorias,
  onClose,
  onSaved,
}: Props) {
  const toast = useToast();
  const [form, setForm] = useState<FormState>(emptyForm(categorias));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const editing = !!negocio;

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (negocio) {
      setForm({
        nombre: negocio.nombre ?? '',
        categoria_id: String(negocio.categoria_id ?? negocio.categoria?.id ?? 1),
        descripcion: negocio.descripcion ?? '',
        telefono: negocio.telefono ?? '',
        whatsapp: negocio.whatsapp ?? '',
        horario: negocio.horario ?? '',
        sitio_web: negocio.sitio_web ?? '',
        direccion: negocio.direccion ?? '',
        latitud: String(negocio.latitud ?? ''),
        longitud: String(negocio.longitud ?? ''),
        imagen_portada: portadaUrl(negocio.imagenes) ?? '',
        verificado: negocio.verificado ?? false,
      });
    } else {
      setForm(emptyForm(categorias));
    }
  }, [open, negocio, categorias]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key as string]) setErrors((e) => ({ ...e, [key]: '' }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};

    const nombre = form.nombre.trim();
    if (!nombre) e.nombre = 'El nombre es obligatorio';
    else if (nombre.length < 3) e.nombre = 'Mínimo 3 caracteres';
    else if (nombre.length > 150) e.nombre = 'Máximo 150 caracteres';

    const desc = form.descripcion.trim();
    if (desc.length > 1000) e.descripcion = 'Máximo 1000 caracteres';

    const tel = form.telefono.trim();
    if (tel && !PHONE_RE.test(tel))
      e.telefono = 'Número inválido (ej: 6000-0000 o +507 6000-0000)';

    const wa = form.whatsapp.trim();
    if (wa && !PHONE_RE.test(wa))
      e.whatsapp = 'Número inválido (ej: 6000-0000 o +507 6000-0000)';

    const web = form.sitio_web.trim();
    if (web && !URL_RE.test(web))
      e.sitio_web = 'Debe ser una URL válida (https://...)';

    if (!form.direccion.trim()) e.direccion = 'La dirección es obligatoria';

    const lat = parseFloat(form.latitud);
    const lng = parseFloat(form.longitud);
    if (form.latitud === '' || isNaN(lat) || lat < -90 || lat > 90)
      e.latitud = 'Latitud inválida (-90 a 90)';
    if (form.longitud === '' || isNaN(lng) || lng < -180 || lng > 180)
      e.longitud = 'Longitud inválida (-180 a 180)';

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);

    const payload: NegocioPayload = {
      nombre: form.nombre.trim(),
      categoria_id: Number(form.categoria_id),
      descripcion: form.descripcion.trim() || undefined,
      telefono: form.telefono.trim() || undefined,
      whatsapp: form.whatsapp.trim() || undefined,
      horario: form.horario.trim() || undefined,
      sitio_web: form.sitio_web.trim() || undefined,
      direccion: form.direccion.trim() || undefined,
      latitud: parseFloat(form.latitud),
      longitud: parseFloat(form.longitud),
      imagen_portada: form.imagen_portada.trim() || undefined,
      verificado: form.verificado,
    };

    try {
      if (editing && negocio) {
        await negociosService.update(negocio.id, payload);
        if ((negocio.verificado ?? false) !== form.verificado) {
          await negociosService.setVerificado(negocio.id, form.verificado);
        }
        toast.success('Negocio actualizado correctamente');
      } else {
        await negociosService.create(payload);
        toast.success('Negocio creado correctamente');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getApiError(err, 'No se pudo guardar el negocio'));
    } finally {
      setSaving(false);
    }
  }

  const errorCount = Object.values(errors).filter(Boolean).length;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar negocio' : 'Nuevo negocio'}
      subtitle={editing ? negocio?.nombre : 'Registra un negocio en la plataforma'}
      icon={<Store size={20} />}
      width={640}
      footer={
        <>
          {errorCount > 0 && (
            <span className="form-error-summary">
              {errorCount} {errorCount === 1 ? 'campo con error' : 'campos con error'}
            </span>
          )}
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <span className="spinner" style={{ borderTopColor: '#fff' }} />
            ) : editing ? (
              'Guardar cambios'
            ) : (
              'Crear negocio'
            )}
          </button>
        </>
      }
    >
      <div className="form-grid">
        {/* Nombre + Categoría */}
        <div className="grid-2">
          <div>
            <label className="label">Nombre *</label>
            <input
              className={`input ${errors.nombre ? 'invalid' : ''}`}
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              placeholder="Ej. Restaurante El Buen Sabor"
              maxLength={150}
            />
            <div className="field-footer">
              {errors.nombre ? (
                <span className="field-error">{errors.nombre}</span>
              ) : (
                <span />
              )}
              <span className="char-count">{form.nombre.length}/150</span>
            </div>
          </div>
          <div>
            <label className="label">Categoría *</label>
            <select
              className="select"
              value={form.categoria_id}
              onChange={(e) => set('categoria_id', e.target.value)}
            >
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="label">Descripción</label>
          <textarea
            className={`textarea ${errors.descripcion ? 'invalid' : ''}`}
            value={form.descripcion}
            onChange={(e) => set('descripcion', e.target.value)}
            placeholder="Breve descripción del negocio"
            maxLength={1000}
          />
          <div className="field-footer">
            {errors.descripcion ? (
              <span className="field-error">{errors.descripcion}</span>
            ) : (
              <span />
            )}
            <span className="char-count">{form.descripcion.length}/1000</span>
          </div>
        </div>

        {/* Teléfono + WhatsApp */}
        <div className="grid-2">
          <div>
            <label className="label">Teléfono</label>
            <input
              className={`input ${errors.telefono ? 'invalid' : ''}`}
              value={form.telefono}
              onChange={(e) => set('telefono', e.target.value)}
              placeholder="6000-0000"
              inputMode="tel"
            />
            {errors.telefono && <div className="field-error">{errors.telefono}</div>}
          </div>
          <div>
            <label className="label">WhatsApp</label>
            <input
              className={`input ${errors.whatsapp ? 'invalid' : ''}`}
              value={form.whatsapp}
              onChange={(e) => set('whatsapp', e.target.value)}
              placeholder="6000-0000"
              inputMode="tel"
            />
            {errors.whatsapp && <div className="field-error">{errors.whatsapp}</div>}
          </div>
        </div>

        {/* Horario + Sitio web */}
        <div className="grid-2">
          <div>
            <label className="label">Horario</label>
            <input
              className="input"
              value={form.horario}
              onChange={(e) => set('horario', e.target.value)}
              placeholder="Lun-Dom 9:00-18:00"
            />
          </div>
          <div>
            <label className="label">Sitio web</label>
            <input
              className={`input ${errors.sitio_web ? 'invalid' : ''}`}
              value={form.sitio_web}
              onChange={(e) => set('sitio_web', e.target.value)}
              placeholder="https://..."
            />
            {errors.sitio_web && <div className="field-error">{errors.sitio_web}</div>}
          </div>
        </div>

        {/* Dirección */}
        <div>
          <label className="label">Dirección *</label>
          <input
            className={`input ${errors.direccion ? 'invalid' : ''}`}
            value={form.direccion}
            onChange={(e) => set('direccion', e.target.value)}
            placeholder="Dirección o referencia del negocio"
          />
          {errors.direccion && <div className="field-error">{errors.direccion}</div>}
        </div>

        {/* Latitud + Longitud */}
        <div className="grid-2">
          <div>
            <label className="label">Latitud *</label>
            <input
              className={`input ${errors.latitud ? 'invalid' : ''}`}
              value={form.latitud}
              onChange={(e) => set('latitud', e.target.value)}
              placeholder="9.0901"
              inputMode="decimal"
            />
            {errors.latitud && <div className="field-error">{errors.latitud}</div>}
          </div>
          <div>
            <label className="label">Longitud *</label>
            <input
              className={`input ${errors.longitud ? 'invalid' : ''}`}
              value={form.longitud}
              onChange={(e) => set('longitud', e.target.value)}
              placeholder="-79.4035"
              inputMode="decimal"
            />
            {errors.longitud && <div className="field-error">{errors.longitud}</div>}
          </div>
        </div>

        {/* Imagen de portada */}
        <div>
          <label className="label">URL de imagen de portada</label>
          <input
            className="input"
            value={form.imagen_portada}
            onChange={(e) => set('imagen_portada', e.target.value)}
            placeholder="/uploads/negocios/imagen.jpg o https://..."
          />
          <div className="help">Ruta relativa del backend o URL completa.</div>
        </div>

        {/* Verificado */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 11,
            padding: '13px 14px',
            border: `1px solid ${form.verificado ? 'var(--success)' : 'var(--border-strong)'}`,
            borderRadius: 10,
            cursor: 'pointer',
            background: form.verificado ? 'var(--success-bg)' : 'var(--surface)',
            transition: 'all 0.15s',
          }}
        >
          <input
            type="checkbox"
            checked={form.verificado}
            onChange={(e) => set('verificado', e.target.checked)}
            style={{ width: 18, height: 18, accentColor: 'var(--success)' }}
          />
          <ShieldCheck size={18} color={form.verificado ? 'var(--success)' : 'var(--muted)'} />
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Negocio verificado</div>
            <div className="help" style={{ marginTop: 1 }}>
              Los negocios verificados aparecen como aprobados en la app.
            </div>
          </div>
        </label>
      </div>
    </Modal>
  );
}
