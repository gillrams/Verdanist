import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { Bell, PlayCircle, StopCircle, Info, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Notification {
  id: number;
  title: string;
  detail: string;
  created_at: string;
  action: string;
}

export default function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pump_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5); // Show latest 5

    if (!error && data) {
      setNotifications(data);
    }
    setLoading(false);
  };

  const getIcon = (action: string) => {
    if (action === 'PUMP ON') return <PlayCircle className="w-5 h-5 text-primary" />;
    if (action === 'PUMP OFF') return <StopCircle className="w-5 h-5 text-muted-foreground" />;
    return <Info className="w-5 h-5 text-chart-2" />;
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    if (isToday) {
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-background/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed z-[101] top-24 right-6 w-[320px] max-w-[calc(100vw-48px)] bg-card border border-border shadow-[var(--shadow-custom)] rounded-3xl overflow-hidden"
          >
            <div className="p-4 border-b border-border flex items-center justify-between bg-card">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                Notifikasi
              </h3>
              <button 
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors"
              >
                <span className="material-symbols-rounded text-sm">close</span>
              </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto">
              {loading ? (
                <div className="p-8 flex justify-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm font-medium">Belum ada notifikasi</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="p-4 hover:bg-secondary/30 transition-colors cursor-default">
                      <div className="flex gap-3">
                        <div className="mt-0.5">
                          {getIcon(notif.action)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-foreground leading-snug">
                            {notif.action === 'PUMP ON' ? 'Pompa Dinyalakan' : notif.action === 'PUMP OFF' ? 'Pompa Dimatikan' : notif.action}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {notif.detail || 'Perubahan status pada sistem.'}
                          </p>
                          <p className="text-[10px] font-semibold text-primary mt-1.5 uppercase tracking-wider">
                            {formatTime(notif.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div 
                className="p-3 border-t border-border bg-secondary/50 text-center cursor-pointer hover:bg-secondary transition-colors flex items-center justify-center gap-1 group"
                onClick={() => {
                  onClose();
                  navigate('/logs');
                }}
              >
                <span className="text-xs font-bold text-primary">Lihat Semua Riwayat</span>
                <ChevronRight className="w-3 h-3 text-primary group-hover:translate-x-1 transition-transform" />
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
