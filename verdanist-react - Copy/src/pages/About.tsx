import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function About() {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#0A2F1F] text-white overflow-y-auto px-4 py-8 md:py-16" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #166534 0%, #0A2F1F 60%)' }}>
      <div className="max-w-3xl mx-auto">
        
        {/* Navigation */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-10 group"
        >
          <span className="material-symbols-rounded group-hover:-translate-x-1 transition-transform">arrow_back</span>
          <span className="font-semibold tracking-wide uppercase text-sm">Return</span>
        </button>

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
            Verdanist
          </h1>
          <p className="text-xl text-white/70 font-medium">Smart Farming Reimagined. Built for the modern agricultural ecosystem.</p>
        </motion.div>

        {/* Content Cards */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-6"
        >
          {/* Privacy & Location Card */}
          <motion.div variants={itemVariants} className="bg-white/5 border border-white/10 rounded-[32px] p-6 md:p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 ring-4 ring-blue-500/10">
                <span className="material-symbols-rounded text-2xl">location_on</span>
              </div>
              <h2 className="text-2xl font-bold">Privacy & Location</h2>
            </div>
            <p className="text-white/60 leading-relaxed mb-6">
              Verdanist requests access to your device's <strong>Geolocation</strong> exclusively to provide highly accurate, hyper-local weather data for your smart dashboard.
            </p>
            <ul className="space-y-3 text-sm text-white/70 font-medium bg-black/20 p-5 rounded-2xl border border-white/5">
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xs shrink-0">✓</span> 
                We do NOT store your location data anywhere on our servers.
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xs shrink-0">✓</span> 
                Location is processed instantly on your device via standard browser APIs.
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xs shrink-0">✓</span> 
                You can revoke access at any time via your browser settings.
              </li>
            </ul>
          </motion.div>

          {/* API & Open Source Card */}
          <motion.div variants={itemVariants} className="bg-white/5 border border-white/10 rounded-[32px] p-6 md:p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400 ring-4 ring-amber-500/10">
                <span className="material-symbols-rounded text-2xl">cloud_sync</span>
              </div>
              <h2 className="text-2xl font-bold">API & Integrations</h2>
            </div>
            <p className="text-white/60 leading-relaxed mb-6">
              Our dashboard relies on robust, open-source free-tier APIs to ensure a seamless demo experience without requiring user registration or API keys.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/20 rounded-2xl p-5 border border-white/5 hover:bg-white/5 transition-colors">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <span>🌤️</span> Open-Meteo API
                </h3>
                <p className="text-sm text-white/50 leading-relaxed">Powers our real-time weather forecasting and humidity tracking without tracking user identities.</p>
              </div>
              <div className="bg-black/20 rounded-2xl p-5 border border-white/5 hover:bg-white/5 transition-colors">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <span>🗺️</span> Nominatim (OSM)
                </h3>
                <p className="text-sm text-white/50 leading-relaxed">Provides reverse-geocoding to display your friendly city name instead of raw coordinates.</p>
              </div>
            </div>
          </motion.div>

          {/* Technology Stack Card */}
          <motion.div variants={itemVariants} className="bg-white/5 border border-white/10 rounded-[32px] p-6 md:p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 ring-4 ring-purple-500/10">
                <span className="material-symbols-rounded text-2xl">code</span>
              </div>
              <h2 className="text-2xl font-bold">Technology Stack</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {['React', 'Vite', 'Tailwind CSS v4', 'Framer Motion', 'TypeScript'].map(tech => (
                <span key={tech} className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-sm font-semibold hover:bg-white/20 hover:-translate-y-0.5 transition-all cursor-default">
                  {tech}
                </span>
              ))}
            </div>
          </motion.div>

        </motion.div>

        {/* Footer Text */}
        <motion.div variants={itemVariants} className="text-center mt-12 mb-4">
          <p className="text-white/30 text-xs">© {new Date().getFullYear()} Verdanist Smart Farming. All rights reserved.</p>
        </motion.div>
      </div>
    </div>
  );
}
