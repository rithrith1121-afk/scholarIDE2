import { useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle2 className="text-secondary" size={20} />,
    error: <AlertCircle className="text-error" size={20} />,
    info: <Info className="text-primary" size={20} />,
  };

  const bgColors = {
    success: 'bg-secondary/10 border-secondary/20',
    error: 'bg-error/10 border-error/20',
    info: 'bg-primary/10 border-primary/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl ${bgColors[type]}`}
    >
      {icons[type]}
      <span className="font-label text-sm font-medium text-on-surface">
        {message}
      </span>
      <button
        onClick={onClose}
        className="ml-2 p-1 hover:bg-on-surface/5 rounded-full transition-colors"
      >
        <X size={14} className="text-on-surface-variant" />
      </button>
    </motion.div>
  );
}

export function ToastContainer({ toasts, removeToast }: { toasts: { id: string; message: string; type: ToastType }[], removeToast: (id: string) => void }) {
  return (
    <div className="fixed bottom-0 right-0 p-6 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
