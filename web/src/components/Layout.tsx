import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  MapPin,
  Store,
  ClipboardCheck,
  LogOut,
} from 'lucide-react';
import { PendingProvider, usePending } from './PendingContext';
import { useAuth } from '../auth/AuthContext';
import logo from '../assets/logo.png';
import adminAvatar from '../assets/admin.png';
import './Layout.css';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/lugares', label: 'Lugares', icon: MapPin, end: false },
  { to: '/negocios', label: 'Negocios', icon: Store, end: false },
  { to: '/solicitudes', label: 'Solicitudes', icon: ClipboardCheck, end: false },
];

const TITLES: Record<string, string> = {
  '/': 'Resumen',
  '/lugares': 'Lugares',
  '/negocios': 'Negocios',
  '/solicitudes': 'Solicitudes',
};

function Sidebar({ onNavigate }: { onNavigate: () => void }) {
  const { usuario, logout } = useAuth();
  const { count } = usePending();

  return (
    <>
      <div className="brand">
        <img src={logo} alt="PanaView" className="brand-logo" />
        <div>
          <div className="brand-name">PanaView</div>
          <div className="brand-sub">Admin</div>
        </div>
      </div>

      <nav className="nav">
        <div className="nav-label">Menú</div>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    className="nav-active-bg"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="nav-content">
                  <item.icon size={19} />
                  {item.label}
                  {item.to === '/solicitudes' && count > 0 && (
                    <span className="nav-badge">{count}</span>
                  )}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-chip">
          <img src={adminAvatar} alt="Admin" className="user-avatar user-avatar--img" />
          <div style={{ minWidth: 0 }}>
            <div className="user-name">{usuario?.nombre}</div>
            <div className="user-email">{usuario?.email}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={logout}>
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </>
  );
}

export default function Layout() {
  const location = useLocation();
  const title = TITLES[location.pathname] ?? 'PanaView Admin';

  return (
    <PendingProvider>
      <div className="layout">
        <aside className="sidebar">
          <Sidebar onNavigate={() => {}} />
        </aside>

        <div className="main">
          <header className="topbar">
            <span className="topbar-title">{title}</span>
          </header>

          <main className="content">
            <Outlet />
          </main>
        </div>
      </div>
    </PendingProvider>
  );
}
