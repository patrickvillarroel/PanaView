import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import api, { tokenStore, getApiError } from '../api/client';
import type { ApiResponse, AuthResponse, Usuario } from '../types';

interface AuthState {
  usuario: Usuario | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  // Restaura sesión a partir del token guardado
  useEffect(() => {
    const token = tokenStore.get();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<ApiResponse<Usuario>>('/auth/me')
      .then((res) => {
        const u = res.data.data;
        if (u && u.rol === 'admin') {
          setUsuario(u);
        } else {
          tokenStore.clear();
        }
      })
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    let res;
    try {
      res = await api.post<ApiResponse<AuthResponse>>('/auth/login', {
        email,
        password,
      });
    } catch (err) {
      throw new Error(getApiError(err, 'Credenciales inválidas'));
    }

    const data = res.data.data;
    if (!data?.token || !data.usuario) {
      throw new Error('Respuesta inválida del servidor');
    }

    // Solo administradores pueden entrar al panel
    if (data.usuario.rol !== 'admin') {
      throw new Error('Esta cuenta no tiene permisos de administrador');
    }

    tokenStore.set(data.token);
    setUsuario(data.usuario);
  }

  function logout() {
    tokenStore.clear();
    setUsuario(null);
  }

  const value = useMemo(
    () => ({ usuario, loading, login, logout }),
    [usuario, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
