import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  MapPin,
  Store,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import logo from '../assets/logo.png';
import './Login.css';

const FEATURES = [
  { icon: MapPin,      text: 'Gestiona lugares turísticos de Panamá' },
  { icon: Store,       text: 'Controla el catálogo completo de negocios' },
  { icon: ShieldCheck, text: 'Aprueba y verifica nuevas solicitudes' },
];


export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">

      {/* ── LEFT HERO ── */}
      <div className="login-hero">
        {/* Decorative glows */}
        <div className="login-glow login-glow--a" />
        <div className="login-glow login-glow--b" />
        <div className="login-glow login-glow--c" />

        {/* Brand */}
        <div className="login-hero-top">
          <img src={logo} alt="PanaView" className="login-hero-logo" />
          <span className="login-hero-brand">PanaView</span>
        </div>

        {/* Heading block */}
        <motion.div
          className="login-hero-body"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
        >
          <span className="login-hero-badge">Panel Administrativo</span>
          <h2>Gestión turística<br />de Panamá</h2>
          <p>
            Administra lugares, negocios y solicitudes desde
            un solo panel centralizado.
          </p>
        </motion.div>

        {/* Feature list */}
        <motion.div
          className="login-hero-features"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28 }}
        >
          {FEATURES.map(({ icon: Icon, text }, i) => (
            <div key={i} className="login-feature">
              <span className="login-feature-icon">
                <Icon size={14} />
              </span>
              {text}
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── RIGHT FORM ── */}
      <div className="login-form-side">
        <motion.div
          className="login-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          {/* Card brand */}
          <div className="login-card-brand">
            <img src={logo} alt="" className="login-card-logo" />
            <span>PanaView Admin</span>
          </div>

          <h1>Bienvenido de nuevo</h1>
          <p className="sub">Accede con tu cuenta de administrador</p>

          {error && (
            <motion.div
              className="login-error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <label className="form-label">Correo electrónico</label>
            <div className="input-group">
              <span className="input-icon"><Mail size={16} /></span>
              <input
                className="input"
                type="email"
                placeholder="admin@panaview.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                autoFocus
              />
            </div>

            <label className="form-label">Contraseña</label>
            <div className="input-group" style={{ marginBottom: 24 }}>
              <span className="input-icon"><Lock size={16} /></span>
              <input
                className="input"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? 'Ocultar' : 'Mostrar'}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner" style={{ borderTopColor: '#fff' }} />
              ) : (
                <>Iniciar sesión <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="login-card-footer">
            <ShieldCheck size={13} />
            Acceso exclusivo para administradores
          </div>
        </motion.div>
      </div>
    </div>
  );
}
