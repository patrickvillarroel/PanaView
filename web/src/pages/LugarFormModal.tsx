import { useEffect, useRef, useState } from 'react';
import { ImageOff, MapPin, Upload, X } from 'lucide-react';
import Modal from '../components/Modal';
import MapPicker from '../components/MapPicker';
import { useToast } from '../components/ToastContext';
import { lugaresService, type LugarPayload } from '../services/lugaresService';
import { getApiError } from '../api/client';
import { CATEGORIAS_LUGAR, type Lugar } from '../types';
import { portadaUrl } from '../utils/format';

interface Props {
  open: boolean;
  lugar: Lugar | null;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  nombre: string;
  categoria_id: string;
  descripcion: string;
  historia: string;
  provincia: string;
  direccion: string;
  latitud: string;
  longitud: string;
  audio_url: string;
}

const EMPTY: FormState = {
  nombre: '',
  categoria_id: '1',
  descripcion: '',
  historia: '',
  provincia: '',
  direccion: '',
  latitud: '',
  longitud: '',
  audio_url: '',
};

const NOMINATIM = 'https://nominatim.openstreetmap.org/reverse';
const URL_RE = /^https?:\/\/.+\..+/;

export default function LugarFormModal({ open, lugar, onClose, onSaved }: Props) {
  const toast = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const blobUrl = useRef<string | null>(null);

  const editing = !!lugar;

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
    if (lugar) {
      setImagePreview(portadaUrl(lugar.imagenes) ?? null);
      setForm({
        nombre: lugar.nombre ?? '',
        categoria_id: String(lugar.categoria_id ?? lugar.categoria?.id ?? 1),
        descripcion: lugar.descripcion ?? '',
        historia: lugar.historia ?? '',
        provincia: lugar.provincia ?? '',
        direccion: lugar.direccion ?? '',
        latitud: String(lugar.latitud ?? ''),
        longitud: String(lugar.longitud ?? ''),
        audio_url: lugar.audio_url ?? '',
      });
    } else {
      setImagePreview(null);
      setForm(EMPTY);
    }
  }, [open, lugar]);

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!file) return;
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
        provincia: addr.state ?? f.provincia,
        direccion: dir || f.direccion,
      }));
    } catch {
      // geocoding failure is non-fatal
    } finally {
      setGeocoding(false);
    }
  }

  function validate(): boolean {
    const e: Record<string, string> = {};

    const nombre = form.nombre.trim();
    if (!nombre) e.nombre = 'El nombre es obligatorio';
    else if (nombre.length < 3) e.nombre = 'Mínimo 3 caracteres';
    else if (nombre.length > 150) e.nombre = 'Máximo 150 caracteres';

    const desc = form.descripcion.trim();
    if (!desc) e.descripcion = 'La descripción es obligatoria';
    else if (desc.length < 10) e.descripcion = 'Mínimo 10 caracteres';

    if (form.historia.trim().length > 2000)
      e.historia = 'La historia no puede superar los 2000 caracteres';

    const lat = parseFloat(form.latitud);
    const lng = parseFloat(form.longitud);
    if (!form.latitud || isNaN(lat) || lat < -90 || lat > 90)
      e.latitud = 'Selecciona una ubicación en el mapa';
    if (!form.longitud || isNaN(lng) || lng < -180 || lng > 180)
      e.longitud = 'Selecciona una ubicación en el mapa';

    const audio = form.audio_url.trim();
    if (audio && !URL_RE.test(audio))
      e.audio_url = 'Debe ser una URL válida (https://...)';

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);

    const payload: LugarPayload = {
      nombre: form.nombre.trim(),
      categoria_id: Number(form.categoria_id),
      descripcion: form.descripcion.trim(),
      historia: form.historia.trim() || undefined,
      provincia: form.provincia.trim() || undefined,
      direccion: form.direccion.trim() || undefined,
      latitud: parseFloat(form.latitud),
      longitud: parseFloat(form.longitud),
      audio_url: form.audio_url.trim() || undefined,
    };

    try {
      let savedId: string;
      if (editing && lugar) {
        await lugaresService.update(lugar.id, payload);
        savedId = lugar.id;
        toast.success('Lugar actualizado correctamente');
      } else {
        const created = await lugaresService.create(payload);
        savedId = created.id;
        toast.success('Lugar creado correctamente');
      }

      if (imageFile) {
        try {
          await lugaresService.uploadImage(savedId, imageFile);
        } catch {
          toast.error('El lugar se guardó, pero no se pudo subir la imagen');
        }
      }

      onSaved();
      onClose();
    } catch (err) {
      toast.error(getApiError(err, 'No se pudo guardar el lugar'));
    } finally {
      setSaving(false);
    }
  }

  const lat = form.latitud ? parseFloat(form.latitud) : null;
  const lng = form.longitud ? parseFloat(form.longitud) : null;
  const errorCount = Object.values(errors).filter(Boolean).length;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar lugar' : 'Nuevo lugar'}
      subtitle={editing ? lugar?.nombre : 'Agrega un punto turístico al mapa'}
      icon={<MapPin size={20} />}
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
              'Crear lugar'
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
              placeholder="Ej. Casco Antiguo"
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
              {CATEGORIAS_LUGAR.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="label">Descripción *</label>
          <textarea
            className={`textarea ${errors.descripcion ? 'invalid' : ''}`}
            value={form.descripcion}
            onChange={(e) => set('descripcion', e.target.value)}
            placeholder="Breve descripción del lugar (mín. 10 caracteres)"
            maxLength={500}
          />
          <div className="field-footer">
            {errors.descripcion ? (
              <span className="field-error">{errors.descripcion}</span>
            ) : (
              <span />
            )}
            <span className="char-count">{form.descripcion.length}/500</span>
          </div>
        </div>

        {/* Historia */}
        <div>
          <label className="label">Historia</label>
          <textarea
            className={`textarea ${errors.historia ? 'invalid' : ''}`}
            value={form.historia}
            onChange={(e) => set('historia', e.target.value)}
            placeholder="Reseña histórica (opcional)"
            maxLength={2000}
          />
          <div className="field-footer">
            {errors.historia ? (
              <span className="field-error">{errors.historia}</span>
            ) : (
              <span />
            )}
            <span className="char-count">{form.historia.length}/2000</span>
          </div>
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

        {/* Mapa de ubicación */}
        <div>
          <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            Ubicación en el mapa *
            {geocoding && <span className="spinner" style={{ width: 14, height: 14 }} />}
          </label>
          <div className="help" style={{ marginBottom: 8 }}>
            Haz clic en el mapa para marcar el lugar. Puedes arrastrar el marcador para ajustar.
          </div>
          {(errors.latitud || errors.longitud) && (
            <div className="field-error" style={{ marginBottom: 8 }}>
              {errors.latitud || errors.longitud}
            </div>
          )}
          {open && <MapPicker lat={lat} lng={lng} onChange={handleMapChange} />}
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

        {/* Provincia + Dirección */}
        <div className="grid-2">
          <div>
            <label className="label">Provincia</label>
            <input
              className="input"
              value={form.provincia}
              onChange={(e) => set('provincia', e.target.value)}
              placeholder="Auto-detectada del mapa"
            />
          </div>
          <div>
            <label className="label">Dirección</label>
            <input
              className="input"
              value={form.direccion}
              onChange={(e) => set('direccion', e.target.value)}
              placeholder="Auto-detectada del mapa"
            />
          </div>
        </div>

        {/* Audio URL */}
        <div>
          <label className="label">URL de audio guía</label>
          <input
            className={`input ${errors.audio_url ? 'invalid' : ''}`}
            value={form.audio_url}
            onChange={(e) => set('audio_url', e.target.value)}
            placeholder="https://... (opcional)"
          />
          {errors.audio_url && <div className="field-error">{errors.audio_url}</div>}
        </div>
      </div>
    </Modal>
  );
}
