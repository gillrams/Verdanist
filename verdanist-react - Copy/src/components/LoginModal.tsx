import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface LoginModalProps {
  deviceName: string;
  onClose: () => void;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, y: 60, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 120, damping: 18 } },
  exit: { opacity: 0, y: 40, scale: 0.95, transition: { duration: 0.2 } },
};

export default function LoginModal({ deviceName, onClose }: LoginModalProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      key="backdrop"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/40 backdrop-blur-md"
    >
      <motion.div
        key="modal"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl p-6 border border-white/10 shadow-2xl bg-gray-900/90 backdrop-blur-xl"
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center ring-4 ring-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
            <span className="material-symbols-rounded text-green-400 text-3xl">lock</span>
          </div>
        </div>

        {/* Text */}
        <h2 className="text-white text-xl font-extrabold text-center mb-2">
          {deviceName === 'Profile' ? 'Login Required' : 'Access Restricted'}
        </h2>
        {deviceName === 'Profile' ? (
          <p className="text-white/50 text-sm text-center leading-relaxed mb-6">
            Please login or register to manage your personal profile, settings, and greenhouse configurations.
          </p>
        ) : (
          <p className="text-white/50 text-sm text-center leading-relaxed mb-6">
            You're trying to control{' '}
            <span className="text-green-400 font-semibold">{deviceName}</span>. 
            Please login to control your real greenhouse devices.
          </p>
        )}

        {/* Buttons */}
        <button
          onClick={() => navigate('/login')}
          className="w-full py-4 rounded-2xl font-bold text-[16px] text-white mb-3 transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
        >
          Login Now
        </button>

        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl font-bold text-[16px] text-gray-400 border border-white/10 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all"
        >
          Continue Exploring Demo
        </button>

        {/* Footer note */}
        <p className="text-white/25 text-xs text-center mt-4">
          All data in Demo Mode is simulated.
        </p>
      </motion.div>
    </motion.div>
  );
}
