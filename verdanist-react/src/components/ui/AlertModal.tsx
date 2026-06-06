import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
  isNotification?: boolean;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'success' | 'info';
}

export default function AlertModal({
  isOpen,
  title,
  message,
  onConfirm,
  onClose,
  isNotification = false,
  confirmText = 'OK',
  cancelText = 'Batal',
  type = 'info',
}: AlertModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const iconMap = {
    warning: <AlertTriangle className="w-7 h-7 text-amber-500" />,
    success: <CheckCircle2 className="w-7 h-7 text-emerald-500" />,
    info: <Info className="w-7 h-7 text-blue-500" />,
  };

  const bgMap = {
    warning: 'bg-amber-500/10 border-amber-500/30',
    success: 'bg-emerald-500/10 border-emerald-500/30',
    info: 'bg-blue-500/10 border-blue-500/30',
  };

  const btnMap = {
    warning: 'bg-amber-500 hover:bg-amber-600 text-white',
    success: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    info: 'bg-primary hover:opacity-90 text-primary-foreground',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center px-6"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-card border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon */}
            <div className={`w-14 h-14 rounded-2xl ${bgMap[type]} border flex items-center justify-center mb-4`}>
              {iconMap[type]}
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>

            {/* Message */}
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line mb-6">{message}</p>

            {/* Buttons */}
            <div className="flex gap-3">
              {!isNotification && cancelText && (
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm bg-secondary text-muted-foreground hover:bg-muted transition-colors"
                >
                  {cancelText}
                </button>
              )}
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${btnMap[type]}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
