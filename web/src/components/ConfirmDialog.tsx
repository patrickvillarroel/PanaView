import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface ConfirmDialogProps {
  open: boolean;
  options: ConfirmOptions;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  options,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onMouseDown={onCancel}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 30, 49, 0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 410,
              background: '#fff',
              borderRadius: 18,
              padding: 26,
              textAlign: 'center',
              boxShadow: '0 24px 70px rgba(16,38,64,0.3)',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                margin: '0 auto 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: options.danger ? 'var(--danger-bg)' : 'var(--brand-50)',
                color: options.danger ? 'var(--danger)' : 'var(--brand-700)',
              }}
            >
              <AlertTriangle size={26} />
            </div>
            <h2 className="h2" style={{ marginBottom: 8 }}>
              {options.title}
            </h2>
            <p
              className="text-soft"
              style={{ fontSize: 14, lineHeight: 1.5, margin: '0 0 22px' }}
            >
              {options.message}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-ghost grow"
                onClick={onCancel}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                className={`btn grow ${options.danger ? 'btn-danger' : 'btn-primary'}`}
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner" style={{ borderTopColor: '#fff' }} />
                ) : (
                  options.confirmLabel ?? 'Confirmar'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
