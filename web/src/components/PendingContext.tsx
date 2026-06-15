import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { negociosService } from '../services/negociosService';

interface PendingApi {
  count: number;
  refresh: () => void;
}

const PendingContext = createContext<PendingApi | undefined>(undefined);

export function PendingProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    negociosService
      .listAll(false)
      .then((list) => setCount(list.length))
      .catch(() => {
        /* silencioso: el badge no es crítico */
      });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <PendingContext.Provider value={{ count, refresh }}>
      {children}
    </PendingContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePending() {
  const ctx = useContext(PendingContext);
  if (!ctx) throw new Error('usePending debe usarse dentro de <PendingProvider>');
  return ctx;
}
