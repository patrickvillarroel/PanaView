import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './auth/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Lugares from './pages/Lugares';
import Negocios from './pages/Negocios';
import Solicitudes from './pages/Solicitudes';
import Facturacion from './pages/Facturacion';

function FullScreenLoader() {
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div className="spinner spinner-lg" />
    </div>
  );
}

function RequireAuth({ children }: { children: JSX.Element }) {
  const { usuario, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenLoader />;
  if (!usuario) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export default function App() {
  const { usuario, loading } = useAuth();
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/login"
          element={
            loading ? (
              <FullScreenLoader />
            ) : usuario ? (
              <Navigate to="/" replace />
            ) : (
              <Login />
            )
          }
        />
        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/lugares" element={<Lugares />} />
          <Route path="/negocios" element={<Negocios />} />
          <Route path="/solicitudes" element={<Solicitudes />} />
          <Route path="/facturacion" element={<Facturacion />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
