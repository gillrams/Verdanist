import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LogoLightTp from '../assets/Logo_Light_Tp.png';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 24, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100, damping: 12 }
  }
};

export default function Welcome() {
  const navigate = useNavigate();
  const { user, currentFarm } = useAuth();

  useEffect(() => {
    if (user && currentFarm) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, currentFarm, navigate]);

  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, []);

  return (
    <>
      {/* ✅ Floating logo - Anchored directly to viewport window, completely outside main layout */}
      <div className="fixed top-0 left-0 z-[99999] p-6 pointer-events-none">
        <img
          src={LogoLightTp}
          alt="Verdanist Logo"
          className="w-40 md:w-48 h-auto object-contain block pointer-events-auto"
        />
      </div>

      {/* ✅ Main content container - Sibling of the floating logo */}
      <main className="h-[100dvh] w-full relative bg-[#E8F4FA] overflow-hidden">
        <div className="flex flex-col md:flex-row w-full h-full max-w-[1600px] mx-auto">

          {/* Image Section */}
          <div className="absolute inset-0 md:relative md:inset-auto md:w-1/2 h-full z-0 md:order-last md:p-8 lg:p-12">
            <img
              src="/images/hero_illustration.png"
              alt="Verdanist Smart Farming"
              className="w-full h-full object-cover object-[center_top] md:object-center md:rounded-[40px] md:shadow-[0_30px_60px_rgba(10,47,31,0.2)]"
            />
            {/* Mobile overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#E8F4FA]/95 via-transparent to-black/60 md:hidden pointer-events-none" />
          </div>

          {/* Text & Button Section */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative z-20 h-full w-full md:w-1/2 flex flex-col justify-center p-8 pt-44 pb-8 md:py-16 md:pl-20 lg:pl-32 xl:pl-40 overflow-hidden"
          >
            {/* Heading */}
            <motion.h1
              variants={itemVariants}
              className="text-[44px] md:text-[64px] lg:text-[76px] leading-[1.05] font-extrabold text-[#0A2F1F] tracking-[-0.03em] mb-4 drop-shadow-sm md:drop-shadow-none"
            >
              Cultivating<br />The Future.
            </motion.h1>

            {/* Subheading */}
            <motion.p
              variants={itemVariants}
              className="text-[#1A4531] text-[16px] md:text-[20px] leading-relaxed max-w-[320px] md:max-w-[450px] font-bold drop-shadow-sm md:drop-shadow-none"
              style={{ textShadow: '0 2px 10px rgba(255,255,255,0.9), 0 0 20px rgba(255,255,255,0.8)' }}
            >
              Automate misting, monitor soil health, and nurture your greenhouse—all from the palm of your hand.
            </motion.p>

            {/* CTA Button */}
            <motion.div variants={itemVariants} className="mt-44 md:mt-32 w-full md:max-w-[300px]">
              <button
                onClick={() => navigate('/farms')}
                className="block w-full bg-white/95 backdrop-blur-md md:bg-white text-gray-900 text-center font-extrabold text-[18px] py-[20px] rounded-[24px] shadow-[0_15px_30px_rgba(22,163,74,0.2)] md:shadow-[0_10px_20px_rgba(22,163,74,0.15)] active:scale-[0.95] transition-all border border-white/40 md:border-transparent hover:shadow-[0_20px_40px_rgba(22,163,74,0.3)] md:hover:-translate-y-1 duration-300"
              >
                Get Started
              </button>

              {/* Footer Links */}
              <div className="mt-6 flex items-center justify-center md:justify-start gap-4 text-sm font-bold text-white/90 md:text-[#1A4531]/70 drop-shadow-md md:drop-shadow-none">
                <Link to="/about" className="hover:text-white md:hover:text-[#1A4531] transition-colors">Privacy Policy</Link>
                <span className="w-1.5 h-1.5 rounded-full bg-white/50 md:bg-[#1A4531]/40"></span>
                <Link to="/about" className="hover:text-white md:hover:text-[#1A4531] transition-colors">API Usage</Link>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </main>
    </>
  );
}
