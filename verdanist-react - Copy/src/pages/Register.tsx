import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import IkonLogo from '../assets/Ikon logo.png';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'email' | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleOAuthLogin = async (provider: 'google') => {
    setLoadingProvider(provider);
    try {
      await login(provider);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error(error);
      setLoadingProvider(null);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return;
    setLoadingProvider('email');
    try {
      await login('email', email, password, true, name);
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Registration failed.');
      setLoadingProvider(null);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#E8F8EE] via-[#F2FAF4] to-[#E0F4E8]">

      {/* Floating Bright Decorative Orbs */}
      <motion.div
        animate={{ y: [0, 30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[10%] right-[10%] w-[400px] h-[400px] bg-green-300/30 rounded-full blur-[100px] z-0 pointer-events-none"
      />
      <motion.div
        animate={{ y: [0, -40, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-[10%] left-[10%] w-[500px] h-[500px] bg-teal-200/40 rounded-full blur-[120px] z-0 pointer-events-none"
      />

      {/* Bright Glassmorphism Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, type: 'spring', bounce: 0.4 }}
        className="relative z-10 w-full max-w-[460px] px-6 py-12"
      >
        <div className="bg-white/80 backdrop-blur-2xl border border-white shadow-[0_20px_60px_rgba(10,47,31,0.08)] rounded-[36px] p-8 lg:p-12 relative overflow-hidden">

          {/* Subtle top glare */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-white/0 via-white to-white/0"></div>

          {/* Back Button */}
          <button onClick={() => navigate('/')} className="absolute top-6 left-6 text-gray-400 hover:text-green-600 transition-colors flex items-center justify-center bg-white/50 hover:bg-white rounded-full p-2 shadow-sm">
            <span className="material-symbols-rounded text-xl">arrow_back</span>
          </button>

          <div className="text-center mb-10 mt-4">
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              src={IkonLogo}
              alt="Verdanist Logo"
              className="w-20 h-20 object-contain mx-auto mb-6 drop-shadow-md"
            />
            <h1 className="text-[32px] font-extrabold text-[#0A2F1F] tracking-tight mb-2">Create Account</h1>
            <p className="text-[#0A2F1F]/60 font-medium">Join Verdanist and start growing smarter.</p>
          </div>

          <form onSubmit={handleEmailRegister} className="space-y-5">
            <div>
              <label className="block text-[13px] font-extrabold text-[#0A2F1F]/70 uppercase tracking-widest mb-2 ml-1">Full Name</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-green-500 transition-colors">
                  <span className="material-symbols-rounded text-xl">person</span>
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-5 py-4 text-[#0A2F1F] placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all font-semibold shadow-sm"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-extrabold text-[#0A2F1F]/70 uppercase tracking-widest mb-2 ml-1">Email</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-green-500 transition-colors">
                  <span className="material-symbols-rounded text-xl">mail</span>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-5 py-4 text-[#0A2F1F] placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all font-semibold shadow-sm"
                  placeholder="hello@verdanist.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-extrabold text-[#0A2F1F]/70 uppercase tracking-widest mb-2 ml-1">Password</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-green-500 transition-colors">
                  <span className="material-symbols-rounded text-xl">lock</span>
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-5 py-4 text-[#0A2F1F] placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all font-semibold shadow-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingProvider !== null}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-extrabold py-4 rounded-2xl mt-8 shadow-[0_10px_25px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_35px_rgba(16,185,129,0.4)] hover:-translate-y-1 active:scale-[0.98] transition-all flex justify-center items-center h-[58px] text-lg border border-green-400/50"
            >
              {loadingProvider === 'email' ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : 'Sign Up'}
            </button>
          </form>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-white/80 text-gray-400 font-extrabold uppercase tracking-widest backdrop-blur-md rounded-full">Or</span>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={() => handleOAuthLogin('google')}
              disabled={loadingProvider !== null}
              className="w-full bg-white hover:bg-gray-50 border border-gray-200 flex items-center justify-center gap-3 py-4 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all font-extrabold text-gray-700 h-[58px]"
            >
              {loadingProvider === 'google' ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              ) : (
                <>
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                  Continue with Google
                </>
              )}
            </button>
          </div>

          <p className="mt-10 text-center text-sm text-gray-500 font-semibold">
            Already have an account?{' '}
            <Link to="/login" className="font-extrabold text-green-600 hover:text-green-500 transition-colors">Sign in here</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
