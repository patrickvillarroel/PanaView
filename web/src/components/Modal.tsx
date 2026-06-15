import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  width = 600,
}: ModalProps) {
  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onMouseDown={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 30, 49, 0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '6vh 16px 24px',
            overflowY: 'auto',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: width,
              background: '#fff',
              borderRadius: 18,
              boxShadow: '0 24px 70px rgba(16,38,64,0.28)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 13,
                padding: '20px 22px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              {icon && (
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--brand-50)',
                    color: 'var(--brand-700)',
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 className="h2">{title}</h2>
                {subtitle && (
                  <p
                    className="muted"
                    style={{ margin: '3px 0 0', fontSize: 13 }}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
              <button className="icon-action" onClick={onClose} aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '22px', maxHeight: '64vh', overflowY: 'auto' }}>
              {children}
            </div>

            {footer && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10,
                  padding: '16px 22px',
                  borderTop: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
