import { useEffect, useRef, useState } from 'react';
import { ImageOff, Store, ShieldCheck, Upload, X } from 'lucide-react';
import Modal from '../components/Modal';
import MapPicker from '../components/MapPicker';
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
  horario_dias: string;
  horario_apertura: string;
  horario_cierre: string;
  sitio_web: string;
  direccion: string;
  latitud: string;
  longitud: string;
  verificado: boolean;
}

function emptyForm(categorias: Categoria[]): FormState {
  return {
    nombre: '',
    categoria_id: String(categorias[0]?.id ?? 1),
    descripcion: '',
    telefono: '',
    whatsapp: '',
    horario_dias: '',
    horario_apertura: '',
    horario_cierre: '',
    sitio_web: '',
    direccion: '',
    latitud: '',
    longitud: '',
    verificado: true,
  };
}

// Panamanian phone: 7-8 digits, optional +507 prefix and formatting chars
const PHONE_RE = /^[\+\d][\d\s\-\(\)]{5,14}$/;
const URL_RE = /^https?:\/\/.+\..+/;
const NOMINATIM = 'https://nominatim.openstreetmap.org/reverse';
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/** Convierte "HH:mm" (24h) a "h:mm AM/PM". */
function to12h(hhmm: string): string {
  if (!hhmm) return '';
  const [hStr, mStr] = hhmm.split(':');
  let h = parseInt(hStr, 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${mStr} ${suffix}`;
}

/** Intenta separar un horario guardado como texto en días + horas 24h, para precargar el picker. */
function parseHorario(horario: string | null | undefined): {
  dias: string;
  apertura: string;
  cierre: string;
} {
  const value = (horario ?? '').trim();
  if (!value) return { dias: '', apertura: '', cierre: '' };

  const match = value.match(
    /^(.*):\s*(\d{1,2}):(\d{2})\s*([AaPp])\.?[Mm]\.?\s*-\s*(\d{1,2}):(\d{2})\s*([AaPp])\.?[Mm]\.?$/
  );
  if (!match) return { dias: value, apertura: '', cierre: '' };

  const [, dias, h1, m1, ap1, h2, m2, ap2] = match;
  const to24 = (h: string, m: string, ap: string) => {
    let hour = parseInt(h, 10) % 12;
    if (ap.toLowerCase() === 'p') hour += 12;
    return `${String(hour).padStart(2, '0')}:${m}`;
  };
  return { dias: dias.trim(), apertura: to24(h1, m1, ap1), cierre: to24(h2, m2, ap2) };
}

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
  const [geocoding, setGeocoding] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const blobUrl = useRef<string | null>(null);

  const editing = !!negocio;

  useEffect(() => {
    if (!open) {
      if (blobUrl.current) {
        URL.revokeObjectURL(blobUrl.current);
        blobUrl.current = null;
      }
      return;
    }
    setErrors({});
    setImageFile(null);
    if (negocio) {
      const { dias, apertura, cierre } = parseHorario(negocio.horario);
      setImagePreview(portadaUrl(negocio.imagenes) ?? null);
      setForm({
        nombre: negocio.nombre ?? '',
        categoria_id: String(negocio.categoria_id ?? negocio.categoria?.id ?? 1),
        descripcion: negocio.descripcion ?? '',
        telefono: negocio.telefono ?? '',
        whatsapp: negocio.whatsapp ?? '',
        horario_dias: dias,
        horario_apertura: apertura,
        horario_cierre: cierre,
        sitio_web: negocio.sitio_web ?? '',
        direccion: negocio.direccion ?? '',
        latitud: String(negocio.latitud ?? ''),
        longitud: String(negocio.longitud ?? ''),
        verificado: negocio.verificado ?? false,
      });
    } else {
      setImagePreview(null);
      setForm(emptyForm(categorias));
    }
  }, [open, negocio, categorias]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key as string]) setErrors((e) => ({ ...e, [key]: '' }));
  }

  async function handleMapChange(lat: number, lng: number) {
    setForm((f) => ({ ...f, latitud: lat.toFixed(6), longitud: lng.toFixed(6) }));
    if (errors.latitud || errors.longitud)
      setErrors((e) => ({ ...e, latitud: '', longitud: '' }));

    setGeocoding(true);
    try {
      const res = await fetch(
        `${NOMINATIM}?format=json&lat=${lat}&lon=${lng}&accept-language=es`,
        { headers: { 'User-Agent': 'PanaView/1.0' } },
      );
      const data = await res.json();
      const addr: Record<string, string> = data.address ?? {};
      const road = addr.road ?? addr.pedestrian ?? addr.street ?? addr.amenity ?? '';
      const suburb = addr.suburb ?? addr.neighbourhood ?? addr.quarter ?? '';
      const dir = [road, suburb].filter(Boolean).join(', ');
      setForm((f) => ({
        ...f,
        latitud: lat.toFixed(6),
        longitud: lng.toFixed(6),
        direccion: dir || f.direccion,
      }));
    } catch {
      // geocoding failure is non-fatal
    } finally {
      setGeocoding(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Formato no válido. Usa JPEG, PNG o WebP');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('La imagen no puede superar 5 MB');
      return;
    }

    if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
    const url = URL.createObjectURL(file);
    blobUrl.current = url;
    setImageFile(file);
    setImagePreview(url);
  }

  function clearImage() {
    if (blobUrl.current) {
      URL.revokeObjectURL(blobUrl.current);
      blobUrl.current = null;
    }
    setImageFile(null);
    setImagePreview(null);
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

    if (Boolean(form.horario_apertura) !== Boolean(form.horario_cierre)) {
      const msg = 'Define tanto la hora de apertura como la de cierre';
      e.horario_apertura = msg;
      e.horario_cierre = msg;
    }

    const web = form.sitio_web.trim();
    if (web && !URL_RE.test(web))
      e.sitio_web = 'Debe ser una URL válida (https://...)';

    if (!form.direccion.trim()) e.direccion = 'La dirección es obligatoria';

    const lat = parseFloat(form.latitud);
    const lng = parseFloat(form.longitud);
    if (form.latitud === '' || isNaN(lat) || lat < -90 || lat > 90)
      e.latitud = 'Selecciona una ubicación en el mapa';
    if (form.longitud === '' || isNaN(lng) || lng < -180 || lng > 180)
      e.longitud = 'Selecciona una ubicación en el mapa';

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function buildHorario(): string | undefined {
    const dias = form.horario_dias.trim();
    const tieneHoras = form.horario_apertura && form.horario_cierre;
    const rango = tieneHoras ? `${to12h(form.horario_apertura)} - ${to12h(form.horario_cierre)}` : '';
    if (dias && rango) return `${dias}: ${rango}`;
    return rango || dias || undefined;
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
      horario: buildHorario(),
      sitio_web: form.sitio_web.trim() || undefined,
      direccion: form.direccion.trim() || undefined,
      latitud: parseFloat(form.latitud),
      longitud: parseFloat(form.longitud),
      verificado: form.verificado,
    };

    try {
      let savedId: string;
      if (editing && negocio) {
        await negociosService.update(negocio.id, payload);
        savedId = negocio.id;
        if ((negocio.verificado ?? false) !== form.verificado) {
          await negociosService.setVerificado(negocio.id, form.verificado);
        }
        toast.success('Negocio actualizado correctamente');
      } else {
        const created = await negociosService.create(payload);
        savedId = created.id;
        toast.success('Negocio creado correctamente');
      }

      if (imageFile) {
        try {
          await negociosService.uploadImage(savedId, imageFile);
        } catch {
          toast.error('El negocio se guardó, pero no se pudo subir la imagen');
        }
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
      width={720}
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

        {/* Horario */}
        <div>
          <label className="label">Horario de atención</label>
          <div className="help" style={{ marginBottom: 8 }}>
            Días de atención y horas de apertura/cierre (opcional).
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 4 }}>Días</div>
              <input
                className="input"
                value={form.horario_dias}
                onChange={(e) => set('horario_dias', e.target.value)}
                placeholder="Ej. Lun - Vie"
              />
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 4 }}>Abre</div>
              <input
                type="time"
                className={`input ${errors.horario_apertura ? 'invalid' : ''}`}
                value={form.horario_apertura}
                onChange={(e) => set('horario_apertura', e.target.value)}
              />
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 4 }}>Cierra</div>
              <input
                type="time"
                className={`input ${errors.horario_cierre ? 'invalid' : ''}`}
                value={form.horario_cierre}
                onChange={(e) => set('horario_cierre', e.target.value)}
              />
            </div>
          </div>
          {(errors.horario_apertura || errors.horario_cierre) && (
            <div className="field-error" style={{ marginTop: 6 }}>
              {errors.horario_apertura || errors.horario_cierre}
            </div>
          )}
        </div>

        {/* Sitio web */}
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

        {/* Mapa de ubicación */}
        <div>
          <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            Ubicación en el mapa *
            {geocoding && <span className="spinner" style={{ width: 14, height: 14 }} />}
          </label>
          <div className="help" style={{ marginBottom: 8 }}>
            Haz clic en el mapa para marcar el negocio. Puedes arrastrar el marcador para ajustar.
          </div>
          {(errors.latitud || errors.longitud) && (
            <div className="field-error" style={{ marginBottom: 8 }}>
              {errors.latitud || errors.longitud}
            </div>
          )}
          {open && (
            <MapPicker
              lat={form.latitud ? parseFloat(form.latitud) : null}
              lng={form.longitud ? parseFloat(form.longitud) : null}
              onChange={handleMapChange}
            />
          )}
        </div>

        {/* Lat / Lng — solo lectura, rellenados por el mapa */}
        <div className="grid-2">
          <div>
            <label className="label">Latitud</label>
            <input
              className="input"
              value={form.latitud}
              readOnly
              placeholder="Haz clic en el mapa"
              style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
            />
          </div>
          <div>
            <label className="label">Longitud</label>
            <input
              className="input"
              value={form.longitud}
              readOnly
              placeholder="Haz clic en el mapa"
              style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
            />
          </div>
        </div>

        {/* Dirección */}
        <div>
          <label className="label">Dirección *</label>
          <input
            className={`input ${errors.direccion ? 'invalid' : ''}`}
            value={form.direccion}
            onChange={(e) => set('direccion', e.target.value)}
            placeholder="Auto-detectada del mapa, o escribe una referencia"
          />
          {errors.direccion && <div className="field-error">{errors.direccion}</div>}
        </div>

        {/* Imagen de portada */}
        <div>
          <label className="label">Imagen de portada</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          {imagePreview ? (
            <div className="img-picker img-picker--preview">
              <img src={imagePreview} alt="Portada" className="img-picker-img" />
              <div className="img-picker-overlay">
                <button
                  type="button"
                  className="img-picker-change"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload size={14} /> Cambiar
                </button>
                <button type="button" className="img-picker-remove" onClick={clearImage}>
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="img-picker img-picker--empty"
              onClick={() => fileRef.current?.click()}
            >
              <ImageOff size={28} className="img-picker-empty-icon" />
              <span>Haz clic para subir una imagen</span>
              <span className="img-picker-hint">JPEG, PNG o WebP · máx. 5 MB</span>
            </button>
          )}
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
